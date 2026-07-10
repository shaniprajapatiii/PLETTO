const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
   {
      channel: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Channel",
         required: true,
      },
      workspace: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Workspace",
         required: true,
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      text: {
         type: String,
         default: "",
      },
      // Rich content support
      attachments: [
         {
            url: String,
            name: String,
            type: String, // image, file, video, etc.
            size: Number,
            metadata: mongoose.Schema.Types.Mixed,
         },
      ],
      // Reactions/Emojis
      reactions: [
         {
            emoji: String,
            users: [
               {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User",
               },
            ],
         },
      ],
      // Message threading
      isThreadReply: {
         type: Boolean,
         default: false,
      },
      threadParent: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Message",
         default: null,
      },
      threadReplies: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
         },
      ],
      threadReplyCount: {
         type: Number,
         default: 0,
      },
      // Message status
      isPinned: {
         type: Boolean,
         default: false,
      },
      pinnedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         default: null,
      },
      pinnedAt: {
         type: Date,
         default: null,
      },
      isEdited: {
         type: Boolean,
         default: false,
      },
      editedAt: {
         type: Date,
         default: null,
      },
      editHistory: [
         {
            text: String,
            editedAt: Date,
         },
      ],
      isDeleted: {
         type: Boolean,
         default: false,
      },
      deletedAt: {
         type: Date,
         default: null,
      },
      // AI features
      isAI: {
         type: Boolean,
         default: false,
      },
      aiMetadata: {
         model: String,
         confidence: Number,
      },
   },
   {
      timestamps: true,
   },
);

module.exports = mongoose.model("Message", messageSchema);
