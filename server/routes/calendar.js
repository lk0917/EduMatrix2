const express = require("express");
const router = express.Router();
const CalendarPlan = require("../models/CalendarPlan");

// 사용자별 계획 조회 (PlanRecommend에서 사용)
router.get("/get-user-plan", async (req, res) => {
  try {
    // 세션에서 user_id를 가져오거나 쿼리 파라미터로 받기
    const user_id = req.query.user_id || req.session?.user_id;

    if (!user_id) {
      return res.status(400).json({ error: "사용자 ID가 필요합니다." });
    }

    const plans = await CalendarPlan.find({ user_id: parseInt(user_id) })
      .sort({ date: 1 })
      .limit(7); // 최근 7일 계획만 가져오기

    res.json({
      success: true,
      plans: plans,
    });
  } catch (err) {
    console.error("사용자 계획 조회 실패:", err);
    res.status(500).json({ error: "사용자 계획 조회 실패" });
  }
});

router.get("/:user_id", async (req, res) => {
  try {
    const plans = await CalendarPlan.find({ user_id: req.params.user_id }).sort(
      { date: 1, createdAt: 1 }
    );

    // 날짜별로 그룹화
    const groupedPlans = {};
    plans.forEach((plan) => {
      if (!groupedPlans[plan.date]) {
        groupedPlans[plan.date] = [];
      }
      groupedPlans[plan.date].push(plan);
    });

    res.json({ plans, groupedPlans });
  } catch (err) {
    console.error("일정 조회 실패:", err);
    res.status(500).json({ error: "일정 조회 실패" });
  }
});

router.post("/", async (req, res) => {
  try {
    // 필수 필드가 없으면 기본값 설정
    const planData = {
      ...req.body,
      topic: req.body.topic || req.body.goal || "학습 계획",
      description: req.body.description || "학습 목표 달성을 위한 계획",
    };

    const plan = new CalendarPlan(planData);
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    console.error("일정 저장 실패:", err);
    res.status(500).json({ error: "일정 저장 실패" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updateData = {
      goal: req.body.goal,
      field: req.body.field,
      topic: req.body.topic || req.body.goal || "학습 계획",
      description: req.body.description || "학습 목표 달성을 위한 계획",
    };

    const plan = await CalendarPlan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!plan)
      return res.status(404).json({ error: "수정할 일정이 없습니다." });
    res.json(plan);
  } catch (err) {
    console.error("일정 수정 실패:", err);
    res.status(500).json({ error: "일정 수정 실패" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await CalendarPlan.findByIdAndDelete(req.params.id);
    if (!result)
      return res.status(404).json({ error: "삭제할 일정이 없습니다." });
    res.json({ message: "일정이 삭제되었습니다." });
  } catch (err) {
    console.error("일정 삭제 실패:", err);
    res.status(500).json({ error: "일정 삭제 실패" });
  }
});

module.exports = router;
