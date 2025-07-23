import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import AIChatBot from '../components/AIChatBot';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';

function ModalCard({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(40,40,60,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 18, boxShadow: '0 8px 32px #667eea33', padding: '2.2rem 2rem', minWidth: 340, maxWidth: 480, width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>✕</button>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18, color: '#667eea' }}>{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function useCardAnimation() {
  const [pressed, setPressed] = useState(false);
  const handlePress = (cb) => {
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      cb();
    }, 150);
  };
  return [pressed, handlePress];
}

function Dashboard() {
  const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const chatbotRef = useRef(null);

  const [progress, setProgress] = useState(null);

  // Card click animation states
  const [progressPressed, handleProgressPress] = useCardAnimation();
  const [calendarPressed, handleCalendarPress] = useCardAnimation();
  const [recommendPressed, handleRecommendPress] = useCardAnimation();
  const [weeklyPressed, handleWeeklyPress] = useCardAnimation();
  const [notePressed, handleNotePress] = useCardAnimation();
  const [quizPressed, handleQuizPress] = useCardAnimation();

  // Study plan states (sample)
  const [editOpen, setEditOpen] = useState(false);
  const [editGoal, setEditGoal] = useState('');
  const [editField, setEditField] = useState('JS');

  // Plan save handler
  const handlePlanSave = () => {
    setEditOpen(false);
  };

  useEffect(() => {
    const fetchProgress = async () => {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) return;
      try {
        const res = await axios.get(`/api/progress/${user_id}`);
        setProgress(res.data);
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      }
    };
    fetchProgress();
  }, []);

  useEffect(() => {
    if (!chatbotOpen) return;
    function handleClick(e) {
      if (chatbotRef.current && !chatbotRef.current.contains(e.target)) {
        setChatbotOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [chatbotOpen]);

  const handleOverlayClick = () => {
    setSidebarOpen(false);
    setChatbotOpen(false);
  };


  const [calendarPlans, setCalendarPlans] = useState([]);
  //캘린더연동
  useEffect(() => {
  const fetchCalendarPlans = async () => {
    const user = JSON.parse(localStorage.getItem("edumatrix_user"));
    if (!user?.user_id) return;
    try {
      const res = await axios.get(`/api/calendar/${user.user_id}`);
      setCalendarPlans(res.data);
    } catch (err) {
      console.error("캘린더 데이터 조회 실패:", err);
    }
  };
  fetchCalendarPlans();
}, []);

const getWeeklySummary = () => {
  const today = new Date();
  const thisMonday = new Date(today);
  const day = thisMonday.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; 
  thisMonday.setDate(thisMonday.getDate() + diffToMonday);

    const weekdayNames = ['일', '월', '화', '수', '목', '금', '토'];


  return calendarPlans
    .filter(p => {
      const date = parseLocalDate(p.date)
      return date >= thisMonday && date < new Date(thisMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
    })
   .map(p => {
  const date = parseLocalDate(p.date);
  return {
    day: weekdayNames[date.getDay()],
    field: p.field
  };
});
};

  // Card style function (applying theme variables)
  const cardStyle = (color, pressed) => ({
    background: 'var(--card-bg)',
    borderRadius: 22,
    boxShadow: pressed
      ? `0 4px 24px var(--card-shadow), 0 2px 12px var(--card-shadow)`
      : '0 4px 18px var(--card-shadow)',
    border: '1.5px solid var(--card-border)',
    padding: '2.2rem 2rem',
    minHeight: 160,
    cursor: 'pointer',
    transition: 'box-shadow 0.38s cubic-bezier(.7,.2,.2,1), transform 0.22s cubic-bezier(.7,.2,.2,1), background 0.25s',
    transform: pressed ? 'scale(0.97)' : 'scale(1)',
    outline: 'none',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  });

  // Card hover style
  const [hovered, setHovered] = useState('');
  const getHoverStyle = (key, color) =>
    hovered === key
      ? {
          boxShadow: `0 10px 36px var(--card-shadow), 0 4px 18px var(--card-shadow)` ,
          background: 'var(--card-bg)',
          transform: 'scale(1.03)',
        }
      : {};

  // Sidebar menu items (컬러풀한 아이콘)
  const sidebarMenu = [
    { label: '대시보드 홈', path: '/dashboard', icon: <span style={{fontSize:22,color:'#667eea'}}>🏠</span> },
    { label: '설정/마이페이지', path: '/dashboard/studyroom', icon: <span style={{fontSize:22,color:'#43a047'}}>⚙️</span> },
    { label: '스터디 노트', path: '/dashboard/note', icon: <span style={{fontSize:22,color:'#4caf50'}}>📝</span> },
    { label: '주간 평가', path: '/dashboard/weekly', icon: <span style={{fontSize:22,color:'#ff9800'}}>🏆</span> },
    { label: '진행률', path: '/dashboard/progress', icon: <span style={{fontSize:22,color:'#1976d2'}}>📈</span> },
    { label: '캘린더', path: '/dashboard/calendar', icon: <span style={{fontSize:22,color:'#764ba2'}}>🗓️</span> },
    { label: '추천 학습', path: '/dashboard/recommend', icon: <span style={{fontSize:22,color:'#2196f3'}}>🌟</span> },
    { label: '퀴즈', path: '/dashboard/quiz', icon: <span style={{fontSize:22,color:'#e74c3c'}}>❓</span> },
  ];

  return (
    <div>
      <DashboardNavbar
        onSidebarToggle={() => setSidebarOpen(v => !v)}
        onChatbotToggle={() => setChatbotOpen(v => !v)}
      />
      {/* Overlay (dimmed) */}
      {(sidebarOpen || chatbotOpen) && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(40,40,60,0.18)', zIndex: 1199,
            opacity: (sidebarOpen || chatbotOpen) ? 1 : 0,
            transition: 'opacity 0.45s cubic-bezier(.7,.2,.2,1)',
          }}
        />
      )}
      {/* Sidebar Overlay (UI 개선) */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 2000,
        width: '90vw', maxWidth: 340, minWidth: 220,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-120%)',
        opacity: sidebarOpen ? 1 : 0.5,
        boxShadow: sidebarOpen ? '12px 0 40px 0 #667eea33, 0 0 0 100vw rgba(40,40,60,0.10)' : 'none',
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px) saturate(1.2)',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'transform 0.55s cubic-bezier(.7,.2,.2,1), opacity 0.45s cubic-bezier(.7,.2,.2,1), box-shadow 0.3s',
        padding: sidebarOpen ? '2.5rem 1.5rem 2.2rem 1.5rem' : '2rem 0',
        pointerEvents: sidebarOpen ? 'auto' : 'none',
        display: 'flex', flexDirection: 'column',
        borderTopRightRadius: 28, borderBottomRightRadius: 28,
        minWidth: 220,
      }} className="sidebar-fancy">
        {/* 상단 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 32, fontWeight: 900, fontSize: 24, color: '#667eea', letterSpacing: -1, textShadow: '0 2px 12px #667eea22', userSelect: 'none' }}>
          <span style={{ fontSize: 32, color: '#667eea', filter: 'drop-shadow(0 2px 8px #b3bcf533)' }}>📚</span>
          EduMatrix
        </div>
        <button onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 26, color: '#888', cursor: 'pointer', fontWeight: 700, transition: 'color 0.18s' }} onMouseEnter={e=>e.currentTarget.style.color='#667eea'} onMouseLeave={e=>e.currentTarget.style.color='#888'}>✕</button>
        <div style={{ fontWeight: 800, fontSize: 19, color: '#667eea', marginBottom: 16, opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s 0.1s', letterSpacing: '-0.5px' }}>메뉴</div>
        <hr style={{ border: 'none', borderTop: '1.5px solid #e0e7ff', margin: '0 0 18px 0', boxShadow: '0 1px 4px #e0e7ff33' }} />
        <ul style={{ listStyle: 'none', padding: 0, fontSize: 17, color: '#333', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s 0.1s', flex: 1, marginBottom: 18 }}>
          {sidebarMenu.map((item, idx) => (
            <li key={item.path}
              style={{
                marginBottom: 10,
                cursor: 'pointer',
                borderRadius: 12,
                padding: '0.85rem 1.2rem',
                transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                border: 'none',
                display: 'flex', alignItems: 'center', gap: 15,
                fontWeight: 700,
                fontSize: 17,
                background: window.location.pathname === item.path ? 'linear-gradient(90deg,#a5b4fc,#c7d2fe 80%)' : 'none',
                color: window.location.pathname === item.path ? '#4338ca' : '#333',
                boxShadow: window.location.pathname === item.path ? '0 2px 12px #a5b4fc44' : 'none',
                borderLeft: window.location.pathname === item.path ? '5px solid #667eea' : '5px solid transparent',
              }}
              onClick={() => {navigate(item.path); setSidebarOpen(false);}}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(90deg,#e0e7ff,#c7d2fe 80%)'; e.currentTarget.style.color = '#4338ca'; e.currentTarget.style.boxShadow = '0 2px 12px #a5b4fc44'; }}
              onMouseLeave={e => { if(window.location.pathname !== item.path) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#333'; e.currentTarget.style.boxShadow = 'none'; } }}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>
        <hr style={{ border: 'none', borderTop: '1.5px solid #e0e7ff', margin: '0 0 18px 0', boxShadow: '0 1px 4px #e0e7ff33' }} />
        {/* 하단 사용자 정보/로그아웃 (예시) */}
        <div style={{ marginTop: 'auto', padding: '0.7rem 0 0.2rem 0', textAlign: 'center', color: '#888', fontSize: 15, fontWeight: 600, letterSpacing: '-0.5px' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 18, marginRight: 6 }}>👤</span> 사용자님
          </div>
          <button style={{ background: 'none', border: 'none', color: '#e74c3c', fontWeight: 700, fontSize: 15, cursor: 'pointer', padding: 0, marginTop: 2 }} onClick={()=>{localStorage.clear(); window.location.href='/login';}}>로그아웃</button>
        </div>
        {/* 사이드바 스크롤바 스타일 */}
        <style>{`
          @media (max-width: 600px) {
            .sidebar-fancy {
              width: 100vw !important;
              min-width: 0 !important;
              max-width: 100vw !important;
              border-radius: 0 !important;
              left: 0 !important;
            }
          }
          .sidebar-fancy::-webkit-scrollbar {
            width: 8px;
          }
          .sidebar-fancy::-webkit-scrollbar-thumb {
            background: #e0e7ff;
            border-radius: 6px;
          }
          .sidebar-fancy::-webkit-scrollbar-track {
            background: transparent;
          }
        `}</style>
      </div>
      {/* AI Chatbot Overlay (smooth animation, close on outside click) */}
      <div style={{
        position: 'fixed', bottom: 0, right: 0, width: 380, maxWidth: '95vw', height: 540,
        zIndex: 1300, display: 'flex', flexDirection: 'column',
        pointerEvents: chatbotOpen ? 'auto' : 'none',
        opacity: chatbotOpen ? 1 : 0,
        transform: chatbotOpen ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.98)',
        boxShadow: chatbotOpen ? '-2px 0 24px var(--color-secondary)' : 'none',
        transition: 'opacity 0.5s cubic-bezier(.7,.2,.2,1), transform 0.6s cubic-bezier(.7,.2,.2,1), box-shadow 0.3s',
      }}>
        <div ref={chatbotRef} style={{
          background: 'var(--color-secondary)', boxShadow: '-2px 0 16px var(--color-secondary)', borderTopLeftRadius: 18, borderTopRightRadius: 18, border: '2px solid var(--color-primary)', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', width: '100%',
        }}>
          <button onClick={() => setChatbotOpen(false)} style={{ position: 'absolute', top: 12, right: 18, background: 'none', border: 'none', fontSize: 22, color: 'var(--color-text)', cursor: 'pointer', zIndex: 2 }}>✕</button>
          <AIChatBot />
        </div>
      </div>
      {/* Dashboard Body (padding equal to navbar height) */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        paddingTop: 90,
        paddingBottom: 40,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 36,
        color: 'var(--color-text)'
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {/* Learning Progress */}
          <div
            style={{ ...cardStyle('#667eea', progressPressed), ...getHoverStyle('progress', '#667eea'), minHeight: 200 }}
            onMouseEnter={() => setHovered('progress')}
            onMouseLeave={() => setHovered('')}
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleProgressPress(() => navigate('/dashboard/progress'))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28, color: '#667eea' }}>📈</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#667eea' }}>학습 진행률</span>
            </div>
            <div style={{ fontSize: 16, marginBottom: 10 }}>이번 주 목표 달성률</div>
            <div style={{ width: '100%', height: 18, background: '#f0f0f0', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{  width: `${progress?.total || 0}%`, height: '100%', background: 'linear-gradient(90deg,#667eea,#764ba2)', transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontWeight: 700, color: '#333', fontSize: 16, marginBottom: 10 }}>{progress?.total || 0}% 달성<span style={{ color: '#4caf50', fontWeight: 600, fontSize: 14, marginLeft: 8 }}>+5% ↑</span></div>
            {/* Subject-wise mini progress */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            {(progress?.subject_stats || []).map((item) => (
            <div key={item.name} style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
            <div style={{ width: '100%', height: 8, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ width: `${item.percent}%`, height: '100%', background: item.color, transition: 'width 0.4s' }} />
            </div>
            <div style={{ fontSize: 12, color: item.color, fontWeight: 700 }}>{item.percent}%</div>
            </div>
            ))}
          </div>
            <div style={{ fontSize: 13, color: 'var(--color-text)', marginTop: 2 }}>
              목표 대비 실제 학습량: <b>{progress?.total || 0}%</b> / 예상 달성일: <b>{progress?.expected_date || '-'}</b>
            </div>
          </div>
          {/* Learning Plan Calendar */}
          <div
            style={{ ...cardStyle('#764ba2', calendarPressed), ...getHoverStyle('calendar', '#764ba2'), minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--card-bg)', boxShadow: '0 4px 18px #b39ddb22' }}
            onMouseEnter={() => setHovered('calendar')}
            onMouseLeave={() => setHovered('')}
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleCalendarPress(() => navigate('/dashboard/calendar'))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 28, color: '#764ba2' }}>🗓️</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#764ba2' }}>학습 계획 캘린더</span>
            </div>
            <div style={{ width: '100%', textAlign: 'center', marginBottom: 8, color: 'var(--color-text)', fontSize: 15 }}>
              이번 주 계획 요약
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', width: '100%' }}>
            {getWeeklySummary().map((item, idx) => (
            <div key={idx} style={{ background: 'var(--card-bg)', borderRadius: 10, boxShadow: '0 1px 4px #e0c3fc33', padding: '0.7rem 1.1rem', minWidth: 60, textAlign: 'center', fontWeight: 700, color: '#764ba2', fontSize: 15 }}>
            <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>{item.day}</div>
            <div>{item.field}</div>
            </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--color-text)' }}>
              클릭 시 전체 캘린더로 이동
            </div>
          </div>
          {/* Plan Edit Modal */}
          <ModalCard open={editOpen} onClose={() => setEditOpen(false)} title={'학습 계획 수정'}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>목표</label>
              <input type="text" value={editGoal} onChange={e => setEditGoal(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #e0c3fc' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>분야</label>
              <select value={editField} onChange={e => setEditField(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #e0c3fc' }}>
                {['JS','Python','Clang','English(Voca)','English(Grammar)','기타'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <button onClick={handlePlanSave} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'linear-gradient(90deg,#8ec5fc,#e0c3fc)', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>저장</button>
          </ModalCard>
          {/* Recommended Learning List */}
          <div
            style={{ ...cardStyle('#2196f3', recommendPressed), ...getHoverStyle('recommend', '#2196f3') }}
            onMouseEnter={() => setHovered('recommend')}
            onMouseLeave={() => setHovered('')}
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleRecommendPress(() => navigate('/dashboard/recommend'))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28, color: '#2196f3' }}>🌟</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#2196f3' }}>추천 학습 목록</span>
            </div>
            <div style={{ display: 'flex', gap: 18 }}>
              {[
                { title: '파이썬 기초 문법', desc: '초보자를 위한 Python 입문 강의', icon: '🐍' },
                { title: '영어 회화 실전', desc: '실생활 영어 표현 익히기', icon: '🗣️' },
                { title: 'HTML/CSS 실습', desc: '웹 페이지 직접 만들어보기', icon: '🌐' }
              ].map((rec, idx) => (
                <div key={idx} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '1.2rem 1rem', minWidth: 120, flex: 1, textAlign: 'center', boxShadow: '0 1px 4px #eee' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{rec.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{rec.title}</div>
                  <div style={{ color: 'var(--color-text)', fontSize: 14, marginTop: 4 }}>{rec.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {/* Weekly Final Evaluation */}
          <div
            style={{ ...cardStyle('#ff9800', weeklyPressed), ...getHoverStyle('weekly', '#ff9800') }}
            onMouseEnter={() => setHovered('weekly')}
            onMouseLeave={() => setHovered('')}
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleWeeklyPress(() => navigate('/dashboard/weekly'))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28, color: '#ff9800' }}>🏆</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#ff9800' }}>주간 최종 평가</span>
            </div>
            <div style={{ fontSize: 16, marginBottom: 10 }}>이번 주 점수: <span style={{ fontWeight: 700, color: '#667eea' }}>7 / 10</span></div>
            <div style={{ color: 'var(--color-text)', fontSize: 15 }}>이번 주 꾸준히 학습했어요! 다음 주엔 실전 문제에 도전해보세요.</div>
          </div>
          {/* Study Note */}
          <div
            style={{ ...cardStyle('#4caf50', notePressed), ...getHoverStyle('note', '#4caf50') }}
            onMouseEnter={() => setHovered('note')}
            onMouseLeave={() => setHovered('')}
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleNotePress(() => navigate('/dashboard/note'))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28, color: '#4caf50' }}>📝</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#4caf50' }}>스터디 노트</span>
            </div>
            <textarea
              value={'오늘 배운 내용을 간단히 정리해보세요!'}
              readOnly
              style={{ width: '100%', minHeight: 80, borderRadius: 10, border: '1.5px solid #e0e7ff', padding: '1rem', fontSize: 15, resize: 'vertical', background: 'var(--card-bg)', color: 'var(--color-text)', fontWeight: 500 }}
              placeholder="오늘 배운 내용을 간단히 정리해보세요!"
            />
          </div>
          {/* Quiz Shortcut */}
          <div
            style={{ ...cardStyle('#e74c3c', quizPressed), ...getHoverStyle('quiz', '#e74c3c') }}
            onMouseEnter={() => setHovered('quiz')}
            onMouseLeave={() => setHovered('')}
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleQuizPress(() => navigate('/dashboard/quiz'))}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 28, color: '#e74c3c' }}>❓</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#e74c3c' }}>퀴즈 바로가기</span>
            </div>
            <div style={{ display: 'flex', gap: 18 }}>
              {[
                { title: '오늘의 퀴즈', desc: '영어 단어 10문제', icon: '❓' },
                { title: '코딩 로직 퀴즈', desc: '조건문/반복문 실전', icon: '💻' }
              ].map((quiz, idx) => (
                <div key={idx} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '1.2rem 1rem', minWidth: 120, flex: 1, textAlign: 'center', boxShadow: '0 1px 4px #eee' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{quiz.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{quiz.title}</div>
                  <div style={{ color: 'var(--color-text)', fontSize: 14, marginTop: 4 }}>{quiz.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;