const express = require("express");
const { getChannels, createChannel } = require("../controllers/chat.controller");
const { getMessages, sendMessage } = require("../controllers/message.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/channels", auth, getChannels);
router.post("/channels", auth, createChannel);
router.get("/channels/:channelId/messages", auth, getMessages);
router.post("/channels/:channelId/messages", auth, sendMessage);

module.exports = router;
