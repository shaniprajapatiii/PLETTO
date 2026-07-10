const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
   {
      message: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Message",
         required: true,
      },
      workspace: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Workspace",
         required: true,
      },
      uploadedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      url: {
         type: String,
         required: true,
      },
      name: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         enum: ["image", "file", "video", "audio", "document", "other"],
         default: "file",
      },
      mimeType: {
         type: String,
      },
      size: {
         type: Number,
      },
      width: Number,
      height: Number,
      duration: Number,
      metadata: mongoose.Schema.Types.Mixed,
      isPublic: {
         type: Boolean,
         default: false,
      },
   },
   {
      timestamps: true,
   },
);

module.exports = mongoose.model("Attachment", attachmentSchema);
