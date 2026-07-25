const mongoose = require("mongoose");

const workspaceMemberSchema =
   new mongoose.Schema(
      {
         workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace"
         },

         user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
         },

         role: {
            type: String,
            enum: [
               "owner",
               "admin",
               "member"
            ],
            default: "member"
         }
      },
      {
         timestamps: true
      }
   );

workspaceMemberSchema.index({ workspace: 1, user: 1 });

module.exports =
   mongoose.model(
      "WorkspaceMember",
      workspaceMemberSchema
   );