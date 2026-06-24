const express = require("express");
const { getMembers, inviteMember } = require("../controllers/workspace.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/members", auth, getMembers);
router.post("/members", auth, inviteMember);

module.exports = router;
