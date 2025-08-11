import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { submitWeeklyQuizResultByCategory } from '../services/quizService';

function CategoryQuizSolve() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quizData, setQuizData] = useState([]);
  const [category, setCategory] = useState('기본');
  const [testCount, setTestCount] = useState(1);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.quizData) {
      console.log('받은 퀴즈 데이터:', location.state.quizData);
      console.log('첫 번째 문제 구조:', location.state.quizData[0]);
      setQuizData(location.state.quizData);
      setCategory(location.state.category || '기본');
      setTestCount(location.state.testCount || 1);
      setAnswers(Array(location.state.quizData.length).fill(null));
    } else {
      alert('퀴즈 데이터가 없습니다.');
      navigate('/category-quiz');
    }
  }, [location.state, navigate]);

  const handleSelect = (aIdx) => {
    if (submitted) return;
    const tmp = [...answers];
    tmp[current] = aIdx;
    setAnswers(tmp);
  };

  const handleNext = () => {
    if (current < quizData.length - 1) setCurrent(current + 1);
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // 점수 계산
    let cnt = 0;
    const wrongAnswers = [];
    quizData.forEach((q, i) => {
      // 두 가지 데이터 구조 모두 지원
      const correctAnswer = q?.answer !== undefined ? q.answer : q?.correct;
      if (answers[i] === correctAnswer) {
        cnt++;
      } else {
        wrongAnswers.push(i);
      }
    });
    
    setScore(cnt);
    setSubmitted(true);

    // 서버에 결과 전송
    setLoading(true);
    try {
      const result = await submitWeeklyQuizResultByCategory({
        user_id: user.user_id,
        score: cnt,
        wrong: wrongAnswers,
        testCount,
        category,
      });
      
      console.log('카테고리별 퀴즈 결과 저장 완료:', result);
    } catch (error) {
      console.error('퀴즈 결과 저장 실패:', error);
      alert('결과 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setAnswers(Array(quizData.length).fill(null));
    setCurrent(0);
    setSubmitted(false);
    setScore(0);
  };

  if (quizData.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>퀴즈를 불러오는 중...</div>
      </div>
    );
  }

  const currentQ = quizData[current];

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontWeight: 900, fontSize: 28, marginBottom: 16, color: '#667eea' }}>
              카테고리별 퀴즈 완료! 🎉
            </h2>
            
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              <strong>카테고리:</strong> {category}
            </div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>
              <strong>테스트 횟수:</strong> {testCount}회차
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: score >= 7 ? '#28a745' : score >= 5 ? '#ffc107' : '#dc3545', marginBottom: 24 }}>
              점수: {score}/{quizData.length}
            </div>
            
            <div style={{ marginBottom: 24 }}>
              {score >= 8 && <div style={{ fontSize: 18, color: '#28a745' }}>🌟 훌륭합니다!</div>}
              {score >= 6 && score < 8 && <div style={{ fontSize: 18, color: '#ffc107' }}>👍 잘했습니다!</div>}
              {score < 6 && <div style={{ fontSize: 18, color: '#dc3545' }}>💪 더 열심히 공부해보세요!</div>}
            </div>

            {loading && (
              <div style={{ marginBottom: 24, color: '#666' }}>
                결과를 저장하는 중...
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleRestart}
                style={{ 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: 10, 
                  border: '1px solid #667eea', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  background: 'transparent', 
                  color: '#667eea' 
                }}
              >
                다시 풀기
              </button>
              <button 
                onClick={() => navigate('/category-quiz')}
                style={{ 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: 10, 
                  border: 'none', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  background: 'var(--accent-gradient)', 
                  color: '#fff' 
                }}
              >
                카테고리 퀴즈 홈
              </button>
              <button 
                onClick={() => navigate('/dashboard/progress')}
                style={{ 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: 10, 
                  border: 'none', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  background: '#28a745', 
                  color: '#fff' 
                }}
              >
                진행률 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '1rem' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontWeight: 900, fontSize: 24, color: '#667eea' }}>
              카테고리: {category}
            </h2>
            <div style={{ fontSize: 16, color: '#666' }}>
              {testCount}회차
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              문제 {current + 1} / {quizData.length}
            </div>
            <div style={{ width: 200, height: 8, background: '#f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ 
                width: `${((current + 1) / quizData.length) * 100}%`, 
                height: '100%', 
                background: 'var(--accent-gradient)', 
                transition: 'width 0.3s ease' 
              }}></div>
            </div>
          </div>
        </div>

        {/* 문제 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.5rem', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, lineHeight: 1.5 }}>
            {currentQ?.q || currentQ?.question || '문제를 불러오는 중...'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(currentQ?.a || currentQ?.choices)?.map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={{
                  padding: '1rem',
                  borderRadius: 12,
                  border: answers[current] === idx ? '2px solid #667eea' : '1px solid var(--card-border)',
                  background: answers[current] === idx ? '#f8f9ff' : 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 16,
                  transition: 'all 0.2s ease',
                  color: answers[current] === idx ? '#667eea' : '#333'
                }}
              >
                <span style={{ fontWeight: 700, marginRight: 12 }}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                {choice}
              </button>
            ))}
          </div>
        </div>

        {/* 네비게이션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={handlePrev}
            disabled={current === 0}
            style={{ 
              padding: '0.8rem 1.5rem', 
              borderRadius: 10, 
              border: '1px solid #667eea', 
              fontWeight: 700, 
              cursor: current === 0 ? 'not-allowed' : 'pointer', 
              background: 'transparent', 
              color: current === 0 ? '#ccc' : '#667eea',
              opacity: current === 0 ? 0.5 : 1
            }}
          >
            이전 문제
          </button>

          <div style={{ fontSize: 14, color: '#666' }}>
            답변: {answers.filter(a => a !== null).length} / {quizData.length}
          </div>

          {current === quizData.length - 1 ? (
            <button 
              onClick={handleSubmit}
              style={{ 
                padding: '0.8rem 1.5rem', 
                borderRadius: 10, 
                border: 'none', 
                fontWeight: 700, 
                cursor: 'pointer', 
                background: 'var(--accent-gradient)', 
                color: '#fff' 
              }}
            >
              제출하기
            </button>
          ) : (
            <button 
              onClick={handleNext}
              style={{ 
                padding: '0.8rem 1.5rem', 
                borderRadius: 10, 
                border: 'none', 
                fontWeight: 700, 
                cursor: 'pointer', 
                background: 'var(--accent-gradient)', 
                color: '#fff' 
              }}
            >
              다음 문제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoryQuizSolve;
