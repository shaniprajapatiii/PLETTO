const express = require("express");
const { getBoards, createBoard, updateBoard, deleteBoard } = require("../controllers/whiteboard.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getBoards);
router.post("/", auth, createBoard);
router.put("/:id", auth, updateBoard);
router.delete("/:id", auth, deleteBoard);

module.exports = router;
