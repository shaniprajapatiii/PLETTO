const WorkspaceMember = require("../models/WorkspaceMember");
const User = require("../models/User");

exports.getMembers = async (req, res) => {
   try {
      // Fetch all registered users in the website (not just workspace members)
      const users = await User.find({}, "name email avatar bio color isActive _id").sort({ createdAt: -1 });
      const currentUserId = req.user?._id?.toString() || "";
      const members = users.map((user) => ({
         _id: user._id,
         userId: user._id,
         role: user._id.toString() === currentUserId ? "owner" : "member",
         name: user.name,
         email: user.email,
         avatar: user.avatar,
         bio: user.bio,
         color: user.color,
         isActive: user.isActive,
      }));
      res.json({ success: true, members });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

exports.inviteMember = async (req, res) => {
   try {
      const { email } = req.body;
      if (!email) {
         return res.status(400).json({ success: false, message: "Email is required to invite a member" });
      }

      const user = await User.findOne({ email });
      if (!user) {
         return res.status(404).json({ success: false, message: "User not found" });
      }

      const existingMember = await WorkspaceMember.findOne({ workspace: req.user.workspaceId, user: user._id });
      if (existingMember) {
         return res.status(400).json({ success: false, message: "Member already belongs to the workspace" });
      }

      const member = await WorkspaceMember.create({
         workspace: req.user.workspaceId,
         user: user._id,
         role: "member",
      });

      res.status(201).json({ success: true, member });
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};
