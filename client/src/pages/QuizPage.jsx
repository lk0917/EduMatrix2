import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import axios from 'axios';

const quizData = {
  english: [
    { q: 'What is the capital of England?', a: ['London', 'Paris', 'Berlin', 'Rome'], answer: 0 },
    { q: 'Choose the correct past tense: "go"', a: ['goed', 'went', 'goes', 'gone'], answer: 1 },
    { q: 'Which is a fruit?', a: ['Car', 'Apple', 'Chair', 'Book'], answer: 1 },
    { q: 'Fill in: I ___ a book yesterday.', a: ['read', 'reads', 'reading', 'rode'], answer: 0 },
    { q: 'What is the opposite of "hot"?', a: ['cold', 'warm', 'cool', 'heat'], answer: 0 },
    { q: 'Which is a verb?', a: ['run', 'red', 'rabbit', 'road'], answer: 0 },
    { q: 'How do you say "감사합니다" in English?', a: ['Sorry', 'Hello', 'Thank you', 'Goodbye'], answer: 2 },
    { q: 'Which is a color?', a: ['Blue', 'Dog', 'Eat', 'Fast'], answer: 0 },
    { q: 'Choose the correct article: ___ apple', a: ['a', 'an', 'the', 'no article'], answer: 1 },
    { q: 'What is "cat" in Korean?', a: ['강아지', '고양이', '사자', '호랑이'], answer: 1 },
  ],
  coding: [
    { q: 'JavaScript에서 변수 선언 키워드는?', a: ['var', 'let', 'const', '모두 정답'], answer: 3 },
    { q: 'Python에서 리스트의 길이를 구하는 함수는?', a: ['size()', 'length()', 'len()', 'count()'], answer: 2 },
    { q: 'HTML에서 링크를 만드는 태그는?', a: ['<a>', '<link>', '<href>', '<url>'], answer: 0 },
    { q: 'CSS에서 글자색을 지정하는 속성은?', a: ['font-size', 'color', 'background', 'text-align'], answer: 1 },
    { q: 'JavaScript에서 함수 선언은?', a: ['function foo() {}', 'func foo() {}', 'def foo() {}', 'lambda foo:'], answer: 0 },
    { q: 'Python에서 주석은?', a: ['//', '#', '--', '/* */'], answer: 1 },
    { q: 'React에서 상태 관리는?', a: ['useState', 'useEffect', 'useRef', 'useMemo'], answer: 0 },
    { q: '코딩에서 반복문이 아닌 것은?', a: ['for', 'while', 'if', 'do-while'], answer: 2 },
    { q: 'HTML에서 가장 큰 제목 태그는?', a: ['<h1>', '<h6>', '<title>', '<header>'], answer: 0 },
    { q: 'Python에서 딕셔너리의 키-값 쌍은?', a: ['[]', '{}', '()', '<>'], answer: 1 },
  ]
};

const detailLabel = {
  conversation: '회화',
  grammar: '문법',
  vocab: '단어',
  python: '파이썬',
  javascript: '자바스크립트',
  html: 'HTML'
};

const quizColors = [
  '#667eea', '#764ba2', '#4caf50', '#ff9800', '#e74c3c', '#00bcd4', '#fbc02d', '#8e44ad', '#009688', '#e67e22'
];

