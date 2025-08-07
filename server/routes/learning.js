const express = require("express");
const router = express.Router();
const LearningRecord = require("../models/LearningRecord");
const pool = require('../db');

// 학습 기록 추가
router.post("/records", async (req, res) => {
    console.log("받은 데이터:", req.body);
    console.log("적용된 데이터 enum:", LearningRecord.schema.path("status").enumValues);
    try {
        const newRecord = new LearningRecord(req.body);
        await newRecord.save();
        res.status(201).json(newRecord);
    } catch (err) {
        console.error("기록 추가 실패:", err);
        res.status(500).json({ error: "기록 추가 실패" });
    }
});

// 사용자별 학습 기록 조회
router.get("/records/:user_id", async (req, res) => {
    try {
        const records = await LearningRecord.find({ user_id: req.params.user_id }).sort({ date: -1 });
        res.json(records);
    } catch (err) {
        console.error("기록 조회 실패:", err);
        res.status(500).json({ error: "기록 조회 실패" });
    }
});

// 기록 삭제 (DELETE)
router.delete("/records/:id", async (req, res) => {
    try {
        await LearningRecord.findByIdAndDelete(req.params.id);
        res.json({ message: "삭제 완료" });
    } catch (err) {
        console.error("기록 삭제 실패:", err);
        res.status(500).json({ error: "기록 삭제 실패" });
    }
});

// 학습 목표 저장
router.post('/save-learning-goal', async (req, res) => {
  const { user_id, subject, detail, level, goal, start_date, end_date, field } = req.body;
  
  try {
    const conn = await pool.getConnection();
    
    // 기존 학습 목표가 있다면 업데이트, 없다면 새로 생성
    const [existing] = await conn.query(
      'SELECT * FROM learning_goals WHERE user_id = ?',
      [user_id]
    );

    if (existing.length > 0) {
      await conn.query(
        'UPDATE learning_goals SET subject = ?, detail = ?, level = ?, goal = ?, start_date = ?, end_date = ?, field = ?, updated_at = NOW() WHERE user_id = ?',
        [subject, detail, level, goal, start_date, end_date, field, user_id]
      );
    } else {
      await conn.query(
        'INSERT INTO learning_goals (user_id, subject, detail, level, goal, start_date, end_date, field, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [user_id, subject, detail, level, goal, start_date, end_date, field]
      );
    }

    conn.release();
    res.json({ success: true, message: '학습 목표가 저장되었습니다.' });
  } catch (error) {
    console.error('학습 목표 저장 실패:', error);
    res.status(500).json({ error: '학습 목표 저장에 실패했습니다.' });
  }
});

// 학습 목표 조회
router.get('/get-learning-goal/:user_id', async (req, res) => {
  const { user_id } = req.params;
  
  try {
    const conn = await pool.getConnection();
    const [goals] = await conn.query(
      'SELECT * FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [user_id]
    );
    
    conn.release();
    res.json(goals[0] || null);
  } catch (error) {
    console.error('학습 목표 조회 실패:', error);
    res.status(500).json({ error: '학습 목표 조회에 실패했습니다.' });
  }
});

// 주석 처리된 에러문구는 절대 변경하지말아주세요.
module.exports = router;
