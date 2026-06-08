const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(
   cors({
      origin: process.env.CLIENT_URL,
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


const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;
