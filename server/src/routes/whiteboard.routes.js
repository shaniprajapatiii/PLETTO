const express = require("express");
const { getBoards, createBoard, updateBoard } = require("../controllers/whiteboard.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getBoards);
router.post("/", auth, createBoard);
router.put("/:id", auth, updateBoard);

module.exports = router;
