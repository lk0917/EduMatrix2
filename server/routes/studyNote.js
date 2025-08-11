const axios = require("axios");
const express = require("express");
const router = express.Router();
const StudyNote = require("../models/StudyNote");
const pool = require("../db");
const {
  extractCategoryFromLearningGoal,
  getNormalizedCategory,
} = require("../utils/categoryUtils");

router.post("/", async (req, res) => {
  try {
    const { user_id, title, content, images, tables, date } = req.body;

    // 사용자의 학습 목표를 조회하여 카테고리 자동 설정
    let category = "기본";

    try {
      const conn = await pool.getConnection();
      const [goals] = await conn.query(
        "SELECT subject, detail FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [user_id]
      );
      conn.release();

      if (goals && goals.length > 0) {
        const { subject, detail } = goals[0];
        category = getNormalizedCategory(subject, detail);
      }
    } catch (goalError) {
      console.warn(
        "학습 목표 조회 실패, 기본 카테고리 사용:",
        goalError.message
      );
    }

    const noteData = {
      user_id,
      title,
      content,
      category,
      images: images || [],
      tables: tables || [],
      date: date || new Date(),
    };

    const note = new StudyNote(noteData);
    await note.save();

    console.log(`노트 저장 완료 - 카테고리: ${category}`);
    res.status(201).json(note);
  } catch (err) {
    console.error("노트 저장 실패:", err);
    res.status(500).json({ error: "노트 저장 실패" });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    console.log("노트 목록 조회 요청:", req.params.user_id);
    const notes = await StudyNote.find({ user_id: req.params.user_id }).sort({
      createdAt: -1,
    });
    console.log("노트 목록 조회 완료:", notes.length, "개");
    res.json(notes);
  } catch (err) {
    console.error("노트 조회 실패:", err);
    res.status(500).json({ error: "노트 조회 실패" });
  }
});

router.get("/detail/:id", async (req, res) => {
  try {
    console.log("노트 상세 조회 요청:", req.params.id);
    const note = await StudyNote.findById(req.params.id);
    if (!note) {
      console.log("노트를 찾을 수 없음:", req.params.id);
      return res.status(404).json({ error: "노트를 찾을 수 없습니다." });
    }
    console.log("노트 상세 조회 완료:", note.title);
    res.json(note);
  } catch (err) {
    console.error("노트 상세 조회 실패:", err);
    res.status(500).json({ error: "노트 상세 조회 실패" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await StudyNote.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "삭제할 노트를 찾을 수 없습니다." });
    }
    res.json({ message: "노트가 삭제되었습니다." });
  } catch (err) {
    console.error("노트 삭제 실패:", err);
    res.status(500).json({ error: "노트 삭제 실패" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { title, content, images, tables, date } = req.body;
    const note = await StudyNote.findOneAndUpdate(
      { _id: req.params.id },
      { title, content, images, tables, date },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ error: "수정할 노트를 찾을 수 없습니다." });
    }
    res.json({ success: true, note });
  } catch (err) {
    console.error("노트 수정 실패:", err);
    res.status(500).json({ error: "노트 수정 실패" });
  }
});

module.exports = router;
