const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const QuizLog = require("../models/QuizLog");
const StudyNote = require("../models/StudyNote");
const LearningRecord = require("../models/LearningRecord");
const ProgressSummary = require("../models/ProgressSummary");
const pool = require("../db");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const openai = new OpenAI(process.env.OPENAI_API_KEY);
const assistantId = process.env.WEEKLY_QUIZ_ASSISTANT_ID;

// 중복 요청 방지를 위한 요청 추적
const activeRequests = new Set();

// 프롬프트 가이드 (역할/단계/출력 규칙)

function extractJsonObject(text) {
  try {
    // 코드 펜스 제거
    let t = text.trim();
    t = t.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    const first = t.indexOf("{");
    const last = t.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = t.substring(first, last + 1);
      return JSON.parse(candidate);
    }
  } catch (_) {}
  return null;
}

function buildNarrativeFromReport(r) {
  const tm = Array.isArray(r.topicMastery)
    ? r.topicMastery
        .map((o) => `- ${o.topic}: ${Math.round(o.mastery)}%`)
        .join("\n")
    : "- 요약 준비 중";
  const wa =
    Array.isArray(r.wrongAnalysis) && r.wrongAnalysis.length > 0
      ? r.wrongAnalysis
          .slice(0, 5)
          .map(
            (w) =>
              `- Q${w.questionNumber}: ${w.topic} · ${w.errorType} → ${w.immediateFix}`
          )
          .join("\n")
      : "- 요약 준비 중";
  const next7 = Array.isArray(r.actionPlan?.next7Days)
    ? r.actionPlan.next7Days
        .map((d) => `Day ${d.day}: ${d.focus} (${d.time})`)
        .join("\n")
    : "- 요약 준비 중";
  const micro = Array.isArray(r.actionPlan?.microGoals)
    ? r.actionPlan.microGoals.join(", ")
    : "-";
  const resources = Array.isArray(r.actionPlan?.resources)
    ? r.actionPlan.resources.join(", ")
    : "-";
  const practice = r.practiceSet
    ? `${r.practiceSet.questionCount}문제 (${r.practiceSet.difficulty} 난이도, ${r.practiceSet.format})`
    : "-";
  const milestone = r.milestoneToGoal
    ? `현재 ${r.milestoneToGoal.currentProgress}%, 다음 체크포인트: ${r.milestoneToGoal.nextCheckpoint}%`
    : "-";
  const nextPlan = r.nextTestPlan
    ? `${r.nextTestPlan.recommendedDate} 예정, ${
        Array.isArray(r.nextTestPlan.focusAreas)
          ? r.nextTestPlan.focusAreas.join(", ")
          : "-"
      } 집중`
    : "-";
  const strengthsStr = Array.isArray(r.patterns?.strengths)
    ? r.patterns.strengths.join(", ")
    : typeof r.patterns?.strengths === "string"
    ? r.patterns.strengths
    : "-";
  const weaknessesStr = Array.isArray(r.patterns?.weaknesses)
    ? r.patterns.weaknesses.join(", ")
    : typeof r.patterns?.weaknesses === "string"
    ? r.patterns.weaknesses
    : "-";
  const risksStr = Array.isArray(r.patterns?.systemicRisks)
    ? r.patterns.systemicRisks.join(", ")
    : typeof r.patterns?.systemicRisks === "string"
    ? r.patterns.systemicRisks
    : "-";
  const badges = Array.isArray(r.badges)
    ? r.badges.join(", ")
    : typeof r.badges === "string"
    ? r.badges
    : "-";

  return `📘 **개인화 피드백 보고서**\n\n- **목표**: ${
    r.meta?.goal || "-"
  }\n- **테스트 유형/회차**: ${r.meta?.testType || "-"} / ${
    r.meta?.testCount || "-"
  }회차 (${(r.meta?.date || new Date().toISOString()).slice(
    0,
    10
  )})\n- **이번 점수**: ${r.score?.raw ?? "-"} / ${r.score?.total ?? "-"} (${
    r.score?.percent ?? "-"
  }%)\n\n✅ **전체 학습 진행도**\n- 현재 진행도: ${
    r.progress?.currentProgressPercent ?? "-"
  }% (이전 ${r.progress?.previousProgressPercent ?? "-"}% → Δ ${
    r.progress?.deltaPercent ?? "-"
  }%p)\n- 완료 예상일: ${r.progress?.estCompletionDate || "-"}\n- 신뢰도: ${
    r.progress?.confidence || "-"
  }\n- 산정 근거: ${
    r.progress?.rationale || "-"
  }\n\n🧭 **주제별 숙련도**\n${tm}\n\n❌ **틀린 문제 분석**\n${wa}\n\n📊 **패턴 요약**\n- 강점: ${strengthsStr}\n- 약점: ${weaknessesStr}\n- 리스크: ${risksStr}\n\n🗓️ **7일 학습 계획**\n${next7}\n\n🎯 **마이크로 목표**\n${micro}\n\n📚 **추천 자료**\n${resources}\n\n🧪 **맞춤 실습 세트**\n${practice}\n\n🏁 **목표 진행률**\n${milestone}\n\n🧭 **다음 테스트 계획**\n${nextPlan}\n\n🪞 **자기 성찰**\n- 질문: ${
    r.reflection?.prompt || "-"
  }\n- 습관 팁: ${
    r.reflection?.habitTip || "-"
  }\n\n🏅 **획득 배지**\n${badges}`;
}

