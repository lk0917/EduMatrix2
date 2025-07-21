 // src/services/authService.js
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api"; // 서버 라우팅에 맞게 수정

/**
 * 회원가입 요청
 * @param {Object} userData - { name, username, gender, birth, phone, email, password }
 */
  export const registerUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/users/register`, userData);
  return response.data;
};

/**
 * 로그인 요청
 * @param {Object} loginData - { idOrEmail, password }
 */
export const loginUser = async (loginData) => {
  const response = await axios.post(`${API_BASE_URL}/users/login`, loginData);
  return response.data;
};
