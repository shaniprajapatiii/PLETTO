const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true
      },

      email: {
         type: String,
         required: true,
         unique: true
      },

      password: {
         type: String,
         required: true
      },

      avatar: {
         type: String,
         default: ""
      },

      bio: {
         type: String,
         default: ""
      },

      color: {
         type: String,
         default: "#3B82F6"
      }
   },
   {
      timestamps: true
   }
);

module.exports =
   mongoose.model("User", userSchema);