import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light"); // 기본값 라이트

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // body background 직접 처리
    if (theme === "gradient") {
      document.body.style.background = "linear-gradient(135deg, #c2e9fb 0%, #a1c4fd 100%)";
    } else {
      document.body.style.background = "";
    }
  }, [theme]);

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