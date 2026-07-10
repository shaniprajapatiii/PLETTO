const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
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
      emoji: {
         type: String,
         required: true,
      },
      users: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
         },
      ],
      count: {
         type: Number,
         default: 1,
      },
   },
   {
      timestamps: true,
   },
);

// Prevent duplicate reactions
reactionSchema.index({ message: 1, emoji: 1 }, { unique: true });

module.exports = mongoose.model("Reaction", reactionSchema);
