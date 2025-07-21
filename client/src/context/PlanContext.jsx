import React, { createContext, useContext, useState } from 'react';

const PlanContext = createContext();

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

export const PlanProvider = ({ children }) => {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [progress, setProgress] = useState(0);

  const selectSubject = (subject) => {
    setSelectedSubject(subject);
  };

  const setPlan = (plan) => {
    setCurrentPlan(plan);
  };

  const updateProgress = (newProgress) => {
    setProgress(newProgress);
  };

  const value = {
    selectedSubject,
    currentPlan,
    progress,
    selectSubject,
    setPlan,
    updateProgress
  };

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
};
