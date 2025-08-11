const express = require("express");
const router = express.Router();
const pool = require("../db");
const CalendarPlan = require("../models/CalendarPlan");
const QuizLog = require("../models/QuizLog");
const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config({
  path: ".env",
});

const openai = new OpenAI(process.env.OPENAI_API_KEY);
const assistantId = process.env.LEVEL_CHECK_ASSISTANT_ID;

// 중복 요청 방지를 위한 요청 추적
const activeRequests = new Set();

// (주간 퀴즈 라우트는 AIWeeklyQuiz로 분리됨)

// 캘린더 항목 정규화 유틸: AI 응답의 키가 제각각일 수 있어 안전하게 매핑
function normalizeCalendarItem(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  const coalesce = (...vals) =>
    vals.find((v) => v != null && String(v).trim().length > 0);

  const topic = coalesce(
    raw.topic,
    raw.title,
    raw.name,
    raw.subject,
    raw.theme,
    raw.focus,
    raw.task
  );
  const goal = coalesce(
    raw.goal,
    raw.objective,
    raw.target,
    raw.purpose,
    raw.outcome
  );
  let description = coalesce(
    raw.description,
    raw.detail,
    raw.details,
    raw.action,
    raw.activity,
    Array.isArray(raw.tasks) ? raw.tasks.join(", ") : undefined
  );

  // 마지막 안전장치: 최소한 스키마 요구사항 충족시키도록 기본값 설정
  const safeTopic = String(topic || goal || description || "학습 주제").slice(
    0,
    120
  );
  const safeGoal = String(goal || topic || "학습 목표 달성").slice(0, 200);
  const safeDesc = String(description || `${safeTopic} 관련 학습 수행`).slice(
    0,
    500
  );

  return { topic: safeTopic, goal: safeGoal, description: safeDesc };
}

