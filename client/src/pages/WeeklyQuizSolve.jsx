import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { submitWeeklyQuizResult } from '../services/quizService';

const quizColors = [
  '#667eea', '#764ba2', '#4caf50', '#ff9800', '#e74c3c',
  '#00bcd4', '#fbc02d', '#8e44ad', '#009688', '#e67e22'
];

function WeeklyQuizSolve() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testCount, setTestCount] = useState(1);
  const [savingResult, setSavingResult] = useState(false);

  useEffect(() => {
    if (location.state && location.state.quizData) {
      setQuizData(location.state.quizData);
      setTestCount(location.state.testCount || 1);
      setAnswers(Array(location.state.quizData.length).fill(null));
      setLoading(false);
    } else {
      // 퀴즈 데이터가 없으면 메인 페이지로 리다이렉트
      navigate('/weekly-quiz');
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

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    let cnt = 0;
    quizData.forEach((q, i) => {
      // 서버와 클라이언트 모두 0부터 시작하는 인덱스 사용
      if (answers[i] === q?.answer) cnt++;
    });
    setScore(cnt);
    setSubmitted(true);
  };

  const handleFinish = async () => {
    if (!user?.user_id) {
      alert('로그인 정보가 없어 저장할 수 없습니다.');
      return;
    }

    setSavingResult(true);

    try {
      const wrongNumbers = quizData
        .map((q, idx) => (answers[idx] !== q?.answer ? idx + 1 : null))
        .filter((n) => n !== null);

      // 퀴즈 결과를 서버로 전송
      const result = await submitWeeklyQuizResult({
        user_id: user.user_id,
        score,
        wrong: wrongNumbers,
        testCount: Number(testCount),
      });

      if (result?.success) {
        console.log('퀴즈 결과 저장 성공');
        // 바로 대시보드로 이동
        navigate('/dashboard', {
          state: {
            quizCompleted: true,
            score,
            totalQuestions: quizData.length,
            testCount: Number(testCount)
          }
        });
      } else {
        throw new Error(result?.error || '퀴즈 결과 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('퀴즈 결과 저장 실패:', err);
      const msg = err?.response?.data?.error || err?.message || '퀴즈 결과 저장에 실패했습니다.';
      alert(msg);
    } finally {
      setSavingResult(false);
    }
  };

  const progress = quizData.length > 0 ? (current / quizData.length) * 100 : 0;

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-main)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-main)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>퀴즈를 준비 중입니다...</h2>
          <p style={{ color: '#666', marginTop: '1rem' }}>잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (!quizData || quizData.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg-main)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--text-main)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>퀴즈 데이터를 불러올 수 없습니다.</h2>
          <button 
            onClick={() => navigate('/weekly-quiz')}
            style={{
              marginTop: '1rem',
              padding: '0.7rem 2rem',
              borderRadius: 8,
              background: 'var(--accent-gradient)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 520, margin: '2rem auto', background: 'var(--card-bg)', borderRadius: 20, boxShadow: '0 8px 32px var(--card-shadow)', padding: '2.5rem 2rem', position: 'relative' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 20, textAlign: 'center', marginBottom: 8, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            주간 퀴즈 {testCount}회차
          </div>
          <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${submitted ? 100 : progress}%`, height: '100%', background: 'var(--contrast-gradient)', transition: 'width 0.4s' }} />
          </div>
          <div style={{ textAlign: 'right', color: '#888', fontSize: 13 }}>
            {submitted ? '완료' : `문제 ${current + 1} / ${quizData.length}`}
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: `linear-gradient(90deg, ${quizColors[current % quizColors.length]}11 0%, var(--card-bg) 100%)`,
              borderRadius: 16,
              boxShadow: '0 2px 8px #eee',
              padding: '2rem 1.2rem',
              marginBottom: 32,
              minHeight: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 18, color: '#333', textAlign: 'center' }}>
                {current + 1}. {quizData[current]?.q || '문제를 불러오는 중...'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 340 }}>
                {quizData[current]?.a?.map((opt, aIdx) => (
                  <button
                    type="button"
                    key={aIdx}
                    style={{
                      padding: '0.9rem 1.2rem',
                      borderRadius: 10,
                      border: answers[current] === aIdx ? '2.5px solid #111' : '1.5px solid #ccc',
                      background: answers[current] === aIdx ? 'var(--contrast-gradient)' : 'var(--card-bg)',
                      color: answers[current] === aIdx ? '#fff' : '#111',
                      fontWeight: answers[current] === aIdx ? 700 : 500,
                      fontSize: 16,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxShadow: answers[current] === aIdx ? '0 2px 8px #1112' : 'none',
                    }}
                    onClick={() => handleSelect(aIdx)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#888', fontSize: 14 }}>문제 {current + 1} / {quizData.length}</div>
              {current < quizData.length - 1 ? (
                <button
                  type="button"
                  style={{
                    padding: '0.7rem 2.2rem',
                    fontSize: '1.1rem',
                    borderRadius: 8,
                    background: answers[current] !== null ? 'var(--accent-gradient)' : '#ccc',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    opacity: answers[current] !== null ? 1 : 0.5,
                    cursor: answers[current] !== null ? 'pointer' : 'not-allowed',
                    boxShadow: answers[current] !== null ? '0 2px 8px #1112' : 'none'
                  }}
                  onClick={handleNext}
                  disabled={answers[current] === null}
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  style={{
                    padding: '0.7rem 2.2rem',
                    fontSize: '1.1rem',
                    borderRadius: 8,
                    background: answers[current] !== null ? 'var(--accent-gradient)' : '#ccc',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    opacity: answers[current] !== null ? 1 : 0.5,
                    cursor: answers[current] !== null ? 'pointer' : 'not-allowed',
                    boxShadow: answers[current] !== null ? '0 2px 8px #1112' : 'none'
                  }}
                  disabled={answers[current] === null}
                >
                  제출하기
                </button>
              )}
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <div style={{
              background: 'var(--accent-gradient)',
              color: '#111',
              borderRadius: 16,
              padding: '2rem 1.5rem',
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 24,
              boxShadow: '0 4px 16px #1112',
              letterSpacing: 1
            }}>
              점수: {score} / {quizData.length}
            </div>
            <div style={{ margin: '2rem 0', textAlign: 'left', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              {quizData.map((q, idx) => (
                <div key={idx} style={{
                  marginBottom: 14,
                  padding: '1rem',
                  borderRadius: 10,
                  background: answers[idx] === q?.answer ? '#e3fcec' : '#ffeaea',
                  color: answers[idx] === q?.answer ? '#2e7d32' : '#c62828',
                  fontWeight: 500,
                  boxShadow: '0 1px 4px #eee'
                }}>
                  <span style={{ fontWeight: 700, color: '#333' }}>{idx + 1}. {q?.q || '문제 없음'}</span>
                  <span style={{ marginLeft: 8 }}>
                    {answers[idx] === q?.answer ? '정답!' : `오답, 정답: ${q?.a?.[q?.answer] || '알 수 없음'}`}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 24, padding: '1rem', background: '#f8f9fa', borderRadius: 10, color: '#666' }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                📊 상세한 학습 분석과 피드백은 <strong>주간 최종 평가</strong>에서 확인할 수 있습니다.
              </p>
            </div>
            <button 
              type="button" 
              onClick={handleFinish}
              disabled={savingResult}
              style={{ 
                padding: '0.7rem 2.2rem', 
                fontSize: '1.1rem', 
                borderRadius: 8, 
                background: savingResult ? '#ccc' : 'var(--accent-gradient)', 
                color: 'white', 
                border: 'none', 
                fontWeight: 600, 
                boxShadow: savingResult ? 'none' : '0 2px 8px #1112',
                cursor: savingResult ? 'not-allowed' : 'pointer'
              }}
            >
              {savingResult ? '저장 중...' : '결과 저장하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WeeklyQuizSolve;
