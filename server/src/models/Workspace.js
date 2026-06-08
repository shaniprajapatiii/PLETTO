const mongoose = require("mongoose");

const workspaceSchema =
   new mongoose.Schema(
      {
         name: {
            type: String,
            required: true
         },

         slug: {
            type: String,
            unique: true
         },

         owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
         }
      },
      {
         timestamps: true
      }
   );

module.exports =
   mongoose.model(
      "Workspace",
      workspaceSchema
   );