// 퀴즈 생성 (기존 AIQuiz 기능)
router.post("/make-quiz", async (req, res) => {
  const requestKey = `${req.body.user_id}_${req.body.subject}_${req.body.detail}`;

  if (activeRequests.has(requestKey)) {
    console.log("중복 요청 감지, 무시:", requestKey);
    return res.status(429).json({ error: "이미 처리 중인 요청입니다." });
  }

  activeRequests.add(requestKey);

  try {
    const {
      user_id,
      subject,
      detail,
      level,
      goal,
      start_date,
      end_date,
      field,
    } = req.body;

    console.log("퀴즈 생성 요청:", {
      user_id,
      subject,
      detail,
      level,
      goal,
      start_date,
      end_date,
      field,
    });

    // 사용자 정보 조회
    const conn = await pool.getConnection();
    const [userFields] = await conn.query(
      "SELECT field, level FROM user_fields WHERE user_id = ?",
      [user_id]
    );
    conn.release();

    // OpenAI Assistant API에 전달할 메시지 생성 (퀴즈 생성 전용 프롬프트)
    const userMessage = `
- 관심분야: ${subject}.${detail}
- 학습 목표: ${goal}
- 학습 기간: ${start_date} ~ ${end_date}
- 현재 수준: ${level}
- 세부 분야: ${field}
-
`;

    // 항상 새로운 스레드 생성 (충돌 방지)
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;

    // 메시지 생성
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userMessage,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    // run.status가 completed인지 확인
    if (run.status !== "completed") {
      return res.status(500).send("Assistant 실행 실패");
    }

    // 마지막 Assistant 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(threadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;

      // 마크다운 형식 제거 및 JSON 추출
      let jsonText = assistantResponseText;

      // ```json과 ``` 제거
      if (jsonText.includes("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      // 앞뒤 공백 제거
      jsonText = jsonText.trim();

      try {
        const quizData = JSON.parse(jsonText);

        // 퀴즈 로그 저장
        await QuizLog.create({
          user_id,
          type: "level-check",
          problems: quizData,
        });

        console.log("퀴즈 생성 완료:", quizData.length, "개 문제");

        res.json({
          success: true,
          quizData,
          thread_id: threadId,
          message: "퀴즈가 생성되었습니다.",
        });
      } catch (parseError) {
        console.error("JSON 파싱 실패:", parseError);
        console.error("원본 응답:", assistantResponseText);
        res.status(500).json({
          error: "퀴즈 데이터 파싱에 실패했습니다.",
          details: parseError.message,
        });
      }
    } else {
      return res.status(500).send("Assistant가 응답을 제공하지 않았습니다.");
    }
  } catch (error) {
    console.error("퀴즈 생성 실패:", error);
    res.status(500).json({
      error: "퀴즈 생성에 실패했습니다.",
      details: error.message,
    });
  } finally {
    activeRequests.delete(requestKey);
  }
});

// 퀴즈 결과 저장 및 캘린더 계획 생성 (기존 quiz.js 기능)
router.post("/save-quiz-result", async (req, res) => {
  const {
    user_id,
    subject,
    detail,
    level,
    goal,
    start_date,
    end_date,
    field,
    score,
    wrong_topics,
    quiz_data,
    answers,
    thread_id,
  } = req.body;

  console.log("퀴즈 결과 저장 요청:", {
    user_id,
    subject,
    detail,
    level,
    goal,
    start_date,
    end_date,
    field,
    score,
  });

  try {
    // 퀴즈 결과 저장
    await pool.query(
      `INSERT INTO test_results (user_id, subject, detail, level, goal, start_date, end_date, field, score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        subject,
        detail,
        level,
        goal,
        start_date,
        end_date,
        field,
        score,
      ]
    );

    console.log("퀴즈 결과 DB 저장 완료");

    // AI를 통해 캘린더 계획 생성 (계획 생성 전용 프롬프트)
    const userMessage = `
- 관심분야: ${subject}.${detail}
- 학습 목표: ${goal}
- 학습 기간: ${start_date} ~ ${end_date}
- 현재 수준: ${level}
- 세부 분야: ${field}
- 정답 수(10문항 기준): ${score}
- 틀린 문제 주제: ${wrong_topics.join(", ")}
- 현재 날짜: ${new Date().toISOString().slice(0, 10)}
`;

    console.log("AI 캘린더 계획 생성 시작");

    // 새로운 스레드 생성 (충돌 방지)
    const thread = await openai.beta.threads.create();
    const currentThreadId = thread.id;

    // 메시지 생성
    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: userMessage,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(currentThreadId, {
      assistant_id: assistantId,
    });

    // run.status가 completed인지 확인
    if (run.status !== "completed") {
      return res.status(500).send("Assistant 실행 실패");
    }

    // 마지막 Assistant 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(currentThreadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;

      console.log(
        "AI 응답 받음:",
        assistantResponseText.substring(0, 200) + "..."
      );

      // 마크다운 형식 제거 및 JSON 추출
      let jsonText = assistantResponseText;

      // ```json과 ``` 제거
      if (jsonText.includes("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      // 앞뒤 공백 제거
      jsonText = jsonText.trim();

      try {
        const calendarPlan = JSON.parse(jsonText);

        console.log(
          "캘린더 계획 파싱 성공:",
          Array.isArray(calendarPlan) ? calendarPlan.length : 0,
          "개 항목"
        );

        // MongoDB에 캘린더 계획 저장 (필드 정규화)
        const today = new Date();
        const docs = (Array.isArray(calendarPlan) ? calendarPlan : []).map(
          (item, idx) => {
            const norm = normalizeCalendarItem(item);
            return {
              user_id,
              date: new Date(today.getTime() + idx * 86400000)
                .toISOString()
                .slice(0, 10),
              topic: norm.topic,
              goal: norm.goal,
              description: norm.description,
              field: `${subject}.${detail}`,
            };
          }
        );

        try {
          if (docs.length > 0) {
            await CalendarPlan.insertMany(docs);
          }
        } catch (dbErr) {
          console.error("캘린더 저장 실패:", dbErr);
          return res.status(500).json({
            error: "캘린더 계획 저장에 실패했습니다.",
            details: dbErr.message,
          });
        }

        console.log("MongoDB 캘린더 계획 저장 완료:", docs.length, "개 항목");

        // 클라이언트에서 즉시 표시 가능하도록 저장된 문서(docs)를 반환
        res.json({
          success: true,
          message: "퀴즈 결과가 저장되고 학습 계획이 생성되었습니다.",
          calendarPlan: docs,
          thread_id: currentThreadId,
          generatedCount: docs.length,
          user_id: user_id,
        });
      } catch (jsonErr) {
        console.error("캘린더 JSON 파싱 실패:", jsonErr);
        console.error("원본 응답:", assistantResponseText);
        res.status(500).json({
          error: "캘린더 계획 파싱에 실패했습니다.",
          details: jsonErr.message,
        });
      }
    } else {
      return res.status(500).send("Assistant가 응답을 제공하지 않았습니다.");
    }
  } catch (err) {
    console.error("퀴즈 결과 저장 실패:", err);
    res.status(500).json({
      success: false,
      message: "서버 오류로 저장에 실패했습니다.",
      error: err.message,
    });
  }
});

// 기존 레벨 체크 기능들 (하위 호환성 유지)
router.post("/start", async (req, res) => {
  const { user_id, subject, goal, period, level } = req.body;

  try {
    const [userFields] = await pool.query(
      "SELECT field, level FROM user_fields WHERE user_id=?",
      [user_id]
    );

    const userMessage = `
      관심분야: ${subject}
      학습 목표: ${goal}
      학습 기간: ${period}
      현재 수준: ${level}
    `;

    // 새로운 스레드 생성
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;

    // 메시지 생성
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userMessage,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    // run.status가 completed인지 확인
    if (run.status !== "completed") {
      return res.status(500).send("Assistant 실행 실패");
    }

    // 마지막 Assistant 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(threadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;

      // 마크다운 형식 제거 및 JSON 추출
      let jsonText = assistantResponseText;

      // ```json과 ``` 제거
      if (jsonText.includes("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      // 앞뒤 공백 제거
      jsonText = jsonText.trim();

      try {
        const problems = JSON.parse(jsonText);

        await QuizLog.create({ user_id, type: "level-check", problems });

        res.json({
          success: true,
          problems,
          thread_id: threadId,
        });
      } catch (parseError) {
        console.error("JSON 파싱 실패:", parseError);
        console.error("원본 응답:", assistantResponseText);
        res.status(500).json({
          error: "문제 데이터 파싱에 실패했습니다.",
          details: parseError.message,
        });
      }
    } else {
      return res.status(500).send("Assistant가 응답을 제공하지 않았습니다.");
    }
  } catch (err) {
    console.error("레벨 체크 문제 생성 실패:", err);
    res.status(500).json({ error: "문제 생성 실패" });
  }
});

router.post("/result", async (req, res) => {
  const { user_id, subject, goal, period, level, score, wrongTopics } =
    req.body;
  const conn = await pool.getConnection();

  try {
    await conn.query(
      "INSERT INTO test_results (user_id, subject, detail, level, score) VALUES (?,?,?,?,?)",
      [user_id, subject, goal, level, score]
    );

    const userMessage = `
      관심분야: ${subject}
      학습 목표: ${goal}
      학습 기간: ${period}
      현재 수준: ${level}
      정답 수: ${score}/10
      틀린 문제 주제: ${wrongTopics.join(", ")}
    `;

    // 새로운 스레드 생성
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;

    // 메시지 생성
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userMessage,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    // run.status가 completed인지 확인
    if (run.status !== "completed") {
      return res.status(500).send("Assistant 실행 실패");
    }

    // 마지막 Assistant 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(threadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;

      // 마크다운 형식 제거 및 JSON 추출
      let jsonText = assistantResponseText;

      // ```json과 ``` 제거
      if (jsonText.includes("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      // 앞뒤 공백 제거
      jsonText = jsonText.trim();

      try {
        const plan = JSON.parse(jsonText);

        // ③ MongoDB 캘린더 자동 저장 (필드 정규화)
        const today = new Date();
        const docs = (Array.isArray(plan) ? plan : []).map((item, idx) => {
          const norm = normalizeCalendarItem(item);
          return {
            user_id,
            date: new Date(today.getTime() + idx * 86400000)
              .toISOString()
              .slice(0, 10),
            topic: norm.topic,
            goal: norm.goal,
            description: norm.description,
            field: `${subject}.${detail}`,
          };
        });

        try {
          if (docs.length > 0) {
            await CalendarPlan.insertMany(docs);
          }
        } catch (dbErr) {
          console.error("캘린더 저장 실패:", dbErr);
          return res.status(500).json({
            error: "캘린더 계획 저장에 실패했습니다.",
            details: dbErr.message,
          });
        }

        res.json({
          success: true,
          plan,
          thread_id: threadId,
        });
      } catch (jsonErr) {
        console.error("계획 JSON 파싱 실패:", jsonErr);
        console.error("원본 응답:", assistantResponseText);
        res.status(500).json({
          error: "계획 데이터 파싱에 실패했습니다.",
          details: jsonErr.message,
        });
      }
    } else {
      return res.status(500).send("Assistant가 응답을 제공하지 않았습니다.");
    }
  } catch (err) {
    console.error("레벨 체크 결과 처리 실패:", err);
    res.status(500).json({ error: "레벨 체크 결과 처리 실패" });
  } finally {
    conn.release();
  }
});

module.exports = router;
