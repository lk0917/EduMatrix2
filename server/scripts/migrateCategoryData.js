require("dotenv").config();
require("../mongodb"); // MongoDB 연결

const StudyNote = require("../models/StudyNote");
const LearningRecord = require("../models/LearningRecord");
const QuizLog = require("../models/QuizLog");
const ProgressSummary = require("../models/ProgressSummary");
const pool = require("../db");
const { getNormalizedCategory } = require("../utils/categoryUtils");

/**
 * 기존 데이터에 카테고리 정보를 추가/업데이트하는 마이그레이션 스크립트
 */
async function migrateCategoryData() {
  console.log("🚀 카테고리 데이터 마이그레이션 시작...");

  try {
    // 1. 모든 사용자의 학습 목표 조회
    const conn = await pool.getConnection();
    const [learningGoals] = await conn.query(
      "SELECT user_id, subject, detail FROM learning_goals"
    );
    conn.release();

    console.log(`📊 ${learningGoals.length}명의 학습 목표 발견`);

    // 사용자별 카테고리 매핑 생성
    const userCategoryMap = {};
    learningGoals.forEach((goal) => {
      const category = getNormalizedCategory(goal.subject, goal.detail);
      userCategoryMap[goal.user_id] = category;
      console.log(
        `👤 사용자 ${goal.user_id}: ${goal.subject} + ${goal.detail} → ${category}`
      );
    });

    // 2. StudyNote 업데이트
    console.log("\n📝 학습 노트 업데이트 중...");
    const studyNotes = await StudyNote.find({
      category: { $in: [null, "기본"] },
    });
    console.log(`📝 업데이트할 학습 노트: ${studyNotes.length}개`);

    let updatedNotes = 0;
    for (const note of studyNotes) {
      const category = userCategoryMap[note.user_id] || "기본";
      await StudyNote.findByIdAndUpdate(note._id, { category });
      updatedNotes++;

      if (updatedNotes % 10 === 0) {
        console.log(
          `📝 학습 노트 ${updatedNotes}/${studyNotes.length} 업데이트 완료`
        );
      }
    }
    console.log(`✅ 학습 노트 업데이트 완료: ${updatedNotes}개`);

    // 3. LearningRecord 업데이트
    console.log("\n📚 학습 기록 업데이트 중...");
    const learningRecords = await LearningRecord.find({
      category: { $in: [null, "기본"] },
    });
    console.log(`📚 업데이트할 학습 기록: ${learningRecords.length}개`);

    let updatedRecords = 0;
    for (const record of learningRecords) {
      const category = userCategoryMap[record.user_id] || "기본";
      await LearningRecord.findByIdAndUpdate(record._id, { category });
      updatedRecords++;

      if (updatedRecords % 10 === 0) {
        console.log(
          `📚 학습 기록 ${updatedRecords}/${learningRecords.length} 업데이트 완료`
        );
      }
    }
    console.log(`✅ 학습 기록 업데이트 완료: ${updatedRecords}개`);

    // 4. QuizLog 업데이트
    console.log("\n🧩 퀴즈 로그 업데이트 중...");
    const quizLogs = await QuizLog.find({ category: { $in: [null, "기본"] } });
    console.log(`🧩 업데이트할 퀴즈 로그: ${quizLogs.length}개`);

    let updatedQuizzes = 0;
    for (const quiz of quizLogs) {
      const category = userCategoryMap[quiz.user_id] || "기본";
      await QuizLog.findByIdAndUpdate(quiz._id, { category });
      updatedQuizzes++;

      if (updatedQuizzes % 5 === 0) {
        console.log(
          `🧩 퀴즈 로그 ${updatedQuizzes}/${quizLogs.length} 업데이트 완료`
        );
      }
    }
    console.log(`✅ 퀴즈 로그 업데이트 완료: ${updatedQuizzes}개`);

    // 5. ProgressSummary에 카테고리별 진행률 초기화
    console.log("\n📈 진행률 요약 업데이트 중...");
    const progressSummaries = await ProgressSummary.find({});
    console.log(`📈 업데이트할 진행률 요약: ${progressSummaries.length}개`);

    let updatedProgress = 0;
    for (const progress of progressSummaries) {
      const category = userCategoryMap[progress.user_id] || "기본";

      // 카테고리별 진행률이 없으면 초기화
      if (
        !progress.categoryProgress ||
        progress.categoryProgress.length === 0
      ) {
        progress.categoryProgress = [
          {
            category: category,
            progress: progress.total || 0,
            lastWeekProgress: progress.last_week || 0,
            quizCount: progress.weeklyQuizCount || 0,
            averageScore: 0,
            lastQuizDate: progress.lastWeeklyQuizDate || null,
          },
        ];

        await progress.save();
        updatedProgress++;
      }
    }
    console.log(`✅ 진행률 요약 업데이트 완료: ${updatedProgress}개`);

    // 6. 마이그레이션 결과 요약
    console.log("\n🎉 마이그레이션 완료!");
    console.log("=".repeat(50));
    console.log(`📝 학습 노트 업데이트: ${updatedNotes}개`);
    console.log(`📚 학습 기록 업데이트: ${updatedRecords}개`);
    console.log(`🧩 퀴즈 로그 업데이트: ${updatedQuizzes}개`);
    console.log(`📈 진행률 요약 업데이트: ${updatedProgress}개`);
    console.log("=".repeat(50));

    // 7. 카테고리별 데이터 분포 확인
    console.log("\n📊 카테고리별 데이터 분포:");
    const categoryStats = {};

    // 학습 노트 카테고리 분포
    const noteCategories = await StudyNote.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📝 학습 노트 카테고리 분포:");
    noteCategories.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count}개`);
    });

    // 학습 기록 카테고리 분포
    const recordCategories = await LearningRecord.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📚 학습 기록 카테고리 분포:");
    recordCategories.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count}개`);
    });
  } catch (error) {
    console.error("❌ 마이그레이션 실패:", error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateCategoryData()
    .then(() => {
      console.log("✅ 마이그레이션 성공적으로 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 마이그레이션 실패:", error);
      process.exit(1);
    });
}

module.exports = { migrateCategoryData };
