// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { useUser } from '../context/UserContext';
import './Login.css';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!loginData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }
    
    if (!loginData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginUser({
                idOrEmail: loginData.email,
                password: loginData.password
            });

            if (response.success) {
              login(response.user);
                try {
                    const { data } = await axios.get('/api/users/user-fields', {
                        params: { user_id: response.user.user_id }
                    });

                    const firstRoute = data.length === 0 ? '/subject' : '/dashboard';
                    navigate(firstRoute, { replace: true });

                } catch (err) {
                    console.error('user_fields 조회 실패', err);
                    navigate('/subject', { replace: true });
                }
            } else {
                setErrors({ general: response.message || '로그인 실패' });
            }
        } catch (err) {
            setErrors({ general: err.response?.data?.message || '로그인 에러' });
        } finally {
            setIsLoading(false);
        }
    };

  const handleDemoLogin = () => {
    setLoginData({
      email: 'demo@edumatrix.com',
      password: 'demo123'
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>EduMatrix에 다시 오신 것을 환영합니다!</h1>
          <p>AI 기반 맞춤형 학습 관리 시스템</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-section">
            <h3>로그인</h3>
            {errors.general && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}
            <div className="input-group">
              <label htmlFor="email">이메일</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={loginData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                <span className="input-icon">📧</span>
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="password">비밀번호</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력해주세요"
                  value={loginData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                />
                <span className="input-icon">🔒</span>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" />
                <span className="checkmark"></span>
                로그인 상태 유지
              </label>
              <span className="forgot-password">비밀번호를 잊으셨나요?</span>
            </div>
          </div>
          <button 
            type="submit" 
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
          <div className="demo-login">
            <button 
              type="button" 
              className="demo-btn"
              onClick={handleDemoLogin}
            >
              데모 계정으로 로그인
            </button>
          </div>
        </form>
        <div className="register-link" style={{ marginTop: 24, fontWeight: 500, fontSize: '1.05rem' }}>
          아직 계정이 없으신가요?{' '}
          <button
            type="button"
            style={{ color: '#667eea', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontSize: '1.05rem' }}
            onClick={() => navigate('/register')}
          >
            회원가입하기
          </button>
        </div>
        <div className="social-login">
          <p>또는</p>
          <div className="social-buttons">
            <button className="social-btn google">
              <span className="social-icon">🔍</span>
              Google로 로그인
            </button>
            <button className="social-btn kakao">
              <span className="social-icon">💛</span>
              카카오로 로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
