const Channel = require("../models/Channel");
const User = require("../models/User");
const Message = require("../models/Message");
const WorkspaceMember = require("../models/WorkspaceMember");
const { getIo } = require("../utils/socket");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).select("workspace").lean();
   return membership?.workspace;
}

exports.getChannels = async (req, res) => {
   try {
      const userId = req.user.id;
      const workspaceId = await getWorkspaceId(userId);
      const channels = await Channel.find({
         workspace: workspaceId,
         $or: [
            { type: "public" },
            { type: "private", members: userId },
            { type: "private", createdBy: userId },
            { type: "dm", members: userId },
         ],
      })
         .sort({ createdAt: -1 })
         .populate("members", "name email avatar color")
         .populate("createdBy", "name email avatar");

      res.json({ success: true, channels });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.createChannel = async (req, res) => {
   try {
      const { name, type = "public", members = [], topic = "", description = "" } = req.body;
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
         }).populate("members", "name email avatar color");

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

         await channel.populate("members", "name email avatar color");

         const io = getIo();
         if (io) {
            io.to(workspaceId.toString()).emit("channelCreated", channel);
         }

         return res.status(201).json({ success: true, channel });
      }

      if (!name || !name.trim()) {
         return res.status(400).json({ success: false, message: "Channel name is required" });
      }

      const memberIds = Array.isArray(members) ? [...new Set(members.map(String))] : [];
      if (!memberIds.includes(req.user.id.toString())) {
         memberIds.push(req.user.id.toString());
      }

      const channelType = type === "private" ? "private" : "public";

      const channel = await Channel.create({
         name: name.trim().toLowerCase().replace(/\s+/g, "-"),
         type: channelType,
         members: memberIds,
         topic,
         description,
         workspace: workspaceId,
         createdBy: req.user.id,
      });

      await channel.populate("members", "name email avatar color");
      await channel.populate("createdBy", "name email avatar");

      // Broadcast channel creation to all workspace members
      const io = getIo();
      if (io) {
         io.to(workspaceId.toString()).emit("channelCreated", channel);
      }

      res.status(201).json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
exports.updateChannel = async (req, res) => {
   try {
      const { channelId } = req.params;
      const { name, topic, description, icon } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      // Only creator or workspace admin can update channel
      if (channel.createdBy.toString() !== req.user.id.toString()) {
         return res.status(403).json({ success: false, message: "Only channel creator can update" });
      }

      if (name) channel.name = name;
      if (topic !== undefined) channel.topic = topic;
      if (description !== undefined) channel.description = description;
      if (icon !== undefined) channel.icon = icon;

      await channel.save();
      await channel.populate("members", "name avatar");
      await channel.populate("createdBy", "name");

      // Broadcast channel update
      const io = getIo();
      if (io) {
         io.to(workspaceId.toString()).emit("channelUpdated", channel);
      }

      res.json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.deleteChannel = async (req, res) => {
   try {
      const { channelId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      // Only creator can delete channel
      if (channel.createdBy.toString() !== req.user.id.toString()) {
         return res.status(403).json({ success: false, message: "Only channel creator can delete" });
      }

      await Channel.deleteOne({ _id: channelId });
      
      // Broadcast channel deletion
      const io = getIo();
      if (io) {
         io.to(workspaceId.toString()).emit("channelDeleted", { channelId });
      }
      
      res.json({ success: true, message: "Channel deleted" });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.addMember = async (req, res) => {
   try {
      const { channelId } = req.params;
      const { userId } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!userId) {
         return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      if (channel.type === "private" && channel.createdBy.toString() !== req.user.id.toString()) {
         return res.status(403).json({ success: false, message: "Only channel creator can add members" });
      }

      if (channel.members.some((id) => id.toString() === userId.toString())) {
         return res.status(400).json({ success: false, message: "User is already a member" });
      }

      channel.members.push(userId);
      await channel.save();
      await channel.populate("members", "name avatar email color");
      await channel.populate("createdBy", "name email avatar");

      const io = getIo();
      if (io) {
         io.to(workspaceId.toString()).emit("channelUpdated", channel);
      }

      res.json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.removeMember = async (req, res) => {
   try {
      const { channelId } = req.params;
      const { userId } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!userId) {
         return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      if (channel.type === "private" && channel.createdBy.toString() !== req.user.id.toString()) {
         return res.status(403).json({ success: false, message: "Only channel creator can remove members" });
      }

      channel.members = channel.members.filter((id) => id.toString() !== userId.toString());
      await channel.save();
      await channel.populate("members", "name avatar email color");
      await channel.populate("createdBy", "name email avatar");

      const io = getIo();
      if (io) {
         io.to(workspaceId.toString()).emit("channelUpdated", channel);
      }

      res.json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.muteChannel = async (req, res) => {
   try {
      const { channelId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      if (!channel.mutedBy.includes(req.user.id)) {
         channel.mutedBy.push(req.user.id);
         await channel.save();
      }

      res.json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.unmuteChannel = async (req, res) => {
   try {
      const { channelId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
      if (!channel) {
         return res.status(404).json({ success: false, message: "Channel not found" });
      }

      channel.mutedBy = channel.mutedBy.filter((id) => id.toString() !== req.user.id.toString());
      await channel.save();

      res.json({ success: true, channel });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.getCreatedChannels = async (req, res) => {
   try {
      const userId = req.user.id;
      const workspaceId = await getWorkspaceId(userId);
      const channels = await Channel.find({
         workspace: workspaceId,
         createdBy: userId,
         type: { $in: ["public", "private"] },
      })
         .sort({ createdAt: -1 })
         .populate("members", "name email avatar color")
         .populate("createdBy", "name");

      if (!channels.length) {
         return res.json({ success: true, channels: [] });
      }

      const channelIds = channels.map((channel) => channel._id);
      const messageCounts = await Message.aggregate([
         { $match: { channel: { $in: channelIds } } },
         { $group: { _id: "$channel", count: { $sum: 1 } } },
      ]);

      const countsByChannel = Object.fromEntries(messageCounts.map(({ _id, count }) => [_id.toString(), count]));

      const channelsWithStats = channels.map((channel) => ({
         ...channel.toObject(),
         messageCount: countsByChannel[channel._id.toString()] || 0,
      }));

      res.json({ success: true, channels: channelsWithStats });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};