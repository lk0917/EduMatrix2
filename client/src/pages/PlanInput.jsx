import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBullseye, FaCalendarAlt, FaBook } from 'react-icons/fa';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const 분야목록 = [
  'JS',
  'Python',
  'Clang',
  'English(Voca)',
  'English(Grammar)',
  '기타'
];

function PlanInput() {
  const [목표, set목표] = useState('');
  const [시작일, set시작일] = useState('');
  const [종료일, set종료일] = useState('');
  const [분야, set분야] = useState(분야목록[0]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const prevState = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 서버로 학습 목표 정보 전송
      await axios.post('/api/learning/save-learning-goal', {
        user_id: user.user_id,
        subject: prevState.subject,
        detail: prevState.detail,
        level: prevState.level,
        goal: 목표,
        start_date: 시작일,
        end_date: 종료일,
        field: 분야
      });

      navigate('/quiz', {
        state: {
          subject: prevState.subject,
          detail: prevState.detail,
          level: prevState.level,
          목표,
          시작일,
          종료일,
          분야,
          ...prevState
        }
      });
    } catch (error) {
      console.error('학습 목표 저장 실패:', error);
      alert('학습 목표 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#111' }}>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px #0002', padding: '3rem 2.5rem', maxWidth: 480, width: '100%', color: '#111' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(90deg,#8ec5fc,#e0c3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> {/*수정 할수도*/}
            학습 목표 설정
          </div>
          <div style={{ color: '#444', fontSize: 16 }}>
            목표, 기간, 분야를 입력해 주세요.
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {/* 목표 입력 */}
          <div style={{ marginBottom: 22 }}>
            <label htmlFor="goal" style={{ display: 'flex', alignItems: 'center', fontWeight: 600, marginBottom: 8, fontSize: 16, color: '#111' }}>
              <FaBullseye style={{ marginRight: 8, color: '#111' }} /> 목표
            </label>
            <input
              id="goal"
              type="text"
              value={목표}
              onChange={e => set목표(e.target.value)}
              placeholder="예: 파이썬 기초 다지기"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0c3fc', fontSize: 15, outline: 'none', transition: 'border 0.2s' }}
              onFocus={e => e.target.style.border = '1.5px solid #111'}
              onBlur={e => e.target.style.border = '1.5px solid #222'}
              required
            />
          </div>
          <hr style={{ border: 'none', borderTop: '1.5px solid #eee', margin: '18px 0' }} />
          {/* 기간 입력 */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: 600, marginBottom: 8, fontSize: 16, color: '#111' }}>
              <FaCalendarAlt style={{ marginRight: 8, color: '#111' }} /> 기간
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="date"
                value={시작일}
                onChange={e => set시작일(e.target.value)}
                required
                style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: '1.5px solid #e0c3fc', fontSize: 15, outline: 'none', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.border = '1.5px solid #111'}
                onBlur={e => e.target.style.border = '1.5px solid #222'}
              />
              <span style={{ alignSelf: 'center', color: '#aaa', fontWeight: 700 }}>~</span>
              <input
                type="date"
                value={종료일}
                onChange={e => set종료일(e.target.value)}
                required
                style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: '1.5px solid #e0c3fc', fontSize: 15, outline: 'none', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.border = '1.5px solid #111'}
                onBlur={e => e.target.style.border = '1.5px solid #222'}
              />
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1.5px solid #eee', margin: '18px 0' }} />
          {/* 분야 선택 */}
          <div style={{ marginBottom: 32 }}>
            <label htmlFor="field" style={{ display: 'flex', alignItems: 'center', fontWeight: 600, marginBottom: 8, fontSize: 16, color: '#111' }}>
              <FaBook style={{ marginRight: 8, color: '#111' }} /> 분야
            </label>
            <select
              id="field"
              value={분야}
              onChange={e => set분야(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #e0c3fc', fontSize: 15, background: '#f8f9fa', outline: 'none', transition: 'border 0.2s' }}
              onFocus={e => e.target.style.border = '1.5px solid #111'}
              onBlur={e => e.target.style.border = '1.5px solid #222'}
            >
              {분야목록.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <button type="submit" style={{ width: '100%', padding: '14px 0', borderRadius: 10, background: 'linear-gradient(135deg, #222 0%, #111 100%)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #1112', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={e => e.target.style.background = 'linear-gradient(90deg,#e0c3fc,#8ec5fc)'}
            onMouseOut={e => e.target.style.background = 'linear-gradient(90deg,#8ec5fc,#e0c3fc)'}
          >
            다음 단계로
          </button>
        </form>
      </div>
    </div>
  );
}

export default PlanInput; 