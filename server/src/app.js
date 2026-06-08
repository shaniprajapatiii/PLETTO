const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(
   cors({
      origin: process.env.CLIENT_URL,
      credentials: true
   })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
   res.json({
      success: true,
      message: "TeamWeave API Running"
   });
});

module.exports = app;