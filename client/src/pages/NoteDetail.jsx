import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import 'highlight.js/styles/github.css';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import DashboardNavbar from '../components/DashboardNavbar';
import AIChatBot from '../components/AIChatBot';

const lowlight = createLowlight();

const CODE_LANGUAGES = [
  { label: '자동', value: null },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'JSON', value: 'json' },
  { label: 'Bash', value: 'bash' },
  { label: 'Go', value: 'go' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Swift', value: 'swift' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Rust', value: 'rust' },
];


export default function NoteDetail() {
    const { theme } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();

    // 대시보드 네비게이션바용 상태 추가
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chatbotOpen, setChatbotOpen] = useState(false);
    const chatbotRef = useRef(null);

    // Dashboard와 동일한 sidebar 메뉴 (컬러풀한 아이콘)
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

    // 대시보드와 동일하게 오버레이 클릭 시 닫기
    const handleOverlayClick = () => {
        setSidebarOpen(false);
        setChatbotOpen(false);
    };

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

    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [codeBlockPos, setCodeBlockPos] = useState(null);
    const [codeBlockLang, setCodeBlockLang] = useState(null);
    const [tablePopover, setTablePopover] = useState({ visible: false, x: 0, y: 0 });
    const popoverRef = useRef();
    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem,
            CodeBlockLowlight.configure({ lowlight }),
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            Image,
            Link.configure({ openOnClick: true }),
            BulletList,
            OrderedList,
            ListItem,
        ],
        content: '<h1>스터디 노트</h1><p>여기에 자유롭게 작성하세요!</p>',
        autofocus: true,
        editorProps: {
            attributes: {
                style: 'min-height:400px; background:#fafbfc; border-radius:12px; box-shadow:0 2px 8px #e0e7ff33; padding:1.5rem 1.2rem; font-size:16px; max-width:100%; margin:0 auto;',
            },
        },
        onUpdate: ({ editor }) => {
            localStorage.setItem('edumatrix_tiptap_note', editor.getHTML());
        },
        onSelectionUpdate: ({ editor }) => {
            // 코드블록 포커스 시 언어 드롭다운 노출
            const { $from } = editor.state.selection;
            const node = $from.node();
            if (node.type.name === 'codeBlock') {
                setCodeBlockPos($from.before());
                setCodeBlockLang(node.attrs.language || null);
            } else {
                setCodeBlockPos(null);
                setCodeBlockLang(null);
            }
        },
    });


    useEffect(() => {
        const fetchNote = async () => {
            try {
             const res = await axios.get(`/api/study-note/detail/${id}`);
             const data = res.data;
             setTitle(data.title);
             setDate(data.date); // DB에 date가 있다면
             if (editor) {
             editor.commands.setContent(data.content);
            }
            } catch (err) {
             console.error("노트 불러오기 실패:", err);
            }
        };

        if (editor) fetchNote();
    }, [editor, id]);

  // 표 셀 클릭 시 팝오버 위치 계산 및 표시
  useEffect(() => {
    if (!editor) return;
    const handleClick = e => {
      let td = e.target.closest('td,th');
      if (td && td.closest('.ProseMirror')) {
        const rect = td.getBoundingClientRect();
        const popoverWidth = 320;
        const popoverHeight = 48;
        let x = rect.left + window.scrollX + rect.width / 2 - popoverWidth / 2;
        let y = rect.top + window.scrollY - popoverHeight - 8;
        x = Math.max(x, 16);
        y = Math.max(y, 8);
        setTablePopover({ visible: true, x, y });
      } else if (!e.target.closest('.table-popover')) {
        setTablePopover(p => ({ ...p, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editor]);

  // 툴바 기능
  const setHeading = level => editor && editor.chain().focus().toggleHeading({ level }).run();
  const addTable = () => editor && editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  const addImage = () => {
    const url = window.prompt('이미지 URL을 입력하세요');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };
  const setLink = () => {
    const url = window.prompt('링크 URL을 입력하세요');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };
  const addRowAfter = () => editor && editor.chain().focus().addRowAfter().run();
  const addRowBefore = () => editor && editor.chain().focus().addRowBefore().run();
  const deleteRow = () => editor && editor.chain().focus().deleteRow().run();
  const addColAfter = () => editor && editor.chain().focus().addColumnAfter().run();
  const addColBefore = () => editor && editor.chain().focus().addColumnBefore().run();
  const deleteCol = () => editor && editor.chain().focus().deleteColumn().run();
  const handleCodeLangChange = e => {
    const lang = e.target.value || null;
    setCodeBlockLang(lang);
    if (codeBlockPos !== null && editor) {
      editor.chain().focus().command(({ tr }) => {
        tr.setNodeMarkup(codeBlockPos, undefined, { language: lang });
        return true;
      }).run();
    }
  };

    const handleSave = async () => {
        try {
            await axios.put(`/api/study-note/${id}`, {
                title,
                content: editor.getHTML(),
            });
            alert("노트가 저장되었습니다!");
            navigate("/dashboard/note");
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/study-note/${id}`);
            alert("노트가 삭제되었습니다!");
            navigate("/dashboard/note");
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

  return (
    <div style={{ maxWidth: 1100, width: '95vw', margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 28, boxShadow: '0 8px 32px var(--card-shadow)', padding: '2.5rem 2.2rem', color: 'var(--text-main)', position: 'relative' }}>
      {/* 네비게이션바 */}
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
      }}>
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
        </div>
      {/* AI Chatbot Overlay (close on outside click) */}
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
      {/* 기존 노트 디테일 UI */}
      <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 24, left: 24, background: 'none', border: '1.5px solid #1976d2', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#1976d2', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
      <button onClick={handleDelete} style={{ position: 'absolute', top: 24, right: 24, background: '#eee', color: '#e74c3c', border: 'none', borderRadius: 8, padding: '0.4rem 1.2rem', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>삭제</button>
      <div style={{ fontWeight: 800, fontSize: 28, color: '#1976d2', marginBottom: 16, marginTop: 30 }}>노트 수정</div>
      <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>{date}</div>
      <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', maxWidth: 1000, fontWeight: 800, fontSize: 26, color: '#111', marginBottom: 18, border: '1.5px solid #e0e7ff', borderRadius: 10, padding: '1rem 1.2rem', background: '#fff' }} />
      {/* Tiptap 툴바 */}
      <div className="tiptap-toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center', background: '#f8f9fa', borderRadius: 12, padding: '0.8rem 1.1rem', boxShadow: '0 1px 4px #e0e7ff33', maxWidth: 1000 }}>
        <button onClick={() => setHeading(1)} title="제목1(H1)">H1</button>
        <button onClick={() => setHeading(2)} title="제목2(H2)">H2</button>
        <button onClick={() => setHeading(3)} title="제목3(H3)">H3</button>
        <button onClick={addTable} title="표 추가">표</button>
        <button onClick={addImage} title="이미지 추가">🖼 이미지</button>
        <button onClick={setLink} title="링크 추가">🔗 링크</button>
        <button onClick={() => editor && editor.chain().focus().toggleBold().run()} title="굵게"><b>B</b></button>
        <button onClick={() => editor && editor.chain().focus().toggleItalic().run()} title="기울임"><i>I</i></button>
        <button onClick={() => editor && editor.chain().focus().toggleUnderline && editor.chain().focus().toggleUnderline().run()} title="밑줄">U</button>
        <button onClick={() => editor && editor.chain().focus().toggleBulletList().run()} title="글머리 리스트">• 리스트</button>
        <button onClick={() => editor && editor.chain().focus().toggleOrderedList().run()} title="번호 리스트">1. 리스트</button>
        <button onClick={() => editor && editor.chain().focus().toggleCodeBlock().run()} title="코드블록">코드</button>
        <button onClick={() => editor && editor.chain().focus().toggleTaskList().run()} title="체크리스트">☑ 체크</button>
        {/* 코드블록 언어 선택 */}
        {codeBlockPos !== null && (
          <select value={codeBlockLang || ''} onChange={handleCodeLangChange} title="코드 언어 선택">
            {CODE_LANGUAGES.map(lang => (
              <option key={lang.label} value={lang.value || ''}>{lang.label}</option>
            ))}
          </select>
        )}
      </div>
      {/* 표 셀 팝오버 */}
      {tablePopover.visible && (
        <div
          className="table-popover"
          ref={popoverRef}
          style={{ left: tablePopover.x, top: tablePopover.y, position: 'absolute', zIndex: 100, background: '#fff', border: '1.5px solid #e0e7ff', borderRadius: 14, boxShadow: '0 2px 16px #667eea22', padding: '0.7rem 1.2rem', display: 'flex', gap: 8, alignItems: 'center', animation: 'fadeIn 0.18s', backdropFilter: 'blur(2.5px)' }}
        >
          <button onClick={addRowAfter} title="행 추가(아래)">➕ 행</button>
          <button onClick={addRowBefore} title="행 추가(위)">⬆️ 행</button>
          <button onClick={deleteRow} title="행 삭제">🗑️ 행</button>
          <button onClick={addColAfter} title="열 추가(오른쪽)">➕ 열</button>
          <button onClick={addColBefore} title="열 추가(왼쪽)">⬅️ 열</button>
          <button onClick={deleteCol} title="열 삭제">🗑️ 열</button>
        </div>
      )}
      {/* 에디터 */}
      <div style={{ width: '100%', maxWidth: 1000 }}>
        <EditorContent editor={editor} style={{ minHeight: '50vh', maxWidth: 1000, fontSize: 18, padding: '1.2rem 1rem', background: '#fff', color: '#111', borderRadius: 12, boxShadow: '0 2px 8px #e0e7ff33', border: '1.5px solid #e0e7ff' }} />
      </div>
      <button onClick={handleSave} style={{ background: 'linear-gradient(90deg,#8ec5fc,#4caf50)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.6rem', fontWeight: 700, fontSize: 17, cursor: 'pointer', marginRight: 10, marginTop: 18 }}>저장</button>
      <button onClick={() => navigate('/dashboard/note')} style={{ background: '#eee', color: '#888', border: 'none', borderRadius: 8, padding: '0.7rem 1.6rem', fontWeight: 700, fontSize: 17, cursor: 'pointer', marginTop: 18 }}>취소</button>
      <style>{`
        .tiptap-toolbar button, .tiptap-toolbar select {
          background: #fff;
          color: #111;
        }
        .tiptap-toolbar button:hover, .tiptap-toolbar select:hover {
          background: #6366f1;
          color: #fff;
        }
        .tiptap-toolbar button:active, .tiptap-toolbar select:active {
          background: #4338ca;
          color: #fff;
        }
        .tiptap-toolbar select {
          background: #fff;
          color: #111;
          border: 1.5px solid #e0e7ff;
        }
        .table-popover {
          z-index: 100;
        }
        /* 표 스타일: 카드 배경, 카드 테두리 */
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.5rem 0;
          background: var(--card-bg);
          border-radius: 0;
          box-shadow: none;
        }
        .ProseMirror th, .ProseMirror td {
          border: 1.5px solid var(--card-border);
          padding: 0.7em 1.1em;
          min-width: 40px;
          background: var(--card-bg);
          cursor: pointer;
          font-size: inherit;
          transition: background 0.15s;
          color: var(--text-main);
        }
        .ProseMirror th {
          background: var(--card-bg);
          font-weight: bold;
          color: var(--text-main);
        }
        .ProseMirror tr:nth-child(even) td {
          background: var(--card-bg);
        }
        .ProseMirror td:focus, .ProseMirror th:focus {
          outline: 2px solid #1976d2;
          background: #e0c3fc33;
        }
        /* 코드블록: 카드 배경, 진한 텍스트 */
        .ProseMirror pre {
          background: #fff !important;
          color: #111 !important;
          border-radius: 6px;
          padding: 1.1em 1.3em;
          font-size: 15px;
          overflow-x: auto;
          margin: 1.2em 0;
          box-shadow: none;
          border: 1.5px solid var(--card-border);
        }
        .ProseMirror code {
          background: #fff;
          color: #111;
        }
        .hljs {
          background: none;
          color: #111 !important;
        }
        /* 코드블록 언어 선택 드롭다운 강조 */
        .tiptap-toolbar select[title='코드 언어 선택'] {
          background: #fff;
          color: #111;
          border: 2px solid #e0e7ff;
          font-size: 15px;
          font-weight: 700;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
  );
} 