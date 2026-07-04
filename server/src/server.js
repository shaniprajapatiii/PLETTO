require("dotenv").config();

const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");
const WorkspaceMember = require("./models/WorkspaceMember");
const Channel = require("./models/Channel");
const Message = require("./models/Message");

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

      socket.user = {
         id: decoded.id,
         workspaceId: membership.workspace?._id,
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