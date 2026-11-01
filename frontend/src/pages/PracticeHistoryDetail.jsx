
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function PracticeHistoryDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSession() {
      try {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
          throw new Error("Please log in to view this interview.");
        }

        const response = await fetch(
          `http://127.0.0.1:8000/interviews/history/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load interview details."
          );
        }

        setSession(data.session);
        setAnswers(data.answers || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.messageCard}>
          Loading your previous interview...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <main style={styles.container}>
          <button
            style={styles.backButton}
            onClick={() => navigate("/practice-history")}
          >
            ← Back to History
          </button>

          <div style={styles.errorCard}>
            <h2>Unable to load interview</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={styles.page}>
      <main style={styles.container}>
        <button
          style={styles.backButton}
          onClick={() => navigate("/practice-history")}
        >
          ← Back to Practice History
        </button>

        {/* SESSION HEADER */}

        <header style={styles.header}>
          <div style={styles.iconBox}>📋</div>

          <p style={styles.label}>PREVIOUS PRACTICE SESSION</p>

          <h1 style={styles.heading}>Interview Report</h1>

          <h2 style={styles.role}>{session.role}</h2>

          <p style={styles.date}>
            Practiced on:{" "}
            {new Date(session.created_at).toLocaleString()}
          </p>
        </header>

        {/* PERFORMANCE SUMMARY */}

        <section style={styles.summaryCard}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>AVERAGE SCORE</span>
            <strong style={styles.averageScore}>
              {Number(session.average_score).toFixed(1)}
              <small>/10</small>
            </strong>
          </div>

          <div style={styles.summaryDivider} />

          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>QUESTIONS EVALUATED</span>
            <strong style={styles.questionCount}>
              {session.total_questions}
            </strong>
          </div>
        </section>

        {/* QUESTION DETAILS */}

        <section style={styles.questionSection}>
          <div style={styles.sectionHeading}>
            <h2>Question-wise Analysis</h2>
            <span style={styles.countBadge}>
              {answers.length} Questions
            </span>
          </div>

          {answers.map((item, index) => (
            <article
              key={`${item.question_index}-${index}`}
              style={styles.questionCard}
            >
              <div style={styles.questionTop}>
                <span style={styles.questionNumber}>
                  QUESTION{" "}
                  {String(
                    Number(item.question_index) + 1
                  ).padStart(2, "0")}
                </span>

                <strong style={styles.questionScore}>
                  {Number(item.score).toFixed(1)}/10
                </strong>
              </div>

              <div style={styles.divider} />

              {/* QUESTION */}

              <div style={styles.contentBlock}>
                <h3 style={styles.contentHeading}>
                  💬 Interview Question
                </h3>
                <p style={styles.contentText}>
                  {item.question}
                </p>
              </div>

              {/* USER ANSWER */}

              <div style={styles.answerBlock}>
                <h3 style={styles.contentHeading}>
                  ✍️ Your Submitted Answer
                </h3>
                <p style={styles.contentText}>
                  {item.answer}
                </p>
              </div>

              {/* STRENGTHS */}

              <div style={styles.feedbackBlock}>
                <h3 style={styles.strengthHeading}>
                  ✓ Key Strengths
                </h3>

                {item.strengths?.length > 0 ? (
                  <ul style={styles.list}>
                    {item.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.mutedText}>
                    No strengths recorded.
                  </p>
                )}
              </div>

              {/* IMPROVEMENTS */}

              <div style={styles.feedbackBlock}>
                <h3 style={styles.improvementHeading}>
                  ↗ Areas to Improve
                </h3>

                {item.improvements?.length > 0 ? (
                  <ul style={styles.list}>
                    {item.improvements.map((improvement, i) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={styles.mutedText}>
                    No improvements recorded.
                  </p>
                )}
              </div>

              {/* IMPROVED ANSWER */}

              <div style={styles.improvedAnswerBlock}>
                <h3 style={styles.improvedHeading}>
                  ✨ Improved Sample Answer
                </h3>

                <p style={styles.improvedText}>
                  {item.improved_answer ||
                    "No improved answer was recorded."}
                </p>
              </div>
            </article>
          ))}
        </section>

        {/* FOOTER ACTIONS */}

        <div style={styles.bottomActions}>
          <button
            style={styles.secondaryButton}
            onClick={() => navigate("/practice-history")}
          >
            ← Back to History
          </button>

          <button
            style={styles.primaryButton}
            onClick={() => navigate("/job-role")}
          >
            Start New Interview →
          </button>
        </div>

        <p style={styles.disclaimer}>
          This report contains AI-generated practice feedback and is not an
          official hiring assessment.
        </p>
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
    maxWidth: "900px",
    width: "100%",
    margin: "0 auto",
  },

  backButton: {
    padding: "10px 16px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #dbe2ef",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  header: {
    textAlign: "center",
    margin: "35px 0",
  },

  iconBox: {
    fontSize: "36px",
    marginBottom: "12px",
  },

  label: {
    color: "#4f46e5",
    fontWeight: "700",
    fontSize: "12px",
    letterSpacing: "1.5px",
  },

  heading: {
    color: "#172554",
    fontSize: "clamp(30px, 5vw, 42px)",
    margin: "10px 0",
  },

  role: {
    color: "#334155",
    fontSize: "21px",
    margin: "10px 0",
  },

  date: {
    color: "#64748b",
    fontSize: "14px",
  },

  summaryCard: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    background: "#ffffff",
    padding: "28px 20px",
    borderRadius: "15px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 5px 20px rgba(15,23,42,0.04)",
    marginBottom: "40px",
  },

  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1px",
  },

  averageScore: {
    color: "#15803d",
    fontSize: "34px",
  },

  questionCount: {
    color: "#3730a3",
    fontSize: "32px",
  },

  summaryDivider: {
    width: "1px",
    height: "55px",
    background: "#e2e8f0",
  },

  questionSection: {
    marginBottom: "35px",
  },

  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
    color: "#172554",
  },

  countBadge: {
    background: "#e0e7ff",
    color: "#3730a3",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },

  questionCard: {
    background: "#ffffff",
    color: "#172554",
    border: "1px solid #e2e8f0",
    borderRadius: "15px",
    padding: "25px",
    marginBottom: "22px",
    boxShadow: "0 5px 20px rgba(15,23,42,0.04)",
  },

  questionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  questionNumber: {
    color: "#4f46e5",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1px",
  },

  questionScore: {
    color: "#15803d",
    fontSize: "20px",
  },

  divider: {
    height: "1px",
    background: "#e2e8f0",
    margin: "18px 0",
  },

  contentBlock: {
    background: "#f8fafc",
    padding: "17px",
    borderRadius: "10px",
    marginBottom: "18px",
  },

  answerBlock: {
    background: "#f8fafc",
    padding: "17px",
    borderRadius: "10px",
    marginBottom: "18px",
  },

  contentHeading: {
    color: "#334155",
    fontSize: "15px",
    margin: "0 0 10px",
  },

  contentText: {
    color: "#334155",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
    margin: "0",
  },

  feedbackBlock: {
    margin: "22px 0",
  },

  strengthHeading: {
    color: "#15803d",
    fontSize: "16px",
  },

  improvementHeading: {
    color: "#b45309",
    fontSize: "16px",
  },

  list: {
    color: "#475569",
    lineHeight: "1.8",
    paddingLeft: "22px",
  },

  mutedText: {
    color: "#64748b",
  },

  improvedAnswerBlock: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    padding: "18px",
    borderRadius: "11px",
    marginTop: "22px",
  },

  improvedHeading: {
    color: "#3730a3",
    fontSize: "16px",
    marginTop: "0",
  },

  improvedText: {
    color: "#334155",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
  },

  bottomActions: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginTop: "35px",
  },

  primaryButton: {
    background: "#4338ca",
    color: "#ffffff",
    border: "none",
    padding: "13px 22px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
  },

  secondaryButton: {
    background: "#ffffff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
    padding: "13px 22px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
  },

  disclaimer: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "30px",
  },

  messageCard: {
    maxWidth: "500px",
    margin: "100px auto",
    padding: "30px",
    background: "#ffffff",
    borderRadius: "12px",
    textAlign: "center",
    color: "#334155",
  },

  errorCard: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "25px",
    borderRadius: "12px",
    marginTop: "30px",
  },
};

export default PracticeHistoryDetail;
