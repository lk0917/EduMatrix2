const express = require("express");
const router = express.Router();
const UserCategory = require("../models/UserCategory");

// 카테고리 조회
router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  let found = await UserCategory.findOne({ user_id });
  if (!found) {
    found = await new UserCategory({ user_id }).save();
  }
  res.json(found.categories);
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
    if (idx === -1) return res.status(400).json({ error: "기존 카테고리 없음" });

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
