import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import axios from 'axios';


function StudyRoom() {
    const { user } = useUser();                       
    const { theme, toggleTheme } = useTheme();        

    const [userInfo, setUserInfo] = useState(null);   
    const [editUser, setEditUser] = useState(null);   
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const { data } = await axios.get('/api/users/userinfo', {
                    params: { user_id: user.user_id }
                });
                setUserInfo(data);
                // 비밀번호는 빈 문자열로 초기화
                setEditUser({ ...data, password: '' });
            } catch (err) {
                console.error('유저정보 조회 실패', err);
            }
        })();
    }, [user]);

    if (userInfo === null) {
        return <div>로딩 중…</div>;
    }

    const themes = [
        { key: 'light', label: '라이트 모드(화이트)', desc: '밝은 흰색 배경, 기본 모드' },
        { key: 'dark', label: '다크 모드(블랙)', desc: '어두운 검정 배경, 눈 보호' },
        { key: 'gradient', label: '그라데이션', desc: '현재 페이지에 적용된 컬러풀한 배경' },
    ];

  // 사용자 정보 변경 핸들러
    const handleChange = e => {
        setEditUser({ ...editUser, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await axios.patch('/api/users/update-userinfo', {
                user_id: user.user_id,
                username: editUser.username,
                name: editUser.name,
                email: editUser.email,
                password: editUser.password  
            });
            setUserInfo(editUser);
            setIsEditing(false);
            alert('내 정보가 저장되었습니다!');
        } catch (err) {
            console.error('유저 정보 저장 실패', err);
            alert('정보 저장 중 오류가 발생했습니다.');
        }
    };
    const handleTheme = async key => {
        try {
            await axios.post('/api/users/update-theme', {
                user_id: user.user_id,
                theme: key
            });
            toggleTheme(key);
        } catch (err) {
            console.error('테마 저장 실패', err);
            alert('테마 변경 중 오류가 발생했습니다.');
        }
    };
    const handleCancel = () => {
        setEditUser(userInfo);
        setIsEditing(false);
    };


  return (
    <div style={{ maxWidth: 700, margin: '3rem auto', background: 'var(--color-bg)', borderRadius: 22, boxShadow: '0 8px 32px #4caf5033', padding: '2.5rem 2.2rem', minHeight: 500, color: 'var(--color-text)' }}>
          <h2 style={{ fontWeight: 900, fontSize: 28, color: '#4caf50', marginBottom: 32, letterSpacing: -1 }}>설정 & 마이페이지</h2>


      {/* 마이페이지(사용자 정보) */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontWeight: 800, fontSize: 20, color: '#1976d2', marginBottom: 18 }}>👤 내 정보</h3>
        {!isEditing ? (
                  <div style={{ lineHeight: 2.2, fontSize: 17 }}>
                      <div><b>아이디:</b> {userInfo.username}</div>
                      <div><b>이름:</b> {userInfo.name}</div>
                      <div><b>이메일:</b> {userInfo.email}</div>
                      <div><b>비밀번호:</b> {userInfo.password}</div> 
                      <button onClick={() => setIsEditing(true)} style={{ marginTop: 18, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>정보 수정</button>
          </div>
        ) : (
          <div style={{ lineHeight: 2.2, fontSize: 17 }}>
            <div>
              <b>아이디:</b> <input name="username" value={editUser.username} onChange={handleChange} style={{ fontSize: 16, padding: '2px 8px', borderRadius: 6, border: '1px solid #bbb', marginLeft: 8 }} />
            </div>
            <div>
              <b>이름:</b> <input name="name" value={editUser.name} onChange={handleChange} style={{ fontSize: 16, padding: '2px 8px', borderRadius: 6, border: '1px solid #bbb', marginLeft: 8 }} />
            </div>
            <div>
              <b>이메일:</b> <input name="email" value={editUser.email} onChange={handleChange} style={{ fontSize: 16, padding: '2px 8px', borderRadius: 6, border: '1px solid #bbb', marginLeft: 8 }} />
            </div>
            <div>
              <b>비밀번호:</b> <input name="password" type="password" value={editUser.password} onChange={handleChange} style={{ fontSize: 16, padding: '2px 8px', borderRadius: 6, border: '1px solid #bbb', marginLeft: 8 }} />
            </div>
            <button onClick={handleSave} style={{ marginTop: 18, background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginRight: 10 }}>저장</button>
            <button onClick={handleCancel} style={{ marginTop: 18, background: '#bbb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>취소</button>
          </div>
        )}
      </section>
      {/* 설정(테마) */}
      <section>
        <h3 style={{ fontWeight: 800, fontSize: 20, color: '#1976d2', marginBottom: 18 }}>⚙️ 테마 설정</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {themes.map(t => (
            <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 14, background: theme === t.key ? '#e3fcef' : '#f8f9fa', borderRadius: 10, padding: '1rem 1.2rem', boxShadow: theme === t.key ? '0 2px 8px #4caf5033' : 'none', border: theme === t.key ? '2px solid #4caf50' : '1.5px solid #e0e0e0', cursor: 'pointer', fontWeight: theme === t.key ? 800 : 600, color: theme === t.key ? '#388e3c' : '#333', fontSize: 17 }}>
              <input type="radio" name="theme" checked={theme === t.key} onChange={() => handleTheme(t.key)} style={{ accentColor: '#4caf50', width: 18, height: 18 }} />
              <span>{t.label}</span>
              <span style={{ fontSize: 14, color: '#888', marginLeft: 8 }}>{t.desc}</span>
              {t.key === 'light' && <span style={{ fontSize: 13, color: '#1976d2', marginLeft: 10 }}>(기본)</span>}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StudyRoom;
