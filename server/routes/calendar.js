const express = require("express");
const router  = express.Router();
const CalendarPlan = require("../models/CalendarPlan");


router.get("/:user_id", async (req, res) => {
  try {
    const plans = await CalendarPlan.find({ user_id: req.params.user_id })
                                    .sort({ date: 1 });
    res.json(plans);
  } catch (err) {
    console.error("일정 조회 실패:", err);
    res.status(500).json({ error: "일정 조회 실패" });
  }
});


router.post("/", async (req, res) => {
  try {
    const plan = new CalendarPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    console.error("일정 저장 실패:", err);
    res.status(500).json({ error: "일정 저장 실패" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const plan = await CalendarPlan.findByIdAndUpdate(
      req.params.id,
      { goal: req.body.goal, field: req.body.field },
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ error: "수정할 일정이 없습니다." });
    res.json(plan);
  } catch (err) {
    console.error("일정 수정 실패:", err);
    res.status(500).json({ error: "일정 수정 실패" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const result = await CalendarPlan.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "삭제할 일정이 없습니다." });
    res.json({ message: "일정이 삭제되었습니다." });
  } catch (err) {
    console.error("일정 삭제 실패:", err);
    res.status(500).json({ error: "일정 삭제 실패" });
  }
});

module.exports = router;
