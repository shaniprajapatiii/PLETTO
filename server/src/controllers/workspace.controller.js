const WorkspaceMember = require("../models/WorkspaceMember");
const User = require("../models/User");

exports.getMembers = async (req, res) => {
   try {
      const memberships = await WorkspaceMember.find({ workspace: req.user.workspaceId }).populate("user", "name email avatar bio color isActive");
      const members = memberships.map((membership) => ({
         _id: membership._id,
         userId: membership.user?._id,
         role: membership.role,
         name: membership.user?.name,
         email: membership.user?.email,
         avatar: membership.user?.avatar,
         bio: membership.user?.bio,
         color: membership.user?.color,
         isActive: membership.user?.isActive,
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
