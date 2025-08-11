// 카테고리 관련 유틸리티 함수들

/**
 * subject와 detail을 조합하여 카테고리명을 생성
 * @param {string} subject - 주제 (예: "programming")
 * @param {string} detail - 세부사항 (예: "javascript")
 * @returns {string} 카테고리명 (예: "Programming - Javascript")
 */
function generateCategoryFromSubjectDetail(subject, detail) {
  if (!subject && !detail) return "기본";
  if (!subject) return capitalizeFirst(detail);
  if (!detail) return capitalizeFirst(subject);

  return `${capitalizeFirst(subject)} - ${capitalizeFirst(detail)}`;
}

/**
 * 문자열의 첫 글자를 대문자로 변환
 * @param {string} str
 * @returns {string}
 */
function capitalizeFirst(str) {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * 학습 목표 정보에서 카테고리 추출
 * @param {Object} learningGoal - 학습 목표 객체
 * @returns {string} 카테고리명
 */
function extractCategoryFromLearningGoal(learningGoal) {
  if (!learningGoal) return "기본";

  const { subject, detail } = learningGoal;
  return generateCategoryFromSubjectDetail(subject, detail);
}

/**
 * subject/detail 매핑 테이블
 * 기존 데이터를 분석하여 일관된 카테고리명 생성
 */
const SUBJECT_DETAIL_MAPPING = {
  // 프로그래밍 관련
  programming: {
    javascript: "Programming - Javascript",
    python: "Programming - Python",
    java: "Programming - Java",
    c: "Programming - C",
    clang: "Programming - C",
  },
  // 언어 관련
  language: {
    english: "Language - English",
    korean: "Language - Korean",
    chinese: "Language - Chinese",
  },
  // 수학 관련
  mathematics: {
    calculus: "Mathematics - Calculus",
    algebra: "Mathematics - Algebra",
    statistics: "Mathematics - Statistics",
  },
  // 과학 관련
  science: {
    physics: "Science - Physics",
    chemistry: "Science - Chemistry",
    biology: "Science - Biology",
  },
};

/**
 * 매핑 테이블을 사용하여 정규화된 카테고리명 생성
 * @param {string} subject
 * @param {string} detail
 * @returns {string}
 */
function getNormalizedCategory(subject, detail) {
  if (!subject || !detail) {
    return generateCategoryFromSubjectDetail(subject, detail);
  }

  const subjectLower = subject.toLowerCase();
  const detailLower = detail.toLowerCase();

  // 매핑 테이블에서 찾기
  if (
    SUBJECT_DETAIL_MAPPING[subjectLower] &&
    SUBJECT_DETAIL_MAPPING[subjectLower][detailLower]
  ) {
    return SUBJECT_DETAIL_MAPPING[subjectLower][detailLower];
  }

  // 매핑 테이블에 없으면 기본 생성 방식 사용
  return generateCategoryFromSubjectDetail(subject, detail);
}

/**
 * 기존 학습 기록들을 분석하여 가능한 카테고리 목록 생성
 * @param {Array} learningRecords - 학습 기록 배열
 * @param {Array} studyNotes - 학습 노트 배열
 * @param {Object} learningGoal - 학습 목표
 * @returns {Array} 카테고리 목록
 */
function extractCategoriesFromData(
  learningRecords = [],
  studyNotes = [],
  learningGoal = null
) {
  const categories = new Set();

  // 학습 목표에서 카테고리 추출
  if (learningGoal && learningGoal.subject && learningGoal.detail) {
    categories.add(
      getNormalizedCategory(learningGoal.subject, learningGoal.detail)
    );
  }

  // 학습 기록에서 기존 카테고리 추출
  learningRecords.forEach((record) => {
    if (record.category && record.category !== "기본") {
      categories.add(record.category);
    }
  });

  // 학습 노트에서 기존 카테고리 추출
  studyNotes.forEach((note) => {
    if (note.category && note.category !== "기본") {
      categories.add(note.category);
    }
  });

  // 기본 카테고리 추가
  if (categories.size === 0) {
    categories.add("기본");
  }

  return Array.from(categories).sort();
}

module.exports = {
  generateCategoryFromSubjectDetail,
  capitalizeFirst,
  extractCategoryFromLearningGoal,
  getNormalizedCategory,
  extractCategoriesFromData,
  SUBJECT_DETAIL_MAPPING,
};
