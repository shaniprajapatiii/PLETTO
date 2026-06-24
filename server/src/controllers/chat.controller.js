const Channel = require("../models/Channel");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).populate("workspace");
   return membership?.workspace?._id;
}

exports.getChannels = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);
      const channels = await Channel.find({ workspace: workspaceId }).sort({ createdAt: -1 });
      res.json({ success: true, channels });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.createChannel = async (req, res) => {
   try {
      const { name } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!name || !workspaceId) {
         return res.status(400).json({ success: false, message: "Channel name and workspace are required" });
      }
      const channel = await Channel.create({ name, workspace: workspaceId, createdBy: req.user.id });
      res.status(201).json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
