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
         required: true,
      },
   },
   {
      timestamps: true,
   },
);

module.exports = mongoose.model("Message", messageSchema);
