const bcrypt = require("bcryptjs");

const User = require("../models/User");
const WorkspaceMember = require("../models/WorkspaceMember");
const generateToken = require("../utils/generateToken");
const { ensureUserWorkspaceMembership } = require("../utils/workspaceHelper");

async function getActiveWorkspace(userId) {
   await ensureUserWorkspaceMembership(userId);
   const membership = await WorkspaceMember.findOne({ user: userId }).select("workspace role").populate("workspace", "name slug");
   return membership?.workspace ? { id: membership.workspace._id, name: membership.workspace.name, slug: membership.workspace.slug, role: membership.role } : null;
}

// REGISTER

exports.register = async (req, res) => {
   try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
         return res.status(400).json({
            success: false,
            message: "All fields required",
         });
      }

      const exists = await User.findOne({ email });

      if (exists) {
         return res.status(400).json({
            success: false,
            message: "User already exists",
         });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
         name,
         email,
         password: hashedPassword,
         avatar: "",
         bio: "",
      });

      await ensureUserWorkspaceMembership(user._id);
      const workspace = await getActiveWorkspace(user._id);

      const token = generateToken(user._id);

      res.status(201).json({
         success: true,
         token,
         user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            color: user.color,
         },
         workspace,
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
};

// LOGIN

exports.login = async (req, res) => {
   try {
      const { email, password } = req.body;

      const user = await User.findOne({
         email,
      });

      if (!user) {
         return res.status(400).json({
            success: false,
            message: "Invalid credentials",
         });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
         return res.status(400).json({
            success: false,
            message: "Invalid credentials",
         });
      }

      const workspace = await getActiveWorkspace(user._id);
      const token = generateToken(user._id);

      res.json({
         success: true,
         token,
         user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            color: user.color,
         },
         workspace,
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
};

// GET CURRENT USER

exports.me = async (req, res) => {
   try {
      const user = await User.findById(req.user.id).select("-password");
      const workspace = await getActiveWorkspace(req.user.id);

      res.json({
         success: true,
         user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            color: user.color,
         },
         workspace,
      });
   } catch (error) {
      res.status(500).json({
         success: false,
         message: error.message,
      });
   }
};