// 새로운 프롬프트에 맞는 고도화된 피드백 보고서 생성 함수
function generateEnhancedReport(
  score,
  wrong,
  goal,
  testCount,
  previousProgress,
  learningData,
  previousQuizzes = []
) {
  const totalQuestions = testCount >= 5 ? 20 : 10;
  const instantProgress = (score / totalQuestions) * 100;
  const alpha = Math.min(0.7, 0.2 + 0.1 * Math.min(testCount, 5));
  const hasPrevious =
    previousProgress != null && !Number.isNaN(previousProgress);
  const currentProgress = Math.round(
    hasPrevious
      ? alpha * instantProgress + (1 - alpha) * Number(previousProgress)
      : instantProgress
  );

  const confidence =
    testCount <= 2 ? "low" : testCount <= 4 ? "medium" : "high";

  // 예상 완료일 계산 (목표 진행률 90%까지, 최근 3회 평균 개선률 기반)
  const recentProgressChanges = previousQuizzes
    .slice(0, 3)
    .map((quiz, idx) => {
      if (idx === previousQuizzes.length - 1)
        return quiz.progressPercentage || 0;
      return (
        (quiz.progressPercentage || 0) -
        (previousQuizzes[idx + 1]?.progressPercentage || 0)
      );
    })
    .filter((change) => !isNaN(change) && change > 0);

  const avgProgressChange =
    recentProgressChanges.length > 0
      ? recentProgressChanges.reduce((sum, change) => sum + change, 0) /
        recentProgressChanges.length
      : Math.max(
          1,
          hasPrevious
            ? currentProgress - Number(previousProgress)
            : currentProgress
        );

  const remainingPercent = Math.max(0, 90 - currentProgress);
  const estimatedDays = Math.ceil(
    (remainingPercent / Math.max(0.5, avgProgressChange)) * 2
  );
  const estCompletionDate = new Date();
  estCompletionDate.setDate(estCompletionDate.getDate() + estimatedDays);

  // 주제별 숙련도 분석 (학습 내용 기반)
  const topics = analyzeTopicsFromLearningData(
    learningData,
    score,
    totalQuestions
  );

  // 오답 분석 강화
  const enhancedWrongAnalysis = wrong.map((questionNum, index) => {
    const errorTypes = [
      "개념 이해 부족",
      "계산 실수",
      "문제 해석 오류",
      "시간 부족",
      "응용력 부족",
    ];
    const causes = [
      "기본 개념 미흡",
      "반복 연습 부족",
      "문제 유형 익숙하지 않음",
      "집중력 저하",
    ];
    const fixes = [
      "개념 재정리",
      "유사 문제 반복",
      "문제 분석 연습",
      "시간 관리 연습",
    ];

    return {
      questionNumber: questionNum,
      topic: topics[index % topics.length]?.topic || "기본 개념",
      errorType: errorTypes[index % errorTypes.length],
      cause: causes[index % causes.length],
      immediateFix: fixes[index % fixes.length],
      reference: `학습 노트 ${Math.floor(Math.random() * 5) + 1}장 참조`,
    };
  });

  // 학습 패턴 분석 (이전 퀴즈 결과 기반)
  const patterns = analyzeLearningPatterns(
    previousQuizzes,
    score,
    totalQuestions
  );

  const reportData = {
    meta: {
      goal: goal,
      testType: testCount >= 5 ? "최종 테스트" : "정기 테스트",
      testCount: testCount,
      date: new Date().toISOString(),
      summary: learningData.noteContent
        ? learningData.noteContent.substring(0, 100) + "..."
        : "학습 내용 요약",
    },
    score: {
      raw: score,
      total: totalQuestions,
      percent: Math.round((score / totalQuestions) * 100),
    },
    progress: {
      currentProgressPercent: currentProgress,
      previousProgressPercent: hasPrevious ? Number(previousProgress) : null,
      deltaPercent: hasPrevious
        ? currentProgress - Number(previousProgress)
        : currentProgress,
      confidence: confidence,
      estCompletionDate: estCompletionDate.toISOString().split("T")[0],
      rationale: hasPrevious
        ? `α=${alpha.toFixed(1)} × ${Math.round(
            instantProgress
          )}% + (1-${alpha.toFixed(1)}) × ${Number(previousProgress)}%`
        : `이전 진행도 없음 → current = instant (${Math.round(
            instantProgress
          )}%)`,
    },
    topicMastery: topics,
    wrongAnalysis: enhancedWrongAnalysis,
    patterns: patterns,
    actionPlan: generateActionPlan(score, totalQuestions, wrong, topics),
    practiceSet: {
      questionCount: Math.max(5, Math.min(15, totalQuestions - score + 3)),
      difficulty:
        score >= totalQuestions * 0.8
          ? "고급"
          : score >= totalQuestions * 0.6
          ? "중급"
          : "기초",
      format: testCount >= 5 ? "객관식 + 서술형" : "객관식 중심",
    },
    milestoneToGoal: {
      currentProgress: currentProgress,
      nextCheckpoint: Math.min(
        100,
        currentProgress + Math.max(5, 15 - Math.floor(currentProgress / 10))
      ),
      bottleneckFactors: identifyBottlenecks(
        wrong,
        score,
        totalQuestions,
        patterns
      ),
    },
    nextTestPlan: {
      recommendedDate: new Date(
        Date.now() + (7 + Math.floor(Math.random() * 3)) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      focusAreas:
        wrong.length > 0
          ? [...new Set(enhancedWrongAnalysis.map((w) => w.topic))].slice(0, 3)
          : ["심화 내용", "응용 문제"],
      preparation: generatePreparationPlan(score, totalQuestions, testCount),
    },
    reflection: {
      prompt: generateReflectionPrompt(score, totalQuestions, testCount),
      habitTip: generateHabitTip(patterns, currentProgress),
    },
    badges: generateBadges(
      score,
      totalQuestions,
      testCount,
      currentProgress,
      previousQuizzes
    ),
  };

  return {
    reportData: reportData,
    jsonReport: JSON.stringify(reportData, null, 2),
    textReport: buildNarrativeFromReport(reportData),
  };
}

// 학습 데이터에서 주제 분석 (카테고리 인식 개선)
function analyzeTopicsFromLearningData(learningData, score, totalQuestions) {
  const baseTopics = ["기본 개념", "응용 문제", "심화 내용"];

  // 학습 노트나 기록에서 주제 추출 시도
  const content =
    (learningData.noteContent || "") +
    " " +
    (learningData.learningContent || "");
  const extractedTopics = [];

  // 카테고리별 스마트 분석
  if (
    content.includes("Programming") ||
    content.includes("Javascript") ||
    content.includes("Python")
  ) {
    extractedTopics.push("프로그래밍 문법", "알고리즘 구현", "디버깅 기술");
  } else if (content.includes("Language") || content.includes("English")) {
    extractedTopics.push("어휘력", "문법 이해", "독해 능력");
  } else if (
    content.includes("Mathematics") ||
    content.includes("수학") ||
    content.includes("계산")
  ) {
    extractedTopics.push("수학적 개념", "문제 해결", "논리적 사고");
  } else if (
    content.includes("Science") ||
    content.includes("과학") ||
    content.includes("실험")
  ) {
    extractedTopics.push("과학적 사고", "실험 설계", "결과 분석");
  } else {
    // 기본 키워드 분석
    if (content.includes("언어") || content.includes("문법"))
      extractedTopics.push("언어 이해");
    if (content.includes("역사") || content.includes("사회"))
      extractedTopics.push("인문학적 지식");
    if (content.includes("기술") || content.includes("코딩"))
      extractedTopics.push("기술적 이해");
  }

  const topics = extractedTopics.length > 0 ? extractedTopics : baseTopics;

  return topics.map((topic, index) => ({
    topic: topic,
    mastery: Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (score / totalQuestions) * (120 - index * 15) + Math.random() * 10 - 5
        )
      )
    ),
  }));
}

// 학습 패턴 분석
function analyzeLearningPatterns(
  previousQuizzes,
  currentScore,
  totalQuestions
) {
  const recentScores = previousQuizzes.slice(0, 5).map((q) => q.score || 0);
  const currentScorePercent = (currentScore / totalQuestions) * 100;

  const strengths = [];
  const weaknesses = [];
  const systemicRisks = [];

  // 점수 트렌드 분석
  if (recentScores.length >= 2) {
    const trend = recentScores[0] - recentScores[recentScores.length - 1];
    if (trend > 0) strengths.push("지속적인 성과 향상");
    else if (trend < -2) weaknesses.push("최근 성과 하락");
  }

  // 현재 성과 분석
  if (currentScorePercent >= 80) {
    strengths.push("우수한 이해도", "목표 달성 임박");
  } else if (currentScorePercent >= 60) {
    strengths.push("양호한 기본기");
    weaknesses.push("응용력 향상 필요");
  } else {
    weaknesses.push("기본 개념 보강 필요", "전반적 이해도 개선 요구");
    systemicRisks.push("학습 목표 달성 지연 위험");
  }

  // 일관성 분석
  if (recentScores.length >= 3) {
    const variance =
      recentScores.reduce((sum, score) => {
        const avg =
          recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        return sum + Math.pow(score - avg, 2);
      }, 0) / recentScores.length;

    if (variance < 4) strengths.push("일관된 학습 성과");
    else weaknesses.push("성과 편차 큼");
  }

  return { strengths, weaknesses, systemicRisks };
}

// 액션 플랜 생성
function generateActionPlan(score, totalQuestions, wrong, topics) {
  const scorePercent = (score / totalQuestions) * 100;

  const next7Days = [
    {
      day: 1,
      focus: wrong.length > 0 ? "오답 집중 분석" : "복습 및 정리",
      tasks:
        wrong.length > 0
          ? ["틀린 문제 재풀이", "오답 노트 작성"]
          : ["핵심 내용 요약"],
      time: "45분",
    },
    {
      day: 2,
      focus: scorePercent < 60 ? "기본 개념 재정립" : "심화 학습",
      tasks:
        scorePercent < 60
          ? ["기본 이론 복습", "개념 정리"]
          : ["고급 문제 도전"],
      time: "60분",
    },
    {
      day: 3,
      focus: "실전 연습",
      tasks: ["유사 문제 풀이", "시간 측정 연습"],
      time: "90분",
    },
    {
      day: 4,
      focus: topics[0]?.topic || "약점 보완",
      tasks: ["해당 영역 집중 학습"],
      time: "60분",
    },
    {
      day: 5,
      focus: "종합 복습",
      tasks: ["전체 내용 점검", "모의고사"],
      time: "120분",
    },
    {
      day: 6,
      focus: "응용 및 심화",
      tasks: ["창의적 문제 해결", "실무 적용"],
      time: "75분",
    },
    {
      day: 7,
      focus: "다음 주 준비",
      tasks: ["학습 계획 수립", "목표 재설정"],
      time: "30분",
    },
  ];

  const microGoals = [
    "일일 학습 시간 준수",
    scorePercent < 70 ? "기본 정확도 70% 달성" : "고난도 문제 도전",
    "주간 복습 완료",
  ];

  const resources = [
    "개인 학습 노트",
    scorePercent < 60 ? "기초 이론서" : "심화 문제집",
    "온라인 강의 자료",
  ];

  return { next7Days, microGoals, resources };
}

// 병목 요소 식별
function identifyBottlenecks(wrong, score, totalQuestions, patterns) {
  const bottlenecks = [];

  if (wrong.length > totalQuestions * 0.5) {
    bottlenecks.push("전반적 이해도 부족");
  }
  if (patterns.weaknesses.includes("성과 편차 큼")) {
    bottlenecks.push("학습 일관성 부족");
  }
  if (score < totalQuestions * 0.4) {
    bottlenecks.push("기본 개념 미정립");
  }

  return bottlenecks.length > 0 ? bottlenecks : ["특별한 병목 없음"];
}

// 준비 계획 생성
function generatePreparationPlan(score, totalQuestions, testCount) {
  const scorePercent = (score / totalQuestions) * 100;

  if (testCount >= 5) {
    return ["종합 복습", "실전 모의고사", "심리적 준비"];
  } else if (scorePercent < 60) {
    return ["기본 개념 정리", "기초 문제 반복", "학습 습관 점검"];
  } else {
    return ["응용 문제 연습", "약점 보완", "시간 관리 연습"];
  }
}

// 성찰 질문 생성
function generateReflectionPrompt(score, totalQuestions, testCount) {
  const prompts = [
    "이번 주 학습에서 가장 어려웠던 부분은 무엇인가요?",
    "어떤 학습 방법이 가장 효과적이었나요?",
    "다음 주에는 어떤 점을 개선하고 싶나요?",
    "학습 목표 달성을 위해 필요한 것은 무엇인가요?",
  ];

  return prompts[Math.floor(Math.random() * prompts.length)];
}

