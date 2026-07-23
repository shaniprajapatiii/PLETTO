const express = require("express");
const { getDocs, createDoc, updateDoc, deleteDoc } = require("../controllers/docs.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getDocs);
router.post("/", auth, createDoc);
router.put("/:id", auth, updateDoc);
router.delete("/:id", auth, deleteDoc);

module.exports = router;
