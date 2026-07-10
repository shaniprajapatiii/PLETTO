const express = require("express");
const {
   getPresence,
   updatePresence,
   getUserPresence,
   getOnlineUsers,
} = require("../controllers/presence.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getPresence);
router.put("/", auth, updatePresence);
router.get("/users/:userId", auth, getUserPresence);
router.get("/online/list", auth, getOnlineUsers);

module.exports = router;
