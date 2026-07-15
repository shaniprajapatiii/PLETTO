const express = require("express");
const {
   getChannels,
   createChannel,
   updateChannel,
   deleteChannel,
   addMember,
   removeMember,
   muteChannel,
   unmuteChannel,
   getCreatedChannels,
} = require("../controllers/chat.controller");
const {
   getMessages,
   sendMessage,
   editMessage,
   deleteMessage,
   pinMessage,
   unpinMessage,
   addReaction,
   removeReaction,
   getPinnedMessages,
   getThreadReplies,
} = require("../controllers/message.controller");
const auth = require("../middleware/auth");

const router = express.Router();

// Channel routes
router.get("/channels", auth, getChannels);
router.get("/channels/created", auth, getCreatedChannels);
router.post("/channels", auth, createChannel);
router.put("/channels/:channelId", auth, updateChannel);
router.delete("/channels/:channelId", auth, deleteChannel);

// Channel member management
router.post("/channels/:channelId/members", auth, addMember);
router.delete("/channels/:channelId/members", auth, removeMember);

// Channel muting
router.post("/channels/:channelId/mute", auth, muteChannel);
router.post("/channels/:channelId/unmute", auth, unmuteChannel);

// Message routes
router.get("/channels/:channelId/messages", auth, getMessages);
router.post("/channels/:channelId/messages", auth, sendMessage);
router.put("/messages/:messageId", auth, editMessage);
router.delete("/messages/:messageId", auth, deleteMessage);

// Message features
router.post("/messages/:messageId/pin", auth, pinMessage);
router.post("/messages/:messageId/unpin", auth, unpinMessage);
router.post("/messages/:messageId/reactions", auth, addReaction);
router.delete("/messages/:messageId/reactions", auth, removeReaction);

// Thread routes
router.get("/messages/:messageId/thread", auth, getThreadReplies);
router.get("/channels/:channelId/pinned", auth, getPinnedMessages);

module.exports = router;
