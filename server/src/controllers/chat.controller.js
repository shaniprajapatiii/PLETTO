const Channel = require("../models/Channel");
const User = require("../models/User");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).populate("workspace");
   return membership?.workspace?._id;
}

exports.getChannels = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);
      const channels = await Channel.find({
         workspace: workspaceId,
         $or: [{ type: "public" }, { type: "dm", members: req.user.id }],
      })
         .sort({ createdAt: -1 })
         .populate("members", "name email avatar")
         .populate("createdBy", "name");

      res.json({ success: true, channels });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.createChannel = async (req, res) => {
   try {
      const { name, type, members = [] } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(400).json({ success: false, message: "Workspace membership required" });
      }

      if (type === "dm") {
         const memberIds = Array.isArray(members) ? [...new Set(members.map(String))] : [];
         if (!memberIds.includes(req.user.id.toString())) {
            memberIds.push(req.user.id.toString());
         }
         if (memberIds.length !== 2) {
            return res.status(400).json({ success: false, message: "Direct chats must have exactly two members" });
         }

         const existingChannel = await Channel.findOne({
            workspace: workspaceId,
            type: "dm",
            members: { $size: 2, $all: memberIds },
         }).populate("members", "name email avatar");

         if (existingChannel) {
            return res.status(200).json({ success: true, channel: existingChannel });
         }

         const users = await User.find({ _id: { $in: memberIds } }).select("name");
         const names = users.map((user) => user.name).sort().join(" & ");
         const channel = await Channel.create({
            name: name || names,
            type: "dm",
            members: memberIds,
            workspace: workspaceId,
            createdBy: req.user.id,
         });

         await channel.populate("members", "name email avatar");
         return res.status(201).json({ success: true, channel });
      }

      if (!name) {
         return res.status(400).json({ success: false, message: "Channel name is required" });
      }

      const channel = await Channel.create({
         name,
         type: "public",
         workspace: workspaceId,
         createdBy: req.user.id,
      });

      res.status(201).json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
