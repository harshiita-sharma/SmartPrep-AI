
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PracticeHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
          throw new Error("Please log in to view your practice history.");
        }

        const response = await fetch(
          "http://127.0.0.1:8000/interviews/history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load practice history."
          );
        }

        setHistory(data.history || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <button
          style={styles.backButton}
          onClick={() => navigate("/profile")}
        >
          ← Back to Profile
        </button>

        <header style={styles.header}>
          <div style={styles.iconBox}>📚</div>

          <h1 style={styles.heading}>My Practice History</h1>

          <p style={styles.subtitle}>
            Review your previous interviews and track your progress.
          </p>
        </header>

        {loading && (
          <div style={styles.messageCard}>
            <p>Loading your practice history...</p>
          </div>
        )}

        {error && (
          <div style={styles.errorCard}>
            <p>{error}</p>
            <button
              style={styles.primaryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>🎯</div>
            <h2>No practice sessions yet</h2>
            <p>
              Your completed interviews will appear here. Start practising
              to build your interview history.
            </p>

            <button
              style={styles.primaryButton}
              onClick={() => navigate("/job-role")}
            >
              Start Your First Interview →
            </button>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <>
            <div style={styles.sectionHeader}>
              <h2>Previous Sessions</h2>
              <span style={styles.sessionCount}>
                {history.length} {history.length === 1 ? "Session" : "Sessions"}
              </span>
            </div>

            <div style={styles.list}>
              {history.map((session) => (
                <article key={session.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div style={styles.roleSection}>
                      <div style={styles.roleIcon}>💼</div>

                      <div>
                        <h3 style={styles.roleTitle}>
                          {session.role}
                        </h3>

                        <p style={styles.date}>
                          {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div style={styles.scoreBox}>
                      <span style={styles.scoreLabel}>AVERAGE SCORE</span>
                      <strong style={styles.score}>
                        {Number(session.average_score).toFixed(1)}
                        <small style={styles.scoreSmall}>/10</small>
                      </strong>
                    </div>
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.cardBottom}>
                    <div style={styles.questionInfo}>
                      <span>📝</span>
                      <span>
                        {session.total_questions} question(s) evaluated
                      </span>
                    </div>

                    <button
                      style={styles.viewButton}
                      onClick={() =>
                        navigate(`/practice-history/${session.id}`)
                      }
                    >
                      View Full Session →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div style={styles.bottomAction}>
          <button
            style={styles.primaryButton}
            onClick={() => navigate("/job-role")}
          >
            + Start New Interview
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#f5f7fb",
    padding: "35px 20px 60px",
    boxSizing: "border-box",
    color: "#172554",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    width: "100%",
  },

  backButton: {
    padding: "10px 16px",
    border: "1px solid #dbe2ef",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },

  header: {
    textAlign: "center",
    margin: "35px 0 45px",
  },

  iconBox: {
    fontSize: "32px",
    marginBottom: "12px",
  },

  heading: {
    fontSize: "clamp(30px, 5vw, 46px)",
    fontWeight: "800",
    color: "#172554",
    margin: "0 0 12px",
  },

  subtitle: {
    fontSize: "17px",
    color: "#64748b",
    margin: "0",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
    color: "#172554",
  },

  sessionCount: {
    background: "#e0e7ff",
    color: "#3730a3",
    padding: "7px 13px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },

  list: {
    display: "grid",
    gap: "18px",
  },

  card: {
    background: "#ffffff",
    color: "#172554",
    padding: "25px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 5px 20px rgba(15, 23, 42, 0.05)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },

  roleSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  roleIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  roleTitle: {
    fontSize: "21px",
    color: "#172554",
    margin: "0 0 6px",
    fontWeight: "700",
  },

  date: {
    color: "#64748b",
    fontSize: "13px",
    margin: "0",
  },

  scoreBox: {
    textAlign: "right",
  },

  scoreLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "5px",
  },

  score: {
    color: "#15803d",
    fontSize: "29px",
    fontWeight: "800",
  },

  scoreSmall: {
    fontSize: "15px",
    color: "#64748b",
  },

  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "22px 0",
  },

  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },

  questionInfo: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#475569",
    fontSize: "14px",
  },

  viewButton: {
    background: "#eef2ff",
    color: "#3730a3",
    border: "none",
    padding: "12px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "45px 25px",
    textAlign: "center",
    color: "#172554",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "15px",
  },

  messageCard: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#334155",
  },

  errorCard: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    padding: "25px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#b91c1c",
  },

  primaryButton: {
    background: "#4338ca",
    color: "#ffffff",
    border: "none",
    padding: "13px 22px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },

  bottomAction: {
    textAlign: "center",
    marginTop: "35px",
  },
};

export default PracticeHistory;
