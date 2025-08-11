require("dotenv").config();
require("./mongodb");

const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./db_index");
const userRoutes = require("./routes/user");
const learningRoutes = require("./routes/learning");
const userCategoryRoutes = require("./routes/userCategory");
const studyNoteRoutes = require("./routes/studyNote");
const calendarRouter = require("./routes/calendar");
const progressRouter = require("./routes/progress");
const aiLevelCheckRouter = require("./controller/AILevelCheck");
const aiWeeklyQuizRouter = require("./controller/AIWeeklyQuiz");
const chatRouter = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/user-categories", userCategoryRoutes);
app.use("/api/study-note", studyNoteRoutes);
app.use("/api/calendar", calendarRouter);
app.use("/api/progress", progressRouter);

// 통합 AI 라우트 (퀴즈 생성, 결과 저장, 캘린더 계획 생성 모두 처리)
app.use("/api/ai", aiLevelCheckRouter);
// 주간 퀴즈 전용 라우트
app.use("/api/ai/weekly-quiz", aiWeeklyQuizRouter);

// 챗봇 라우트
app.use("/chat", chatRouter);

const PORT = process.env.PORT || 3001;

// 서버 시작 시 데이터베이스 초기화
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`SERVER ON : http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("서버 시작 실패:", error);
  });
