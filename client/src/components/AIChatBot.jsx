import React, { useState, useEffect, useRef } from "react";

function AIChatBot({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const chatbotBodyRef = useRef(null);

  useEffect(() => {
    setMessages([{ sender: "bot", text: "안녕하세요! 무엇을 도와드릴까요?" }]);
  }, []);

  useEffect(() => {
    if (chatbotBodyRef.current) {
      chatbotBodyRef.current.scrollTop = chatbotBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleUnload = () => setThreadId(null);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const addMessage = (sender, text) => {
    setMessages((prev) => [...prev, { sender, text }]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    addMessage("user", userMessage);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          thread_id: threadId,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: API 요청 실패`);
      }
      
      const data = await res.json();
      if (!data?.thread_id || !data?.response) {
        throw new Error("응답 데이터 형식이 올바르지 않습니다.");
      }
      
      setThreadId(data.thread_id);
      addMessage("bot", data.response);
    } catch (err) {
      console.error("챗봇 오류:", err);
      addMessage("bot", err.message || "죄송합니다. 응답에 실패했습니다.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={containerStyle} className="ai-chatbot-container">
      <style>
        {`
        .ai-chatbot-container {
          font-family: 'Pretendard', 'Segoe UI', 'Noto Sans KR', 'Apple SD Gothic Neo', Arial, sans-serif;
          background: #fff;
          backdrop-filter: blur(6px) saturate(1.1);
        }
        .ai-chatbot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(90deg, #fff 0%, #f5f5f5 100%);
          color: #222;
          font-weight: 700;
          font-size: 20px;
          padding: 16px 20px 14px 16px;
          border-top-left-radius: 18px;
          border-top-right-radius: 18px;
          box-shadow: 0 2px 12px #0001;
          letter-spacing: 1px;
        }
        .ai-chatbot-header .ai-bot-icon {
          font-size: 22px;
          margin-right: 8px;
        }
        .ai-chatbot-header .ai-close-btn {
          background: rgba(0,0,0,0.04);
          border: none;
          color: #222;
          font-size: 22px;
          cursor: pointer;
          opacity: 0.7;
          border-radius: 50%;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.18s, opacity 0.18s;
        }
        .ai-chatbot-header .ai-close-btn:hover {
          background: rgba(0,0,0,0.10);
          opacity: 1;
        }
        .ai-chatbot-body {
          background: linear-gradient(135deg, #fff 0%, #f5f5f5 100%);
          min-height: 380px;
          max-height: 380px;
          overflow-y: auto;
          border-radius: 0 0 12px 12px;
          padding: 18px 10px 10px 10px;
          box-shadow: 0 2px 12px #0001;
          margin-bottom: 8px;
          transition: background 0.2s;
        }
        .ai-chatbot-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .ai-chatbot-scrollbar::-webkit-scrollbar-thumb {
          background: #e0e0e0;
          border-radius: 4px;
        }
        .ai-chatbot-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-bubble-appear {
          animation: aiBubbleAppear 0.3s;
        }
        @keyframes aiBubbleAppear {
          from { opacity: 0; transform: translateY(10px) scale(0.95);}
          to { opacity: 1; transform: translateY(0) scale(1);}
        }
        .ai-typing-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #bbb;
          animation: aiBlink 1.2s infinite both;
          margin: 0 2px;
        }
        .ai-typing-dot:nth-child(2) { animation-delay: 0.2s;}
        .ai-typing-dot:nth-child(3) { animation-delay: 0.4s;}
        @keyframes aiBlink {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
        .ai-chatbot-input {
          background: #fafafa;
          color: #222;
          border: 1.5px solid #e0e0e0;
          font-size: 16px;
          border-radius: 12px;
          box-shadow: 0 1px 4px #0001;
          transition: border 0.2s, background 0.2s;
        }
        .ai-chatbot-input:focus {
          border: 2px solid #222 !important;
          background: #fff !important;
        }
        .ai-send-btn {
          background: linear-gradient(90deg, #fff 0%, #e0e0e0 100%);
          color: #222;
          border: none;
          border-radius: 12px;
          box-shadow: 0 2px 8px #0001;
          transition: background 0.2s, color 0.2s;
        }
        .ai-send-btn:disabled {
          background: #f0f0f0 !important;
          color: #bbb !important;
          cursor: not-allowed;
        }
        .ai-send-btn:hover:not(:disabled) {
          background: linear-gradient(90deg, #fff 60%, #f5f5f5 100%) !important;
          color: #000 !important;
        }
        .ai-bubble-user {
          background: linear-gradient(135deg, #fff 0%, #f5f5f5 100%);
          color: #222;
          border-top-right-radius: 0 !important;
          border-top-left-radius: 18px !important;
          box-shadow: 0 2px 12px #0001;
        }
        .ai-bubble-bot {
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
          color: #222;
          border-top-left-radius: 0 !important;
          border-top-right-radius: 18px !important;
          box-shadow: 0 2px 12px #0001;
        }
        .ai-bubble-user .ai-bubble-tail {
          border-left: 10px solid #f5f5f5 !important;
        }
        .ai-bubble-bot .ai-bubble-tail {
          border-right: 10px solid #e0e0e0 !important;
        }
        .ai-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 8px;
          background: #fff;
          box-shadow: 0 2px 8px #0001;
          border: 2px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }
        @media (max-width: 600px) {
          .ai-chatbot-container {
            max-width: 100vw !important;
            min-width: 0 !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
          .ai-chatbot-header {
            border-radius: 0 !important;
          }
        }
        `}
      </style>
      <div className="ai-chatbot-header">
        <span>
          <span className="ai-bot-icon" role="img" aria-label="bot">🤖</span>
          AI 챗봇
        </span>
        {onClose && (
          <button className="ai-close-btn" onClick={onClose} title="닫기">✕</button>
        )}
      </div>
      <div
        className="ai-chatbot-body ai-chatbot-scrollbar"
        ref={chatbotBodyRef}
        id="chatbot-body"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: msg.sender === "user" ? "row-reverse" : "row",
              marginBottom: 14,
              alignItems: "flex-end",
            }}
            className="ai-bubble-appear"
          >
            <div className="ai-avatar" aria-label={msg.sender === "user" ? "user" : "bot"}>
              {msg.sender === "user" ? "🧑" : "🤖"}
            </div>
            <div
              className={msg.sender === "user" ? "ai-bubble-user" : "ai-bubble-bot"}
              style={{
                ...bubbleStyle,
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                position: "relative",
              }}
            >
              {msg.text}
              <span
                className="ai-bubble-tail"
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: msg.sender === "user" ? -10 : "auto",
                  left: msg.sender === "user" ? "auto" : -10,
                  width: 0,
                  height: 0,
                  borderTop: "10px solid transparent",
                  borderBottom: "10px solid transparent",
                  borderLeft: msg.sender === "user" ? "10px solid #f5f5f5" : "none",
                  borderRight: msg.sender === "user" ? "none" : "10px solid #e0e0e0",
                  filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.04))",
                  display: "block",
                }}
              ></span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={typingStyle}>
            <div className="ai-avatar" aria-label="bot">🤖</div>
            <div style={{ display: "flex", gap: 2, marginLeft: 6 }}>
              <div className="ai-typing-dot"></div>
              <div className="ai-typing-dot"></div>
              <div className="ai-typing-dot"></div>
            </div>
          </div>
        )}
      </div>
      <div style={inputWrapperStyle}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요"
          style={inputStyle}
          className="ai-chatbot-input"
          id="chatbot-input"
        />
        <button
          onClick={sendMessage}
          style={{
            ...sendBtnStyle,
            transition: "background 0.2s, color 0.2s",
          }}
          className="ai-send-btn"
          disabled={isTyping || !input.trim()}
          id="send-btn"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 20L21 12L3 4V10L17 12L3 14V20Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  maxWidth: 420,
  minWidth: 320,
  background: "#fff",
  borderRadius: 18,
  padding: 0,
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 0,
  position: "relative",
  border: "2px solid #eee",
};

const bubbleStyle = {
  padding: "12px 16px",
  borderRadius: 18,
  fontSize: 16,
  lineHeight: 1.6,
  maxWidth: "70vw",
  minWidth: 40,
  wordBreak: "break-word",
  margin: "0 2px",
  position: "relative",
  transition: "background 0.2s, color 0.2s",
};

const inputWrapperStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 2,
  padding: "12px 16px 16px 16px",
  background: "#fafafa",
  borderBottomLeftRadius: 18,
  borderBottomRightRadius: 18,
  boxShadow: "0 -2px 8px #0001",
};

const inputStyle = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1.5px solid #e0e0e0",
  fontSize: 16,
  outline: "none",
  background: "#fafafa",
  color: "#222",
  boxShadow: "0 1px 4px #0001",
  transition: "border 0.2s, background 0.2s",
};

const sendBtnStyle = {
  border: "none",
  borderRadius: 12,
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(90deg, #fff 0%, #e0e0e0 100%)",
  color: "#222",
  cursor: "pointer",
  boxShadow: "0 2px 8px #0001",
  transition: "background 0.2s, color 0.2s",
};

const typingStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
  marginLeft: 8,
};

export default AIChatBot;