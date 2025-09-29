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
        subject_stats: [
          {
            name: "기본",
            percent: 0,
            color: "#667eea",
            trend: [0],
          },
        ],
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

    // subject_stats가 없거나 비어있는 경우에만 생성
    if (!latest.subject_stats || latest.subject_stats.length === 0) {
      if (latest.categoryProgress && latest.categoryProgress.length > 0) {
        const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
        latest.subject_stats = latest.categoryProgress.map((cp, index) => ({
          name: cp.category,
          percent: cp.progress,
          color: colors[index % colors.length],
          trend: [cp.progress],
        }));
      } else {
        // 기본 subject_stats 제공
        latest.subject_stats = [
          {
            name: "기본",
            percent: latest.total || 0,
            color: "#667eea",
            trend: [latest.total || 0],
          },
        ];
      }
    } else {
      // 기존 subject_stats가 있지만 categoryProgress와 동기화가 필요한 경우
      if (latest.categoryProgress && latest.categoryProgress.length > 0) {
        const colors = ["#667eea", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
        const updatedSubjectStats = latest.categoryProgress.map(
          (cp, index) => ({
            name: cp.category,
            percent: cp.progress,
            color: colors[index % colors.length],
            trend: [cp.progress],
          })
        );

        // 기존 subject_stats와 비교하여 변경사항이 있으면 업데이트
        const needsUpdate =
          updatedSubjectStats.length !== latest.subject_stats.length ||
          updatedSubjectStats.some((newStat, index) => {
            const oldStat = latest.subject_stats[index];
            return (
              !oldStat ||
              oldStat.name !== newStat.name ||
              oldStat.percent !== newStat.percent
            );
          });

        if (needsUpdate) {
          latest.subject_stats = updatedSubjectStats;
          console.log("subject_stats 동기화 업데이트:", latest.subject_stats);
        }
      }
    }

    console.log("진행률 API 응답:", {
      user_id: latest.user_id,
      total: latest.total,
      categoryProgress_count: latest.categoryProgress?.length || 0,
      subject_stats_count: latest.subject_stats?.length || 0,
      subject_stats: latest.subject_stats?.map((ss) => ({
        name: ss.name,
        percent: ss.percent,
      })),
    });

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
