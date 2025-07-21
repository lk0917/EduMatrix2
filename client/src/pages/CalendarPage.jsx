import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaRegCalendarCheck, FaBookOpen, FaPlusCircle } from 'react-icons/fa';
import axios from "axios";

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

const 분야목록 = ['JS','Python','Clang','English(Voca)','English(Grammar)','기타'];

function CalendarPage() {
  const [planData, setPlanData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editGoal, setEditGoal] = useState('');
  const [editField, setEditField] = useState('JS');

    useEffect(() => {
        const fetchPlans = async () => {
            const user = JSON.parse(localStorage.getItem("edumatrix_user"));
            if (!user?.user_id) return;
            try {
                const res = await axios.get(`/api/calendar/${user.user_id}`);
                const data = res.data.reduce((acc, { date, goal, field, _id }) => {
                    acc[date] = { 목표: goal, 분야: field, id: _id };
                    return acc;
                }, {});
                setPlanData(data);
            } catch (err) {
                console.error("캘린더 불러오기 실패:", err);
            }
        };
        fetchPlans();
    }, []);

  // 오늘 날짜
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 날짜 클릭 시 모달 오픈 및 기존 데이터 세팅
  const handleCalendarClick = (date) => {
    const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(ymd);
    setEditGoal(planData[ymd]?.목표 || '');
    setEditField(planData[ymd]?.분야 || 'JS');
    setEditOpen(true);
  };
  // 계획 저장
    const handlePlanSave = async () => {
        const user = JSON.parse(localStorage.getItem("edumatrix_user"));
        const payload = {
            user_id: user.user_id,
            date: selectedDate,
            goal: editGoal,
            field: editField
        };
        try {
            if (planData[selectedDate]?.id) {
                await axios.put(`/api/calendar/${planData[selectedDate].id}`, {
                    goal: editGoal,
                    field: editField
                });
            } else {
                const res = await axios.post("/api/calendar", payload);
                payload.id = res.data._id;
            }
            setPlanData(prev => ({
                ...prev,
                [selectedDate]: { 목표: editGoal, 분야: editField, id: payload.id }
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

  return (
   <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', color: 'var(--text-main)' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 36, boxShadow: '0 16px 64px var(--card-shadow)', padding: '3.5rem 2.5rem', maxWidth: 1200, width: '100%' }}>
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
                const ymd = date.toISOString().slice(0, 10);
                if (planData[ymd]) {
                  return (
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center' }}>
                      <span style={{ background: 'var(--color-primary)', color: 'var(--color-bg)', borderRadius: 10, padding: '2px 10px', fontSize: 17, fontWeight: 700, boxShadow: '0 1px 4px var(--card-shadow)' }}>
                        {planData[ymd].목표}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
              tileClassName={({ date, view }) => {
                const ymd = date.toISOString().slice(0, 10);
                if (ymd === todayStr) return 'calendar-today-highlight';
                return '';
              }}
              style={{ width: '100%', height: '100%', minWidth: 800, minHeight: 600, fontSize: 24, borderRadius: 32, border: '3px solid var(--card-border)', background: 'var(--input-bg)', padding: 40, boxShadow: '0 4px 24px var(--card-shadow)', flexGrow: 1 }}
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
            <label style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 17, color: 'var(--color-primary)' }}>목표</label>
            <input type="text" value={editGoal} onChange={e => setEditGoal(e.target.value)} style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid var(--card-border)', fontSize: 17, background: 'var(--input-bg)' }} />
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
            오늘의 계획: <span style={{ color: 'var(--color-primary)' }}>{planData[todayStr].목표}</span> <span style={{ color: 'var(--color-text)', fontWeight: 500, fontSize: 15 }}>({planData[todayStr].분야})</span>
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
          background: var(--card-bg) !important;
          color: var(--color-text) !important;
        }
        .custom-big-calendar .react-calendar__viewContainer,
        .custom-big-calendar .react-calendar__month-view {
          width: 100% !important;
          min-width: 800px !important;
          min-height: 600px !important;
          background: var(--card-bg) !important;
        }
        .custom-big-calendar .react-calendar__navigation {
          margin-bottom: 18px;
        }
        .custom-big-calendar .react-calendar__navigation button {
          font-size: 1.4em;
          font-weight: 700;
          color: var(--color-primary);
          background: none;
          border-radius: 10px;
          margin: 0 2px;
          transition: background 0.18s;
        }
        .custom-big-calendar .react-calendar__navigation button:enabled:hover {
          background: var(--color-secondary);
        }
        .custom-big-calendar .react-calendar__month-view__weekdays {
          text-align: center;
          font-size: 1.2em;
          color: var(--color-primary);
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .custom-big-calendar .react-calendar__tile {
          min-width: 80px;
          min-height: 80px;
          font-size: 1.15em;
          border-radius: 16px;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
          background: var(--card-bg);
          color: var(--color-text);
        }
        .custom-big-calendar .react-calendar__tile:enabled:hover {
          background: var(--color-secondary);
          color: var(--color-primary);
          box-shadow: 0 2px 8px var(--card-shadow);
        }
        .custom-big-calendar .react-calendar__tile--active {
          background: linear-gradient(90deg, var(--color-primary), var(--color-secondary)) !important;
          color: var(--color-bg) !important;
          font-weight: 900;
          box-shadow: 0 2px 12px var(--card-shadow);
        }
        .calendar-today-highlight abbr {
          background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
          color: var(--color-bg) !important;
          border-radius: 50%;
          padding: 0.2em 0.6em;
          font-weight: 900;
          font-size: 1.08em;
        }
      `}</style>
    </div>
  );
}

export default CalendarPage; 