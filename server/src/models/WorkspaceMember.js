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

module.exports =
   mongoose.model(
      "WorkspaceMember",
      workspaceMemberSchema
   );