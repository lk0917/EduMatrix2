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
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [selectedDatePlans, setSelectedDatePlans] = useState([]);
  const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            const user = JSON.parse(localStorage.getItem("edumatrix_user"));
            if (!user?.user_id) return;
            try {
                const res = await axios.get(`/api/calendar/${user.user_id}`);
                // 새로운 API 응답 구조에 맞게 수정
                const { groupedPlans } = res.data;
                setPlanData(groupedPlans || {});
            } catch (err) {
                console.error("캘린더 불러오기 실패:", err);
            }
        };
        fetchPlans();
    }, []);

  // 오늘 날짜 (로컬 기준)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 날짜 클릭 시 모달 오픈 및 해당 날짜의 일정들 표시
  const handleCalendarClick = (date) => {
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(ymd);
    setSelectedDatePlans(planData[ymd] || []);
    // 새 일정 추가를 위해 초기화
    setEditGoal('');
    setEditTopic('');
    setEditDescription('');
    setEditField('기타');
    setEditingPlanId(null);
    setEditOpen(true);
  };

  // 기존 일정 편집
  const handleEditPlan = (plan) => {
    setEditGoal(plan.goal);
    setEditTopic(plan.topic);
    setEditDescription(plan.description);
    setEditField(plan.field);
    setEditingPlanId(plan._id);
  };

  // 새 일정 추가
  const handleAddNewPlan = () => {
    setEditGoal('');
    setEditTopic('');
    setEditDescription('');
    setEditField('기타');
    setEditingPlanId(null);
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
            if (editingPlanId) {
                // 기존 일정 수정
                await axios.put(`/api/calendar/${editingPlanId}`, {
                    goal: editGoal,
                    topic: editTopic,
                    description: editDescription,
                    field: editField
                });
                
                // 로컬 상태 업데이트
                setPlanData(prev => ({
                    ...prev,
                    [selectedDate]: prev[selectedDate].map(plan => 
                        plan._id === editingPlanId 
                            ? { ...plan, goal: editGoal, topic: editTopic, description: editDescription, field: editField }
                            : plan
                    )
                }));
                
                setSelectedDatePlans(prev => 
                    prev.map(plan => 
                        plan._id === editingPlanId 
                            ? { ...plan, goal: editGoal, topic: editTopic, description: editDescription, field: editField }
                            : plan
                    )
                );
            } else {
                // 새 일정 추가
                const res = await axios.post("/api/calendar", payload);
                const newPlan = res.data;
                
                setPlanData(prev => ({
                    ...prev,
                    [selectedDate]: [...(prev[selectedDate] || []), newPlan]
                }));
                
                setSelectedDatePlans(prev => [...prev, newPlan]);
            }
            
            // 폼 초기화
            setEditGoal('');
            setEditTopic('');
            setEditDescription('');
            setEditField('기타');
            setEditingPlanId(null);
        } catch (err) {
            console.error("일정 저장 실패:", err);
        }
    };
  // 계획 삭제
    const handlePlanDelete = async (planId) => {
        try {
            await axios.delete(`/api/calendar/${planId}`);
            
            // 로컬 상태에서 해당 일정 제거
            setPlanData(prev => ({
                ...prev,
                [selectedDate]: prev[selectedDate].filter(plan => plan._id !== planId)
            }));
            
            setSelectedDatePlans(prev => prev.filter(plan => plan._id !== planId));
            
            // 폼 초기화
            setEditGoal('');
            setEditTopic('');
            setEditDescription('');
            setEditField('기타');
            setEditingPlanId(null);
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
          <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 10, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1.5px' }}>
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
                 const dayPlans = planData[ymd];
                 
                 if (dayPlans && dayPlans.length > 0) {
                   return (
                     <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                       {dayPlans.slice(0, 3).map((plan, index) => {
                         const color = fieldColors[plan.field] || '#667eea';
                         const displayText = plan.topic || plan.goal;
                         return (
                           <span
                             key={plan._id}
                             style={{
                               display: 'inline-block',
                               background: color,
                               color: '#fff',
                               borderRadius: 6,
                               padding: '1px 6px',
                               fontSize: 10,
                               fontWeight: 600,
                               maxWidth: 70,
                               overflow: 'hidden',
                               textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap',
                               boxShadow: '0 1px 3px #0001',
                               letterSpacing: '-0.3px',
                               transition: 'background 0.18s',
                             }}
                             title={`주제: ${plan.topic || plan.goal}\n목표: ${plan.goal}\n설명: ${plan.description || '설명 없음'}\n분야: ${plan.field}`}
                           >
                             {displayText}
                           </span>
                         );
                       })}
                       {dayPlans.length > 3 && (
                         <span
                           style={{
                             fontSize: 9,
                             color: '#666',
                             fontWeight: 600,
                             textAlign: 'center',
                             marginTop: 1
                           }}
                         >
                           +{dayPlans.length - 3}개 더
                         </span>
                       )}
                     </div>
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
          {/* 기존 일정 목록 */}
          {selectedDatePlans.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 18, color: 'var(--color-primary)' }}>
                기존 일정 ({selectedDatePlans.length}개)
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--card-border)', borderRadius: 8, padding: 8 }}>
                {selectedDatePlans.map((plan) => (
                  <div key={plan._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    marginBottom: 8,
                    background: 'var(--input-bg)',
                    borderRadius: 8,
                    border: editingPlanId === plan._id ? '2px solid var(--color-primary)' : '1px solid var(--card-border)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-primary)' }}>
                        {plan.topic || plan.goal}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text)', marginTop: 2 }}>
                        {plan.field} • {plan.goal}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleEditPlan(plan)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: 'none',
                          background: 'var(--color-primary)',
                          color: 'white',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handlePlanDelete(plan._id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: 'none',
                          background: '#e74c3c',
                          color: 'white',
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 일정 편집/추가 폼 */}
          <div style={{ border: '2px solid var(--color-primary)', borderRadius: 12, padding: 16, background: 'var(--accent-gradient-soft)' }}>
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16, color: 'var(--color-primary)' }}>
              {editingPlanId ? '일정 편집' : '새 일정 추가'}
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 15, color: 'var(--color-primary)' }}>주제</label>
              <input type="text" value={editTopic} onChange={e => setEditTopic(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid var(--card-border)', fontSize: 15, background: 'var(--input-bg)' }} />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 15, color: 'var(--color-primary)' }}>목표</label>
              <input type="text" value={editGoal} onChange={e => setEditGoal(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid var(--card-border)', fontSize: 15, background: 'var(--input-bg)' }} />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 15, color: 'var(--color-primary)' }}>설명</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid var(--card-border)', fontSize: 15, background: 'var(--input-bg)', minHeight: 60, resize: 'vertical' }} />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 15, color: 'var(--color-primary)' }}>분야</label>
              <select value={editField} onChange={e => setEditField(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid var(--card-border)', fontSize: 15, background: 'var(--input-bg)' }}>
                {분야목록.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handlePlanSave} 
                style={{ 
                  flex: 1, 
                  padding: 12, 
                  borderRadius: 8, 
                  background: 'var(--accent-gradient)', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: 14, 
                  cursor: 'pointer'
                }}
              >
                {editingPlanId ? '수정' : '추가'}
              </button>
              {editingPlanId && (
                <button 
                  onClick={handleAddNewPlan} 
                  style={{ 
                    flex: 1, 
                    padding: 12, 
                    borderRadius: 8, 
                    background: 'var(--color-secondary)', 
                    color: 'var(--color-primary)', 
                    border: 'none', 
                    fontWeight: 'bold', 
                    fontSize: 14, 
                    cursor: 'pointer'
                  }}
                >
                  새 일정
                </button>
              )}
            </div>
          </div>
        </ModalCard>
        {/* 오늘 계획 강조 (있으면) */}
        {planData[todayStr] && planData[todayStr].length > 0 && (
          <div style={{ marginTop: 32, background: 'var(--accent-gradient-soft)', borderRadius: 16, boxShadow: '0 1px 8px var(--card-shadow)', padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-primary)', fontSize: 18 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              오늘의 계획 ({planData[todayStr].length}개)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {planData[todayStr].map((plan, index) => (
                <div key={plan._id} style={{ 
                  background: 'var(--card-bg)', 
                  borderRadius: 8, 
                  padding: '8px 12px',
                  border: '1px solid var(--card-border)',
                  fontSize: 14
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                    {plan.topic || plan.goal}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text)', marginTop: 2 }}>
                    {plan.field} • {plan.goal}
                  </div>
                  {plan.description && (
                    <div style={{ fontSize: 12, color: 'var(--color-text)', marginTop: 4, fontWeight: 400 }}>
                      {plan.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
          min-width: 90px;
          min-height: 100px;
          font-size: 1.08em;
          border-radius: 14px;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s, border 0.18s;
          background: #fff !important;
          color: #222;
          border: 1.5px solid #e0e7ff;
          box-shadow: 0 1px 4px #e0e7ff22;
          padding: 0.5em 0.2em 0.3em 0.2em;
          display: flex;
          flex-direction: column;
          align-items: center;
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