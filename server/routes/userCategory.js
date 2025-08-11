const express = require("express");
const router = express.Router();
const UserCategory = require("../models/UserCategory");
const pool = require("../db");
const { getNormalizedCategory } = require("../utils/categoryUtils");

// 카테고리 조회
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    let found = await UserCategory.findOne({ user_id });

    if (!found) {
      // 사용자의 학습 목표에서 카테고리 자동 생성
      let defaultCategories = ["기본"];

      try {
        const conn = await pool.getConnection();
        const [goals] = await conn.query(
          "SELECT subject, detail FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
          [user_id]
        );
        conn.release();

        if (goals && goals.length > 0) {
          const { subject, detail } = goals[0];
          const category = getNormalizedCategory(subject, detail);
          if (category !== "기본") {
            defaultCategories = [category, "기본"];
          }
        }
      } catch (goalError) {
        console.warn("학습 목표 조회 실패:", goalError.message);
      }

      found = await new UserCategory({
        user_id,
        categories: defaultCategories,
      }).save();
    }

    res.json(found.categories);
  } catch (error) {
    console.error("카테고리 조회 실패:", error);
    res.status(500).json({ error: "카테고리 조회 실패" });
  }
});

// 카테고리 추가
router.post("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { newCategory } = req.body;

  const updated = await UserCategory.findOneAndUpdate(
    { user_id },
    { $addToSet: { categories: newCategory } },
    { new: true, upsert: true }
  );
  res.json(updated.categories);
});
//카테고리 새이름으로 변경
router.patch("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { oldCategory, newCategory } = req.body;

  try {
    const doc = await UserCategory.findOne({ user_id });
    if (!doc) return res.status(404).json({ error: "사용자 없음" });

    const idx = doc.categories.indexOf(oldCategory);
    if (idx === -1)
      return res.status(400).json({ error: "기존 카테고리 없음" });

    doc.categories[idx] = newCategory;
    await doc.save();
    res.json(doc.categories);
  } catch (err) {
    console.error("카테고리명 변경 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

//카테고리 삭제
router.post("/:user_id/delete", async (req, res) => {
  const { user_id } = req.params;
  const { targetCategory } = req.body;

  try {
    const updated = await UserCategory.findOneAndUpdate(
      { user_id },
      { $pull: { categories: targetCategory } },
      { new: true }
    );
    res.json(updated.categories);
  } catch (err) {
    console.error("카테고리 삭제 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});
module.exports = router;
