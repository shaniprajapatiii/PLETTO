const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
   {
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      title: {
         type: String,
         required: true,
      },
      body: {
         type: String,
         default: "",
      },
      link: {
         type: String,
         default: "",
      },
      readAt: {
         type: Date,
      },
   },
   { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
