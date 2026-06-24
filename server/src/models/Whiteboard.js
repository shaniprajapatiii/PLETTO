const mongoose = require("mongoose");

const whiteboardSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
      },
      workspace: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Workspace",
         required: true,
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      data: {
         type: Object,
         default: {},
      },
   },
   { timestamps: true },
);

module.exports = mongoose.model("Whiteboard", whiteboardSchema);
