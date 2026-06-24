const Channel = require("../models/Channel");
const Message = require("../models/Message");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).populate("workspace");
   return membership?.workspace?._id;
}

exports.getMessages = async (req, res) => {
   try {
      const { channelId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      const messages = await Message.find({ channel: channelId, workspace: workspaceId })
         .populate("user", "name avatar")
         .sort({ createdAt: 1 });

      res.json({ success: true, messages });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.sendMessage = async (req, res) => {
   try {
      const { channelId } = req.params;
      const { text } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!text || !text.trim()) {
         return res.status(400).json({ success: false, message: "Message text is required" });
      }

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      const message = await Message.create({
         channel: channelId,
         workspace: workspaceId,
         user: req.user.id,
         text: text.trim(),
      });

      const populatedMessage = await Message.findById(message._id).populate("user", "name avatar");

      res.status(201).json({ success: true, message: populatedMessage });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
