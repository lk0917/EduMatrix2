import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';

const quizColors = [
  '#667eea', '#764ba2', '#4caf50', '#ff9800', '#e74c3c',
  '#00bcd4', '#fbc02d', '#8e44ad', '#009688', '#e67e22'
];

function QuizPage() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [detail, setDetail] = useState('');
  const [level, setLevel] = useState('');
  const [quizData, setQuizData] = useState([]);
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [threadId, setThreadId] = useState(null);
  const isRequesting = useRef(false);
  const [savingResult, setSavingResult] = useState(false);

  useEffect(() => {
    console.log('QuizPage useEffect 실행:', { 
      hasLocationState: !!location.state, 
      loading, 
      user: !!user,
      isRequesting: isRequesting.current
    });
    
    if (location.state && user && !isRequesting.current) {
      const {
        subject,
        detail,
        level,
        목표,
        시작일,
        종료일,
        분야
      } = location.state;

      console.log('퀴즈 생성 시작:', { subject, detail, level, 목표, 시작일, 종료일, 분야 });

      setSubject(subject);
      setDetail(detail);
      setLevel(level);

      const fetchQuiz = async () => {
        if (isRequesting.current) {
          console.log('이미 요청 중이므로 중단');
          return;
        }
        
        isRequesting.current = true;
        try {
          console.log('퀴즈 생성 요청 전송...');
          const { data } = await axios.post('/api/ai/make-quiz', {
            user_id: user.user_id,
            subject,
            detail,
            level,
            goal: 목표,
            start_date: 시작일,
            end_date: 종료일,
            field: 분야
          });

          console.log('퀴즈 생성 응답 받음:', data);

          if (data.success) {
            setQuizData(data.quizData);
            setThreadId(data.thread_id);
          } else {
            throw new Error(data.error || '퀴즈 생성에 실패했습니다.');
          }
          setLoading(false);
        } catch (err) {
          console.error('퀴즈 로딩 실패', err);
          alert('퀴즈를 불러오는 데 실패했습니다.');
          setLoading(false);
        } finally {
          isRequesting.current = false;
        }
      };

      fetchQuiz();
    }
  }, [location.state, user]); // threadId 의존성 제거

  const handleSelect = (aIdx) => {
    if (submitted) return;
    const tmp = [...answers];
    tmp[current] = aIdx;
    setAnswers(tmp);
  };

  const handleNext = () => {
    if (current < 9) setCurrent(current + 1);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    let cnt = 0;
    quizData.forEach((q, i) => {
      if (answers[i] === q?.answer) cnt++;
    });
    setScore(cnt);
    setSubmitted(true);
  };

  const handleRestart = () => {
    setAnswers(Array(10).fill(null));
    setCurrent(0);
    setSubmitted(false);
    setScore(0);
  };

  const handleNextStep = async () => {
    const {
      subject,
      detail,
      level,
      목표,
      시작일,
      종료일,
      분야
    } = location.state;

    if (!user) {
      alert('로그인 정보가 없어 저장할 수 없습니다.');
      return;
    }

    setSavingResult(true);

    try {
      // 퀴즈 결과를 서버로 전송
      const wrongTopics = quizData
        .map((q, idx) => (answers[idx] !== q?.answer ? q?.q : null))
        .filter(Boolean);

      const response = await axios.post('/api/ai/save-quiz-result', {
        user_id: user.user_id,
        subject,
        detail,
        level,
        goal: 목표,
        start_date: 시작일,
        end_date: 종료일,
        field: 분야,
        score,
        wrong_topics: wrongTopics,
        quiz_data: quizData,
        answers
      });

      console.log('퀴즈 결과 저장 성공', response.data);

      // 성공적으로 저장된 경우에만 다음 페이지로 이동
      if (response.data.success) {
        navigate('/plan', {
          state: {
            subject,
            detail,
            목표,
            기간: `${시작일} ~ ${종료일}`,
            level,
            score,
            틀린문제: quizData
              .map((q, idx) => (answers[idx] !== q?.answer ? q?.q : null))
              .filter(Boolean),
            calendarPlan: response.data.calendarPlan // 생성된 캘린더 계획도 함께 전달
          }
        });
      } else {
        throw new Error('퀴즈 결과 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('퀴즈 결과 저장 실패', err);
      alert('퀴즈 결과 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSavingResult(false);
    }
  };

  const progress = (current / 10) * 100;

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>문제를 생성 중입니다...</h2>
        <p style={{ color: '#666', marginTop: '1rem' }}>AI가 맞춤형 문제를 만들고 있습니다.</p>
      </div>
    );
  }

  if (!quizData || quizData.length === 0) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>문제를 불러올 수 없습니다.</h2>
        <p style={{ color: '#666', marginTop: '1rem' }}>페이지를 새로고침해주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 520, margin: '2rem auto', background: 'var(--card-bg)', borderRadius: 20, boxShadow: '0 8px 32px var(--card-shadow)', padding: '2.5rem 2rem', position: 'relative', color: 'var(--text-main)' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 20, textAlign: 'center', marginBottom: 8, background: 'linear-gradient(90deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            수준 체크
            {detail && <span style={{ fontWeight: 500, fontSize: 16, color: '#111', marginLeft: 10 }}>/ {detail}</span>}
          </div>
          <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${submitted ? 100 : progress}%`, height: '100%', background: 'linear-gradient(90deg,#222,#111)', transition: 'width 0.4s' }} />
          </div>
          <div style={{ textAlign: 'right', color: '#888', fontSize: 13 }}>{submitted ? '완료' : `문제 ${current + 1} / 10`}</div>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: `linear-gradient(90deg, ${quizColors[current % quizColors.length]}11 0%, #fff 100%)`,
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
                      background: answers[current] === aIdx ? 'linear-gradient(90deg,#222,#111)' : '#fff',
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
                )) || (
                  <div style={{ textAlign: 'center', color: '#666' }}>
                    선택지를 불러오는 중...
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#888', fontSize: 14 }}>문제 {current + 1} / 10</div>
              {current < 9 ? (
                <button
                  type="button"
                  style={{
                    padding: '0.7rem 2.2rem',
                    fontSize: '1.1rem',
                    borderRadius: 8,
                    background: answers[current] !== null ? 'linear-gradient(90deg,#667eea,#764ba2)' : '#ccc',
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
                    background: answers[current] !== null ? 'linear-gradient(90deg,#667eea,#764ba2)' : '#ccc',
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
              background: 'linear-gradient(90deg,#667eea,#764ba2)',
              color: '#111',
              borderRadius: 16,
              padding: '2rem 1.5rem',
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 24,
              boxShadow: '0 4px 16px #1112',
              letterSpacing: 1
            }}>
              점수: {score} / 10
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
            <button type="button" onClick={handleRestart} style={{ marginRight: 16, padding: '0.7rem 2.2rem', fontSize: '1.1rem', borderRadius: 8, background: '#fff', color: '#111', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px #1112' }} disabled={savingResult}>
              다시 풀기
            </button>
            <button type="button" onClick={handleNextStep} style={{ padding: '0.7rem 2.2rem', fontSize: '1.1rem', borderRadius: 8, background: savingResult ? '#ccc' : '#fff', color: '#111', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px #1112', opacity: savingResult ? 0.5 : 1, cursor: savingResult ? 'not-allowed' : 'pointer' }} disabled={savingResult}>
              {savingResult ? '생성 중...' : '다음 단계로'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPage;
