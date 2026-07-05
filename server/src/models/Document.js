const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
   {
      title: {
         type: String,
         required: true,
      },
      content: {
         type: String,
         default: "",
      },
      type: {
         type: String,
         enum: ["text", "markdown"],
         default: "text",
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
   },
   { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);
