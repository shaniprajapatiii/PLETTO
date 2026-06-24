const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(
   cors({
      origin: (origin, callback) => {
         const allowedOrigins = [process.env.CLIENT_URL, "http://127.0.0.1:5173"];
         if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
         } else {
            callback(new Error("Not allowed by CORS"));
         }
      },
      credentials: true,
   }),
);


// Body parser
app.use(express.json());
// URL-encoded parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Routes
app.get("/", (req, res) => {
   res.json({
      success: true,
      message: "PLETTO API Running",
   });
});

// Auth routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Feature routes
const chatRoutes = require("./routes/chat.routes");
const docsRoutes = require("./routes/docs.routes");
const whiteboardRoutes = require("./routes/whiteboard.routes");
const profileRoutes = require("./routes/profile.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const uploadRoutes = require("./routes/upload.routes");

app.use("/api/chat", chatRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/whiteboards", whiteboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/upload", uploadRoutes);

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;