// 습관 팁 생성
function generateHabitTip(patterns, currentProgress) {
  if (patterns.weaknesses.includes("성과 편차 큼")) {
    return "매일 같은 시간에 일정량씩 학습하여 일관성을 높여보세요.";
  } else if (currentProgress < 50) {
    return "작은 목표부터 달성하며 성취감을 쌓아가세요.";
  } else {
    return "현재 페이스를 유지하면서 점진적으로 난이도를 높여보세요.";
  }
}

// 배지 생성
function generateBadges(
  score,
  totalQuestions,
  testCount,
  currentProgress,
  previousQuizzes
) {
  const badges = [];
  const scorePercent = (score / totalQuestions) * 100;

  if (scorePercent >= 90) badges.push("완벽주의자");
  else if (scorePercent >= 80) badges.push("우수 학습자");
  else if (scorePercent >= 70) badges.push("성실한 학습자");

  if (testCount >= 5) badges.push("끈기의 달인");
  if (previousQuizzes.length >= 3) badges.push("꾸준함의 상징");
  if (currentProgress >= 80) badges.push("목표 달성 임박");

  return badges.length > 0 ? badges : ["학습 의지", "개선 정신"];
}

// 사용자 학습 데이터 수집 함수 (부분 실패 허용, 가능한 데이터만 반환)
async function collectUserLearningData(user_id) {
  const result = {
    noteContent: "",
    learningContent: "",
    learningGoal: {},
    previousQuizzes: [],
    totalNotes: 0,
    totalRecords: 0,
    categorizedData: {}, // 카테고리별 데이터 추가
  };

  // 1) 노트 수집 (MongoDB) - 카테고리별로 분류
  try {
    const studyNotes = await StudyNote.find({ user_id }).sort({ date: -1 });
    result.totalNotes = studyNotes.length;
    result.noteContent = studyNotes
      .map((note) => `${note.title}: ${note.content}`)
      .join("\n\n");

    // 카테고리별 노트 분류
    studyNotes.forEach((note) => {
      const category = note.category || "기본";
      if (!result.categorizedData[category]) {
        result.categorizedData[category] = {
          records: [],
          notes: [],
          totalRecords: 0,
          totalNotes: 0,
        };
      }
      result.categorizedData[category].notes.push(note);
      result.categorizedData[category].totalNotes++;
    });
  } catch (e) {
    console.error("학습 노트 수집 실패:", e.message);
  }

  // 2) 학습 기록 수집 (MongoDB) - 카테고리별로 분류
  try {
    const learningRecords = await LearningRecord.find({ user_id }).sort({
      date: -1,
    });
    result.totalRecords = learningRecords.length;
    result.learningContent = learningRecords
      .map(
        (record) =>
          `${record.subject} - ${record.category}: ${
            record.memo || "학습 기록"
          }`
      )
      .join("\n\n");

    // 카테고리별 데이터 분류
    learningRecords.forEach((record) => {
      const category = record.category || "기본";
      if (!result.categorizedData[category]) {
        result.categorizedData[category] = {
          records: [],
          notes: [],
          totalRecords: 0,
          totalNotes: 0,
        };
      }
      result.categorizedData[category].records.push(record);
      result.categorizedData[category].totalRecords++;
    });
  } catch (e) {
    console.error("학습 기록 수집 실패:", e.message);
  }

  // 3) 학습 목표 조회 (MySQL)
  try {
    const conn = await pool.getConnection();
    try {
      const [goals] = await conn.query(
        "SELECT * FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [user_id]
      );
      result.learningGoal = goals?.[0] || {};
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error("학습 목표 조회 실패 (MySQL):", e.message);
  }

  // 4) 이전 퀴즈 기록 조회 (MongoDB)
  try {
    result.previousQuizzes = await QuizLog.find({
      user_id,
      type: "weekly",
    })
      .sort({ created_at: -1 })
      .limit(5);
  } catch (e) {
    console.error("이전 퀴즈 기록 조회 실패:", e.message);
  }

  return result;
}

// 주간 퀴즈: 카테고리별 문제 생성
router.post("/generate-by-category", async (req, res) => {
  const { user_id, testCount = 1, category } = req.body || {};

  const requestKey = `weekly-generate-category_${user_id}_${testCount}_${category}`;
  if (activeRequests.has(requestKey)) {
    return res.status(429).json({ error: "이미 처리 중인 요청입니다." });
  }
  activeRequests.add(requestKey);

  try {
    if (!user_id) {
      return res.status(400).json({ error: "user_id는 필수입니다." });
    }

    console.log("카테고리별 퀴즈 생성 요청 받음:", {
      user_id,
      testCount,
      category,
    });

    // 환경 변수 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API 키가 설정되지 않음");
      return res.status(500).json({
        error:
          "OpenAI API 키가 설정되지 않았습니다. 서버/.env 파일을 확인해주세요.",
      });
    }

    if (!assistantId) {
      console.error("Assistant ID가 설정되지 않음");
      return res.status(500).json({
        error:
          "Weekly Quiz Assistant ID가 설정되지 않았습니다. 서버/.env 파일을 확인해주세요.",
      });
    }

    // 사용자 학습 데이터 수집
    console.log("학습 데이터 수집 시작");
    const learningData = await collectUserLearningData(user_id);
    console.log("학습 데이터 수집 완료:", {
      totalNotes: learningData.totalNotes,
      totalRecords: learningData.totalRecords,
      hasNoteContent: !!learningData.noteContent,
      hasLearningContent: !!learningData.learningContent,
      categories: Object.keys(learningData.categorizedData),
    });

    // 특정 카테고리 데이터 확인
    const targetCategory = category || "기본";
    const categoryData = learningData.categorizedData[targetCategory];

    if (
      !categoryData ||
      (categoryData.totalNotes === 0 && categoryData.totalRecords === 0)
    ) {
      console.log(`카테고리 '${targetCategory}'에 학습 데이터가 없음`);
      return res.status(400).json({
        error: `카테고리 '${targetCategory}'에 학습 데이터가 없습니다.`,
        message:
          "퀴즈를 생성하기 위해서는 해당 카테고리에 학습 노트나 학습 기록이 필요합니다.",
      });
    }

    // 카테고리별 학습 내용 생성
    const categoryNoteContent = categoryData.notes
      .map((note) => `${note.title}: ${note.content}`)
      .join("\n\n");

    const categoryLearningContent = categoryData.records
      .map((record) => `${record.subject}: ${record.memo || "학습 기록"}`)
      .join("\n\n");

    const combinedCategoryContent = [
      categoryNoteContent,
      categoryLearningContent,
    ]
      .filter((content) => content.trim())
      .join("\n\n");

    // OpenAI Assistant 스레드 생성
    console.log("Assistant 스레드 생성 중...");
    let thread, threadId;
    try {
      console.log("OpenAI 객체 확인:", !!openai);
      console.log("API 키 확인:", !!process.env.OPENAI_API_KEY);

      thread = await openai.beta.threads.create();
      console.log("스레드 생성 결과:", thread);
      threadId = thread.id;
      console.log("스레드 생성 완료:", threadId);

      if (!threadId) {
        throw new Error("Thread ID가 생성되지 않았습니다.");
      }
    } catch (threadError) {
      console.error("스레드 생성 실패:", threadError);
      return res.status(500).json({
        error: "OpenAI 스레드 생성에 실패했습니다.",
        details: threadError.message,
      });
    }

    // 카테고리별 프롬프트 생성
    const prompt = `사용자 ID: ${user_id}
테스트 횟수: ${testCount}
학습 카테고리: ${targetCategory}

=== 카테고리별 학습 내용 ===
${combinedCategoryContent}

=== 학습 목표 ===
${learningData.learningGoal?.goal || "목표 없음"}

=== 이전 퀴즈 기록 ===
${
  learningData.previousQuizzes.length > 0
    ? learningData.previousQuizzes
        .map(
          (quiz) =>
            `${quiz.created_at}: 점수 ${quiz.score || 0}점 (카테고리: ${
              quiz.category || "미분류"
            })`
        )
        .join("\n")
    : "이전 퀴즈 기록 없음"
}

위 학습 내용을 바탕으로 '${targetCategory}' 카테고리에 특화된 10문제의 주간 퀴즈를 생성해주세요. 
문제는 해당 카테고리의 학습 내용에만 집중하여 출제해주세요.`;

    // 메시지 추가
    try {
      console.log("메시지 생성 중... threadId:", threadId);
      if (!threadId) {
        throw new Error("threadId가 undefined입니다.");
      }
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: prompt,
      });
      console.log("메시지 생성 완료");
    } catch (messageError) {
      console.error("메시지 생성 실패:", messageError);
      return res.status(500).json({
        error: "OpenAI 메시지 생성에 실패했습니다.",
        details: messageError.message,
      });
    }

    // Assistant 실행 (createAndPoll 사용)
    console.log("Assistant 실행 중...");
    let run;
    try {
      run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId,
      });
      console.log("Run 완료:", run.id, "상태:", run.status);

      if (run.status !== "completed") {
        throw new Error(
          `Assistant 실행 실패: ${run.status} - ${
            run.last_error?.message || "알 수 없는 오류"
          }`
        );
      }
    } catch (runError) {
      console.error("Run 생성/실행 실패:", runError);
      return res.status(500).json({
        error: "OpenAI Assistant 실행에 실패했습니다.",
        details: runError.message,
      });
    }

    // 응답 메시지 가져오기 (일반 퀴즈와 동일한 방식)
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    const assistantMessage = lastMessageForRun;

    if (assistantMessage?.content?.[0]?.text?.value) {
      const assistantResponseText = assistantMessage.content[0].text.value;
      console.log(
        "Assistant 응답 받음 (길이:",
        assistantResponseText.length,
        ")"
      );

      // JSON 추출 및 파싱
      let jsonText = assistantResponseText;
      if (jsonText.includes("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      jsonText = jsonText.trim();

      let quizData;
      try {
        quizData = JSON.parse(jsonText);
        console.log(
          `카테고리 '${targetCategory}' 퀴즈 데이터 파싱 성공:`,
          quizData.length,
          "개 문제"
        );

        if (!Array.isArray(quizData) || quizData.length === 0) {
          return res.status(500).json({
            error: "AI가 생성한 퀴즈가 비어있습니다.",
            details: "퀴즈 생성에 실패했습니다. 다시 시도해주세요.",
            thread_id: threadId,
          });
        }
      } catch (e) {
        console.error("JSON 파싱 실패:", e.message);
        return res.status(500).json({
          error: "AI가 생성한 퀴즈 데이터를 처리할 수 없습니다.",
          details: "퀴즈 데이터 형식이 올바르지 않습니다. 다시 시도해주세요.",
          thread_id: threadId,
        });
      }

      // 퀴즈 로그 저장 (카테고리 정보 포함)
      try {
        await QuizLog.create({
          user_id,
          type: "weekly",
          category: targetCategory,
          problems: quizData,
          testCount: Number(testCount),
          learningData: {
            totalNotes: categoryData.totalNotes,
            totalRecords: categoryData.totalRecords,
            noteContent: categoryNoteContent,
            learningContent: categoryLearningContent,
          },
        });

        console.log(`카테고리 '${targetCategory}' 퀴즈 로그 저장 완료`);

        res.json({
          success: true,
          quizData,
          category: targetCategory,
          thread_id: threadId,
          message: `카테고리 '${targetCategory}'의 주간 퀴즈가 생성되었습니다.`,
        });
      } catch (saveError) {
        console.error("퀴즈 로그 저장 실패:", saveError);
        res.status(500).json({
          error: "퀴즈 저장에 실패했습니다.",
          details: saveError.message,
          thread_id: threadId,
        });
      }
    } else {
      return res.status(500).json({
        error: "Assistant가 응답을 제공하지 않았습니다.",
        thread_id: threadId,
      });
    }
  } catch (error) {
    console.error("카테고리별 퀴즈 생성 실패:", error);
    res.status(500).json({
      error: "퀴즈 생성에 실패했습니다.",
      details: error.message,
    });
  } finally {
    activeRequests.delete(requestKey);
  }
});

