const Document = require("../models/Document");
const WorkspaceMember = require("../models/WorkspaceMember");

async function getWorkspaceId(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).populate("workspace");
   return membership?.workspace?._id;
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
      const document = await Document.findOneAndUpdate(
         { _id: id, workspace: workspaceId },
         { ...req.body },
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
