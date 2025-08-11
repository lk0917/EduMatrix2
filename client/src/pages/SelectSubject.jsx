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
      // 기본 영어 스킬
      { id: 'conversation', name: '회화', description: '실생활/비즈니스 회화', icon: '🗣️' },
      { id: 'grammar', name: '문법', description: '영문법 핵심', icon: '📚' },
      { id: 'vocab', name: '단어', description: '어휘력 향상', icon: '📝' },
      { id: 'listening', name: '리스닝', description: '듣기 실력 향상', icon: '👂' },
      { id: 'reading', name: '리딩', description: '독해 능력 향상', icon: '📖' },
      { id: 'writing', name: '라이팅', description: '영작문 실력', icon: '✍️' },
      
      // 시험 영어
      { id: 'toeic', name: 'TOEIC', description: '토익 시험 준비', icon: '📊' },
      { id: 'toefl', name: 'TOEFL', description: '토플 시험 준비', icon: '🎓' },
      { id: 'ielts', name: 'IELTS', description: '아이엘츠 시험 준비', icon: '🌍' },
      { id: 'opic', name: 'OPIc', description: '오픽 시험 준비', icon: '🎤' },
      { id: 'teps', name: 'TEPS', description: '텝스 시험 준비', icon: '📋' },
      
      // 특화 영어
      { id: 'business', name: '비즈니스 영어', description: '업무용 영어', icon: '💼' },
      { id: 'academic', name: '학술 영어', description: '학문적 영어', icon: '🎓' },
      { id: 'literature', name: '영문학', description: '영어 문학 작품', icon: '📚' },
      { id: 'presentation', name: '프레젠테이션', description: '영어 발표 스킬', icon: '🎤' }
    ],
    coding: [
      // 웹 개발
      { id: 'javascript', name: 'JavaScript', description: '웹/프론트엔드 JS', icon: '✨' },
      { id: 'typescript', name: 'TypeScript', description: '타입 안전한 JS', icon: '🔷' },
      { id: 'react', name: 'React', description: '리액트 프레임워크', icon: '⚛️' },
      { id: 'vue', name: 'Vue.js', description: '뷰 프레임워크', icon: '💚' },
      { id: 'html', name: 'HTML', description: '웹의 뼈대, HTML', icon: '🌐' },
      { id: 'css', name: 'CSS', description: '웹 스타일링', icon: '🎨' },
      { id: 'nodejs', name: 'Node.js', description: '서버사이드 JS', icon: '🟢' },
      { id: 'express', name: 'Express.js', description: 'Node.js 웹 프레임워크', icon: '🚀' },
      
      // 프로그래밍 언어
      { id: 'python', name: 'Python', description: 'Python 기초/활용', icon: '🐍' },
      { id: 'java', name: 'Java', description: '자바 프로그래밍', icon: '☕' },
      { id: 'c', name: 'C/C++', description: '시스템 프로그래밍', icon: '⚙️' },
      { id: 'csharp', name: 'C#', description: '마이크로소프트 언어', icon: '🔷' },
      { id: 'go', name: 'Go', description: '구글의 시스템 언어', icon: '🔵' },
      { id: 'rust', name: 'Rust', description: '메모리 안전 언어', icon: '🦀' },
      { id: 'php', name: 'PHP', description: '웹 서버 언어', icon: '🐘' },
      { id: 'ruby', name: 'Ruby', description: '루비 프로그래밍', icon: '💎' },
      
      // 프레임워크 & 라이브러리
      { id: 'django', name: 'Django', description: 'Python 웹 프레임워크', icon: '🎯' },
      { id: 'flask', name: 'Flask', description: 'Python 마이크로 프레임워크', icon: '🍶' },
      { id: 'spring', name: 'Spring Boot', description: '자바 스프링 프레임워크', icon: '🍃' },
      { id: 'laravel', name: 'Laravel', description: 'PHP 웹 프레임워크', icon: '🔥' },
      { id: 'rails', name: 'Ruby on Rails', description: '루비 웹 프레임워크', icon: '💎' },
      
      // 모바일 & 앱 개발
      { id: 'swift', name: 'Swift', description: 'iOS 앱 개발', icon: '🍎' },
      { id: 'kotlin', name: 'Kotlin', description: '안드로이드 개발', icon: '🟠' },
      { id: 'flutter', name: 'Flutter', description: '크로스플랫폼 앱', icon: '🦋' },
      { id: 'reactnative', name: 'React Native', description: '리액트 네이티브', icon: '📱' },
      
      // 데이터 & AI
      { id: 'pandas', name: 'Pandas', description: '데이터 분석 라이브러리', icon: '🐼' },
      { id: 'numpy', name: 'NumPy', description: '수치 계산 라이브러리', icon: '🔢' },
      { id: 'tensorflow', name: 'TensorFlow', description: '머신러닝 프레임워크', icon: '🧠' },
      { id: 'sql', name: 'SQL', description: '데이터베이스 쿼리', icon: '🗄️' },
      
      // 인프라 & 도구
      { id: 'aws', name: 'AWS', description: '아마존 클라우드 서비스', icon: '☁️' },
      { id: 'docker', name: 'Docker', description: '컨테이너 기술', icon: '🐳' },
      { id: 'kubernetes', name: 'Kubernetes', description: '컨테이너 오케스트레이션', icon: '⚓' },
      { id: 'git', name: 'Git', description: '버전 관리 시스템', icon: '📝' },
      { id: 'linux', name: 'Linux', description: '리눅스 시스템 관리', icon: '🐧' }
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
                    level: selectedLevel,
                }
            });
        } catch (err) {
            console.error('분야/레벨 저장 실패', err);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    // 기존 사용자 필드 체크 로직 제거 - 새로운 학습 생성을 위해 항상 진행 가능하도록 함
    // useEffect(() => {
    //     if (!user) return;

    //     (async () => {
    //         try {
    //             const { data } = await axios.get('/api/users/user-fields', {
    //                 params: { user_id: user.user_id }
    //             });
    //             if (data.length > 0) {
    //                 navigate('/dashboard', { replace: true });
    //             }
    //         } catch (err) {
    //             console.error('user_fields 조회 실패', err);
    //         }
    //     })();
    // }, [user, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 32px rgba(102,126,234,0.10)', padding: '2.5rem 2rem', maxWidth: 800, width: '100%' }}>
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
                background: selectedSubject === subject.id ? 'var(--accent-gradient-soft)' : '#f8f9fa',
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
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: '1rem', 
              maxHeight: '400px', 
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {detailOptions[selectedSubject].map((detail) => (
                <div
                  key={detail.id}
                  onClick={() => handleDetailSelect(detail.id)}
                  style={{
                    padding: '1rem 0.8rem',
                    border: selectedDetail === detail.id ? '3px solid #764ba2' : '1.5px solid #e0e7ff',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: selectedDetail === detail.id ? 'var(--accent-gradient-soft)' : '#f8f9fa',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 14,
                    color: selectedDetail === detail.id ? '#333' : '#555',
                    boxShadow: selectedDetail === detail.id ? '0 2px 12px #764ba222' : 'none',
                    position: 'relative',
                    minHeight: '100px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{detail.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{detail.name}</div>
                  <div style={{ color: '#888', fontSize: 11, lineHeight: '1.2' }}>{detail.description}</div>
                  {selectedDetail === detail.id && <div style={{ position: 'absolute', top: 6, right: 8, color: '#764ba2', fontSize: 14 }}>✓</div>}
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
              background: selectedSubject && selectedDetail && selectedLevel ? 'var(--accent-gradient)' : '#ccc',
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