// 주간 퀴즈: 문제 생성 (기존)
router.post("/generate", async (req, res) => {
  const { user_id, testCount = 1 } = req.body || {};

  const requestKey = `weekly-generate_${user_id}_${testCount}`;
  if (activeRequests.has(requestKey)) {
    return res.status(429).json({ error: "이미 처리 중인 요청입니다." });
  }
  activeRequests.add(requestKey);

  try {
    if (!user_id) {
      return res.status(400).json({ error: "user_id는 필수입니다." });
    }

    console.log("퀴즈 생성 요청 받음:", { user_id, testCount });

    // 환경 변수 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API 키가 설정되지 않음");
      return res.status(500).json({
        error:
          "OpenAI API 키가 설정되지 않았습니다. 서버/.env 파일을 확인해주세요.",
      });
    }

    if (!assistantId) {
      console.error("Assistant ID가 설정되지 않음");
      return res.status(500).json({
        error:
          "Weekly Quiz Assistant ID가 설정되지 않았습니다. 서버/.env 파일을 확인해주세요.",
      });
    }

    console.log("환경 변수 확인 완료");

    // 사용자 학습 데이터 수집
    console.log("학습 데이터 수집 시작");
    const learningData = await collectUserLearningData(user_id);
    console.log("학습 데이터 수집 완료:", {
      totalNotes: learningData.totalNotes,
      totalRecords: learningData.totalRecords,
      hasNoteContent: !!learningData.noteContent,
      hasLearningContent: !!learningData.learningContent,
    });

    if (!learningData.noteContent && !learningData.learningContent) {
      console.log("학습 데이터가 없음");
      return res.status(400).json({
        error: "퀴즈를 생성하기 위해서는 학습 노트나 학습 기록이 필요합니다.",
      });
    }

    const isFinal = Number(testCount) >= 5;
    const goal =
      learningData.learningGoal.goal || "학습 목표가 설정되지 않았습니다.";

    // 학습 내용 요약 생성
    const summaryContent = `${learningData.noteContent}\n\n${learningData.learningContent}`;
    const summary =
      summaryContent.length > 2000
        ? summaryContent.substring(0, 2000) + "..."
        : summaryContent;

    console.log("퀴즈 생성 시작:", {
      user_id,
      testCount,
      summaryLength: summary.length,
      goal,
      totalNotes: learningData.totalNotes,
      totalRecords: learningData.totalRecords,
    });

    // 새로운 프롬프트 형식으로 메시지 생성
    const userMessage = `{
"type": "generate",
"summary": "${summary.replace(/"/g, '\\"')}",
"goal": "${goal.replace(/"/g, '\\"')}",
"testCount": ${Number(testCount)}
}`;

    console.log("전송할 메시지:", userMessage);

    console.log("OpenAI API 호출 시작");
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    console.log("Thread 생성 완료:", threadId);

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userMessage,
    });
    console.log("메시지 전송 완료");

    console.log("Assistant 실행 시작");
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    console.log("Assistant 실행 완료:", run.status);
    if (run.status !== "completed") {
      console.error("Assistant 실행 실패:", run.status);
      return res
        .status(500)
        .json({ error: "Assistant 실행 실패", status: run.status });
    }

    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessageForRun = messages.data
      .filter((m) => m.run_id === run.id && m.role === "assistant")
      .pop();

    if (!lastMessageForRun) {
      console.error("Assistant 응답 없음");
      return res
        .status(500)
        .json({ error: "Assistant가 응답을 제공하지 않았습니다." });
    }

    let jsonText = lastMessageForRun.content[0].text.value || "";
    console.log("AI 응답 원본:", jsonText.substring(0, 200) + "...");

    // 마크다운 형식 제거 및 JSON 추출
    if (jsonText.includes("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    // 앞뒤 공백 제거
    jsonText = jsonText.trim();

    // JSON 배열 시작과 끝 찾기 (문제 배열만 추출)
    const startBracket = jsonText.indexOf("[");
    const endBracket = jsonText.lastIndexOf("]");

    if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
      jsonText = jsonText.substring(startBracket, endBracket + 1);
    }

    let quizData;
    try {
      quizData = JSON.parse(jsonText);
      console.log("퀴즈 데이터 파싱 성공:", quizData.length, "개 문제");

      // 퀴즈 데이터가 비어있는지 확인
      if (!Array.isArray(quizData) || quizData.length === 0) {
        return res.status(500).json({
          error: "AI가 생성한 퀴즈가 비어있습니다.",
          details: "퀴즈 생성에 실패했습니다. 다시 시도해주세요.",
          thread_id: threadId,
        });
      }
    } catch (e) {
      console.error("JSON 파싱 실패:", e.message);
      console.error("파싱 시도한 텍스트:", jsonText);

      // JSON 파싱 실패 시 에러 반환
      return res.status(500).json({
        error: "AI가 생성한 퀴즈 데이터를 처리할 수 없습니다.",
        details: "퀴즈 데이터 형식이 올바르지 않습니다. 다시 시도해주세요.",
        thread_id: threadId,
      });
    }

    try {
      await QuizLog.create({
        user_id,
        type: "weekly",
        problems: quizData,
        summary,
        goal,
        testCount: Number(testCount),
        learningData: {
          totalNotes: learningData.totalNotes,
          totalRecords: learningData.totalRecords,
          noteContent: learningData.noteContent,
          learningContent: learningData.learningContent,
        },
      });
      console.log("QuizLog 저장 성공");
    } catch (e) {
      console.error("QuizLog 저장 실패:", e);
    }

    console.log("퀴즈 생성 완료, 응답 전송");
    return res.json({
      success: true,
      quizData,
      thread_id: threadId,
      learningSummary: {
        totalNotes: learningData.totalNotes,
        totalRecords: learningData.totalRecords,
        goal: goal,
      },
    });
  } catch (err) {
    console.error("주간 퀴즈 생성 실패:", err);
    return res
      .status(500)
      .json({ error: "주간 퀴즈 생성 실패", details: err.message });
  } finally {
    activeRequests.delete(requestKey);
  }
});

