require("dotenv").config();
require("./mongodb");

const express           = require("express");
const cors              = require("cors");
const userRoutes        = require("./routes/user");
const quizRouter        = require("./routes/quiz");
const learningRoutes    = require("./routes/learning");
const userCategoryRoutes= require("./routes/userCategory");
const studyNoteRoutes   = require("./routes/studyNote");
const calendarRouter    = require("./routes/calendar");
const progressRoutes = require("./routes/progress");

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.use("/api/users", userRoutes);

app.use("/api/quiz", quizRouter);

app.use("/api/learning", learningRoutes);

app.use("/api/user-categories", userCategoryRoutes);

app.use("/api/study-note", studyNoteRoutes);

app.use("/api/calendar", calendarRouter);


app.use("/api/progress", progressRoutes);  

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SERVER ON : http://localhost:${PORT}`);
});
