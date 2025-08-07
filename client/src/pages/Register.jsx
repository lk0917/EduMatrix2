// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
import { registerUser } from '../services/authService';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    gender: '',
    birth: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    interests: [],
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const interestOptions = [
    { id: 'english', name: '영어', icon: '🌍', description: '기초부터 비즈니스 영어까지' },
    { id: 'coding', name: '코딩', icon: '💻', description: 'Python, JavaScript, Java 등' },
    { id: 'certificate', name: '자격증', icon: '📜', description: 'IT, 언어, 전문 자격증' },
    { id: 'self-improvement', name: '자기계발', icon: '🚀', description: '리더십, 커뮤니케이션' },
    { id: 'math', name: '수학', icon: '📐', description: '기초 수학부터 고급 수학' },
    { id: 'science', name: '과학', icon: '🔬', description: '물리, 화학, 생물 등' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    }
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }
    
    if (!formData.birth.trim()) {
      newErrors.birth = '생년월일을 입력해주세요';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }
    
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    
    /* if (formData.interests.length === 0) {
      newErrors.interests = '최소 하나의 관심 분야를 선택해주세요';
    } */
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const toggleInterest = (interestId) => {
    setFormData((prev) => {
      const newInterests = prev.interests.includes(interestId)
        ? prev.interests.filter((item) => item !== interestId)
        : [...prev.interests, interestId];
      return { ...prev, interests: newInterests };
    });
    
    // 에러 메시지 제거
    if (errors.interests) {
      setErrors({ ...errors, interests: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 회원가입
     const createdUser = await registerUser({
        name: formData.name,
        username: formData.username,
        gender: formData.gender,
        birth: formData.birth,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        interests: formData.interests
      });

      if(createdUser.user_id && formData.interests.length > 0){
        await axios.post('/api/users/save-user-fields',{
          user_id : createdUser.user_id,
          selections: formData.interests.map((field) => ({ 
          field,
          level : 'beginner'//기본값
          }))
          
        });
      }


      // 관심분야 별도 저장
      // await axios.post('/api/save-user-fields', { user_id: ..., selections: ... })
      navigate('/login');
    } catch (err) {
      alert('회원가입 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h2>EduMatrix에 오신 것을 환영합니다!</h2>
          <h3>AI 기반 맞춤형 학습 관리 시스템</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-section">
            <h3>기본 정보</h3>
            
            <div className="input-group">
              <label htmlFor="name">이름</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="홍길동"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            
            <div className="input-group">
              <label htmlFor="username">아이디</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="아이디"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'error' : ''}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="gender">성별</label>
              <div className="gender-group">
                <button
                  type="button"
                  className={`gender-btn${formData.gender === '남성' ? ' selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'gender', value: '남성' } })}
                >
                  남성
                </button>
                <button
                  type="button"
                  className={`gender-btn${formData.gender === '여성' ? ' selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'gender', value: '여성' } })}
                >
                  여성
                </button>
              </div>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="birth">생년월일</label>
              <input
                id="birth"
                name="birth"
                type="date"
                value={formData.birth}
                onChange={handleChange}
                className={errors.birth ? 'error' : ''}
              />
              {errors.birth && <span className="error-message">{errors.birth}</span>}
            </div>
            <div className="input-group">
              <label htmlFor="phone">전화번호</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
            
            <div className="input-group">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="input-group">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="6자 이상 입력해주세요"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            
            <div className="input-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>관심 학습 분야</h3>
            <p className="section-description">학습하고 싶은 분야를 선택해주세요 (복수 선택 가능)</p>
            
            <div className="interest-grid">
              {interestOptions.map((interest) => (
                <div
                  key={interest.id}
                  className={`interest-card ${
                    formData.interests.includes(interest.id) ? 'selected' : ''
                  }`}
                  onClick={() => toggleInterest(interest.id)}
                >
                  <div className="interest-icon">{interest.icon}</div>
                  <div className="interest-content">
                    <h4>{interest.name}</h4>
                    <p>{interest.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {errors.interests && <span className="error-message">{errors.interests}</span>}
          </div>

          <button 
            type="submit" 
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '회원가입 완료'}
          </button>
        </form>
        
        <div className="login-link">
          이미 계정이 있으신가요? <span onClick={() => navigate('/login')}>로그인하기</span>
        </div>
      </div>
    </div>
  );
}

export default Register;
