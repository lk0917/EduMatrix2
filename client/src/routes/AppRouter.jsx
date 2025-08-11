// src/routes/AppRouter.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Welcome from '../pages/Welcome';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import SelectSubject from '../pages/SelectSubject';
import PlanRecommend from '../pages/PlanRecommend';
import FinalReport from '../pages/FinalReport';
import Login from '../pages/Login';
import QuizPage from '../pages/QuizPage';
import ProgressDetail from '../pages/ProgressDetail';

import RecommendDetail from '../pages/RecommendDetail';
import WeeklyEvalDetail from '../pages/WeeklyEvalDetail';
import NoteDetail from '../pages/NoteDetail';
import QuizDetail from '../pages/QuizDetail';
import WeeklyQuizPage from '../pages/WeeklyQuizPage';
import WeeklyQuizSolve from '../pages/WeeklyQuizSolve';
import CategoryQuizPage from '../pages/CategoryQuizPage';
import CategoryQuizSolve from '../pages/CategoryQuizSolve';
import CategoryManagePage from '../pages/CategoryManagePage';
import CategoryReportPage from '../pages/CategoryReportPage';
import CategoryReportsListPage from '../pages/CategoryReportsListPage';
import ProtectedRoute from './ProtectedRoute';
import PlanInput from '../pages/PlanInput';
import CalendarPage from '../pages/CalendarPage';
import NoteList from '../pages/NoteList';
import NoteCreate from '../pages/NoteCreate';
import StudyRoom from '../pages/StudyRoom';

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* 보호가 필요한 라우트 */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/progress" element={<ProtectedRoute><ProgressDetail /></ProtectedRoute>} />
        <Route path="/dashboard/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/dashboard/recommend" element={<ProtectedRoute><RecommendDetail /></ProtectedRoute>} />
        <Route path="/dashboard/weekly" element={<ProtectedRoute><WeeklyEvalDetail /></ProtectedRoute>} />
        <Route path="/dashboard/note" element={<ProtectedRoute><NoteList /></ProtectedRoute>} />
        <Route path="/dashboard/note/new" element={<ProtectedRoute><NoteCreate /></ProtectedRoute>} />
        <Route path="/dashboard/note/:id" element={<ProtectedRoute><NoteDetail /></ProtectedRoute>} />
        <Route path="/dashboard/quiz" element={<ProtectedRoute><QuizDetail /></ProtectedRoute>} />
        <Route path="/dashboard/studyroom" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
        <Route path="/subject" element={<ProtectedRoute><SelectSubject /></ProtectedRoute>} />
        <Route path="/plan" element={<ProtectedRoute><PlanRecommend /></ProtectedRoute>} />
        <Route path="/plan-input" element={<ProtectedRoute><PlanInput /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><FinalReport /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
        <Route path="/weekly-quiz" element={<ProtectedRoute><WeeklyQuizPage /></ProtectedRoute>} />
        <Route path="/weekly-quiz-solve" element={<ProtectedRoute><WeeklyQuizSolve /></ProtectedRoute>} />
        <Route path="/category-quiz" element={<ProtectedRoute><CategoryQuizPage /></ProtectedRoute>} />
        <Route path="/category-quiz-solve" element={<ProtectedRoute><CategoryQuizSolve /></ProtectedRoute>} />
        <Route path="/category-manage" element={<ProtectedRoute><CategoryManagePage /></ProtectedRoute>} />
        <Route path="/category-reports" element={<ProtectedRoute><CategoryReportsListPage /></ProtectedRoute>} />
        <Route path="/category-report/:category" element={<ProtectedRoute><CategoryReportPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
