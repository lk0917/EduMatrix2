const express = require("express");
const router = express.Router();
const { handleChat } = require("../controller/AIChatbot");

// POST /chat - 챗봇 메시지 처리
router.post("/", handleChat);

module.exports = router;
