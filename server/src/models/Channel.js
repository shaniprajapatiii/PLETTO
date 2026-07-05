const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         enum: ["public", "dm"],
         default: "public",
      },
      members: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      ],
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

module.exports = mongoose.model("Channel", channelSchema);
