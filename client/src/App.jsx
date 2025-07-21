// src/App.jsx
import React from 'react';
import AppRouter from './routes/AppRouter';
import { UserProvider } from './context/UserContext';
import { PlanProvider } from './context/PlanContext';
import { ThemeProvider } from "./context/ThemeContext";
import "./assets/styles/theme.css";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <PlanProvider>
          <AppRouter />
        </PlanProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
