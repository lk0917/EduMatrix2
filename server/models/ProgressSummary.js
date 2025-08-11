const mongoose = require("mongoose");

const ProgressSummarySchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  week_start: { type: String, required: true }, //날짜 2025-07-14
  total: { type: Number, required: true }, // 주간 전체 퍼센트
  last_week: { type: Number }, // 지난주 퍼센트
  expected_date: { type: String }, // 목표 달성 예측일

  // 카테고리별 진행률 추가
  categoryProgress: [
    {
      category: { type: String, required: true },
      progress: { type: Number, default: 0 },
      lastWeekProgress: { type: Number, default: 0 },
      quizCount: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastQuizDate: { type: Date },
    },
  ],

  // 주간 퀴즈 관련 필드들
  weeklyQuizProgress: { type: Number, default: 0 }, // 주간 퀴즈 진행률
  weeklyQuizCount: { type: Number, default: 0 }, // 주간 퀴즈 완료 횟수
  lastWeeklyQuizDate: { type: Date }, // 마지막 주간 퀴즈 날짜

  // 새로운 프롬프트 기반 상세 통계
  detailedStats: {
    // 최근 테스트 결과 요약
    recentTestResults: [
      {
        testDate: { type: Date },
        testType: { type: String },
        score: { type: Number },
        totalQuestions: { type: Number },
        progressPercent: { type: Number },
      },
    ],

    // 주제별 숙련도 트렌드 (최근 5회)
    topicMasteryTrend: [
      {
        topic: { type: String },
        masteryHistory: [{ type: Number }], // 최근 5회 숙련도
        averageMastery: { type: Number },
        improvementRate: { type: Number },
      },
    ],

    // 학습 패턴 분석
    learningPatterns: {
      consistentStrengths: [{ type: String }],
      persistentWeaknesses: [{ type: String }],
      improvingAreas: [{ type: String }],
      decliningAreas: [{ type: String }],
    },

    // 목표 달성 예측
    goalPrediction: {
      currentProgressPercent: { type: Number },
      weeklyImprovementRate: { type: Number },
      estimatedCompletionWeeks: { type: Number },
      confidenceLevel: { type: String, enum: ["low", "medium", "high"] },
    },
  },

  subject_stats: [
    {
      name: { type: String, required: true },
      percent: { type: Number, required: true },
      trend: { type: [Number], default: [] },
    },
  ],
  strong: { type: String },
  weak: { type: String },

  // 문장형 보고서 (렌더링용 마크다운 텍스트)
  narrativeReport: { type: String },

  // 최신 상세 보고서 (JSON 형태로 저장)
  latestDetailedReport: { type: mongoose.Schema.Types.Mixed },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ProgressSummary", ProgressSummarySchema);
