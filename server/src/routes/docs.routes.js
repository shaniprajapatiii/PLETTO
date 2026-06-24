const express = require("express");
const { getDocs, createDoc, updateDoc } = require("../controllers/docs.controller");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, getDocs);
router.post("/", auth, createDoc);
router.put("/:id", auth, updateDoc);

module.exports = router;
