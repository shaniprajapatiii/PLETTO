const User = require("../models/User");

exports.updateProfile = async (req, res) => {
   try {
      const user = await User.findById(req.user.id);
      if (!user) {
         return res.status(404).json({ success: false, message: "User not found" });
      }
      const { name, bio, avatar } = req.body;
      user.name = name ?? user.name;
      user.bio = bio ?? user.bio;
      user.avatar = avatar ?? user.avatar;
      await user.save();
      res.json({ success: true, user });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
