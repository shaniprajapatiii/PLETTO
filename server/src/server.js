require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const WorkspaceMember = require("./models/WorkspaceMember");
const Channel = require("./models/Channel");
const Message = require("./models/Message");
const Document = require("./models/Document");
const Whiteboard = require("./models/Whiteboard");
const User = require("./models/User");
const Presence = require("./models/Presence");

const PORT = Number(process.env.PORT) || 5000;

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
   cors: {
      origin: (origin, callback) => {
         if (!origin) {
            callback(null, true);
            return;
         }

         const allowedOrigins = [process.env.CLIENT_URL];
         try {
            const url = new URL(origin);
            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
               callback(null, true);
               return;
            }
         } catch (error) {
            // invalid origin format, fall back to explicit list
         }

         if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
         }

         callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
   },
});
const { setIo } = require("./utils/socket");
setIo(io);

io.use(async (socket, next) => {
   try {
      const token = socket.handshake.auth?.token;
      if (!token) {
         return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

// Track active users
const userChannels = new Map();

io.on("connection", (socket) => {
   console.log(`User ${socket.user.id} connected`);

   // Join workspace room and personal user room immediately on connection
   if (socket.user.workspaceId) {
      socket.join(socket.user.workspaceId);
   }
   if (socket.user.id) {
      socket.join(`user:${socket.user.id}`);
   }

   // ============ PRESENCE & TYPING ============
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
         console.error("userOnline error:", error);
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
         console.error("userAway error:", error);
      }
   });

   // ============ CHANNEL MANAGEMENT ============
   socket.on("joinChannel", async (channelId) => {
      try {
         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId });
         if (!channel) return;

         if (channel.type === "private" || channel.type === "dm") {
            const isMember = channel.members?.some((id) => id.toString() === socket.user.id.toString());
            const isCreator = channel.createdBy?.toString() === socket.user.id.toString();
            if (!isMember && !isCreator) {
               socket.emit("channelAccessDenied", { channelId, message: "Access denied to private channel" });
               return;
            }
         }

         socket.join(channelId);
         userChannels.set(socket.id, channelId);
         socket.emit("joinedChannel", channelId);

         // Notify others that user is viewing this channel
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

   // ============ CHANNEL MANAGEMENT (Real-time) ============
   socket.on("channelCreated", async (channelId) => {
      try {
         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId })
            .populate("members", "name email avatar")
            .populate("createdBy", "name");
         if (!channel) return;

         io.to(socket.user.workspaceId).emit("channelCreated", channel);
      } catch (error) {
         console.error("channelCreated error:", error.message);
      }
   });

   socket.on("channelUpdated", async (channelId) => {
      try {
         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId })
            .populate("members", "name email avatar")
            .populate("createdBy", "name");
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

   // ============ MESSAGING ============
   socket.on("sendMessage", async ({ channelId, text, attachments = [] }) => {
      try {
         if (!text || !text.trim()) return;

         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId });
         if (!channel) return;

         if (channel.type === "private" || channel.type === "dm") {
            const isMember = channel.members?.some((id) => id.toString() === socket.user.id.toString());
            const isCreator = channel.createdBy?.toString() === socket.user.id.toString();
            if (!isMember && !isCreator) return;
         }

         const message = await Message.create({
            channel: channelId,
            workspace: socket.user.workspaceId,
            user: socket.user.id,
            text: text.trim(),
            attachments,
         });

         const populatedMessage = await Message.findById(message._id)
            .populate("user", "name avatar color")
            .populate("reactions.users", "name avatar");

         io.to(channelId).emit("newMessage", populatedMessage);

         // Broadcast to workspace room so all online workspace members receive new public channel messages
         if (channel.type === "public" && socket.user.workspaceId) {
            io.to(socket.user.workspaceId).emit("newMessage", populatedMessage);
         }

         // For DMs and Private channels, emit to each member's personal socket room
         if (channel.members && channel.members.length > 0) {
            channel.members.forEach((mId) => {
               io.to(`user:${mId.toString()}`).emit("newMessage", populatedMessage);
            });
         }

         // Update channel last activity
         await Channel.findByIdAndUpdate(channelId, { lastActivityAt: new Date() });
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

         // Save edit history
         message.editHistory.push({
            text: message.text,
            editedAt: message.editedAt || message.createdAt,
         });

         message.text = text.trim();
         message.isEdited = true;
         message.editedAt = new Date();
         await message.save();

         const populatedMessage = await Message.findById(messageId)
            .populate("user", "name avatar color")
            .populate("reactions.users", "name avatar");

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

         io.to(channelId).emit("messageDeleted", {
            messageId,
            channelId,
         });
      } catch (error) {
         console.error("deleteMessage error:", error.message);
      }
   });

   // ============ MESSAGE FEATURES ============
   socket.on("pinMessage", async ({ messageId, channelId }) => {
      try {
         const message = await Message.findOne({
            _id: messageId,
            workspace: socket.user.workspaceId,
         });
         if (!message) return;

         message.isPinned = true;
         message.pinnedBy = socket.user.id;
         message.pinnedAt = new Date();
         await message.save();

         const populatedMessage = await Message.findById(messageId)
            .populate("user", "name avatar color")
            .populate("pinnedBy", "name avatar");

         io.to(channelId).emit("messagePinned", populatedMessage);
      } catch (error) {
         console.error("pinMessage error:", error.message);
      }
   });

   socket.on("unpinMessage", async ({ messageId, channelId }) => {
      try {
         const message = await Message.findOne({
            _id: messageId,
            workspace: socket.user.workspaceId,
         });
         if (!message) return;

         message.isPinned = false;
         message.pinnedBy = null;
         message.pinnedAt = null;
         await message.save();

         io.to(channelId).emit("messageUnpinned", { messageId, channelId });
      } catch (error) {
         console.error("unpinMessage error:", error.message);
      }
   });

   socket.on("addReaction", async ({ messageId, channelId, emoji }) => {
      try {
         if (!emoji) return;

         const message = await Message.findOne({
            _id: messageId,
            workspace: socket.user.workspaceId,
         });
         if (!message) return;

         const reaction = message.reactions.find((r) => r.emoji === emoji);
         if (reaction) {
            if (!reaction.users.includes(socket.user.id)) {
               reaction.users.push(socket.user.id);
            }
         } else {
            message.reactions.push({ emoji, users: [socket.user.id] });
         }

         await message.save();

         const populatedMessage = await Message.findById(messageId)
            .populate("user", "name avatar color")
            .populate("reactions.users", "name avatar");

         io.to(channelId).emit("reactionAdded", populatedMessage);
      } catch (error) {
         console.error("addReaction error:", error.message);
      }
   });

   socket.on("removeReaction", async ({ messageId, channelId, emoji }) => {
      try {
         if (!emoji) return;

         const message = await Message.findOne({
            _id: messageId,
            workspace: socket.user.workspaceId,
         });
         if (!message) return;

         const reaction = message.reactions.find((r) => r.emoji === emoji);
         if (reaction) {
            reaction.users = reaction.users.filter((id) => id.toString() !== socket.user.id.toString());
            if (reaction.users.length === 0) {
               message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
            }
         }

         await message.save();

         const populatedMessage = await Message.findById(messageId)
            .populate("user", "name avatar color")
            .populate("reactions.users", "name avatar");

         io.to(channelId).emit("reactionRemoved", populatedMessage);
      } catch (error) {
         console.error("removeReaction error:", error.message);
      }
   });

   // ============ DOCUMENTS ============
   socket.on("joinDoc", async (docId) => {
      try {
         const document = await Document.findOne({ _id: docId, workspace: socket.user.workspaceId });
         if (!document) return;

         socket.join(`doc:${docId}`);
         socket.emit("joinedDoc", docId);
      } catch (error) {
         console.error("joinDoc error:", error.message);
      }
   });

   socket.on("docUpdate", async ({ docId, title, content, type }) => {
      try {
         if (!docId) return;
         const update = {};
         if (title !== undefined) update.title = title;
         if (content !== undefined) update.content = content;
         if (type !== undefined) update.type = type;

         const document = await Document.findOneAndUpdate(
            { _id: docId, workspace: socket.user.workspaceId },
            update,
            { new: true },
         );
         if (!document) return;

         io.to(`doc:${docId}`).emit("docUpdate", {
            document,
            user: {
               id: socket.user.id,
               name: socket.user.name,
               avatar: socket.user.avatar,
               color: socket.user.color,
            },
         });
      } catch (error) {
         console.error("docUpdate error:", error.message);
      }
   });

   socket.on("docCursor", ({ docId, cursor }) => {
      if (!docId || !cursor) return;
      socket.to(`doc:${docId}`).emit("docCursor", {
         docId,
         cursor,
         user: {
            id: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
            color: socket.user.color,
         },
      });
   });

   // ============ WHITEBOARDS ============
   socket.on("joinBoard", async (boardId) => {
      try {
         const board = await Whiteboard.findOne({ _id: boardId, workspace: socket.user.workspaceId });
         if (!board) return;

         socket.join(`board:${boardId}`);
         socket.emit("joinedBoard", boardId);
      } catch (error) {
         console.error("joinBoard error:", error.message);
      }
   });

   socket.on("boardUpdate", async ({ boardId, data }) => {
      try {
         if (!boardId || data === undefined) return;

         const board = await Whiteboard.findOneAndUpdate(
            { _id: boardId, workspace: socket.user.workspaceId },
            { data },
            { new: true },
         );
         if (!board) return;

         io.to(`board:${boardId}`).emit("boardUpdate", {
            board,
            user: {
               id: socket.user.id,
               name: socket.user.name,
               avatar: socket.user.avatar,
               color: socket.user.color,
            },
         });
      } catch (error) {
         console.error("boardUpdate error:", error.message);
      }
   });

   socket.on("boardCursor", ({ boardId, cursor }) => {
      if (!boardId || !cursor) return;
      socket.to(`board:${boardId}`).emit("boardCursor", {
         boardId,
         cursor,
         user: {
            id: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
            color: socket.user.color,
         },
      });
   });

   // ============ DISCONNECT ============
   socket.on("disconnect", async () => {
      try {
         console.log(`User ${socket.user.id} disconnected`);

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
         }

         socket.removeAllListeners();
      } catch (error) {
         console.error("disconnect error:", error);
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