const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");

const generateToken = require("../utils/generateToken");

async function getActiveWorkspace(userId) {
   const membership = await WorkspaceMember.findOne({ user: userId }).populate("workspace");
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

      const workspace = await Workspace.create({
         name: `${name}'s Workspace`,
         slug: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
         owner: user._id,
      });

      await WorkspaceMember.create({
         workspace: workspace._id,
         user: user._id,
         role: "owner",
      });

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
         workspace: {
            id: workspace._id,
            name: workspace.name,
            slug: workspace.slug,
            role: "owner",
         },
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
