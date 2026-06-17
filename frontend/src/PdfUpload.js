import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineLogout } from "react-icons/hi";
import {
  apiUploadNote,
  apiGetNotes,
  apiDeleteNote,
  apiGenerateQuizFromNote,
  getUser,
  clearAuth,
} from "./api";
import "./PdfUpload.css";

const NAV = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/practice",  icon: "🤖", label: "AI Practice" },
  { to: "/subjects",  icon: "📚", label: "Subjects" },
  { to: "/analytics", icon: "📊", label: "Analytics" },
  { to: "/pdf-upload",icon: "📄", label: "PDF Upload" },
  { to: "/settings",  icon: "⚙️", label: "Settings" },
];

const SUBJECTS = ["General", "DSA", "OS", "DBMS", "CN", "AI", "Maths", "Other"];

function PdfUpload() {
  const navigate   = useNavigate();
  const user       = getUser();
  const fileRef    = useRef(null);

  const [notes,      setNotes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [generating, setGenerating] = useState(null); // noteId
  const [questions,  setQuestions]  = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [answers,    setAnswers]    = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [toast,      setToast]      = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [qCount,     setQCount]     = useState(5);

  // Upload form state
  const [title,   setTitle]   = useState("");
  const [subject, setSubject] = useState("General");
  const [file,    setFile]    = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchNotes = useCallback(async () => {
    try {
      const data = await apiGetNotes();
      setNotes(data.notes || []);
    } catch {
      showToast("Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    fetchNotes();
  }, [navigate, fetchNotes]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      if (!title) setTitle(dropped.name.replace(".pdf", ""));
    } else {
      showToast("Please upload a PDF file only", "error");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(".pdf", ""));
    }
  };

  const handleUpload = async () => {
    if (!file) { showToast("Please select a PDF file", "error"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      fd.append("subject", subject);
      const data = await apiUploadNote(fd);
      if (data.note) {
        showToast("PDF uploaded successfully! 🎉");
        setFile(null); setTitle(""); setSubject("General");
        if (fileRef.current) fileRef.current.value = "";
        fetchNotes();
      } else {
        showToast(data.message || "Upload failed", "error");
      }
    } catch {
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      await apiDeleteNote(id);
      setNotes((n) => n.filter((x) => x._id !== id));
      if (activeNote?._id === id) { setActiveNote(null); setQuestions([]); setAnswers({}); setSubmitted(false); }
      showToast("Note deleted");
    } catch {
      showToast("Delete failed", "error");
    }
  };

  const handleGenerate = async (note) => {
    setGenerating(note._id);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setActiveNote(note);
    try {
      const data = await apiGenerateQuizFromNote(note._id, qCount);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        showToast(`${data.questions.length} questions generated! 🎓`);
        // Scroll to quiz
        setTimeout(() => document.getElementById("quiz-section")?.scrollIntoView({ behavior: "smooth" }), 200);
      } else {
        showToast(data.message || "No questions generated", "error");
      }
    } catch {
      showToast("Failed to generate questions", "error");
    } finally {
      setGenerating(null);
    }
  };

  const handleAnswer = (qi, option) => {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [qi]: option }));
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      showToast("Please answer all questions first", "error");
      return;
    }
    setSubmitted(true);
    const correct = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    showToast(`Score: ${correct}/${questions.length} — ${Math.round((correct/questions.length)*100)}%`);
  };

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correctAnswer).length
    : 0;

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleLogout = () => { clearAuth(); navigate("/login"); };

  return (
    <div className="pdf-page">

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">🧠</div>
          <span className="logo-text">Exam<span>IQ</span></span>
        </div>
        <div className="nav-section">
          <p className="nav-label">Main Menu</p>
          <nav className="menu">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`menu-item ${window.location.pathname === item.to ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
          <div className="user-info">
            <p className="user-name">{user?.name || "Student"}</p>
            <p className="user-role">Student</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <HiOutlineLogout />
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="pdf-main">

        {/* Toast */}
        {toast && (
          <div className={`pdf-toast ${toast.type}`}>{toast.msg}</div>
        )}

        {/* Header */}
        <div className="pdf-header">
          <div>
            <h1>📄 PDF Upload & Question Generator</h1>
            <p>Upload your lecture notes, textbooks or any PDF — AI will generate exam-ready questions from them.</p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="upload-card">
          <div className="upload-card-header">
            <div className="upload-card-icon">⬆️</div>
            <div>
              <h2>Upload New PDF</h2>
              <p>PDF files only · Max 10 MB</p>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            className={`drop-zone ${dragOver ? "active" : ""} ${file ? "has-file" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <div className="drop-file-icon">📄</div>
                <div className="drop-file-name">{file.name}</div>
                <div className="drop-file-size">{formatSize(file.size)} · Ready to upload</div>
                <button className="drop-change" onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(""); }}>
                  Change File ×
                </button>
              </>
            ) : (
              <>
                <div className="drop-icon">📂</div>
                <div className="drop-text">Drag & drop your PDF here</div>
                <div className="drop-sub">or click to browse</div>
              </>
            )}
          </div>

          {/* Form row */}
          <div className="upload-form-row">
            <div className="upload-field">
              <label>Title / Note Name</label>
              <input
                type="text"
                placeholder="e.g. OS Chapter 3 Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="upload-field upload-field-sm">
              <label>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="upload-field upload-field-sm">
              <label>Questions to Generate</label>
              <select value={qCount} onChange={(e) => setQCount(Number(e.target.value))}>
                {[3, 5, 7, 10].map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? (
              <><span className="btn-spinner"></span> Uploading…</>
            ) : (
              "⬆️ Upload PDF"
            )}
          </button>
        </div>

        {/* Uploaded Notes */}
        <div className="notes-section">
          <div className="notes-section-header">
            <h2>📚 Your Uploaded Notes</h2>
            <span className="notes-count">{notes.length} file{notes.length !== 1 ? "s" : ""}</span>
          </div>

          {loading ? (
            <div className="pdf-loading">
              <div className="loading-ring"></div>
              <p>Loading your notes…</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="notes-empty">
              <div className="notes-empty-icon">📂</div>
              <h3>No PDFs uploaded yet</h3>
              <p>Upload your first PDF above to start generating practice questions!</p>
            </div>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <div className={`note-card ${activeNote?._id === note._id ? "active-note" : ""}`} key={note._id}>
                  <div className="note-card-top">
                    <div className="note-icon">📄</div>
                    <div className="note-info">
                      <div className="note-title">{note.title}</div>
                      <div className="note-meta">
                        <span className="note-subject">{note.subject}</span>
                        <span>·</span>
                        <span>{formatSize(note.fileSize)}</span>
                        <span>·</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="note-actions">
                    <button
                      className="note-btn generate"
                      onClick={() => handleGenerate(note)}
                      disabled={generating === note._id}
                    >
                      {generating === note._id ? (
                        <><span className="btn-spinner sm"></span> Generating…</>
                      ) : (
                        "🤖 Generate Questions"
                      )}
                    </button>
                    <button
                      className="note-btn delete"
                      onClick={() => handleDelete(note._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated Quiz Section */}
        {questions.length > 0 && (
          <div className="quiz-section" id="quiz-section">
            <div className="quiz-section-header">
              <div>
                <h2>🎯 Generated Quiz</h2>
                <p>From: <strong>{activeNote?.title}</strong> · {activeNote?.subject}</p>
              </div>
              {submitted && (
                <div className="quiz-score-badge">
                  <span className="quiz-score-value">{score}/{questions.length}</span>
                  <span className="quiz-score-pct">{Math.round((score / questions.length) * 100)}%</span>
                </div>
              )}
            </div>

            <div className="quiz-list">
              {questions.map((q, qi) => {
                const userAns = answers[qi];
                const isCorrect = submitted && userAns === q.correctAnswer;
                const isWrong = submitted && userAns && userAns !== q.correctAnswer;

                return (
                  <div className={`quiz-item ${submitted ? (isCorrect ? "correct" : isWrong ? "wrong" : "unanswered") : ""}`} key={qi}>
                    <div className="quiz-q-header">
                      <span className="quiz-q-num">Q{qi + 1}</span>
                      <p className="quiz-q-text">{q.question}</p>
                    </div>
                    <div className="quiz-options">
                      {q.options.map((opt, oi) => {
                        const isSelected = userAns === opt;
                        const isCorrectOpt = submitted && opt === q.correctAnswer;
                        return (
                          <button
                            key={oi}
                            className={`quiz-option 
                              ${isSelected ? "selected" : ""}
                              ${isCorrectOpt ? "correct-opt" : ""}
                              ${submitted && isSelected && !isCorrectOpt ? "wrong-opt" : ""}
                            `}
                            onClick={() => handleAnswer(qi, opt)}
                          >
                            <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && q.explanation && (
                      <div className="quiz-explanation">
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!submitted ? (
              <button className="quiz-submit-btn" onClick={handleSubmit}>
                ✅ Submit Quiz
              </button>
            ) : (
              <div className="quiz-result">
                <div className="quiz-result-box">
                  <div className="quiz-result-icon">{score / questions.length >= 0.7 ? "🎉" : "📚"}</div>
                  <div className="quiz-result-text">
                    <h3>{score / questions.length >= 0.7 ? "Great Job!" : "Keep Practicing!"}</h3>
                    <p>You scored <strong>{score} out of {questions.length}</strong> ({Math.round((score / questions.length) * 100)}%)</p>
                  </div>
                  <button
                    className="quiz-retry-btn"
                    onClick={() => { setAnswers({}); setSubmitted(false); setQuestions([]); }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfUpload;
