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

const PORT = Number(process.env.PORT) || 5000;

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
   cors: {
      origin: process.env.CLIENT_URL,
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

      const user = await User.findById(decoded.id).select("name avatar");

      socket.user = {
         id: decoded.id,
         workspaceId: membership.workspace?._id,
         name: user?.name || "Unknown",
         avatar: user?.avatar || "",
      };
      next();
   } catch (error) {
      next(new Error("Invalid socket token"));
   }
});

io.on("connection", (socket) => {
   socket.on("joinChannel", async (channelId) => {
      try {
         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId });
         if (!channel) {
            return;
         }
         socket.join(channelId);
         socket.emit("joinedChannel", channelId);
      } catch (error) {
         console.error("Socket joinChannel error:", error.message);
      }
   });

   socket.on("typing", ({ channelId, isTyping }) => {
      if (!channelId) return;
      io.to(channelId).emit("typing", {
         channelId,
         isTyping: Boolean(isTyping),
         user: {
            id: socket.user.id,
            name: socket.user.name,
            avatar: socket.user.avatar,
         },
      });
   });

   socket.on("sendMessage", async ({ channelId, text }) => {
      try {
         if (!text || !text.trim()) return;

         const channel = await Channel.findOne({ _id: channelId, workspace: socket.user.workspaceId });
         if (!channel) return;

         const message = await Message.create({
            channel: channelId,
            workspace: socket.user.workspaceId,
            user: socket.user.id,
            text: text.trim(),
         });

         const populatedMessage = await Message.findById(message._id).populate("user", "name avatar");
         io.to(channelId).emit("newMessage", populatedMessage);
      } catch (error) {
         console.error("Socket sendMessage error:", error.message);
      }
   });

   socket.on("joinDoc", async (docId) => {
      try {
         const document = await Document.findOne({ _id: docId, workspace: socket.user.workspaceId });
         if (!document) {
            return;
         }
         socket.join(`doc:${docId}`);
         socket.emit("joinedDoc", docId);
      } catch (error) {
         console.error("Socket joinDoc error:", error.message);
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
         if (!document) {
            return;
         }

         io.to(`doc:${docId}`).emit("docUpdate", {
            document,
            user: {
               id: socket.user.id,
               name: socket.user.name,
               avatar: socket.user.avatar,
            },
         });
      } catch (error) {
         console.error("Socket docUpdate error:", error.message);
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
         },
      });
   });

   socket.on("joinBoard", async (boardId) => {
      try {
         const board = await Whiteboard.findOne({ _id: boardId, workspace: socket.user.workspaceId });
         if (!board) {
            return;
         }
         socket.join(`board:${boardId}`);
         socket.emit("joinedBoard", boardId);
      } catch (error) {
         console.error("Socket joinBoard error:", error.message);
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
         if (!board) {
            return;
         }

         io.to(`board:${boardId}`).emit("boardUpdate", {
            board,
            user: {
               id: socket.user.id,
               name: socket.user.name,
               avatar: socket.user.avatar,
            },
         });
      } catch (error) {
         console.error("Socket boardUpdate error:", error.message);
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
         },
      });
   });

   socket.on("disconnect", () => {
      socket.removeAllListeners();
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