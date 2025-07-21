// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Context 생성
const UserContext = createContext();

// Context 제공 컴포넌트
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 예시: 로컬스토리지에 저장된 사용자 불러오기
  useEffect(() => {
    const storedUser = localStorage.getItem('edumatrix_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 로그인 시 사용자 저장
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('edumatrix_user', JSON.stringify(userData));
  };

  // 로그아웃 처리
  const logout = () => {
    setUser(null);
    localStorage.removeItem('edumatrix_user');
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Context를 쉽게 사용할 수 있도록 훅 제공
export const useUser = () => useContext(UserContext);
