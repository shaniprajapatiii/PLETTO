const Channel = require("../models/Channel");
const Message = require("../models/Message");
const WorkspaceMember = require("../models/WorkspaceMember");
const { getIo } = require("../utils/socket");
const { ensureUserWorkspaceMembership } = require("../utils/workspaceHelper");

async function getWorkspaceId(userId) {
   const workspace = await ensureUserWorkspaceMembership(userId);
   if (workspace) return workspace._id;
   const membership = await WorkspaceMember.findOne({ user: userId }).select("workspace").lean();
   return membership?.workspace;
}

exports.getMessages = async (req, res) => {
   try {
      const { channelId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const workspaceId = await getWorkspaceId(req.user.id);

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      const messages = await Message.find({ channel: channelId, workspace: workspaceId, isDeleted: false })
         .select("channel workspace user text attachments isThreadReply threadParent threadReplyCount isEdited editedAt isDeleted createdAt updatedAt")
         .populate("user", "name avatar color")
         .sort({ createdAt: -1 })
         .skip(parseInt(offset))
         .limit(parseInt(limit));

      res.json({ success: true, messages: messages.reverse() });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.sendMessage = async (req, res) => {
   try {
      const { channelId } = req.params;
      const { text, attachments = [], threadParentId = null } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!text || !text.trim()) {
         return res.status(400).json({ success: false, message: "Message text is required" });
      }

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      const isPublicChannel = channel.type === "public";
      const isMember = channel.members.some((memberId) => memberId.toString() === req.user.id.toString());
      if (!isPublicChannel && !isMember) {
         return res.status(403).json({ success: false, message: "You do not have access to this channel" });
      }

      // Check if this is a thread reply
      let isThreadReply = false;
      if (threadParentId) {
         const threadParent = await Message.findById(threadParentId);
         if (threadParent) {
            isThreadReply = true;
         }
      }

      const message = await Message.create({
         channel: channelId,
         workspace: workspaceId,
         user: req.user.id,
         text: text.trim(),
         attachments,
         isThreadReply,
         threadParent: threadParentId,
      });

      // Update thread reply count if this is a thread reply
      if (isThreadReply) {
         await Message.findByIdAndUpdate(threadParentId, {
            $push: { threadReplies: message._id },
            $inc: { threadReplyCount: 1 },
         });
      }

      // Update last activity
      await Channel.findByIdAndUpdate(channelId, { lastActivityAt: new Date() });

      const populatedMessage = await Message.findById(message._id)
         .select("channel workspace user text attachments isThreadReply threadParent threadReplyCount isEdited editedAt isDeleted createdAt updatedAt")
         .populate("user", "name avatar color");

      const io = getIo();
      if (io) {
         io.to(channelId).emit("newMessage", populatedMessage);
         if (channel.type === "public" && workspaceId) {
            io.to(workspaceId.toString()).emit("newMessage", populatedMessage);
         }
         if (channel.members && channel.members.length > 0) {
            channel.members.forEach((mId) => {
               io.to(`user:${mId.toString()}`).emit("newMessage", populatedMessage);
            });
         }
      }

      res.status(201).json({ success: true, message: populatedMessage });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.editMessage = async (req, res) => {
   try {
      const { messageId } = req.params;
      const { text } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!text || !text.trim()) {
         return res.status(400).json({ success: false, message: "Message text is required" });
      }

      const message = await Message.findOne({ _id: messageId, user: req.user.id, workspace: workspaceId });
      if (!message) {
         return res.status(404).json({ success: false, message: "Message not found" });
      }

      message.editHistory.push({
         text: message.text,
         editedAt: message.editedAt || message.createdAt,
      });

      message.text = text.trim();
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      const populatedMessage = await Message.findById(messageId)
         .select("channel workspace user text attachments isThreadReply threadParent threadReplyCount isEdited editedAt isDeleted createdAt updatedAt")
         .populate("user", "name avatar color");

      const io = getIo();
      if (io) {
         io.to(message.channel.toString()).emit("messageEdited", populatedMessage);
      }

      res.json({ success: true, message: populatedMessage });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.deleteMessage = async (req, res) => {
   try {
      const { messageId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const message = await Message.findOne({ _id: messageId, user: req.user.id, workspace: workspaceId });
      if (!message) {
         return res.status(404).json({ success: false, message: "Message not found" });
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      const io = getIo();
      if (io) {
         io.to(message.channel.toString()).emit("messageDeleted", {
            messageId,
            channelId: message.channel,
         });
      }

      res.json({ success: true, message: "Message deleted", messageId });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.deleteLatestMessage = async (req, res) => {
   try {
      const { channelId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const latestMessage = await Message.findOne({
         channel: channelId,
         user: req.user.id,
         workspace: workspaceId,
         isDeleted: false,
      }).sort({ createdAt: -1 });

      if (!latestMessage) {
         return res.status(404).json({ success: false, message: "No message found to delete" });
      }

      latestMessage.isDeleted = true;
      latestMessage.deletedAt = new Date();
      await latestMessage.save();

      const io = getIo();
      if (io) {
         io.to(channelId).emit("messageDeleted", {
            messageId: latestMessage._id,
            channelId,
         });
      }

      res.json({ success: true, message: "Latest message deleted", messageId: latestMessage._id });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.getThreadReplies = async (req, res) => {
   try {
      const { messageId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const message = await Message.findOne({ _id: messageId, workspace: workspaceId });
      if (!message) {
         return res.status(404).json({ success: false, message: "Message not found" });
      }

      const threadReplies = await Message.find({ threadParent: messageId, isDeleted: false })
         .select("channel workspace user text attachments isThreadReply threadParent threadReplyCount isEdited editedAt isDeleted createdAt updatedAt")
         .populate("user", "name avatar color")
         .sort({ createdAt: 1 });

      res.json({ success: true, threadReplies });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
