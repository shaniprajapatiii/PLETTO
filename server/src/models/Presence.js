const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema(
   {
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
         unique: true,
      },
      workspace: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Workspace",
         required: true,
      },
      status: {
         type: String,
         enum: ["online", "away", "offline", "dnd"],
         default: "online",
      },
      lastSeen: {
         type: Date,
         default: () => new Date(),
      },
      currentChannel: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Channel",
         default: null,
      },
      socketId: String,
      userAgent: String,
   },
   {
      timestamps: true,
   },
);

// TTL index to automatically clean up offline users after 24 hours
presenceSchema.index(
   { updatedAt: 1 },
   { expireAfterSeconds: 86400, partialFilterExpression: { status: "offline" } }
);

module.exports = mongoose.model("Presence", presenceSchema);
