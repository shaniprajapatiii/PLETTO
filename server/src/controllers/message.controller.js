const Channel = require("../models/Channel");
const Message = require("../models/Message");
const Reaction = require("../models/Reaction");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).populate("workspace");
   return membership?.workspace?._id;
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
         .populate("user", "name avatar color")
         .populate("reactions.users", "name avatar")
         .populate("threadParent")
         .populate("threadReplies")
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
         .populate("user", "name avatar color")
         .populate("threadParent")
         .populate("reactions.users", "name avatar");

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

      // Save edit history
      message.editHistory.push({
         text: message.text,
         editedAt: message.editedAt || message.createdAt,
      });

      message.text = text.trim();
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      const populatedMessage = await Message.findById(messageId)
         .populate("user", "name avatar color")
         .populate("reactions.users", "name avatar");

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

      res.json({ success: true, message: "Message deleted" });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.pinMessage = async (req, res) => {
   try {
      const { messageId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const message = await Message.findOne({ _id: messageId, workspace: workspaceId });
      if (!message) {
         return res.status(404).json({ success: false, message: "Message not found" });
      }

      message.isPinned = true;
      message.pinnedBy = req.user.id;
      message.pinnedAt = new Date();
      await message.save();

      const populatedMessage = await Message.findById(messageId)
         .populate("user", "name avatar color")
         .populate("pinnedBy", "name avatar");

      res.json({ success: true, message: populatedMessage });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.unpinMessage = async (req, res) => {
   try {
      const { messageId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const message = await Message.findOne({ _id: messageId, workspace: workspaceId });
      if (!message) {
         return res.status(404).json({ success: false, message: "Message not found" });
      }

      message.isPinned = false;
      message.pinnedBy = null;
      message.pinnedAt = null;
      await message.save();

      res.json({ success: true, message: "Message unpinned" });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.addReaction = async (req, res) => {
   try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!emoji) {
         return res.status(400).json({ success: false, message: "Emoji is required" });
      }

      const message = await Message.findOne({ _id: messageId, workspace: workspaceId });
      if (!message) {
         return res.status(404).json({ success: false, message: "Message not found" });
      }

      // Check if user already reacted with this emoji
      const reaction = message.reactions.find((r) => r.emoji === emoji);
      if (reaction) {
         if (!reaction.users.includes(req.user.id)) {
            reaction.users.push(req.user.id);
         }
      } else {
         message.reactions.push({ emoji, users: [req.user.id] });
      }

      await message.save();

      const populatedMessage = await Message.findById(messageId)
         .populate("user", "name avatar color")
         .populate("reactions.users", "name avatar");

      res.json({ success: true, message: populatedMessage });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.removeReaction = async (req, res) => {
   try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!emoji) {
         return res.status(400).json({ success: false, message: "Emoji is required" });
      }

      const message = await Message.findOne({ _id: messageId, workspace: workspaceId });
      if (!message) {
         return res.status(404).json({ success: false, message: "Message not found" });
      }

      const reaction = message.reactions.find((r) => r.emoji === emoji);
      if (reaction) {
         reaction.users = reaction.users.filter((id) => id.toString() !== req.user.id.toString());
         if (reaction.users.length === 0) {
            message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
         }
      }

      await message.save();

      const populatedMessage = await Message.findById(messageId)
         .populate("user", "name avatar color")
         .populate("reactions.users", "name avatar");

      res.json({ success: true, message: populatedMessage });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.getPinnedMessages = async (req, res) => {
   try {
      const { channelId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      const pinnedMessages = await Message.find({
         channel: channelId,
         workspace: workspaceId,
         isPinned: true,
         isDeleted: false,
      })
         .populate("user", "name avatar color")
         .populate("pinnedBy", "name avatar")
         .populate("reactions.users", "name avatar")
         .sort({ pinnedAt: -1 });

      res.json({ success: true, pinnedMessages });
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
         .populate("user", "name avatar color")
         .populate("reactions.users", "name avatar")
         .sort({ createdAt: 1 });

      res.json({ success: true, threadReplies });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
