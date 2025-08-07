import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaRegCalendarCheck, FaBookOpen, FaPlusCircle } from 'react-icons/fa';
import axios from "axios";
import { useNavigate } from 'react-router-dom';

function ModalCard({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--card-bg)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 22, boxShadow: '0 12px 48px var(--card-shadow)', padding: '2.5rem 2.2rem', minWidth: 340, maxWidth: 500, width: '95%', position: 'relative', border: '2.5px solid var(--card-border)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 24, color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        <div style={{ fontWeight: 900, fontSize: 23, marginBottom: 18, color: 'var(--color-primary)', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: 8  }}>
          <FaBookOpen style={{ color: 'var(--color-primary)', fontSize: 22 }} /> {title}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}



const 분야목록 = [
  // 코딩 분야
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Node.js', 'Express.js',
  'Python', 'Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'TensorFlow',
  'C', 'C++', 'C#', 'Java', 'Spring Boot', 'Kotlin',
  'Go', 'Rust', 'PHP', 'Laravel', 'Ruby', 'Rails',
  'Swift', 'Objective-C', 'Dart', 'Flutter', 'React Native',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'AWS', 'Docker', 'Kubernetes', 'Git', 'Linux',
  
  // 영어 분야
  'English(Vocabulary)', 'English(Grammar)', 'English(Listening)', 'English(Speaking)', 'English(Reading)', 'English(Writing)',
  'TOEIC', 'TOEFL', 'IELTS', 'OPIc', 'TEPS',
  'Business English', 'Academic English', 'Conversational English',
  'English Literature', 'English Essay', 'English Presentation',
  
  // 기타
  '기타'
];

