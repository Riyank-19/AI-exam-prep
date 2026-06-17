import React, { useState, useRef, useEffect } from "react";
import "./AIPractice.css";
import { apiChat, apiExplain, apiStudyPlan } from "./api";
import { useNavigate } from "react-router-dom";
import { SharedSidebar } from "./SharedLayout";

const QUICK_PROMPTS = [
  "Explain Deadlock in OS",
  "Generate 5 MCQs on Binary Trees",
  "What is TCP 3-way handshake?",
  "Explain SQL Joins with examples",
  "What is process scheduling?",
];

const formatText = (text) => {
  if (!text) return null;
  const parts = text.split("**");
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
};

function AIPractice() {
  const navigate = useNavigate();
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hi! I'm your AI Tutor powered by Groq. Ask me anything about DSA, OS, DBMS, CN or AI — or try a quick prompt below!",
    },
  ]);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState("chat");
  const [explainTopic, setExplainTopic]     = useState("");
  const [explainSubject, setExplainSubject] = useState("DSA");
  const [startDate, setStartDate]     = useState(new Date().toISOString().split("T")[0]);
  const [examDate, setExamDate]       = useState("");
  const [explanation, setExplanation] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [studyPlan, setStudyPlan]     = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setMessages((prev) => [...prev, { sender: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const data = await apiChat(msg);
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply || "No response." }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "Server error. Try again ❌" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!explainTopic.trim()) return;
    setExplainLoading(true); setExplanation("");
    try {
      const data = await apiExplain(explainTopic, explainSubject);
      setExplanation(data.explanation || "No explanation returned.");
    } catch { setExplanation("Error fetching explanation ❌"); }
    finally { setExplainLoading(false); }
  };

  const handleStudyPlan = async () => {
    setPlanLoading(true); setStudyPlan("");
    try {
      const data = await apiStudyPlan(startDate, examDate, []);
      setStudyPlan(data.studyPlan || "No plan returned.");
    } catch { setStudyPlan("Error generating study plan ❌"); }
    finally { setPlanLoading(false); }
  };

  const TABS = [
    { id: "chat",      label: "💬 AI Chat",     desc: "Chat with your AI tutor" },
    { id: "explain",   label: "📖 Deep Explain", desc: "Get detailed topic explanations" },
    { id: "studyplan", label: "📅 Study Planner", desc: "Generate a personalized plan" },
  ];

  return (
    <div className="dashboard">
      <SharedSidebar />

      <div className="main ai-practice-main">
        {/* Header */}
        <div className="ai-page-header">
          <div className="ai-page-header-left">
            <div className="ai-page-icon">🤖</div>
            <div>
              <h1>AI Practice Tutor</h1>
              <p>Powered by Groq AI · Ask anything, get explained, plan your study</p>
            </div>
          </div>
          <div className="ai-status-pill">
            <span className="ai-status-dot"></span>
            AI Online
          </div>
        </div>

        {/* Tab bar */}
        <div className="ai-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`ai-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="ai-tab-label">{t.label}</span>
              <span className="ai-tab-desc">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* ── CHAT TAB ── */}
        {activeTab === "chat" && (
          <div className="chat-container">
            {/* Quick prompts */}
            <div className="quick-prompts">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} className="quick-prompt-chip" onClick={() => sendMessage(p)}>
                  {p}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="chatbox">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.sender}`}>
                  {msg.sender === "ai" && (
                    <div className="ai-avatar">🤖</div>
                  )}
                  <div className="bubble">{formatText(msg.text)}</div>
                  {msg.sender === "user" && (
                    <div className="user-msg-avatar">👤</div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="message ai">
                  <div className="ai-avatar">🤖</div>
                  <div className="bubble typing-bubble">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <div className="chat-input-wrap">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Ask anything — DSA, OS, DBMS, CN, AI…"
                  disabled={loading}
                />
                <button
                  className="chat-send-btn"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <span className="btn-spin"></span> : "Send ↑"}
                </button>
              </div>
              <p className="chat-hint">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        )}

        {/* ── EXPLAIN TAB ── */}
        {activeTab === "explain" && (
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-card-icon" style={{ background: "#ecfeff" }}>📖</div>
              <div>
                <h2>Deep Topic Explanation</h2>
                <p>Get a comprehensive, exam-focused explanation of any concept</p>
              </div>
            </div>

            <div className="explain-controls">
              <div className="explain-field">
                <label>Subject</label>
                <select value={explainSubject} onChange={(e) => setExplainSubject(e.target.value)}>
                  {["DSA", "OS", "DBMS", "CN", "AI"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="explain-field explain-field-grow">
                <label>Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Deadlock, SQL Joins, Binary Trees, TCP Handshake…"
                  value={explainTopic}
                  onChange={(e) => setExplainTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleExplain()}
                />
              </div>
              <button
                className="explain-btn"
                onClick={handleExplain}
                disabled={explainLoading || !explainTopic.trim()}
              >
                {explainLoading ? <><span className="btn-spin"></span> Explaining…</> : "📖 Explain"}
              </button>
            </div>

            {explanation && (
              <div className="result-box">
                <div className="result-box-header">
                  <span>📄 Explanation: {explainTopic}</span>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(explanation)}>
                    Copy
                  </button>
                </div>
                <pre className="result-content" style={{ whiteSpace: "pre-wrap" }}>{formatText(explanation)}</pre>
              </div>
            )}

            {!explanation && !explainLoading && (
              <div className="panel-empty">
                <div className="panel-empty-icon">📖</div>
                <p>Enter a topic above and click Explain to get a detailed breakdown</p>
              </div>
            )}
          </div>
        )}

        {/* ── STUDY PLAN TAB ── */}
        {activeTab === "studyplan" && (
          <div className="panel-card">
            <div className="panel-card-header">
              <div className="panel-card-icon" style={{ background: "#faf5ff" }}>📅</div>
              <div>
                <h2>Personalized Study Planner</h2>
                <p>AI generates a day-by-day study schedule based on your exam date</p>
              </div>
            </div>

            <div className="explain-controls">
              <div className="explain-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="explain-field">
                <label>Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  min={startDate}
                />
              </div>
              <button
                className="explain-btn"
                onClick={handleStudyPlan}
                disabled={planLoading || !examDate}
              >
                {planLoading ? <><span className="btn-spin"></span> Generating…</> : "📅 Generate Plan"}
              </button>
            </div>

            {studyPlan && (
              <div className="result-box">
                <div className="result-box-header">
                  <span>📅 Your Study Plan</span>
                  <button className="copy-btn" onClick={() => navigator.clipboard.writeText(studyPlan)}>
                    Copy
                  </button>
                </div>
                <pre className="result-content" style={{ whiteSpace: "pre-wrap" }}>{formatText(studyPlan)}</pre>
              </div>
            )}

            {!studyPlan && !planLoading && (
              <div className="panel-empty">
                <div className="panel-empty-icon">📅</div>
                <p>Select your exam date to get a personalized daily study schedule</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIPractice;
