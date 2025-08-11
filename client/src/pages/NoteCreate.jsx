import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

function NoteCreate() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

    const handleSave = async () => {
        console.log("저장 버튼 클릭됨");

        if (!title.trim() || !content.trim()) {
            console.warn("제목 또는 내용 비어 있음");
            return;
        }

        const user = JSON.parse(localStorage.getItem("edumatrix_user"));
        const user_id = user?.user_id;
        console.log("user_id:", user_id);

        if (!user_id) {
            alert("로그인 정보가 없습니다.");
            return;
        }

        try {
            console.log("요청 전송 중");
            await axios.post("/api/study-note", {
                user_id,
                title,
                content
            });
            console.log("요청 성공");
            alert("노트를 저장했습니다.");
            navigate("/dashboard/note");
        } catch (err) {
            console.error("요청 실패:", err);
            alert("노트 저장 중 오류가 발생했습니다.");
        }
    };

  return (
    <div style={{ maxWidth: 700, margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 22, boxShadow: '0 8px 32px var(--card-shadow)', padding: '2.5rem 2.2rem', color: 'var(--text-main)' }}>
      <h2 style={{ fontWeight: 900, fontSize: 28, color: 'var(--text-main)', marginBottom: 18 }}>새 스터디 노트 작성</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 700, marginBottom: 6, display: 'block', color: 'var(--text-main)' }}>제목</label>
        <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', fontWeight: 700, fontSize: 18, color: 'var(--text-main)', border: '1.5px solid var(--input-border)', borderRadius: 8, padding: '0.5rem 1rem', background: 'var(--input-bg)' }} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 700, marginBottom: 6, display: 'block', color: 'var(--text-main)' }}>내용</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} style={{ width: '100%', minHeight: 220, borderRadius: 10, border: '1.5px solid var(--input-border)', padding: '1rem', fontSize: 16, color: 'var(--text-main)', fontWeight: 500, background: 'var(--input-bg)' }} />
      </div>
      <button onClick={handleSave} style={{ background: 'var(--button-bg)', color: 'var(--button-text)', border: 'none', borderRadius: 8, padding: '0.7rem 1.6rem', fontWeight: 700, fontSize: 17, cursor: 'pointer' }}>저장</button>
      <button onClick={() => navigate('/dashboard/note')} style={{ background: '#eee', color: '#888', border: 'none', borderRadius: 8, padding: '0.7rem 1.6rem', fontWeight: 700, fontSize: 17, cursor: 'pointer', marginLeft: 10 }}>취소</button>
    </div>
  );
}

export default NoteCreate; 