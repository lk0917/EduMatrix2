const mongoose = require("mongoose");

const ProgressSummarySchema = new mongoose.Schema({

    user_id : { type : Number, required : true }, 
    week_start : { type : String, required : true}, //날짜 2025-07-14
    total : { type : Number, required : true}, // 주간 전체 퍼센트
    last_week : { type : Number }, // 지난주 퍼센트
    expected_date : { type : String }, // 목표 달성 예측일
    subject_stats:[{
        name : { type : String, required : true},
        percent :  { type : Number, required : true},
        trend : { type : [Number], default : [] }
    }
    ],
    strong : { type : String },
    weak : { type : String },
    created_at : { type : Date, default : Date.now }
});

module.exports = mongoose.model("ProgressSummary", ProgressSummarySchema);
