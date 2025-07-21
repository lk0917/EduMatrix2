const axios = require("axios");
const express = require("express");
const router = express.Router();
const StudyNote = require("../models/StudyNote");

router.post("/",async(req,res)=> {
    try{
        const note = new StudyNote(req.body);
        await note.save();
        res.status(201).json(note);
    } catch(err){
        console.error("노트 저장 실패:",err);
        res.status(500).json({error:"노트 저장 실패"});
    }
});

router.get("/:user_id",async(req,res) => {
    try{
        const notes = await StudyNote.find({ user_id: req.params.user_id}).sort({ createdAt: -1});
        res.json(notes);
    }catch(err){
        console.error("노트 조회 실패:",err);
        res.status(500).json({error:"노트 조회 실패"});
    }
});

router.get("/detail/:id", async (req, res) => {
  try {
    const note = await StudyNote.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: "노트를 찾을 수 없습니다." });
    }
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

router.put('/:id', async (req, res) => {
  try {
    const { title, content, images, tables, date } = req.body;
    const note = await StudyNote.findOneAndUpdate(
      { _id: req.params.id },
      { title, content, images, tables, date },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ error: '수정할 노트를 찾을 수 없습니다.' });
    }
    res.json({ success: true, note });
  } catch (err) {
    console.error('노트 수정 실패:', err);
    res.status(500).json({ error: '노트 수정 실패' });
  }
});

module.exports = router;