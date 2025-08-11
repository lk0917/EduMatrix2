const express = require("express");
const router = express.Router();
const ProgressSummary = require("../models/ProgressSummary");
//get

router.get("/:user_id", async (req, res) => {
  try {
    const id = Number(req.params.user_id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "유효하지 않은 user_id" });
    }

    const latest = await ProgressSummary.findOne({ user_id: id }).sort({
      created_at: -1,
    });

    if (!latest) {
      // 기본값 반환 (200) - 클라이언트 네트워크 에러 방지
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      const weekStart = monday.toISOString().slice(0, 10);

      return res.json({
        user_id: id,
        week_start: weekStart,
        total: 0,
        last_week: null,
        expected_date: "-",
        weeklyQuizProgress: 0,
        weeklyQuizCount: 0,
        lastWeeklyQuizDate: null,
        subject_stats: [],
        strong: "-",
        weak: "-",
        narrativeReport: "",
        categoryProgress: [], // 카테고리별 진행률 추가
        created_at: new Date(),
      });
    }

    // 카테고리별 진행률이 없는 경우 빈 배열로 초기화
    if (!latest.categoryProgress) {
      latest.categoryProgress = [];
    }

    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: "조회 실패", detail: err.message });
  }
});

// post
router.post("/", async (req, res) => {
  try {
    const newSummary = new ProgressSummary(req.body);
    await newSummary.save();
    res.status(201).json({ success: true, summary: newSummary });
  } catch (err) {
    res.status(500).json({ error: "저장 실패", detail: err.message });
  }
});

module.exports = router;
