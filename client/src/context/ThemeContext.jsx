import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const stored = typeof window !== "undefined" && localStorage.getItem("em_theme");
    if (stored === "light" || stored === "dark" || stored === "gradient") return stored;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // gradient는 배경이 흐릿해 보이도록 본문에 미세한 오버레이 제공
    if (theme === "gradient") {
      document.body.style.background = "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 35%, #ede9fe 70%, #fae8ff 100%)";
    } else {
      document.body.style.background = "";
    }
    try {
      localStorage.setItem("em_theme", theme);
    } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    // 시스템 테마 변경을 실시간 반영 (저장된 수동 선택이 있으면 유지)
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const stored = localStorage.getItem("em_theme");
      if (!stored) setTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = (nextTheme) => {
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 