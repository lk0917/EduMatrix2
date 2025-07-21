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
    <div style={{ maxWidth: 1100, width: '95vw', margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 28, boxShadow: '0 8px 32px var(--card-shadow)', padding: '2.5rem 2.2rem', color: 'var(--text-main)' }}>
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
    </div>
  );
} 