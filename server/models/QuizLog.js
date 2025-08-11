const mongoose = require("mongoose");

const QuizLogSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  type: { type: String, enum: ["level-check", "weekly"], required: true },
  // 카테고리 정보 추가
  category: { type: String, default: "기본" },
  // 생성된 문제 목록
  problems: { type: Array, default: [] },
  // 주간 퀴즈 메타
  summary: { type: String },
  goal: { type: String },
  testCount: { type: Number },
  // 결과 저장용
  score: { type: Number },
  wrong: { type: [Number], default: [] },
  previousSummary: { type: String },

  // 새로운 프롬프트 기반 상세 보고서 데이터
  detailedReport: {
    // JSON 스키마 데이터
    meta: {
      goal: { type: String },
      testType: { type: String },
      testCount: { type: Number },
      date: { type: String },
      summary: { type: String },
    },
    score: {
      raw: { type: Number },
      total: { type: Number },
      percent: { type: Number },
    },
    progress: {
      currentProgressPercent: { type: Number },
      previousProgressPercent: { type: Number },
      deltaPercent: { type: Number },
      confidence: { type: String, enum: ["low", "medium", "high"] },
      estCompletionDate: { type: String },
      rationale: { type: String },
    },
    topicMastery: [
      {
        topic: { type: String },
        mastery: { type: Number },
      },
    ],
    wrongAnalysis: [
      {
        questionNumber: { type: Number },
        topic: { type: String },
        errorType: { type: String },
        cause: { type: String },
        immediateFix: { type: String },
        reference: { type: String },
      },
    ],
    patterns: {
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      systemicRisks: [{ type: String }],
    },
    actionPlan: {
      next7Days: [
        {
          day: { type: Number },
          focus: { type: String },
          tasks: [{ type: String }],
          time: { type: String },
        },
      ],
      microGoals: [{ type: String }],
      resources: [{ type: String }],
    },
    practiceSet: {
      questionCount: { type: Number },
      difficulty: { type: String },
      format: { type: String },
    },
    milestoneToGoal: {
      currentProgress: { type: Number },
      nextCheckpoint: { type: Number },
      bottleneckFactors: [{ type: String }],
    },
    nextTestPlan: {
      recommendedDate: { type: String },
      focusAreas: [{ type: String }],
      preparation: [{ type: String }],
    },
    reflection: {
      prompt: { type: String },
      habitTip: { type: String },
    },
    badges: [{ type: String }],
  },

  // 기존 필드들
  feedback_report: { type: String },
  // 학습 진행률 및 통계
  progressPercentage: { type: Number },
  averageScore: { type: Number },
  // 학습 데이터 정보
  learningData: {
    totalNotes: { type: Number },
    totalRecords: { type: Number },
    noteContent: { type: String },
    learningContent: { type: String },
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("QuizLog", QuizLogSchema);
