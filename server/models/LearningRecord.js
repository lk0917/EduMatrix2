const mongoose = require("mongoose");

if (mongoose.models.LearningRecord) {
    delete mongoose.models.LearningRecord;
}

const LearningRecordSchema = new mongoose.Schema({
    user_id: { type: Number, required: true },
    date: { type: Date, required: true },
    subject: { type: String, required: true },
    status: {
        type: String, enum: ["완료", "미완료"],
        default: "미완료"
    },
    memo: { type: String },
    category: {
        type : String,
        default : "기본"
    },
}, {
    timestamps: true
});

module.exports = mongoose.model("LearningRecord", LearningRecordSchema);