function QuizPage() {
  const { user } = useUser(); 
  const location = useLocation();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('english');
  const [detail, setDetail] = useState('');
  const [level, setLevel] = useState('');
  const [answers, setAnswers] = useState(Array(10).fill(null));
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);


    useEffect(() => {
        if (location.state?.subject) setSubject(location.state.subject);
        if (location.state?.detail) setDetail(location.state.detail);
        if (location.state?.level) setLevel(location.state.level);
    }, [location.state]);

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
        quizData[subject].forEach((q, i) => {
            if (answers[i] === q.answer) cnt++;
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
        if (!user) {
            alert('로그인 정보가 없어 저장할 수 없습니다.');
            return;
        }

        try {
            await axios.post('/api/quiz/save-quiz-result', {
                user_id: user.user_id,
                subject,
                detail,
                level,
                score
            });
            console.log('퀴즈 결과 저장 성공');
        } catch (err) {
            console.error('퀴즈 결과 저장 실패', err);
        }

        navigate('/plan', { state: { subject, detail, level, score } });
    };


  // 진행률 계산
  const progress = ((current) / 10) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 520, margin: '2rem auto', background: 'var(--card-bg)', borderRadius: 20, boxShadow: '0 8px 32px var(--card-shadow)', padding: '2.5rem 2rem', position: 'relative', color: 'var(--text-main)' }}>
        {/* 진행 바 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 20, textAlign: 'center', marginBottom: 8, background: 'linear-gradient(90deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            수준 체크 ({subject === 'english' ? '영어' : '코딩'})
            {detail && <span style={{ fontWeight: 500, fontSize: 16, color: '#111', marginLeft: 10 }}>/ {detailLabel[detail]}</span>}
          </div>
          <div style={{ height: 10, background: '#eee', borderRadius: 6, overflow: 'hidden', margin: '0 0 8px 0' }}>
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
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 18, color: '#333', textAlign: 'center' }}>{current + 1}. {quizData[subject][current].q}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 340 }}>
                {quizData[subject][current].a.map((opt, aIdx) => (
                  <button
                    type="button"
                    key={aIdx}
                    className={`quiz-option${answers[current] === aIdx ? ' selected' : ''}`}
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
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#888', fontSize: 14 }}>문제 {current + 1} / 10</div>
              {current < 9 ? (
                <button
                  type="button"
                  className="submit-btn"
                  style={{ padding: '0.7rem 2.2rem', fontSize: '1.1rem', borderRadius: 8, background: answers[current] !== null ? 'linear-gradient(90deg,#667eea,#764ba2)' : '#ccc', color: 'white', border: 'none', fontWeight: 600, opacity: answers[current] !== null ? 1 : 0.5, cursor: answers[current] !== null ? 'pointer' : 'not-allowed', boxShadow: answers[current] !== null ? '0 2px 8px #1112' : 'none' }}
                  onClick={handleNext}
                  disabled={answers[current] === null}
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  className="submit-btn"
                  style={{ padding: '0.7rem 2.2rem', fontSize: '1.1rem', borderRadius: 8, background: answers[current] !== null ? 'linear-gradient(90deg,#667eea,#764ba2)' : '#ccc', color: 'white', border: 'none', fontWeight: 600, opacity: answers[current] !== null ? 1 : 0.5, cursor: answers[current] !== null ? 'pointer' : 'not-allowed', boxShadow: answers[current] !== null ? '0 2px 8px #1112' : 'none' }}
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
              letterSpacing: 1,
            }}>
              점수: {score} / 10
            </div>
            <div style={{ margin: '2rem 0', textAlign: 'left', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              {quizData[subject].map((q, idx) => (
                <div key={idx} style={{ marginBottom: 14, padding: '1rem', borderRadius: 10, background: answers[idx] === q.answer ? '#e3fcec' : '#ffeaea', color: answers[idx] === q.answer ? '#2e7d32' : '#c62828', fontWeight: 500, boxShadow: '0 1px 4px #eee' }}>
                  <span style={{ fontWeight: 700, color: '#333' }}>{idx + 1}. {q.q}</span>
                  <span style={{ marginLeft: 8 }}>
                    {answers[idx] === q.answer ? '정답!' : `오답, 정답: ${q.a[q.answer]}`}
                  </span>
                </div>
              ))}
            </div>
            <button type="button" onClick={handleRestart} className="submit-btn" style={{ marginRight: 16, padding: '0.7rem 2.2rem', fontSize: '1.1rem', borderRadius: 8, background: '#fff', color: '#111', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px #1112' }}>
              다시 풀기
            </button>
            <button type="button" onClick={handleNextStep} className="submit-btn" style={{ padding: '0.7rem 2.2rem', fontSize: '1.1rem', borderRadius: 8, background: '#fff', color: '#111', border: 'none', fontWeight: 600, boxShadow: '0 2px 8px #1112' }}>
              다음 단계로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPage;
