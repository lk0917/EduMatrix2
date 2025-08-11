require("dotenv").config();
require("../mongodb");

const StudyNote = require("../models/StudyNote");
const LearningRecord = require("../models/LearningRecord");
const QuizLog = require("../models/QuizLog");
const ProgressSummary = require("../models/ProgressSummary");
const UserCategory = require("../models/UserCategory");
const {
  getNormalizedCategory,
  extractCategoriesFromData,
} = require("../utils/categoryUtils");

/**
 * 카테고리 시스템 통합 테스트
 */
async function testCategorySystem() {
  console.log("🧪 카테고리 시스템 통합 테스트 시작...\n");

  try {
    // 1. 카테고리 유틸리티 함수 테스트
    console.log("1️⃣ 카테고리 유틸리티 함수 테스트");
    const testCases = [
      {
        subject: "programming",
        detail: "javascript",
        expected: "Programming - Javascript",
      },
      {
        subject: "language",
        detail: "english",
        expected: "Language - English",
      },
      {
        subject: "mathematics",
        detail: "calculus",
        expected: "Mathematics - Calculus",
      },
      { subject: null, detail: "python", expected: "Python" },
      { subject: "unknown", detail: "test", expected: "Unknown - Test" },
    ];

    testCases.forEach(({ subject, detail, expected }) => {
      const result = getNormalizedCategory(subject, detail);
      const status = result === expected ? "✅" : "❌";
      console.log(
        `   ${status} ${subject} + ${detail} → "${result}" (예상: "${expected}")`
      );
    });

    // 2. 데이터베이스 연결 테스트
    console.log("\n2️⃣ 데이터베이스 연결 테스트");

    // StudyNote 테스트
    const sampleNotes = await StudyNote.find().limit(3);
    console.log(`   ✅ StudyNote 연결 성공 (샘플: ${sampleNotes.length}개)`);

    // LearningRecord 테스트
    const sampleRecords = await LearningRecord.find().limit(3);
    console.log(
      `   ✅ LearningRecord 연결 성공 (샘플: ${sampleRecords.length}개)`
    );

    // UserCategory 테스트
    const sampleCategories = await UserCategory.find().limit(3);
    console.log(
      `   ✅ UserCategory 연결 성공 (샘플: ${sampleCategories.length}개)`
    );

    // 3. 카테고리별 데이터 분포 분석
    console.log("\n3️⃣ 카테고리별 데이터 분포 분석");

    // 노트 카테고리 분포
    const noteCategories = await StudyNote.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("   📝 노트 카테고리 분포:");
    noteCategories.forEach((stat) => {
      console.log(`      ${stat._id || "미분류"}: ${stat.count}개`);
    });

    // 학습 기록 카테고리 분포
    const recordCategories = await LearningRecord.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("   📚 학습 기록 카테고리 분포:");
    recordCategories.forEach((stat) => {
      console.log(`      ${stat._id || "미분류"}: ${stat.count}개`);
    });

    // 4. 퀴즈 로그 카테고리 분포
    console.log("\n4️⃣ 퀴즈 로그 카테고리 분포");
    const quizCategories = await QuizLog.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("   🧩 퀴즈 카테고리 분포:");
    if (quizCategories.length > 0) {
      quizCategories.forEach((stat) => {
        console.log(`      ${stat._id || "미분류"}: ${stat.count}개`);
      });
    } else {
      console.log("      아직 퀴즈 데이터가 없습니다.");
    }

    // 5. 진행률 요약 카테고리 분포
    console.log("\n5️⃣ 진행률 요약 카테고리 분포");
    const progressSummaries = await ProgressSummary.find({});

    console.log(`   📈 총 진행률 요약: ${progressSummaries.length}개`);
    let totalCategoryProgress = 0;
    progressSummaries.forEach((progress, index) => {
      if (progress.categoryProgress && progress.categoryProgress.length > 0) {
        console.log(
          `      사용자 ${progress.user_id}: ${progress.categoryProgress.length}개 카테고리`
        );
        progress.categoryProgress.forEach((cp) => {
          console.log(
            `         - ${cp.category}: ${cp.progress}% (퀴즈 ${cp.quizCount}회)`
          );
        });
        totalCategoryProgress += progress.categoryProgress.length;
      }
    });
    console.log(
      `   📊 총 카테고리별 진행률 데이터: ${totalCategoryProgress}개`
    );

    // 6. 사용자별 카테고리 현황
    console.log("\n6️⃣ 사용자별 카테고리 현황");
    const userCategories = await UserCategory.find({});

    console.log(`   👥 총 사용자: ${userCategories.length}명`);
    userCategories.forEach((userCat) => {
      console.log(
        `      사용자 ${userCat.user_id}: [${userCat.categories.join(", ")}]`
      );
    });

    // 7. 카테고리 시스템 건전성 검사
    console.log("\n7️⃣ 카테고리 시스템 건전성 검사");

    // 미분류 데이터 확인
    const uncategorizedNotes = await StudyNote.countDocuments({
      $or: [{ category: null }, { category: "기본" }],
    });
    const uncategorizedRecords = await LearningRecord.countDocuments({
      $or: [{ category: null }, { category: "기본" }],
    });

    console.log(`   📝 미분류 노트: ${uncategorizedNotes}개`);
    console.log(`   📚 미분류 학습 기록: ${uncategorizedRecords}개`);

    // 고아 카테고리 확인 (사용자 카테고리에는 있지만 실제 데이터가 없는 경우)
    for (const userCat of userCategories) {
      for (const category of userCat.categories) {
        if (category === "기본") continue;

        const noteCount = await StudyNote.countDocuments({
          user_id: userCat.user_id,
          category: category,
        });
        const recordCount = await LearningRecord.countDocuments({
          user_id: userCat.user_id,
          category: category,
        });

        if (noteCount === 0 && recordCount === 0) {
          console.log(
            `   ⚠️  고아 카테고리 발견: 사용자 ${userCat.user_id}의 '${category}' (데이터 없음)`
          );
        }
      }
    }

    console.log("\n🎉 카테고리 시스템 테스트 완료!");
    console.log("=".repeat(60));

    // 8. 시스템 상태 요약
    console.log("📊 시스템 상태 요약:");
    console.log(`   • 총 사용자: ${userCategories.length}명`);
    console.log(
      `   • 총 카테고리: ${
        [...new Set(userCategories.flatMap((uc) => uc.categories))].length
      }개 (중복 제거)`
    );
    console.log(`   • 총 노트: ${await StudyNote.countDocuments()}개`);
    console.log(
      `   • 총 학습 기록: ${await LearningRecord.countDocuments()}개`
    );
    console.log(`   • 총 퀴즈 로그: ${await QuizLog.countDocuments()}개`);
    console.log(`   • 총 진행률 요약: ${progressSummaries.length}개`);
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  testCategorySystem()
    .then(() => {
      console.log("✅ 모든 테스트 성공적으로 완료");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ 테스트 실패:", error);
      process.exit(1);
    });
}

module.exports = { testCategorySystem };