function CalendarPage() {
  const [planData, setPlanData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editGoal, setEditGoal] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editField, setEditField] = useState('기타');
  const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            const user = JSON.parse(localStorage.getItem("edumatrix_user"));
            if (!user?.user_id) return;
            try {
                const res = await axios.get(`/api/calendar/${user.user_id}`);
                const data = res.data.reduce((acc, { date, goal, field, topic, description, _id }) => {
                    acc[date] = { 목표: goal, 분야: field, 주제: topic, 설명: description, id: _id };
                    return acc;
                }, {});
                setPlanData(data);
            } catch (err) {
                console.error("캘린더 불러오기 실패:", err);
            }
        };
        fetchPlans();
    }, []);

  // 오늘 날짜 (로컬 기준)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 날짜 클릭 시 모달 오픈 및 기존 데이터 세팅
  const handleCalendarClick = (date) => {
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(ymd);
    setEditGoal(planData[ymd]?.목표 || '');
    setEditTopic(planData[ymd]?.주제 || '');
    setEditDescription(planData[ymd]?.설명 || '');
    setEditField(planData[ymd]?.분야 || '기타');
    setEditOpen(true);
  };
  // 계획 저장
    const handlePlanSave = async () => {
        const user = JSON.parse(localStorage.getItem("edumatrix_user"));
        const payload = {
            user_id: user.user_id,
            date: selectedDate,
            goal: editGoal,
            topic: editTopic,
            description: editDescription,
            field: editField
        };
        try {
            if (planData[selectedDate]?.id) {
                await axios.put(`/api/calendar/${planData[selectedDate].id}`, {
                    goal: editGoal,
                    topic: editTopic,
                    description: editDescription,
                    field: editField
                });
            } else {
                const res = await axios.post("/api/calendar", payload);
                payload.id = res.data._id;
            }
            setPlanData(prev => ({
                ...prev,
                [selectedDate]: { 
                    목표: editGoal, 
                    분야: editField, 
                    주제: editTopic,
                    설명: editDescription,
                    id: payload.id 
                }
            }));
            setEditOpen(false);
        } catch (err) {
            console.error("일정 저장 실패:", err);
        }
    };
  // 계획 삭제
    const handlePlanDelete = async () => {
        try {
            const { id } = planData[selectedDate];
            await axios.delete(`/api/calendar/${id}`);
            setPlanData(prev => {
                const next = { ...prev };
                delete next[selectedDate];
                return next;
            });
            setEditOpen(false);
        } catch (err) {
            console.error("일정 삭제 실패:", err);
        }
    };

  // 분야별 컬러 매핑
  const fieldColors = {
    // JavaScript 계열
    'JavaScript': '#ffd600', 'TypeScript': '#3178c6', 'React': '#61dafb', 'Vue.js': '#4fc08d', 'Node.js': '#339933', 'Express.js': '#000000',
    
    // Python 계열
    'Python': '#3776ab', 'Django': '#092e20', 'Flask': '#000000', 'FastAPI': '#009688', 'Pandas': '#130654', 'NumPy': '#4dabcf', 'TensorFlow': '#ff6f00',
    
    // C/C++/Java 계열
    'C': '#a8b9cc', 'C++': '#00599c', 'C#': '#178600', 'Java': '#ed8b00', 'Spring Boot': '#6db33f', 'Kotlin': '#f18e33',
    
    // 기타 프로그래밍 언어
    'Go': '#00add8', 'Rust': '#ce422b', 'PHP': '#777bb4', 'Laravel': '#ff2d20', 'Ruby': '#cc342d', 'Rails': '#cc0000',
    
    // 모바일/앱 개발
    'Swift': '#ffac45', 'Objective-C': '#438eff', 'Dart': '#00b4ab', 'Flutter': '#02569b', 'React Native': '#61dafb',
    
    // 데이터베이스/인프라
    'SQL': '#e48e00', 'MySQL': '#4479a1', 'PostgreSQL': '#336791', 'MongoDB': '#47a248', 'Redis': '#dc382d',
    'AWS': '#ff9900', 'Docker': '#2496ed', 'Kubernetes': '#326ce5', 'Git': '#f05032', 'Linux': '#fcc624',
    
    // 영어 분야
    'English(Vocabulary)': '#ff9800', 'English(Grammar)': '#e91e63', 'English(Listening)': '#9c27b0', 'English(Speaking)': '#f44336', 'English(Reading)': '#2196f3', 'English(Writing)': '#4caf50',
    'TOEIC': '#ff5722', 'TOEFL': '#795548', 'IELTS': '#607d8b', 'OPIc': '#ff9800', 'TEPS': '#9e9e9e',
    'Business English': '#3f51b5', 'Academic English': '#673ab7', 'Conversational English': '#009688',
    'English Literature': '#8bc34a', 'English Essay': '#ffc107', 'English Presentation': '#ff5722',
    
    // 기본값
    '기타': '#9e9e9e',
  };

  return (
   <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', color: 'var(--text-main)' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 36, boxShadow: '0 16px 64px var(--card-shadow)', padding: '3.5rem 2.5rem', maxWidth: 1200, width: '100%' }}>
        {/* 뒤로가기 버튼 */}
        <button onClick={() => navigate(-1)} style={{ marginBottom: 18, background: 'none', border: '1.5px solid #1976d2', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#1976d2', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
        {/* 상단 일러스트/아이콘 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <FaRegCalendarCheck style={{ fontSize: 54, color: 'var(--color-primary)', marginBottom: 8 }} />
          <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 10, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1.5px' }}>
            학습 계획 캘린더
          </div>
          <div style={{ color: 'var(--color-text)', fontSize: 19, marginBottom: 8 }}>
            날짜를 클릭해 계획을 추가/수정/삭제할 수 있습니다.
          </div>
          <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
            오늘: {todayStr}
          </div>
        </div>
        {/* 카드형 섹션 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: 700, background: 'var(--card-bg)', borderRadius: 32, boxShadow: '0 2px 12px var(--card-shadow)', padding: '4rem 0', marginBottom: 18 }}>
          <div style={{ width: '100%', maxWidth: 1000, minHeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Calendar
              className="custom-big-calendar"
              locale="ko-KR"
              onClickDay={handleCalendarClick}
                             tileContent={({ date, view }) => {
                 const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                 if (planData[ymd]) {
                   const color = fieldColors[planData[ymd].분야] || '#667eea';
                   const displayText = planData[ymd].주제 || planData[ymd].목표;
                   return (
                     <span
                       style={{
                         display: 'inline-block',
                         marginTop: 6,
                         background: color,
                         color: '#fff',
                         borderRadius: 8,
                         padding: '2px 10px',
                         fontSize: 13,
                         fontWeight: 700,
                         minWidth: 0,
                         maxWidth: 80,
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap',
                         boxShadow: '0 1px 4px #0001',
                         letterSpacing: '-0.5px',
                         border: 'none',
                         transition: 'background 0.18s',
                       }}
                       title={`주제: ${planData[ymd].주제 || planData[ymd].목표}\n목표: ${planData[ymd].목표}\n설명: ${planData[ymd].설명 || '설명 없음'}\n분야: ${planData[ymd].분야}`}
                     >
                       {displayText}
                     </span>
                   );
                 }
                 return null;
               }}
              tileClassName={({ date, view }) => {
                const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                if (ymd === todayStr) return 'calendar-today-minimal';
                if (planData[ymd]) return 'calendar-has-plan-minimal';
                if (date.getDay() === 0 || date.getDay() === 6) return 'calendar-weekend';
                return '';
              }}
              tileDisabled={({ date }) => false}
              style={{ width: '100%', height: '100%', minWidth: 800, minHeight: 600, fontSize: 22, borderRadius: 28, border: '2px solid #e0e7ff', background: '#f8fafc', padding: 32, boxShadow: '0 2px 12px #e0e7ff33', flexGrow: 1 }}
              calendarType="gregory"
            />
          </div>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--color-text)', fontSize: 16, marginBottom: 8 }}>
          <FaPlusCircle style={{ color: 'var(--color-primary)', marginRight: 6, fontSize: 19, verticalAlign: '-2px' }} />
          날짜를 클릭해 계획을 추가하거나 수정하세요.
        </div>
                 <ModalCard open={editOpen} onClose={() => setEditOpen(false)} title={selectedDate + ' 학습 계획'}>
                       <div style={{ marginBottom: 22 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 17, color: 'var(--color-primary)' }}>주제</label>
              <input type="text" value={editTopic} onChange={e => setEditTopic(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid var(--card-border)', fontSize: 17, background: 'var(--input-bg)' }} />
            </div>
            
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 17, color: 'var(--color-primary)' }}>목표</label>
              <input type="text" value={editGoal} onChange={e => setEditGoal(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid var(--card-border)', fontSize: 17, background: 'var(--input-bg)' }} />
            </div>
            
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 17, color: 'var(--color-primary)' }}>설명</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid var(--card-border)', fontSize: 17, background: 'var(--input-bg)', minHeight: 80, resize: 'vertical' }} />
            </div>
            
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 17, color: 'var(--color-primary)' }}>분야</label>
              <select value={editField} onChange={e => setEditField(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid var(--card-border)', fontSize: 17, background: 'var(--input-bg)' }}>
                {분야목록.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handlePlanSave} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', color: 'var(--color-bg)', border: 'none', fontWeight: 'bold', fontSize: 18, marginTop: 8, boxShadow: '0 1px 4px var(--card-shadow)', letterSpacing: '-0.5px' }}>저장</button>
            {planData[selectedDate] && (
              <button onClick={handlePlanDelete} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'var(--color-secondary)', color: 'var(--color-danger, #e74c3c)', border: 'none', fontWeight: 'bold', fontSize: 18, marginTop: 8, letterSpacing: '-0.5px' }}>삭제</button>
            )}
          </div>
        </ModalCard>
        {/* 오늘 계획 강조 (있으면) */}
        {planData[todayStr] && (
          <div style={{ marginTop: 32, background: 'linear-gradient(90deg, var(--color-secondary), var(--color-primary), var(--color-secondary))', borderRadius: 16, boxShadow: '0 1px 8px var(--card-shadow)', padding: '1.2rem 1.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-primary)', fontSize: 18 }}>
            오늘의 계획: <span style={{ color: 'var(--color-primary)' }}>{planData[todayStr].주제 || planData[todayStr].목표}</span> <span style={{ color: 'var(--color-text)', fontWeight: 500, fontSize: 15 }}>({planData[todayStr].분야})</span>
            {planData[todayStr].설명 && (
              <div style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text)', fontWeight: 500 }}>
                {planData[todayStr].설명}
              </div>
            )}
          </div>
        )}
      </div>
      {/* 커스텀 캘린더 스타일 */}
      <style>{`
        .custom-big-calendar {
          font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
          width: 100% !important;
          height: 100% !important;
          min-width: 800px !important;
          min-height: 600px !important;
          background: #f8fafc !important;
          color: #222 !important;
        }
        .custom-big-calendar .react-calendar__viewContainer,
        .custom-big-calendar .react-calendar__month-view {
          width: 100% !important;
          min-width: 800px !important;
          min-height: 600px !important;
          background: #f8fafc !important;
        }
        .custom-big-calendar .react-calendar__navigation {
          margin-bottom: 12px;
          background: none;
          box-shadow: none;
        }
        .custom-big-calendar .react-calendar__navigation button {
          font-size: 1.15em;
          font-weight: 700;
          color: #667eea;
          background: none;
          border-radius: 8px;
          margin: 0 2px;
          border: none;
          padding: 6px 12px;
          transition: background 0.18s, color 0.18s;
        }
        .custom-big-calendar .react-calendar__navigation button:enabled:hover {
          background: #e0e7ff;
          color: #4338ca;
        }
        .custom-big-calendar .react-calendar__month-view__weekdays {
          text-align: center;
          font-size: 1.08em;
          color: #888;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .custom-big-calendar .react-calendar__tile {
          min-width: 80px;
          min-height: 80px;
          font-size: 1.08em;
          border-radius: 14px;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, border 0.18s;
          background: #fff !important;
          color: #222;
          border: 1.5px solid #e0e7ff;
          box-shadow: 0 1px 4px #e0e7ff22;
          padding: 0.7em 0.2em 0.5em 0.2em;
        }
        .custom-big-calendar .react-calendar__tile:enabled:hover {
          background: #f3f6fd !important;
          color: #4338ca !important;
          box-shadow: 0 4px 16px #a5b4fc22;
          border: 1.5px solid #a5b4fc;
          z-index: 2;
        }
        .custom-big-calendar .react-calendar__tile--active {
          background: #e0e7ff !important;
          color: #4338ca !important;
          font-weight: 900;
          box-shadow: 0 2px 8px #a5b4fc33;
          border: 1.5px solid #667eea;
        }
        .calendar-today-minimal abbr {
          border: 2.5px solid #1976d2;
          background: #fff;
          color: #1976d2 !important;
          border-radius: 50%;
          padding: 0.18em 0.55em;
          font-weight: 900;
          font-size: 1.08em;
          box-shadow: 0 2px 8px #a5b4fc22;
        }
        .calendar-has-plan-minimal {
          border: 1.5px solid #4caf50 !important;
          box-shadow: 0 2px 8px #4caf5022 !important;
        }
        .calendar-weekend {
          background: #f4f6f8 !important;
          color: #bbb !important;
        }
      `}</style>
    </div>
  );
}

export default CalendarPage; 