import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

function SelectSubject() {
    const navigate = useNavigate();
    const { user } = useUser();  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDetail, setSelectedDetail] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const subjects = [
    { id: 'english', name: '영어', description: '기초부터 비즈니스 영어까지', icon: '🇬🇧' },
    { id: 'coding', name: '코딩', description: 'Python, JavaScript, Java 등', icon: '💻' }
  ];

  const detailOptions = {
    english: [
      { id: 'conversation', name: '회화', description: '실생활/비즈니스 회화', icon: '🗣️' },
      { id: 'grammar', name: '문법', description: '영문법 핵심', icon: '📚' },
      { id: 'vocab', name: '단어', description: '어휘력 향상', icon: '📝' }
    ],
    coding: [
      { id: 'python', name: '파이썬', description: 'Python 기초/활용', icon: '🐍' },
      { id: 'javascript', name: '자바스크립트', description: '웹/프론트엔드 JS', icon: '✨' },
      { id: 'html', name: 'HTML', description: '웹의 뼈대, HTML', icon: '🌐' }
    ]
  };

  const levelOptions = [
    { id: 'beginner', name: '비기너', desc: '처음 시작해요', color: '#b3c6ff' },
    { id: 'intermediate', name: '인터미디엇', desc: '기본은 알아요', color: '#a7ffeb' },
    { id: 'advanced', name: '어드밴스드', desc: '꽤 자신있어요', color: '#ffe082' },
    { id: 'professional', name: '프로페셔널', desc: '전문가예요', color: '#ffab91' }
  ];

  const handleSubjectSelect = (subjectId) => {
    setSelectedSubject(subjectId);
    setSelectedDetail('');
    setSelectedLevel('');
  };

  const handleDetailSelect = (detailId) => {
    setSelectedDetail(detailId);
    setSelectedLevel('');
  };

  const handleLevelSelect = (levelId) => {
    setSelectedLevel(levelId);
  };

    const handleContinue = async () => {
        if (!(selectedSubject && selectedDetail && selectedLevel)) {
            return alert('분야, 세부 분야, 수준을 모두 선택해주세요!');
        }

        try {
            await axios.post('/api/users/save-user-fields', {
                user_id: user.user_id,
                selections: [
                    {
                        field: `${selectedSubject}.${selectedDetail}`,
                        level: selectedLevel
                    }
                ]
            }, { withCredentials: true }
            );

            navigate('/plan-input', {
                state: {
                    subject: selectedSubject,
                    detail: selectedDetail,
                    level: selectedLevel
                }
            });
        } catch (err) {
            console.error('분야/레벨 저장 실패', err);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        if (!user) return;

        (async () => {
            try {
                const { data } = await axios.get('/api/user-fields', {
                    params: { user_id: user.user_id }
                });
                if (data.length > 0) {
                    navigate('/dashboard', { replace: true });
                }
            } catch (err) {
                console.error('user_fields 조회 실패', err);
            }
        })();
    }, [user, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 32px rgba(102,126,234,0.10)', padding: '2.5rem 2rem', maxWidth: 520, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, background: '#111', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            학습 분야 선택
          </div>
          <div style={{ color: '#666', fontSize: 16 }}>
            관심 있는 분야와 세부 분야, 그리고 자신의 수준을 선택해 주세요.
          </div>
        </div>
        {/* 1차 분야 선택 */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: 36 }}>
          {subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => handleSubjectSelect(subject.id)}
              style={{
                padding: '1.7rem 1.2rem',
                border: selectedSubject === subject.id ? '3px solid #667eea' : '1.5px solid #e0e7ff',
                borderRadius: '16px',
                cursor: 'pointer',
                background: selectedSubject === subject.id ? 'linear-gradient(90deg,#eef2ff,#e0e7ff)' : '#f8f9fa',
                transition: 'all 0.2s',
                minWidth: 120,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: 20,
                boxShadow: selectedSubject === subject.id ? '0 2px 12px #667eea22' : 'none',
                color: selectedSubject === subject.id ? '#333' : '#555',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{subject.icon}</div>
              {subject.name}
              <div style={{ color: '#888', fontSize: 14, marginTop: 8 }}>{subject.description}</div>
              {selectedSubject === subject.id && <div style={{ position: 'absolute', top: 10, right: 16, color: '#667eea', fontSize: 18 }}>✓</div>}
            </div>
          ))}
        </div>
        {/* 2차 세부 분야 선택 */}
        {selectedSubject && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#764ba2', textAlign: 'center' }}>
              세부 분야 선택
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
              {detailOptions[selectedSubject].map((detail) => (
                <div
                  key={detail.id}
                  onClick={() => handleDetailSelect(detail.id)}
                  style={{
                    padding: '1.2rem',
                    border: selectedDetail === detail.id ? '3px solid #764ba2' : '1.5px solid #e0e7ff',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    background: selectedDetail === detail.id ? 'linear-gradient(90deg,#f3e8ff,#ede9fe)' : '#f8f9fa',
                    transition: 'all 0.2s',
                    minWidth: 100,
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 16,
                    color: selectedDetail === detail.id ? '#333' : '#555',
                    boxShadow: selectedDetail === detail.id ? '0 2px 12px #764ba222' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{detail.icon}</div>
                  {detail.name}
                  <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>{detail.description}</div>
                  {selectedDetail === detail.id && <div style={{ position: 'absolute', top: 8, right: 14, color: '#764ba2', fontSize: 16 }}>✓</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 3차 수준 선택 */}
        {selectedDetail && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#2196f3', textAlign: 'center' }}>
              자신의 수준을 선택하세요
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
              {levelOptions.map((level) => (
                <div
                  key={level.id}
                  onClick={() => handleLevelSelect(level.id)}
                  style={{
                    padding: '1.1rem 1.2rem',
                    border: selectedLevel === level.id ? '3px solid #2196f3' : '1.5px solid #e0e7ff',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    background: selectedLevel === level.id ? level.color : '#f8f9fa',
                    transition: 'all 0.2s',
                    minWidth: 100,
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 16,
                    color: selectedLevel === level.id ? '#333' : '#555',
                    boxShadow: selectedLevel === level.id ? '0 2px 12px #2196f322' : 'none',
                    position: 'relative'
                  }}
                >
                  {level.name}
                  <div style={{ color: '#888', fontSize: 13, marginTop: 6 }}>{level.desc}</div>
                  {selectedLevel === level.id && <div style={{ position: 'absolute', top: 8, right: 14, color: '#2196f3', fontSize: 16 }}>✓</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleContinue}
            disabled={!(selectedSubject && selectedDetail && selectedLevel)}
            style={{
              padding: '1rem 2.5rem',
              background: selectedSubject && selectedDetail && selectedLevel ? 'linear-gradient(90deg,#667eea,#764ba2)' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: selectedSubject && selectedDetail && selectedLevel ? 'pointer' : 'not-allowed',
              opacity: selectedSubject && selectedDetail && selectedLevel ? 1 : 0.6,
              boxShadow: selectedSubject && selectedDetail && selectedLevel ? '0 2px 8px #667eea33' : 'none',
              transition: 'all 0.2s'
            }}
          >
            계속하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectSubject;
