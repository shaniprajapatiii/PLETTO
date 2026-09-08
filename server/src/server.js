require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const WorkspaceMember = require("./models/WorkspaceMember");
const Channel = require("./models/Channel");
const Message = require("./models/Message");
const User = require("./models/User");
const Presence = require("./models/Presence");
const { ensureUserWorkspaceMembership, ensureAllUsersInPrimaryWorkspace } = require("./utils/workspaceHelper");
const { setIo } = require("./utils/socket");

const PORT = Number(process.env.PORT) || 5000;

connectDB().then(() => {
   ensureAllUsersInPrimaryWorkspace();
});

const server = http.createServer(app);

const io = new Server(server, {
   cors: {
      origin: (origin, callback) => {
         if (!origin) return callback(null, true);

         const allowedOrigins = [process.env.CLIENT_URL];
         try {
            const url = new URL(origin);
            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
               return callback(null, true);
            }
         } catch {
            // fallback to explicit origin check
         }

         if (allowedOrigins.includes(origin)) {
            return callback(null, true);
         }

         callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
   },
});

setIo(io);

// Socket Authentication Middleware
io.use(async (socket, next) => {
   try {
      const token = socket.handshake.auth?.token;
      if (!token) {
         return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await ensureUserWorkspaceMembership(decoded.id);

      const membership = await WorkspaceMember.findOne({ user: decoded.id }).populate("workspace");
      if (!membership) {
         return next(new Error("Workspace membership required"));
      }

      const user = await User.findById(decoded.id).select("name avatar color");

      socket.user = {
         id: decoded.id.toString(),
         workspaceId: membership.workspace?._id ? membership.workspace._id.toString() : "",
         name: user?.name || "Unknown",
         avatar: user?.avatar || "",
         color: user?.color || "#6366f1",
      };
      next();
   } catch (error) {
      next(new Error("Invalid socket token"));
   }
});

// Track active channels per socket connection
const userChannels = new Map();

io.on("connection", (socket) => {
   // Join workspace room and personal user room immediately on connection
   if (socket.user.workspaceId) {
      socket.join(socket.user.workspaceId);
   }
   if (socket.user.id) {
      socket.join(`user:${socket.user.id}`);
   }

   // ============ PRESENCE & STATUS ============
   socket.on("userOnline", async () => {
      try {
         await Presence.findOneAndUpdate(
            { user: socket.user.id },
            {
               user: socket.user.id,
               workspace: socket.user.workspaceId,
               status: "online",
               socketId: socket.id,
               lastSeen: new Date(),
            },
            { upsert: true },
         );

         io.to(socket.user.workspaceId).emit("presenceUpdate", {
            userId: socket.user.id,
            status: "online",
            name: socket.user.name,
            avatar: socket.user.avatar,
            color: socket.user.color,
         });
      } catch (error) {
         console.error("userOnline error:", error.message);
      }
   });

   socket.on("userAway", async () => {
      try {
         await Presence.findOneAndUpdate(
            { user: socket.user.id },
            { status: "away", lastSeen: new Date() },
         );

         io.to(socket.user.workspaceId).emit("presenceUpdate", {
            userId: socket.user.id,
            status: "away",
            name: socket.user.name,
         });
      } catch (error) {
         console.error("userAway error:", error.message);
      }
   });

   // ============ CHANNEL ROOMS ============
   socket.on("joinChannel", async (channelId) => {
      try {
         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId });
         if (!channel) return;

         if (channel.type === "private" || channel.type === "dm") {
            const isMember = channel.members?.some((id) => id.toString() === socket.user.id);
            const isCreator = channel.createdBy?.toString() === socket.user.id;
            if (!isMember && !isCreator) {
               socket.emit("channelAccessDenied", { channelId, message: "Access denied to private channel" });
               return;
            }
         }

         const previousChannel = userChannels.get(socket.id);
         if (previousChannel && previousChannel !== channelId) {
            socket.leave(previousChannel);
         }

         socket.join(channelId);
         userChannels.set(socket.id, channelId);
         socket.emit("joinedChannel", channelId);

         socket.to(channelId).emit("userJoinedChannel", {
            channelId,
            userId: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
            color: socket.user.color,
         });
      } catch (error) {
         console.error("joinChannel error:", error.message);
      }
   });

   socket.on("leaveChannel", async (channelId) => {
      try {
         socket.leave(channelId);
         userChannels.delete(socket.id);

         socket.to(channelId).emit("userLeftChannel", {
            channelId,
            userId: socket.user.id,
            name: socket.user.name,
         });
      } catch (error) {
         console.error("leaveChannel error:", error.message);
      }
   });

   // ============ TYPING INDICATORS ============
   socket.on("typing", ({ channelId, isTyping }) => {
      if (!channelId) return;
      io.to(channelId).emit("typing", {
         channelId,
         isTyping: Boolean(isTyping),
         user: {
            id: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
            color: socket.user.color,
         },
         timestamp: Date.now(),
      });
   });

   // ============ CHANNELS CRUD (Real-time Broadcast) ============
   socket.on("channelCreated", async (channelId) => {
      try {
         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId })
            .populate("members", "name email avatar color")
            .populate("createdBy", "name email avatar");
         if (!channel) return;

         io.to(socket.user.workspaceId).emit("channelCreated", channel);
      } catch (error) {
         console.error("channelCreated error:", error.message);
      }
   });

   socket.on("channelUpdated", async (channelId) => {
      try {
         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId })
            .populate("members", "name email avatar color")
            .populate("createdBy", "name email avatar");
         if (!channel) return;

         io.to(socket.user.workspaceId).emit("channelUpdated", channel);
      } catch (error) {
         console.error("channelUpdated error:", error.message);
      }
   });

   socket.on("channelDeleted", async (channelId) => {
      try {
         io.to(socket.user.workspaceId).emit("channelDeleted", { channelId });
      } catch (error) {
         console.error("channelDeleted error:", error.message);
      }
   });

   // ============ MESSAGES & THREADS ============
   socket.on("sendMessage", async ({ channelId, text, attachments = [], threadParentId = null }) => {
      try {
         if (!text || !text.trim()) return;

         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId });
         if (!channel) return;

         if (channel.type === "private" || channel.type === "dm") {
            const isMember = channel.members?.some((id) => id.toString() === socket.user.id);
            const isCreator = channel.createdBy?.toString() === socket.user.id;
            if (!isMember && !isCreator) return;
         }

         let isThreadReply = false;
         if (threadParentId) {
            const parent = await Message.findById(threadParentId);
            if (parent) {
               isThreadReply = true;
            }
         }

         const message = await Message.create({
            channel: channelId,
            workspace: socket.user.workspaceId,
            user: socket.user.id,
            text: text.trim(),
            attachments,
            isThreadReply,
            threadParent: isThreadReply ? threadParentId : null,
         });

         if (isThreadReply) {
            await Message.findByIdAndUpdate(threadParentId, {
               $push: { threadReplies: message._id },
               $inc: { threadReplyCount: 1 },
               lastReplyAt: new Date(),
            });
         }

         await Channel.findByIdAndUpdate(channelId, { lastActivityAt: new Date() });

         const populatedMessage = await Message.findById(message._id)
            .select("channel workspace user text attachments isThreadReply threadParent threadReplyCount isEdited editedAt isDeleted createdAt updatedAt")
            .populate("user", "name avatar color");

         io.to(channelId).emit("newMessage", populatedMessage);

         // Broadcast to workspace room for public channels
         if (channel.type === "public" && socket.user.workspaceId) {
            io.to(socket.user.workspaceId).emit("newMessage", populatedMessage);
         }

         // For DMs and Private channels, emit to members' individual socket rooms
         if (channel.members && channel.members.length > 0) {
            channel.members.forEach((mId) => {
               io.to(`user:${mId.toString()}`).emit("newMessage", populatedMessage);
            });
         }
      } catch (error) {
         console.error("sendMessage error:", error.message);
      }
   });

   socket.on("editMessage", async ({ messageId, channelId, text }) => {
      try {
         if (!text || !text.trim()) return;

         const message = await Message.findOne({
            _id: messageId,
            user: socket.user.id,
            workspace: socket.user.workspaceId,
         });
         if (!message) return;

         message.editHistory.push({
            text: message.text,
            editedAt: message.editedAt || message.createdAt,
         });

         message.text = text.trim();
         message.isEdited = true;
         message.editedAt = new Date();
         await message.save();

         const populatedMessage = await Message.findById(messageId)
            .select("channel workspace user text attachments isThreadReply threadParent threadReplyCount isEdited editedAt isDeleted createdAt updatedAt")
            .populate("user", "name avatar color");

         io.to(channelId).emit("messageEdited", populatedMessage);
      } catch (error) {
         console.error("editMessage error:", error.message);
      }
   });

   socket.on("deleteMessage", async ({ messageId, channelId }) => {
      try {
         const message = await Message.findOne({
            _id: messageId,
            user: socket.user.id,
            workspace: socket.user.workspaceId,
         });
         if (!message) return;

         message.isDeleted = true;
         message.deletedAt = new Date();
         await message.save();

         io.to(channelId).emit("messageDeleted", { messageId, channelId });
      } catch (error) {
         console.error("deleteMessage error:", error.message);
      }
   });

   socket.on("deleteLatestMessage", async ({ channelId }) => {
      try {
         const message = await Message.findOne({
            channel: channelId,
            user: socket.user.id,
            workspace: socket.user.workspaceId,
            isDeleted: false,
         }).sort({ createdAt: -1 });
         if (!message) return;

         message.isDeleted = true;
         message.deletedAt = new Date();
         await message.save();

         io.to(channelId).emit("messageDeleted", { messageId: message._id, channelId });
      } catch (error) {
         console.error("deleteLatestMessage error:", error.message);
      }
   });

   // ============ DISCONNECT & CLEANUP ============
   socket.on("disconnect", async () => {
      try {
         await Presence.findOneAndUpdate(
            { user: socket.user.id },
            {
               status: "offline",
               socketId: null,
               lastSeen: new Date(),
            },
         );

         io.to(socket.user.workspaceId).emit("presenceUpdate", {
            userId: socket.user.id,
            status: "offline",
            name: socket.user.name,
         });

         const channelId = userChannels.get(socket.id);
         if (channelId) {
            socket.to(channelId).emit("userLeftChannel", {
               channelId,
               userId: socket.user.id,
               name: socket.user.name,
            });
            userChannels.delete(socket.id);
         }
      } catch (error) {
         console.error("disconnect error:", error.message);
      }
   });
});

const startServer = (port) => {
   server.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
   });
};

server.on("error", (error) => {
   if (error.code === "EADDRINUSE") {
      const fallbackPort = PORT + 1;
      console.warn(`Port ${PORT} is busy. Trying ${fallbackPort} instead.`);
      startServer(fallbackPort);
      return;
   }

   console.error("Server startup error:", error);
   process.exit(1);
});

startServer(PORT);