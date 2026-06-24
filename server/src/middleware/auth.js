const jwt = require("jsonwebtoken");
const WorkspaceMember = require("../models/WorkspaceMember");

module.exports = async (req, res, next) => {
   try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
         return res.status(401).json({
            success: false,
            message: "Authentication required",
         });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const membership = await WorkspaceMember.findOne({ user: decoded.id }).populate("workspace");

      if (!membership) {
         return res.status(401).json({
            success: false,
            message: "Workspace membership required",
         });
      }

      req.user = {
         id: decoded.id,
         workspaceId: membership.workspace?._id,
      };

      next();
   } catch (error) {
      res.status(401).json({
         success: false,
         message: "Invalid token",
      });
   }
};
