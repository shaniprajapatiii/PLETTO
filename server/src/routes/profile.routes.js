const express = require("express");
const { updateProfile } = require("../controllers/profile.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.put("/", auth, updateProfile);

module.exports = router;
