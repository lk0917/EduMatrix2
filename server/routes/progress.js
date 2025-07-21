const express = require("express");
const router = express.Router();
const ProgressSummary = require("../models/ProgressSummary");
//get

router.get("/:user_id", async(req, res) => {
    const { user_id } = req.params;
    try{
        const latest = await ProgressSummary.findOne({user_id})
        .sort({ created_at: -1 });
        if (!latest) {
        return res.status(404).json({ message: "진행률 요약 없음" });
            }
res.json(latest);
    } catch(err){
        res.status(500).json({ error : "조회 실패",detail:err.message});
    }
});


// post
router.post("/",async (req,res) => {
    try{
        const newSummary = new ProgressSummary(req.body);
        await newSummary.save();
        res.status(201).json({ success : true, summary : newSummary });
    } catch(err) {
        res.status(500).json({ error : "저장 실패",detail:err.message});
    }
});

module.exports = router;
