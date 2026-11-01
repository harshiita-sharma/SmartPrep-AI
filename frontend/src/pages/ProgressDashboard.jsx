
import { useEffect, useState } from "react";

function ProgressDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = sessionStorage.getItem("access_token");

        const response = await fetch(
          "http://127.0.0.1:8000/interviews/history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Could not load your progress.");
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const scores = history
    .map((session) => Number(session.average_score))
    .filter((score) => Number.isFinite(score));

  const totalSessions = history.length;

  const overallAverage =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

  const latestScore = scores.length > 0 ? scores[0] : null;
  const previousScore = scores.length > 1 ? scores[1] : null;

  const scoreChange =
    latestScore !== null && previousScore !== null
      ? latestScore - previousScore
      : null;

  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

  // History is newest-first. Reverse a copy for the chart.
  const chartSessions = [...history].reverse();

  const chartPoints = chartSessions.map((session, index) => ({
    x:
      chartSessions.length === 1
        ? 50
        : 30 + (index / (chartSessions.length - 1)) * 340,
    y: 160 - (Number(session.average_score) / 10) * 130,
    score: Number(session.average_score),
    label: `Session ${index + 1}`,
  }));

  const linePoints = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f4f6fb",
      padding: "35px 20px",
      color: "#172033",
      fontFamily: "Arial, sans-serif",
    },
    container: {
      maxWidth: "1050px",
      margin: "0 auto",
    },
    heading: {
      fontSize: "28px",
      marginBottom: "8px",
    },
    subtitle: {
      color: "#64748b",
      marginBottom: "28px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: "18px",
      marginBottom: "25px",
    },
    card: {
      background: "#ffffff",
      padding: "22px",
      borderRadius: "12px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    label: {
      color: "#64748b",
      fontSize: "14px",
      marginBottom: "12px",
    },
    value: {
      fontSize: "30px",
      fontWeight: "bold",
      margin: 0,
    },
    panel: {
      background: "#ffffff",
      padding: "24px",
      borderRadius: "12px",
      marginBottom: "22px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    },
    session: {
      borderTop: "1px solid #e5e7eb",
      padding: "16px 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
  };

  if (loading) {
    return <div style={styles.page}>Loading your progress...</div>;
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h2>Progress Dashboard</h2>
          <p style={{ color: "#dc2626" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Performance Dashboard</h1>
        <p style={styles.subtitle}>
          Track your interview practice and monitor your progress.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <p style={styles.label}>Total Practice Sessions</p>
            <p style={styles.value}>{totalSessions}</p>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>Overall Average Score</p>
            <p style={styles.value}>
              {totalSessions > 0 ? `${overallAverage.toFixed(1)}/10` : "—"}
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>Latest Session Score</p>
            <p style={styles.value}>
              {latestScore !== null ? `${latestScore.toFixed(1)}/10` : "—"}
            </p>
          </div>

          <div style={styles.card}>
            <p style={styles.label}>Highest Session Score</p>
            <p style={styles.value}>
              {totalSessions > 0 ? `${highestScore.toFixed(1)}/10` : "—"}
            </p>
          </div>
        </div>

        <div style={styles.panel}>
          <h2>Score Improvement</h2>

          {scoreChange !== null ? (
            <p>
              Your latest score changed by{" "}
              <strong>
                {scoreChange > 0 ? "+" : ""}
                {scoreChange.toFixed(1)} points
              </strong>{" "}
              compared with your previous session.
            </p>
          ) : (
            <p style={{ color: "#64748b" }}>
              Complete another interview session to compare your scores and
              track your improvement.
            </p>
          )}
        </div>

        <div style={styles.panel}>
          <h2>Score Trend</h2>

          {chartPoints.length > 0 ? (
            <>
              <svg
                viewBox="0 0 400 190"
                role="img"
                aria-label="Average score trend across interview sessions"
                style={{ width: "100%", maxWidth: "600px" }}
              >
                {[0, 5, 10].map((score) => {
                  const y = 160 - (score / 10) * 130;
                  return (
                    <g key={score}>
                      <line
                        x1="30"
                        y1={y}
                        x2="370"
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                      />
                      <text
                        x="5"
                        y={y + 4}
                        fontSize="11"
                        fill="#64748b"
                      >
                        {score}
                      </text>
                    </g>
                  );
                })}

                {chartPoints.length > 1 && (
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}

                {chartPoints.map((point, index) => (
                  <g key={index}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="5"
                      fill="#2563eb"
                    />
                    <text
                      x={point.x}
                      y="180"
                      fontSize="10"
                      textAnchor="middle"
                      fill="#64748b"
                    >
                      {point.label}
                    </text>
                  </g>
                ))}
              </svg>

              <p style={{ color: "#64748b", fontSize: "13px" }}>
                Scores are shown from oldest to newest.
              </p>
            </>
          ) : (
            <p style={{ color: "#64748b" }}>
              Your score chart will appear after your first completed
              interview.
            </p>
          )}
        </div>

        <div style={styles.panel}>
          <h2>Previous Practice Sessions</h2>

          {history.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              No practice sessions found. Complete an interview to see your
              history here.
            </p>
          ) : (
            history.map((session) => (
              <div key={session.id} style={styles.session}>
                <div>
                  <strong>{session.role}</strong>
                  <p style={{ color: "#64748b", margin: "6px 0 0" }}>
                    {session.total_questions} question(s) evaluated
                  </p>
                </div>

                <strong>
                  {Number(session.average_score).toFixed(1)}/10
                </strong>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressDashboard;
