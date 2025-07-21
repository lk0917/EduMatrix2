const express = require("express");
const router = express.Router();
const pool   = require("../db");

router.post("/save-quiz-result", async (req, res) => {
  const { user_id, subject, detail, level, score } = req.body;
  try {
    await pool.query(
      `INSERT INTO test_results (user_id, subject, detail, level, score)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, subject, detail, level, score]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("퀴즈 결과 저장 실패:", err);
    res.status(500).json({ success: false, message: "서버 오류로 저장에 실패했습니다." });
  }
});

module.exports = router;
