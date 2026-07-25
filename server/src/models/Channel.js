const mongoose = require("mongoose");

const channelSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         enum: ["public", "private", "dm"],
         default: "public",
      },
      topic: {
         type: String,
         default: "",
      },
      description: {
         type: String,
         default: "",
      },
      members: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      ],
      mutedBy: [
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
      icon: {
         type: String,
         default: null,
      },
      isArchived: {
         type: Boolean,
         default: false,
      },
      lastActivityAt: {
         type: Date,
         default: () => new Date(),
      },
   },
   { timestamps: true },
);

channelSchema.index({ workspace: 1, type: 1, createdAt: -1 });
channelSchema.index({ workspace: 1, createdBy: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model("Channel", channelSchema);
