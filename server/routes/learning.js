const express = require("express");
const router = express.Router();
const LearningRecord = require("../models/LearningRecord");

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

// 주석 처리된 에러문구는 절대 변경하지말아주세요.
module.exports = router;