// 주간 퀴즈: 카테고리별 결과 분석 및 피드백 보고서
router.post("/result-by-category", async (req, res) => {
  console.log("전체 요청 바디:", req.body);

  const {
    user_id,
    score,
    wrong = [],
    testCount = 1,
    category = "기본",
  } = req.body || {};

  // category 값 확실히 보장
  const finalCategory = category || "기본";

  try {
    console.log("카테고리별 퀴즈 결과 처리 시작:", {
      user_id,
      score,
      wrong,
      testCount,
      originalCategory: category,
      finalCategory,
      requestBody: req.body,
    });

    if (user_id == null || score == null || !Array.isArray(wrong)) {
      console.error("필수 파라미터 누락:", { user_id, score, wrong });
      return res.status(400).json({
        error: "user_id, score, wrong[]는 필수입니다.",
      });
    }

    // AI 사용 가능 여부 플래그
    const skipAI = !process.env.OPENAI_API_KEY || !assistantId;
    console.log("AI 사용 여부:", {
      skipAI,
      hasAPIKey: !!process.env.OPENAI_API_KEY,
      hasAssistantId: !!assistantId,
    });

    // 사용자 학습 데이터 수집
    const learningData = await collectUserLearningData(user_id);
    const goal =
      learningData.learningGoal.goal || "학습 목표가 설정되지 않았습니다.";

    // 카테고리별 학습 내용 요약 생성
    const categoryData = learningData.categorizedData[finalCategory] || {
      notes: [],
      records: [],
    };
    const categoryNoteContent = categoryData.notes
      .map((note) => `${note.title}: ${note.content}`)
      .join("\n\n");
    const categoryLearningContent = categoryData.records
      .map((record) => `${record.subject}: ${record.memo || "학습 기록"}`)
      .join("\n\n");

    const categorySummaryContent = [
      categoryNoteContent,
      categoryLearningContent,
    ]
      .filter((content) => content.trim())
      .join("\n\n");

    const previousSummary =
      categorySummaryContent.length > 2000
        ? categorySummaryContent.substring(0, 2000) + "..."
        : categorySummaryContent;

    // 카테고리별 이전 퀴즈 결과 분석
    const categoryPreviousQuizzes = learningData.previousQuizzes.filter(
      (quiz) => quiz.category === finalCategory
    );
    const previousProgress =
      categoryPreviousQuizzes.length > 0
        ? categoryPreviousQuizzes[0].progressPercentage || 0
        : 0;

    let reportText = "";
    let narrative = null;
    let threadId = null;

    if (skipAI) {
      // OpenAI 없이 고도화된 보고서 생성
      console.log(
        `카테고리 '${finalCategory}' 고도화된 기본 보고서 생성 중...`
      );
      const enhancedReport = generateEnhancedReport(
        score,
        wrong,
        goal,
        testCount,
        previousProgress,
        {
          ...learningData,
          noteContent: categoryNoteContent,
          learningContent: categoryLearningContent,
          totalNotes: categoryData.totalNotes || 0,
          totalRecords: categoryData.totalRecords || 0,
        },
        categoryPreviousQuizzes
      );

      reportText = enhancedReport.textReport;
      narrative = enhancedReport.reportData;

      console.log(`카테고리 '${finalCategory}' 기본 보고서 생성 완료`);
    } else {
      // OpenAI를 이용한 고급 보고서 생성
      try {
        console.log(`카테고리 '${finalCategory}' AI 보고서 생성 중...`);
        const thread = await openai.beta.threads.create();
        threadId = thread.id;

        const prompt = `사용자 ID: ${user_id}
테스트 횟수: ${testCount}
카테고리: ${finalCategory}
퀴즈 점수: ${score}/10
틀린 문제 번호: ${wrong.join(", ") || "없음"}

=== 카테고리별 학습 내용 ===
${categorySummaryContent || "학습 내용이 없습니다."}

=== 학습 목표 ===
${goal}

=== 카테고리별 이전 퀴즈 기록 ===
${
  categoryPreviousQuizzes.length > 0
    ? categoryPreviousQuizzes
        .map((quiz) => `${quiz.created_at}: 점수 ${quiz.score || 0}점`)
        .join("\n")
    : "이전 퀴즈 기록 없음"
}

위 정보를 바탕으로 '${category}' 카테고리에 특화된 상세한 학습 피드백 보고서를 작성해주세요.`;

        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: prompt,
        });

        const run = await openai.beta.threads.runs.createAndPoll(threadId, {
          assistant_id: assistantId,
        });

        if (run.status !== "completed") {
          throw new Error(
            `AI 보고서 생성 실패: ${run.status} - ${
              run.last_error?.message || "알 수 없는 오류"
            }`
          );
        }

        // 응답 메시지 가져오기
        const messages = await openai.beta.threads.messages.list(threadId);
        const assistantMessage = messages.data.find(
          (msg) => msg.role === "assistant"
        );

        if (assistantMessage?.content?.[0]?.text?.value) {
          reportText = assistantMessage.content[0].text.value;
          console.log(`카테고리 '${category}' AI 보고서 생성 완료`);
        }
      } catch (aiError) {
        console.error(`카테고리 '${category}' AI 보고서 생성 실패:`, aiError);
        // AI 실패 시 기본 보고서로 fallback
        const enhancedReport = generateEnhancedReport(
          score,
          wrong,
          goal,
          testCount,
          previousProgress,
          {
            ...learningData,
            noteContent: categoryNoteContent,
            learningContent: categoryLearningContent,
            totalNotes: categoryData.totalNotes || 0,
            totalRecords: categoryData.totalRecords || 0,
          },
          categoryPreviousQuizzes
        );
        reportText = enhancedReport.textReport;
        narrative = enhancedReport.reportData;
      }
    }

    // 카테고리별 퀴즈 결과 저장
    const savedQuiz = await QuizLog.findOneAndUpdate(
      {
        user_id,
        type: "weekly",
        category: finalCategory,
        testCount: Number(testCount),
      },
      {
        $set: {
          score,
          wrong,
          feedback_report: reportText,
          progressPercentage: Math.round((score / 10) * 100),
          averageScore: score,
          detailedReport: narrative,
          previousSummary,
        },
      },
      { new: true, sort: { created_at: -1 } }
    );

    if (!savedQuiz) {
      console.warn(
        `카테고리 '${category}' 퀴즈 로그를 찾을 수 없음, 새로 생성`
      );
      await QuizLog.create({
        user_id,
        type: "weekly",
        category: finalCategory,
        score,
        wrong,
        testCount: Number(testCount),
        feedback_report: reportText,
        progressPercentage: Math.round((score / 10) * 100),
        averageScore: score,
        detailedReport: narrative,
        previousSummary,
      });
    }

    // 카테고리별 진행률 업데이트
    console.log(
      "updateCategoryProgress 호출 직전 finalCategory 값:",
      finalCategory
    );
    await updateCategoryProgress(user_id, finalCategory, score, testCount);

    // 일반 진행률과 카테고리별 진행률 동기화
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    const weekStart = monday.toISOString().slice(0, 10);
    await syncGeneralProgressWithCategory(user_id, weekStart);

    console.log(`카테고리 '${finalCategory}' 퀴즈 결과 저장 완료`);

    res.json({
      success: true,
      category: finalCategory,
      score,
      progressPercentage: Math.round((score / 10) * 100),
      feedback_report: reportText,
      detailedReport: narrative,
      thread_id: threadId,
      message: `카테고리 '${category}'의 퀴즈 결과가 저장되었습니다.`,
    });
  } catch (error) {
    console.error(`카테고리 '${category}' 퀴즈 결과 처리 실패:`, error);
    res.status(500).json({
      error: "퀴즈 결과 처리에 실패했습니다.",
      details: error.message,
    });
  }
});

