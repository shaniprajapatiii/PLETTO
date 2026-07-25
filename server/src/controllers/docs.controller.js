const Document = require("../models/Document");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).select("workspace").lean();
   return membership?.workspace;
}

exports.getDocs = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(403).json({ success: false, message: "Workspace access required" });
      }
      const documents = await Document.find({ workspace: workspaceId }).sort({ updatedAt: -1 });
      res.json({ success: true, documents });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.createDoc = async (req, res) => {
   try {
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(403).json({ success: false, message: "Workspace access required" });
      }
      const document = await Document.create({
         title: req.body.title || "Untitled document",
         content: req.body.content || "",
         type: req.body.type === "markdown" ? "markdown" : "text",
         workspace: workspaceId,
         createdBy: req.user.id,
      });
      res.status(201).json({ success: true, document });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.updateDoc = async (req, res) => {
   try {
      const { id } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(403).json({ success: false, message: "Workspace access required" });
      }
      const update = {};
      if (req.body.title !== undefined) update.title = req.body.title;
      if (req.body.content !== undefined) update.content = req.body.content;
      if (req.body.type !== undefined) update.type = req.body.type === "markdown" ? "markdown" : "text";

      const document = await Document.findOneAndUpdate(
         { _id: id, workspace: workspaceId },
         update,
         { new: true },
      );
      if (!document) {
         return res.status(404).json({ success: false, message: "Document not found" });
      }
      res.json({ success: true, document });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.deleteDoc = async (req, res) => {
   try {
      const { id } = req.params;
      const workspaceId = await getWorkspaceId(req.user.id);
      if (!workspaceId) {
         return res.status(403).json({ success: false, message: "Workspace access required" });
      }

      const document = await Document.findOneAndDelete({ _id: id, workspace: workspaceId });
      if (!document) {
         return res.status(404).json({ success: false, message: "Document not found" });
      }

      res.json({ success: true, message: "Document deleted successfully" });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
