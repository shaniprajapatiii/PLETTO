const Whiteboard = require("../models/Whiteboard");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).populate("workspace");
   return membership?.workspace?._id;
}

exports.getBoards = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(403).json({ success: false, message: "Workspace access required" });
      }
      const whiteboards = await Whiteboard.find({ workspace: workspaceId }).sort({ createdAt: -1 });
      res.json({ success: true, whiteboards });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.createBoard = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(403).json({ success: false, message: "Workspace access required" });
      }
      const board = await Whiteboard.create({
         name: req.body.name || "Untitled board",
         workspace: workspaceId,
         createdBy: req.user.id,
         data: { strokes: [] },
      });
      res.status(201).json({ success: true, board });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.updateBoard = async (req, res) => {
   try {
      const { id } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(403).json({ success: false, message: "Workspace access required" });
      }
      const update = {};

      if (req.body.name) {
         update.name = req.body.name;
      }
      if (req.body.data !== undefined) {
         update.data = req.body.data;
      }

      const board = await Whiteboard.findOneAndUpdate({ _id: id, workspace: workspaceId }, update, { new: true });
      if (!board) {
         return res.status(404).json({ success: false, message: "Whiteboard not found" });
      }
      res.json({ success: true, board });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
