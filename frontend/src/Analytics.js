import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { apiAnalytics, apiLeaderboard } from "./api";
import { SharedSidebar } from "./SharedLayout";
import "./Analytics.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

const CHART_OPTS = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: "#1e3a8a", titleColor: "#fff", bodyColor: "#bfdbfe", padding: 10, cornerRadius: 8 },
  },
  scales: {
    x: { grid: { color: "rgba(37,99,235,0.05)" }, ticks: { color: "#94a3b8", font: { size: 11 } } },
    y: { grid: { color: "rgba(37,99,235,0.05)" }, ticks: { color: "#94a3b8", font: { size: 11 } } },
  },
};

function Analytics() {
  const navigate = useNavigate();
  const [data, setData]               = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    Promise.all([apiAnalytics(), apiLeaderboard()])
      .then(([analytics, lb]) => { setData(analytics); setLeaderboard(lb.leaderboard || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="dashboard">
      <SharedSidebar />
      <div className="main analytics-main">

        {/* Header */}
        <div className="analytics-header">
          <div className="analytics-header-left">
            <div className="analytics-icon">📊</div>
            <div>
              <h1>Performance Analytics</h1>
              <p>Track your progress, identify weak areas, and celebrate improvements</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="loading-ring"></div>
            <p>Loading your analytics…</p>
          </div>
        ) : !data?.hasData ? (
          <div className="analytics-empty">
            <div className="analytics-empty-icon">📭</div>
            <h2>No Data Yet</h2>
            <p>Take some quizzes to see your performance insights appear here.</p>
            <Link to="/practice" className="analytics-cta-btn">🤖 Start Practicing</Link>
          </div>
        ) : (
          <>
            {/* ── STAT CARDS ── */}
            <div className="analytics-stats">
              {[
                { label: "Tests Taken", value: data.overview.testsTaken, icon: "📝", color: "#2563eb", bg: "#eff6ff" },
                { label: "Overall Accuracy", value: `${data.overview.overallAccuracy}%`, icon: "🎯", color: "#10b981", bg: "#f0fdf4" },
                { label: "Average Score", value: `${data.overview.avgScore}%`, icon: "⭐", color: "#f59e0b", bg: "#fffbeb" },
                { label: "Day Streak", value: `${data.overview.streak} 🔥`, icon: "🔥", color: "#ef4444", bg: "#fef2f2" },
              ].map((s) => (
                <div className="analytics-stat-card" key={s.label}>
                  <div className="analytics-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <div>
                    <div className="analytics-stat-val" style={{ color: s.color }}>{s.value}</div>
                    <div className="analytics-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── CHARTS ROW 1 ── */}
            <div className="analytics-charts-row">
              <div className="analytics-chart-card wide">
                <div className="chart-card-header">
                  <h3>Subject Performance</h3>
                  <span className="chart-tag">Avg vs Best Scores</span>
                </div>
                <Bar
                  data={{
                    labels: data.subjectPerformance.map((s) => s.subject),
                    datasets: [
                      { label: "Avg Score %", data: data.subjectPerformance.map((s) => s.avgScore), backgroundColor: "rgba(37,99,235,0.8)", borderRadius: 8, borderSkipped: false },
                      { label: "Best Score %", data: data.subjectPerformance.map((s) => s.bestScore), backgroundColor: "rgba(16,185,129,0.8)", borderRadius: 8, borderSkipped: false },
                    ],
                  }}
                  options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, legend: { display: true, labels: { color: "#64748b", font: { size: 12 } } } } }}
                />
              </div>

              <div className="analytics-chart-card donut-card">
                <div className="chart-card-header">
                  <h3>Overall Accuracy</h3>
                  <span className="chart-tag">Correct vs Wrong</span>
                </div>
                <div className="donut-wrap">
                  <Doughnut
                    data={{
                      labels: ["Correct", "Wrong"],
                      datasets: [{ data: [data.overview.overallAccuracy, 100 - data.overview.overallAccuracy], backgroundColor: ["#2563eb", "#e2e8f0"], borderWidth: 0, hoverOffset: 4 }],
                    }}
                    options={{ cutout: "75%", plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1e3a8a", bodyColor: "#bfdbfe" } } }}
                  />
                  <div className="donut-center">
                    <span className="donut-val">{data.overview.overallAccuracy}%</span>
                    <span className="donut-sub">accuracy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CHARTS ROW 2 ── */}
            <div className="analytics-charts-row">
              <div className="analytics-chart-card">
                <div className="chart-card-header">
                  <h3>Score Trend</h3>
                  <span className="chart-tag">Last 14 Quizzes</span>
                </div>
                <Line
                  data={{
                    labels: data.scoreTrend.map((t) => `#${t.index}`),
                    datasets: [{
                      label: "Score %", data: data.scoreTrend.map((t) => t.score),
                      borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.08)",
                      fill: true, tension: 0.4, pointBackgroundColor: "#2563eb",
                      pointRadius: 4, pointHoverRadius: 6,
                    }],
                  }}
                  options={CHART_OPTS}
                />
              </div>

              <div className="analytics-chart-card">
                <div className="chart-card-header">
                  <h3>Weekly Activity</h3>
                  <span className="chart-tag">Quizzes per Day</span>
                </div>
                <Bar
                  data={{
                    labels: data.weeklyActivity.map((d) => d.day),
                    datasets: [{
                      label: "Quizzes", data: data.weeklyActivity.map((d) => d.quizzes),
                      backgroundColor: "rgba(6,182,212,0.8)", borderRadius: 8, borderSkipped: false,
                    }],
                  }}
                  options={CHART_OPTS}
                />
              </div>
            </div>

            {/* ── SCORE DISTRIBUTION + LEADERBOARD ── */}
            <div className="analytics-bottom-row">
              <div className="analytics-chart-card">
                <div className="chart-card-header">
                  <h3>Score Distribution</h3>
                  <span className="chart-tag">Quiz Ranges</span>
                </div>
                <Bar
                  data={{
                    labels: Object.keys(data.scoreDistribution),
                    datasets: [{
                      label: "Quizzes", data: Object.values(data.scoreDistribution),
                      backgroundColor: ["rgba(239,68,68,0.8)","rgba(249,115,22,0.8)","rgba(37,99,235,0.8)","rgba(16,185,129,0.8)"],
                      borderRadius: 8, borderSkipped: false,
                    }],
                  }}
                  options={CHART_OPTS}
                />
              </div>

              {leaderboard.length > 0 && (
                <div className="leaderboard-card">
                  <div className="chart-card-header">
                    <h3>🏆 Leaderboard</h3>
                    <span className="chart-tag">Top Students</span>
                  </div>
                  <div className="leaderboard-list">
                    {leaderboard.map((u) => (
                      <div className={`leaderboard-row ${u.rank <= 3 ? "top-three" : ""}`} key={u.rank}>
                        <div className="lb-rank">
                          {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : `#${u.rank}`}
                        </div>
                        <div className="lb-avatar">{u.name.charAt(0).toUpperCase()}</div>
                        <div className="lb-info">
                          <div className="lb-name">{u.name}</div>
                          <div className="lb-meta">{u.testsTaken} tests · {u.streak}🔥</div>
                        </div>
                        <div className="lb-accuracy">{u.accuracy}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;
