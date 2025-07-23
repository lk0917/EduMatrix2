import React, { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';


function NoteList() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [notes, setNotes] = useState([]);

useEffect(() => {
    const fetchNotes = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("edumatrix_user"));
            const user_id = user?.user_id;
            if (!user_id) return;

            const res = await axios.get(`/api/study-note/${user_id}`);
            setNotes(res.data);
        } catch (err) {
            console.error("노트 불러오기 실패:", err);
        }
    };
    fetchNotes();
}, []);

  // 'light' 또는 'gradient' 모드일 때 밝은 글씨 스타일 적용
  const isBrightMode = theme === 'light' || theme === 'gradient';
  // 카드 스타일 분기
  const getCardStyle = () => isBrightMode
    ? {
        background: 'linear-gradient(120deg,#f8f9fa 80%,#e3fcef 100%)',
        borderRadius: 18,
        boxShadow: '0 2px 12px #e0e0e033',
        padding: '1.5rem 1.4rem 1.2rem 1.4rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, transform 0.18s',
        border: '1.5px solid #e0e0e0',
        position: 'relative',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#222',
      }
    : {
        background: 'var(--card-bg)',
        borderRadius: 18,
        boxShadow: '0 2px 12px var(--card-shadow)',
        padding: '1.5rem 1.4rem 1.2rem 1.4rem',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, transform 0.18s',
        border: '1.5px solid var(--card-border)',
        position: 'relative',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
      };

  return (
    <div style={{ maxWidth: 1500, margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 28, boxShadow: '0 8px 32px var(--card-shadow)', padding: '2.5rem 2.2rem', minHeight: 500, color: 'var(--text-main)' }}>
      {/* 뒤로가기 버튼 */}
      <button onClick={() => navigate(-1)} style={{ marginBottom: 18, background: 'none', border: '1.5px solid #1976d2', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#1976d2', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h2 style={{ fontWeight: 900, fontSize: 32, color: '#388e3c', letterSpacing: -1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="note">📝</span> 스터디 노트
        </h2>
        <button onClick={() => navigate('/dashboard/note/new')} style={{ background: 'linear-gradient(90deg,#8ec5fc,#4caf50)', color: '#fff', border: 'none', borderRadius: 12, padding: '0.8rem 1.8rem', fontWeight: 800, fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 12px #8ec5fc33', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="plus">➕</span> 새 노트
        </button>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(700px, 1fr))',
        gap: 28,
        width: '100%'
      }}>
        {notes.map(note => (
          <div
            key={note._id}
            style={getCardStyle()}
            onClick={() => navigate(`/dashboard/note/${note._id}`)}
            onMouseOver={e => {
              if (theme === 'light') {
                e.currentTarget.style.boxShadow = '0 4px 24px #4caf5044';
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.025)';
              } else {
                e.currentTarget.style.boxShadow = '0 4px 24px var(--card-shadow)';
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.025)';
              }
            }}
            onMouseOut={e => {
              if (theme === 'light') {
                e.currentTarget.style.boxShadow = '0 2px 12px #e0e0e033';
                e.currentTarget.style.transform = 'none';
              } else {
                e.currentTarget.style.boxShadow = '0 2px 12px var(--card-shadow)';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: isBrightMode ? '#1976d2' : '', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span role="img" aria-label="book">📖</span> {note.title}
              </div>
              <div style={{ color: isBrightMode ? '#43a047' : '#fff', fontSize: 14, fontWeight: 700, background: isBrightMode ? '#e8f5e9' : 'var(--card-bg)', borderRadius: 8, padding: '2px 10px', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span role="img" aria-label="calendar">📅</span> {note.date}
              </div>
            </div>
            <div style={{ color: isBrightMode ? '#444' : '#fff', fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6, fontWeight: 500 }}>
              {note.content}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 }}>
              <span style={{ color: isBrightMode ? '#bdbdbd' : '#fff', fontSize: 13 }}>자세히 보기 →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoteList; 