// 카테고리별 진행률 업데이트 함수
async function updateCategoryProgress(user_id, category, score, testCount) {
  try {
    console.log("updateCategoryProgress 호출됨:", {
      user_id,
      category,
      score,
      testCount,
    });

    if (!category) {
      console.error("category가 undefined입니다!");
      return;
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    const weekStart = monday.toISOString().slice(0, 10);

    const progressPercent = Math.round((score / 10) * 100);

    // 현재 주차 진행률 조회 또는 생성
    let progressSummary = await ProgressSummary.findOne({
      user_id,
      week_start: weekStart,
    });

    if (!progressSummary) {
      progressSummary = new ProgressSummary({
        user_id,
        week_start: weekStart,
        total: 0,
        categoryProgress: [],
      });
    }

    // 카테고리별 진행률 업데이트
    let categoryProgressIndex = progressSummary.categoryProgress.findIndex(
      (cp) => cp.category === category
    );

    if (categoryProgressIndex === -1) {
      // 새 카테고리 추가
      const newCategoryProgress = {
        category: category,
        progress: progressPercent,
        lastWeekProgress: 0,
        quizCount: 1,
        averageScore: score,
        lastQuizDate: new Date(),
      };

      console.log("새 카테고리 진행률 추가:", newCategoryProgress);
      progressSummary.categoryProgress.push(newCategoryProgress);
      progressSummary.markModified("categoryProgress");
    } else {
      // 기존 카테고리 업데이트
      const categoryProgress =
        progressSummary.categoryProgress[categoryProgressIndex];
      const totalScore =
        categoryProgress.averageScore * categoryProgress.quizCount + score;
      const newQuizCount = categoryProgress.quizCount + 1;

      progressSummary.categoryProgress[categoryProgressIndex] = {
        ...categoryProgress,
        progress: progressPercent,
        quizCount: newQuizCount,
        averageScore: Math.round(totalScore / newQuizCount),
        lastQuizDate: new Date(),
      };
      progressSummary.markModified("categoryProgress");
    }

    // 전체 진행률 계산 (모든 카테고리 평균)
    const totalProgress =
      progressSummary.categoryProgress.reduce(
        (sum, cp) => sum + cp.progress,
        0
      ) / progressSummary.categoryProgress.length;

    progressSummary.total = Math.round(totalProgress) || 0;

    console.log("저장 전 progressSummary 데이터:", {
      user_id: progressSummary.user_id,
      week_start: progressSummary.week_start,
      total: progressSummary.total,
      categoryProgress: progressSummary.categoryProgress,
    });

    await progressSummary.save();
    console.log(
      `카테고리 '${category}' 진행률 업데이트 완료: ${progressPercent}%`
    );
  } catch (error) {
    console.error("카테고리별 진행률 업데이트 실패:", error);
  }
}

// 주간 퀴즈: 결과 분석 및 피드백 보고서 (기존)
router.post("/result", async (req, res) => {
  const { user_id, score, wrong = [], testCount = 1 } = req.body || {};

  try {
    console.log("퀴즈 결과 처리 시작:", { user_id, score, wrong, testCount });

    if (user_id == null || score == null || !Array.isArray(wrong)) {
      console.error("필수 파라미터 누락:", { user_id, score, wrong });
      return res.status(400).json({
        error: "user_id, score, wrong[]는 필수입니다.",
      });
    }

    // AI 사용 가능 여부 플래그 (없어도 기본 보고서로 진행)
    const skipAI = !process.env.OPENAI_API_KEY || !assistantId;
    console.log("AI 사용 여부:", {
      skipAI,
      hasAPIKey: !!process.env.OPENAI_API_KEY,
      hasAssistantId: !!assistantId,
    });

    // 사용자 학습 데이터 수집
    const learningData = await collectUserLearningData(user_id);
    const goal =
      learningData.learningGoal.goal || "학습 목표가 설정되지 않았습니다.";

    // 학습 내용 요약 생성
    const summaryContent = `${learningData.noteContent}\n\n${learningData.learningContent}`;
    const previousSummary =
      summaryContent.length > 2000
        ? summaryContent.substring(0, 2000) + "..."
        : summaryContent;

    // 이전 퀴즈 결과 분석
    const previousQuizzes = learningData.previousQuizzes;
    const previousProgress =
      previousQuizzes.length > 0
        ? previousQuizzes[0].progressPercentage || 0
        : 0;

    let reportText = "";
    let narrative = null;
    let threadId = null; // threadId를 상위 스코프에서 초기화

    if (skipAI) {
      // OpenAI 없이 고도화된 보고서 생성
      console.log("고도화된 기본 보고서 생성 중...");
      const enhancedReport = generateEnhancedReport(
        score,
        wrong,
        goal,
        testCount,
        previousProgress,
        learningData,
        previousQuizzes
      );
      reportText =
        enhancedReport.jsonReport + "\n\n" + enhancedReport.textReport;
      narrative = enhancedReport.textReport;
      console.log("고도화된 기본 보고서 생성 완료");
    } else {
      // 새로운 프롬프트 형식으로 메시지 생성
      const userMessage = `{\n"type": "result",\n"score": ${Number(
        score
      )},\n"wrong": ${JSON.stringify(
        wrong
      )},\n"previousSummary": "${previousSummary.replace(
        /"/g,
        '\\"'
      )}",\n"goal": "${goal.replace(/"/g, '\\"')}",\n"testCount": ${Number(
        testCount
      )}\n}`;

      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: userMessage,
      });
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId,
      });

      if (run.status !== "completed") {
        // 실패 시 고도화된 보고서로 폴백
        const enhancedReport = generateEnhancedReport(
          score,
          wrong,
          goal,
          testCount,
          previousProgress,
          learningData,
          previousQuizzes
        );
        reportText =
          enhancedReport.jsonReport + "\n\n" + enhancedReport.textReport;
        narrative = enhancedReport.textReport;
      } else {
        const messages = await openai.beta.threads.messages.list(threadId);
        const lastMessageForRun = messages.data
          .filter((m) => m.run_id === run.id && m.role === "assistant")
          .pop();

        let raw = (lastMessageForRun?.content?.[0]?.text?.value || "").trim();
        if (raw.includes("```")) raw = raw.replace(/```\n?/g, "");
        const parsed = extractJsonObject(raw);
        if (parsed && parsed.meta && parsed.score && parsed.progress) {
          try {
            narrative = buildNarrativeFromReport(parsed);
            reportText = JSON.stringify(parsed, null, 2) + "\n\n" + narrative;
          } catch (e) {
            const enhancedReport = generateEnhancedReport(
              score,
              wrong,
              goal,
              testCount,
              previousProgress,
              learningData,
              previousQuizzes
            );
            reportText =
              enhancedReport.jsonReport + "\n\n" + enhancedReport.textReport;
            narrative = enhancedReport.textReport;
          }
        } else {
          const enhancedReport = generateEnhancedReport(
            score,
            wrong,
            goal,
            testCount,
            previousProgress,
            learningData,
            previousQuizzes
          );
          reportText =
            enhancedReport.jsonReport + "\n\n" + enhancedReport.textReport;
          narrative = enhancedReport.textReport;
        }
      }
    }

    // 진행률 계산 (새로운 로직)
    const totalQuestions = testCount >= 5 ? 20 : 10;
    const instantProgress = (score / totalQuestions) * 100;
    const alpha = 0.2 + 0.1 * Math.min(testCount, 5);
    const progressPercentage = Math.round(
      alpha * instantProgress + (1 - alpha) * previousProgress
    );

    // 퀴즈 결과 저장 (상세 보고서 데이터 포함)
    try {
      // 보고서에서 상세 데이터 추출
      let detailedReportData = null;
      try {
        // JSON 부분만 추출해서 파싱
        const jsonPart = reportText.split("\n\n")[0];
        detailedReportData = JSON.parse(jsonPart);
      } catch (parseError) {
        console.log(
          "상세 보고서 데이터 파싱 실패, 기본값 사용:",
          parseError.message
        );
        // 파싱 실패 시 기본 구조 생성
        const enhancedReport = generateEnhancedReport(
          score,
          wrong,
          goal,
          testCount,
          previousProgress,
          learningData,
          previousQuizzes
        );
        detailedReportData = enhancedReport.reportData;
      }

      await QuizLog.create({
        user_id,
        type: "weekly",
        score: Number(score),
        wrong: wrong.map((n) => Number(n)),
        goal,
        testCount: Number(testCount),
        progressPercentage,
        detailedReport: detailedReportData, // 새로운 상세 보고서 데이터
        feedback_report: narrative, // 기존 텍스트 보고서 유지
        learningData: {
          totalNotes: learningData.totalNotes,
          totalRecords: learningData.totalRecords,
        },
      });
      console.log("QuizLog 결과 및 상세 보고서 저장 성공");
    } catch (e) {
      console.error("QuizLog 결과 저장 실패:", e);
    }

    // 진행률 요약 업데이트 (+ 상세 통계 및 문장형 보고서 저장)
    try {
      // 현재 주의 시작일 계산 (월요일 기준)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      const weekStart = monday.toISOString().slice(0, 10);

      const existingSummary = await ProgressSummary.findOne({
        user_id,
        week_start: weekStart,
      });

      // 상세 통계 업데이트를 위한 데이터 준비
      let detailedReportData = null;
      try {
        const jsonPart = reportText.split("\n\n")[0];
        detailedReportData = JSON.parse(jsonPart);
      } catch (parseError) {
        const enhancedReport = generateEnhancedReport(
          score,
          wrong,
          goal,
          testCount,
          previousProgress,
          learningData,
          previousQuizzes
        );
        detailedReportData = enhancedReport.reportData;
      }

      if (existingSummary) {
        existingSummary.weeklyQuizProgress = progressPercentage;
        existingSummary.lastWeeklyQuizDate = new Date();
        existingSummary.weeklyQuizCount =
          (existingSummary.weeklyQuizCount || 0) + 1;
        existingSummary.narrativeReport = narrative || reportText;
        existingSummary.latestDetailedReport = detailedReportData;
        existingSummary.updated_at = new Date();

        // 상세 통계 업데이트
        if (!existingSummary.detailedStats) {
          existingSummary.detailedStats = {
            recentTestResults: [],
            topicMasteryTrend: [],
            learningPatterns: {
              consistentStrengths: [],
              persistentWeaknesses: [],
              improvingAreas: [],
              decliningAreas: [],
            },
            goalPrediction: {},
          };
        }

        // 최근 테스트 결과 추가
        existingSummary.detailedStats.recentTestResults.unshift({
          testDate: new Date(),
          testType: detailedReportData.meta.testType,
          score: score,
          totalQuestions: detailedReportData.score.total,
          progressPercent: progressPercentage,
        });

        // 최근 5개만 유지
        if (existingSummary.detailedStats.recentTestResults.length > 5) {
          existingSummary.detailedStats.recentTestResults =
            existingSummary.detailedStats.recentTestResults.slice(0, 5);
        }

        // 주제별 숙련도 트렌드 업데이트
        if (detailedReportData.topicMastery) {
          detailedReportData.topicMastery.forEach((topic) => {
            let existingTopic =
              existingSummary.detailedStats.topicMasteryTrend.find(
                (t) => t.topic === topic.topic
              );

            if (existingTopic) {
              existingTopic.masteryHistory.unshift(topic.mastery);
              if (existingTopic.masteryHistory.length > 5) {
                existingTopic.masteryHistory =
                  existingTopic.masteryHistory.slice(0, 5);
              }
              existingTopic.averageMastery = Math.round(
                existingTopic.masteryHistory.reduce((a, b) => a + b, 0) /
                  existingTopic.masteryHistory.length
              );
            } else {
              existingSummary.detailedStats.topicMasteryTrend.push({
                topic: topic.topic,
                masteryHistory: [topic.mastery],
                averageMastery: topic.mastery,
                improvementRate: 0,
              });
            }
          });
        }

        // 목표 달성 예측 업데이트
        existingSummary.detailedStats.goalPrediction = {
          currentProgressPercent: progressPercentage,
          weeklyImprovementRate:
            existingSummary.detailedStats.recentTestResults.length >= 2
              ? existingSummary.detailedStats.recentTestResults[0]
                  .progressPercent -
                existingSummary.detailedStats.recentTestResults[1]
                  .progressPercent
              : 0,
          estimatedCompletionWeeks: Math.ceil(
            (90 - progressPercentage) /
              Math.max(
                1,
                existingSummary.detailedStats.recentTestResults.length >= 2
                  ? existingSummary.detailedStats.recentTestResults[0]
                      .progressPercent -
                      existingSummary.detailedStats.recentTestResults[1]
                        .progressPercent
                  : 5
              )
          ),
          confidenceLevel: detailedReportData.progress.confidence,
        };

        await existingSummary.save();
      } else {
        // 현재 주의 시작일 계산 (월요일 기준)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToMonday);
        const weekStart = monday.toISOString().slice(0, 10);

        await ProgressSummary.create({
          user_id,
          week_start: weekStart,
          total: progressPercentage,
          weeklyQuizProgress: progressPercentage,
          lastWeeklyQuizDate: new Date(),
          weeklyQuizCount: 1,
          narrativeReport: narrative || reportText,
          latestDetailedReport: detailedReportData,
          detailedStats: {
            recentTestResults: [
              {
                testDate: new Date(),
                testType: detailedReportData.meta.testType,
                score: score,
                totalQuestions: detailedReportData.score.total,
                progressPercent: progressPercentage,
              },
            ],
            topicMasteryTrend: detailedReportData.topicMastery
              ? detailedReportData.topicMastery.map((topic) => ({
                  topic: topic.topic,
                  masteryHistory: [topic.mastery],
                  averageMastery: topic.mastery,
                  improvementRate: 0,
                }))
              : [],
            learningPatterns: {
              consistentStrengths: detailedReportData.patterns?.strengths || [],
              persistentWeaknesses:
                detailedReportData.patterns?.weaknesses || [],
              improvingAreas: [],
              decliningAreas: [],
            },
            goalPrediction: {
              currentProgressPercent: progressPercentage,
              weeklyImprovementRate: 0,
              estimatedCompletionWeeks: Math.ceil(
                (90 - progressPercentage) / 5
              ),
              confidenceLevel: detailedReportData.progress.confidence,
            },
          },
        });
      }
      console.log("진행률 요약 및 상세 통계 업데이트 성공");
    } catch (e) {
      console.error("진행률 요약 업데이트 실패:", e);
    }

    // 사용자 테이블의 퀴즈 통계 업데이트
    try {
      const conn = await pool.getConnection();

      // 현재 사용자의 퀴즈 통계 조회
      const [userStats] = await conn.query(
        "SELECT total_quiz_count, total_quiz_score, best_quiz_score, last_quiz_date FROM users WHERE user_id = ?",
        [user_id]
      );

      if (userStats.length > 0) {
        const currentStats = userStats[0];
        const newTotalCount = (currentStats.total_quiz_count || 0) + 1;
        const newTotalScore = (currentStats.total_quiz_score || 0) + score;
        const newBestScore = Math.max(currentStats.best_quiz_score || 0, score);
        const newAverageScore = Math.round(newTotalScore / newTotalCount);

        // 사용자 테이블 업데이트
        await conn.query(
          `UPDATE users SET 
           total_quiz_count = ?, 
           total_quiz_score = ?, 
           best_quiz_score = ?, 
           average_quiz_score = ?,
           last_quiz_date = NOW(),
           updated_at = NOW()
           WHERE user_id = ?`,
          [newTotalCount, newTotalScore, newBestScore, newAverageScore, user_id]
        );

        console.log("사용자 퀴즈 통계 업데이트 성공:", {
          totalCount: newTotalCount,
          totalScore: newTotalScore,
          bestScore: newBestScore,
          averageScore: newAverageScore,
        });
      } else {
        console.error("사용자를 찾을 수 없습니다:", user_id);
      }

      conn.release();
    } catch (e) {
      console.error("사용자 퀴즈 통계 업데이트 실패:", e);
    }

    // 일반 진행률과 카테고리별 진행률 동기화 (카테고리가 없는 경우에도 호출)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    const weekStart = monday.toISOString().slice(0, 10);
    await syncGeneralProgressWithCategory(user_id, weekStart);

    console.log("퀴즈 결과 처리 완료, 응답 전송:", {
      progressPercentage,
      testCount,
      hasReport: !!reportText,
      threadId: threadId || "no_thread",
    });

    return res.json({
      success: true,
      report: reportText,
      thread_id: threadId || "no_thread", // AI를 사용하지 않은 경우 대체값 제공
      progressPercentage,
      testCount,
    });
  } catch (err) {
    console.error("주간 퀴즈 결과 처리 실패:", err);
    return res
      .status(500)
      .json({ error: "주간 퀴즈 결과 처리 실패", details: err.message });
  }
});

// 사용자 학습 데이터 조회 (대시보드용)
router.get("/learning-data/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const learningData = await collectUserLearningData(user_id);

    res.json({
      success: true,
      data: learningData,
    });
  } catch (err) {
    console.error("학습 데이터 조회 실패:", err);
    res.status(500).json({
      error: "학습 데이터 조회 실패",
      details: err.message,
    });
  }
});

// 주간 퀴즈 진행률 조회
router.get("/progress/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // 현재 주의 시작일 계산 (월요일 기준)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    const weekStart = monday.toISOString().slice(0, 10);

    const progressSummary = await ProgressSummary.findOne({
      user_id,
      week_start: weekStart,
    });

    const weeklyQuizzes = await QuizLog.find({
      user_id,
      type: "weekly",
    })
      .sort({ created_at: -1 })
      .limit(5);

    res.json({
      success: true,
      progress: progressSummary || {
        total: 0,
        weeklyQuizProgress: 0,
        weeklyQuizCount: 0,
        lastWeeklyQuizDate: null,
        week_start: weekStart,
      },
      recentQuizzes: weeklyQuizzes,
    });
  } catch (err) {
    console.error("진행률 조회 실패:", err);
    res.status(500).json({
      error: "진행률 조회 실패",
      details: err.message,
    });
  }
});

// 사용자 퀴즈 통계 조회
router.get("/stats/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const conn = await pool.getConnection();

    // 사용자 퀴즈 통계 조회
    const [userStats] = await conn.query(
      `SELECT 
        total_quiz_count, 
        total_quiz_score, 
        best_quiz_score, 
        average_quiz_score,
        last_quiz_date
       FROM users WHERE user_id = ?`,
      [user_id]
    );

    // 주간 퀴즈 진행률 조회
    const progressSummary = await ProgressSummary.findOne({ user_id });
    const weeklyQuizzes = await QuizLog.find({
      user_id,
      type: "weekly",
    })
      .sort({ created_at: -1 })
      .limit(5);

    conn.release();

    const stats = userStats[0] || {
      total_quiz_count: 0,
      total_quiz_score: 0,
      best_quiz_score: 0,
      average_quiz_score: 0,
      last_quiz_date: null,
    };

    res.json({
      success: true,
      stats: {
        ...stats,
        average_quiz_score: parseFloat(stats.average_quiz_score || 0),
      },
      progress: progressSummary || {
        weeklyQuizProgress: 0,
        weeklyQuizCount: 0,
        lastWeeklyQuizDate: null,
      },
      recentQuizzes: weeklyQuizzes,
    });
  } catch (err) {
    console.error("퀴즈 통계 조회 실패:", err);
    res.status(500).json({
      error: "퀴즈 통계 조회 실패",
      details: err.message,
    });
  }
});

// 상세 학습 보고서 조회 (새로운 프롬프트 기반)
router.get("/detailed-report/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { quiz_log_id } = req.query; // 특정 퀴즈 로그의 보고서를 조회할 경우

    let detailedReport = null;
    let narrativeReport = "";

    if (quiz_log_id) {
      // 특정 퀴즈 로그의 상세 보고서 조회
      const quizLog = await QuizLog.findById(quiz_log_id);
      if (quizLog && quizLog.user_id === Number(user_id)) {
        detailedReport = quizLog.detailedReport;
        narrativeReport = quizLog.feedback_report || "";
      }
    } else {
      // 최신 진행률 요약에서 상세 보고서 조회
      const progressSummary = await ProgressSummary.findOne({ user_id }).sort({
        created_at: -1,
      });

      if (progressSummary) {
        detailedReport = progressSummary.latestDetailedReport;
        narrativeReport = progressSummary.narrativeReport || "";
      }
    }

    if (!detailedReport) {
      return res.status(404).json({
        error: "상세 보고서를 찾을 수 없습니다.",
        message: "아직 퀴즈를 완료하지 않았거나 보고서가 생성되지 않았습니다.",
      });
    }

    res.json({
      success: true,
      detailedReport: detailedReport,
      narrativeReport: narrativeReport,
      generatedAt: detailedReport.meta?.date || new Date().toISOString(),
    });
  } catch (err) {
    console.error("상세 보고서 조회 실패:", err);
    res.status(500).json({
      error: "상세 보고서 조회 실패",
      details: err.message,
    });
  }
});

// 학습 통계 대시보드 데이터 조회
router.get("/dashboard/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    // 진행률 요약 조회
    const progressSummary = await ProgressSummary.findOne({ user_id }).sort({
      created_at: -1,
    });

    // 최근 5개 퀴즈 로그 조회
    const recentQuizzes = await QuizLog.find({
      user_id,
      type: "weekly",
    })
      .sort({ created_at: -1 })
      .limit(5);

    // 기본 대시보드 데이터
    const dashboardData = {
      currentProgress: progressSummary?.weeklyQuizProgress || 0,
      weeklyQuizCount: progressSummary?.weeklyQuizCount || 0,
      lastQuizDate: progressSummary?.lastWeeklyQuizDate || null,
      estimatedCompletion: progressSummary?.expected_date || null,
      recentTestResults: [],
      topicMasteryTrend: [],
      learningPatterns: {
        consistentStrengths: [],
        persistentWeaknesses: [],
        improvingAreas: [],
        decliningAreas: [],
      },
      goalPrediction: {
        currentProgressPercent: 0,
        weeklyImprovementRate: 0,
        estimatedCompletionWeeks: 0,
        confidenceLevel: "low",
      },
    };

    // 상세 통계가 있는 경우 추가
    if (progressSummary?.detailedStats) {
      dashboardData.recentTestResults =
        progressSummary.detailedStats.recentTestResults || [];
      dashboardData.topicMasteryTrend =
        progressSummary.detailedStats.topicMasteryTrend || [];
      dashboardData.learningPatterns =
        progressSummary.detailedStats.learningPatterns ||
        dashboardData.learningPatterns;
      dashboardData.goalPrediction =
        progressSummary.detailedStats.goalPrediction ||
        dashboardData.goalPrediction;
    }

    res.json({
      success: true,
      dashboard: dashboardData,
      hasDetailedStats: !!progressSummary?.detailedStats,
      lastUpdated:
        progressSummary?.updated_at || progressSummary?.created_at || null,
    });
  } catch (err) {
    console.error("대시보드 데이터 조회 실패:", err);
    res.status(500).json({
      error: "대시보드 데이터 조회 실패",
      details: err.message,
    });
  }
});

// 카테고리별 보고서 조회 API
router.get("/category-report/:user_id/:category", async (req, res) => {
  const { user_id, category } = req.params;

  try {
    console.log(
      `카테고리별 보고서 조회 요청: user_id=${user_id}, category=${category}`
    );

    // 해당 카테고리의 최근 퀴즈 로그 조회
    const recentQuizzes = await QuizLog.find({
      user_id: Number(user_id),
      type: "weekly",
      category: category,
    })
      .sort({ created_at: -1 })
      .limit(5);

    if (!recentQuizzes || recentQuizzes.length === 0) {
      return res.status(404).json({
        error: "해당 카테고리의 퀴즈 기록이 없습니다.",
        category,
      });
    }

    const latestQuiz = recentQuizzes[0];

    // 카테고리별 진행률 정보 조회
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    const weekStart = monday.toISOString().slice(0, 10);

    const progressSummary = await ProgressSummary.findOne({
      user_id: Number(user_id),
      week_start: weekStart,
    });

    let categoryProgress = null;
    if (progressSummary) {
      categoryProgress = progressSummary.categoryProgress.find(
        (cp) => cp.category === category
      );
    }

    // 응답 데이터 구성
    const reportData = {
      category,
      latestReport: {
        score: latestQuiz.score,
        totalQuestions: 10,
        progressPercentage:
          latestQuiz.progressPercentage ||
          Math.round((latestQuiz.score / 10) * 100),
        testCount: latestQuiz.testCount,
        feedback_report: latestQuiz.feedback_report,
        detailedReport: latestQuiz.detailedReport,
        created_at: latestQuiz.created_at,
      },
      categoryProgress: categoryProgress
        ? {
            progress: categoryProgress.progress,
            quizCount: categoryProgress.quizCount,
            averageScore: categoryProgress.averageScore,
            lastQuizDate: categoryProgress.lastQuizDate,
          }
        : null,
      recentHistory: recentQuizzes.map((quiz) => ({
        score: quiz.score,
        progressPercentage:
          quiz.progressPercentage || Math.round((quiz.score / 10) * 100),
        testCount: quiz.testCount,
        created_at: quiz.created_at,
      })),
    };

    console.log(`카테고리 '${category}' 보고서 조회 완료`);
    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("카테고리별 보고서 조회 실패:", error);
    res.status(500).json({
      error: "카테고리별 보고서 조회에 실패했습니다.",
      details: error.message,
    });
  }
});

// 사용자의 모든 카테고리 보고서 목록 조회
router.get("/category-reports/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    console.log(`사용자 ${user_id}의 모든 카테고리 보고서 목록 조회`);

    // 사용자의 모든 카테고리 퀴즈 로그 조회
    const allQuizzes = await QuizLog.find({
      user_id: Number(user_id),
      type: "weekly",
      category: { $exists: true, $ne: null },
    }).sort({ created_at: -1 });

    // 카테고리별로 그룹화
    const categoryMap = new Map();

    allQuizzes.forEach((quiz) => {
      const category = quiz.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category).push(quiz);
    });

    // 각 카테고리의 최신 보고서 정보 구성
    const categoryReports = [];
    for (const [category, quizzes] of categoryMap.entries()) {
      const latestQuiz = quizzes[0];
      categoryReports.push({
        category,
        latestScore: latestQuiz.score,
        progressPercentage:
          latestQuiz.progressPercentage ||
          Math.round((latestQuiz.score / 10) * 100),
        quizCount: quizzes.length,
        lastTestDate: latestQuiz.created_at,
        hasDetailedReport: !!(
          latestQuiz.feedback_report || latestQuiz.detailedReport
        ),
      });
    }

    // 진행률 순으로 정렬
    categoryReports.sort((a, b) => b.progressPercentage - a.progressPercentage);

    res.json({
      success: true,
      data: categoryReports,
    });
  } catch (error) {
    console.error("카테고리 보고서 목록 조회 실패:", error);
    res.status(500).json({
      error: "카테고리 보고서 목록 조회에 실패했습니다.",
      details: error.message,
    });
  }
});

// 일반 진행률과 카테고리별 진행률 동기화 함수
async function syncGeneralProgressWithCategory(user_id, weekStart) {
  try {
    console.log("진행률 동기화 시작:", { user_id, weekStart });

    // 현재 주의 ProgressSummary 조회
    let progressSummary = await ProgressSummary.findOne({
      user_id,
      week_start: weekStart,
    });

    if (!progressSummary) {
      console.log("현재 주의 ProgressSummary가 없어서 동기화를 건너뜁니다.");
      return;
    }

    // 카테고리별 진행률이 있는 경우 평균 계산, 없는 경우 기존 값 유지
    if (
      progressSummary.categoryProgress &&
      progressSummary.categoryProgress.length > 0
    ) {
      const totalProgress = progressSummary.categoryProgress.reduce(
        (sum, cp) => sum + cp.progress,
        0
      );
      const averageProgress = Math.round(
        totalProgress / progressSummary.categoryProgress.length
      );

      // 일반 진행률 업데이트 (total과 weeklyQuizProgress 모두 동기화)
      progressSummary.total = averageProgress;
      progressSummary.weeklyQuizProgress = averageProgress;

      console.log("카테고리별 진행률 기반 동기화 완료:", {
        categoryCount: progressSummary.categoryProgress.length,
        averageProgress,
        totalProgress,
      });
    } else {
      // 카테고리별 진행률이 없는 경우, 기존 total 값을 weeklyQuizProgress와 동기화
      if (typeof progressSummary.total === "number") {
        progressSummary.weeklyQuizProgress = progressSummary.total;
      } else if (typeof progressSummary.weeklyQuizProgress === "number") {
        progressSummary.total = progressSummary.weeklyQuizProgress;
      }

      console.log("일반 진행률 동기화 완료 (카테고리 없음):", {
        total: progressSummary.total,
        weeklyQuizProgress: progressSummary.weeklyQuizProgress,
      });
    }

    await progressSummary.save();

    console.log("진행률 동기화 완료:", {
      user_id,
      weekStart,
      categoryCount: progressSummary.categoryProgress?.length || 0,
      total: progressSummary.total,
      weeklyQuizProgress: progressSummary.weeklyQuizProgress,
    });
  } catch (error) {
    console.error("진행률 동기화 실패:", error);
  }
}

module.exports = router;
