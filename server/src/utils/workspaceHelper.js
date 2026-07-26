const Workspace = require("../models/Workspace");
const WorkspaceMember = require("../models/WorkspaceMember");
const Channel = require("../models/Channel");
const User = require("../models/User");

let cachedPrimaryWorkspaceId = null;

async function getOrCreatePrimaryWorkspace() {
   try {
      let workspace = await Workspace.findOne().sort({ createdAt: 1 });

      if (!workspace) {
         workspace = await Workspace.create({
            name: "PLETTO Workspace",
            slug: "pletto-workspace",
         });
      }

      cachedPrimaryWorkspaceId = workspace._id;

      // Ensure default #general channel exists in primary workspace
      let generalChannel = await Channel.findOne({
         workspace: workspace._id,
         name: "general",
         type: "public",
      });

      if (!generalChannel) {
         await Channel.create({
            name: "general",
            type: "public",
            topic: "Company-wide announcements and work-based matters",
            description: "Default workspace general channel for all team members",
            workspace: workspace._id,
         });
      }

      return workspace;
   } catch (error) {
      console.error("Error in getOrCreatePrimaryWorkspace:", error);
      throw error;
   }
}

async function ensureUserWorkspaceMembership(userId) {
   if (!userId) return null;
   try {
      const primaryWorkspace = await getOrCreatePrimaryWorkspace();

      let membership = await WorkspaceMember.findOne({
         workspace: primaryWorkspace._id,
         user: userId,
      });

      if (!membership) {
         membership = await WorkspaceMember.create({
            workspace: primaryWorkspace._id,
            user: userId,
            role: "member",
         });
      }

      return primaryWorkspace;
   } catch (error) {
      console.error("Error ensuring user workspace membership:", error);
      return null;
   }
}

async function ensureAllUsersInPrimaryWorkspace() {
   try {
      const primaryWorkspace = await getOrCreatePrimaryWorkspace();
      const users = await User.find({}).select("_id");

      for (const u of users) {
         await ensureUserWorkspaceMembership(u._id);
      }

      // Re-assign orphaned channels to primary workspace if any exist
      await Channel.updateMany(
         { workspace: { $exists: false } },
         { $set: { workspace: primaryWorkspace._id } }
      );

      return primaryWorkspace;
   } catch (error) {
      console.error("Error in ensureAllUsersInPrimaryWorkspace:", error);
   }
}

module.exports = {
   getOrCreatePrimaryWorkspace,
   ensureUserWorkspaceMembership,
   ensureAllUsersInPrimaryWorkspace,
};
