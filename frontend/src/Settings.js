import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiGetProfile, apiUpdateProfile, apiChangePassword, saveAuth
} from "./api";
import { SharedSidebar } from "./SharedLayout";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [studyGoal, setStudyGoal] = useState(5);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileMsgType, setProfileMsgType] = useState("success");

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwMsgType, setPwMsgType] = useState("success");

  // Settings Tabs: profile | security
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    apiGetProfile()
      .then((data) => {
        setProfile(data.user);
        setName(data.user?.name || "");
        setStudyGoal(data.user?.studyGoalHours || 5);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleProfileSave = async () => {
    setProfileMsg("");
    try {
      const data = await apiUpdateProfile({ name, studyGoalHours: studyGoal });
      if (data.user) {
        saveAuth(localStorage.getItem("token"), data.user);
        setProfileMsg("Profile updated successfully!");
        setProfileMsgType("success");
      } else {
        setProfileMsg(data.message || "Update failed.");
        setProfileMsgType("error");
      }
    } catch {
      setProfileMsg("Server error.");
      setProfileMsgType("error");
    }
  };

  const handlePasswordChange = async () => {
    setPwMsg("");
    if (!currentPw || !newPw) {
      setPwMsg("Please fill both password fields.");
      setPwMsgType("error");
      return;
    }
    try {
      const data = await apiChangePassword(currentPw, newPw);
      if (data.success || !data.message?.includes("error")) {
        setPwMsg("Password updated successfully!");
        setPwMsgType("success");
        setCurrentPw("");
        setNewPw("");
      } else {
        setPwMsg(data.message || "Failed to update password.");
        setPwMsgType("error");
      }
    } catch {
      setPwMsg("Server error.");
      setPwMsgType("error");
    }
  };

  const TABS = [
    { id: "profile", label: "👤 Profile Settings" },
    { id: "security", label: "🔒 Account Security" },
  ];

  return (
    <div className="dashboard">
      <SharedSidebar />
      <div className="main settings-main">
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-left">
            <div className="settings-icon">⚙️</div>
            <div>
              <h1>Account Settings</h1>
              <p>Configure your study goals and profile parameters</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="settings-loading">
            <div className="loading-ring"></div>
            <p>Loading your configuration…</p>
          </div>
        ) : (
          <div className="settings-grid">
            {/* Sidebar Tabs */}
            <div className="settings-tabs-side">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`settings-tab-btn ${activeTab === t.id ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}

              <div className="settings-profile-badge">
                <div className="badge-avatar">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div className="badge-info">
                  <div className="badge-name">{name || "Student"}</div>
                  <div className="badge-email">{profile?.email}</div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="settings-content-card">
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="settings-pane">
                  <h2>Profile Settings</h2>
                  <p className="pane-subtitle">Manage your personal information and daily target study hours</p>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={profile?.email || ""}
                        disabled
                        title="Email cannot be changed"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Daily Study Goal (Hours)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={studyGoal}
                      onChange={(e) => setStudyGoal(e.target.value)}
                      style={{ width: "120px" }}
                    />
                    <p className="form-help">Set your daily target to track consistency in Dashboard</p>
                  </div>

                  <button className="settings-save-btn" onClick={handleProfileSave}>
                    Save Changes
                  </button>

                  {profileMsg && (
                    <div className={`form-feedback-alert ${profileMsgType}`}>
                      {profileMsg}
                    </div>
                  )}
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div className="settings-pane">
                  <h2>Security Settings</h2>
                  <p className="pane-subtitle">Update your password to keep your academic account safe</p>

                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                    />
                  </div>

                  <button className="settings-save-btn" onClick={handlePasswordChange}>
                    Update Password
                  </button>

                  {pwMsg && (
                    <div className={`form-feedback-alert ${pwMsgType}`}>
                      {pwMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
