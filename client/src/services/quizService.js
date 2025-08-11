import api from "./api";

// 사용자 학습 데이터 조회
export async function getUserLearningData(user_id) {
  const { data } = await api.get(`/ai/weekly-quiz/learning-data/${user_id}`);
  return data;
}

// 주간 퀴즈 문제 생성
export async function generateWeeklyQuiz({ user_id, testCount = 1 }) {
  const { data } = await api.post("/ai/weekly-quiz/generate", {
    user_id,
    testCount,
  });
  return data;
}

// 주간 퀴즈 결과 전송 및 피드백 리포트 생성
export async function submitWeeklyQuizResult({
  user_id,
  score,
  wrong,
  testCount = 1,
}) {
  const { data } = await api.post("/ai/weekly-quiz/result", {
    user_id,
    score,
    wrong,
    testCount,
  });
  return data;
}

// 주간 퀴즈 진행률 조회
export async function getWeeklyQuizProgress(user_id) {
  const { data } = await api.get(`/ai/weekly-quiz/progress/${user_id}`);
  return data;
}

// 사용자 퀴즈 통계 조회
export async function getUserQuizStats(user_id) {
  const { data } = await api.get(`/ai/weekly-quiz/stats/${user_id}`);
  return data;
}

// 카테고리별 주간 퀴즈 생성
export async function generateWeeklyQuizByCategory({
  user_id,
  testCount = 1,
  category,
}) {
  try {
    const { data } = await api.post("/ai/weekly-quiz/generate-by-category", {
      user_id,
      testCount,
      category,
    });
    return data;
  } catch (error) {
    console.error("카테고리별 주간 퀴즈 생성 실패:", error);
    throw error;
  }
}

// 카테고리별 퀴즈 결과 제출
export async function submitWeeklyQuizResultByCategory({
  user_id,
  score,
  wrong,
  testCount = 1,
  category,
}) {
  try {
    const { data } = await api.post("/ai/weekly-quiz/result-by-category", {
      user_id,
      score,
      wrong,
      testCount,
      category,
    });
    return data;
  } catch (error) {
    console.error("카테고리별 퀴즈 결과 제출 실패:", error);
    throw error;
  }
}

// 카테고리별 보고서 조회
export async function getCategoryReport(user_id, category) {
  try {
    const { data } = await api.get(
      `/ai/weekly-quiz/category-report/${user_id}/${encodeURIComponent(
        category
      )}`
    );
    return data;
  } catch (error) {
    console.error("카테고리별 보고서 조회 실패:", error);
    throw error;
  }
}

// 모든 카테고리 보고서 목록 조회
export async function getAllCategoryReports(user_id) {
  try {
    const { data } = await api.get(
      `/ai/weekly-quiz/category-reports/${user_id}`
    );
    return data;
  } catch (error) {
    console.error("카테고리 보고서 목록 조회 실패:", error);
    throw error;
  }
}
