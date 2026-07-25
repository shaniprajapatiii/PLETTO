const Presence = require("../models/Presence");
const User = require("../models/User");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).select("workspace").lean();
   return membership?.workspace;
}

exports.getPresence = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);

      const presences = await Presence.find({ workspace: workspaceId, status: "online" })
         .populate("user", "name avatar color")
         .populate("currentChannel", "name");

      res.json({ success: true, presences });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.updatePresence = async (req, res) => {
   try {
      const { status, currentChannel } = req.body;
      const workspaceId = await getWorkspaceId(req.user.id);

      if (!["online", "away", "offline", "dnd"].includes(status)) {
         return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const presence = await Presence.findOneAndUpdate(
         { user: req.user.id },
         {
            user: req.user.id,
            workspace: workspaceId,
            status,
            currentChannel: currentChannel || null,
            lastSeen: new Date(),
         },
         { upsert: true, new: true }
      )
         .populate("user", "name avatar color")
         .populate("currentChannel", "name");

      res.json({ success: true, presence });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.getUserPresence = async (req, res) => {
   try {
      const { userId } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);

      const presence = await Presence.findOne({
         user: userId,
         workspace: workspaceId,
      })
         .populate("user", "name avatar color")
         .populate("currentChannel", "name");

      if (!presence) {
         return res.status(404).json({ success: false, message: "Presence not found" });
      }

      res.json({ success: true, presence });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.getOnlineUsers = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);

      const onlineUsers = await Presence.find({
         workspace: workspaceId,
         status: { $in: ["online", "away"] },
      })
         .populate("user", "name avatar color email")
         .sort({ lastSeen: -1 });

      res.json({ success: true, users: onlineUsers });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
