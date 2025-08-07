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

    // OpenAI Assistant API에 전달할 메시지 생성
    const userMessage = `
      관심분야: ${subject}.${detail}
      학습 목표: ${goal}
      학습 기간: ${start_date} ~ ${end_date}
      현재 수준: ${level}
      세부 분야: ${field}

      위 정보를 바탕으로 4지선다 객관식 10문제를 JSON 배열로 출력해 주세요.
      형식 예시:
      [
        {"q":"문제 내용","a":["선지1","선지2","선지3","선지4"],"answer":2},
        ...
      ]
      부가 설명 없이 JSON만 반환
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

    // AI를 통해 캘린더 계획 생성
    const userMessage = `
      관심분야: ${subject}.${detail}
      학습 목표: ${goal}
      학습 기간: ${start_date} ~ ${end_date}
      현재 수준: ${level}
      세부 분야: ${field}
      퀴즈 점수: ${score}/10
      틀린 문제 주제: ${wrong_topics.join(", ")}
      현재 날짜: ${new Date().toISOString().slice(0, 10)}

      위 정보를 바탕으로 일일 학습 계획표를 JSON 배열로 출력해 주세요.
      형식 예시:
      [
        {"topic":"조건문 if/else","goal":"조건 분기 이해","description":"if/else 기본 문법 학습"},
        {"topic":"반복문 for/while","goal":"반복 구조 이해","description":"for/while 문법과 활용법 학습"},
        ...
      ]
      부가 설명 없이 JSON만 반환
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

        console.log("캘린더 계획 파싱 성공:", calendarPlan.length, "개 항목");

        // MongoDB에 캘린더 계획 저장
        const today = new Date();
        const docs = calendarPlan.map((item, idx) => ({
          user_id,
          date: new Date(today.getTime() + idx * 86400000)
            .toISOString()
            .slice(0, 10),
          topic: item.topic,
          goal: item.goal,
          description: item.description,
          field: `${subject}.${detail}`,
        }));

        await CalendarPlan.insertMany(docs);

        console.log("MongoDB 캘린더 계획 저장 완료:", docs.length, "개 항목");

        res.json({
          success: true,
          message: "퀴즈 결과가 저장되고 학습 계획이 생성되었습니다.",
          calendarPlan,
          thread_id: currentThreadId,
          generatedCount: docs.length,
          user_id: user_id,
        });
      } catch (parseError) {
        console.error("JSON 파싱 실패:", parseError);
        console.error("원본 응답:", assistantResponseText);
        res.status(500).json({
          error: "캘린더 계획 파싱에 실패했습니다.",
          details: parseError.message,
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

      4지선다 객관식 10문제를 JSON 배열로 출력해 주세요.
      형식 예시:
      [
        {"q":"문제","a":["1","2","3","4"],"answer":2},
        ...
      ]
      부가 설명 없이 JSON만 반환
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

      일일 학습 계획표를 JSON 배열로 출력해 주세요.
      형식 예시:
      [
        {"topic":"조건문 if/else","goal":"조건 분기 이해","description":"if/else 기본 문법 학습"},
        ...
      ]
      부가 설명 없이 JSON만 반환
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

        // ③ MongoDB 캘린더 자동 저장
        const today = new Date();
        const docs = plan.map((item, idx) => ({
          user_id,
          date: new Date(today.getTime() + idx * 86400000)
            .toISOString()
            .slice(0, 10),
          topic: item.topic,
          goal: item.goal,
          description: item.description,
          field: subject,
        }));
        await CalendarPlan.insertMany(docs);

        res.json({
          success: true,
          plan,
          thread_id: threadId,
        });
      } catch (parseError) {
        console.error("JSON 파싱 실패:", parseError);
        console.error("원본 응답:", assistantResponseText);
        res.status(500).json({
          error: "계획 데이터 파싱에 실패했습니다.",
          details: parseError.message,
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
