const express = require("express");
const multer = require("multer");
const { uploadFile } = require("../controllers/upload.controller");
const auth = require("../middleware/auth");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", auth, upload.single("file"), uploadFile);

module.exports = router;
