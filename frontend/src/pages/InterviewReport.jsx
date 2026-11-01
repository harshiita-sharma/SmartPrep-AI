
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./InterviewReport.css";

function cleanItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (typeof item !== "string" || !item.trim()) return false;

    const key = item.trim().toLowerCase().replace(/[.!]+$/, "");
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function InterviewReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = location.state?.role || "Software Developer";
  const evaluations = location.state?.evaluations || [];

  const [saveStatus, setSaveStatus] = useState("saving");
  const [saveMessage, setSaveMessage] = useState("");

  const saveStarted = useRef(false);

  const validEvaluations = evaluations.filter(
    (item) =>
      item &&
      item.score !== null &&
      item.score !== undefined &&
      item.score !== "" &&
      Number.isFinite(Number(item.score))
  );

  const completedEarly =
    location.state?.completedEarly ??
    validEvaluations.length < 10;

  const totalScore = validEvaluations.reduce(
    (total, item) =>
      total + Math.min(10, Math.max(0, Number(item.score))),
    0
  );

  const average = validEvaluations.length
    ? totalScore / validEvaluations.length
    : 0;

  const averageScore = average.toFixed(1);

  const strengths = cleanItems(
    validEvaluations.flatMap((item) =>
      Array.isArray(item.strengths) ? item.strengths : []
    )
  );

  const improvements = cleanItems(
    validEvaluations.flatMap((item) =>
      Array.isArray(item.improvements) ? item.improvements : []
    )
  );

  const strongestAnswer = validEvaluations.length
    ? validEvaluations.reduce((best, item) =>
        Number(item.score) > Number(best.score) ? item : best
      )
    : null;

  const weakestAnswer = validEvaluations.length
    ? validEvaluations.reduce((worst, item) =>
        Number(item.score) < Number(worst.score) ? item : worst
      )
    : null;

  const practicePlan = improvements.slice(0, 3);

  // SAVE INTERVIEW REPORT
  useEffect(() => {
    if (validEvaluations.length === 0 || saveStarted.current) {
      return;
    }

    saveStarted.current = true;

    async function saveInterview() {
      try {
        const token = sessionStorage.getItem("access_token");

        if (!token) {
          throw new Error(
            "Please log in again to save your practice history."
          );
        }

        const payload = {
          role,
          evaluations: validEvaluations.map((item, index) => ({
            question: item.question || "Interview question",
            answer: item.answer || "",
            score: Math.min(10, Math.max(0, Number(item.score))),
            strengths: item.strengths || [],
            improvements: item.improvements || [],
            improved_answer: item.improved_answer || "",
            questionIndex: Number.isInteger(Number(item.questionIndex))
              ? Number(item.questionIndex)
              : index,
          })),
        };

        const response = await fetch(
          "http://127.0.0.1:8000/interviews/save",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to save your interview report."
          );
        }

        if (!data.session_id) {
          throw new Error("The backend did not return a session ID.");
        }

        setSaveStatus("saved");
        setSaveMessage(
          `Your interview report has been saved successfully. Session ID: ${data.session_id}`
        );
      } catch (error) {
        console.error("Interview history save error:", error);
        setSaveStatus("error");
        setSaveMessage(
          error.message || "Something went wrong while saving."
        );
      }
    }

    saveInterview();
  }, [role, validEvaluations]);

  // EMPTY REPORT
  if (validEvaluations.length === 0) {
    return (
      <div className="report-page">
        <main className="report-container">
          <h1>No interview report yet</h1>
          <p>
            Complete and submit at least one interview answer to see
            your performance analysis.
          </p>

          <button onClick={() => navigate("/job-role")}>
            Start Interview
          </button>
        </main>
      </div>
    );
  }

  // REPORT UI
  return (
    <div className="report-page">
      <header className="report-header">
        <div className="report-logo">🎯 SMARTPREP AI</div>

        <button onClick={() => navigate("/job-role")}>
          New Interview
        </button>
      </header>

      <main className="report-container">
        <section className="report-heading">
          <p className="report-label">
            {completedEarly
              ? "INTERVIEW FINISHED EARLY"
              : "INTERVIEW COMPLETED"}
          </p>

          <h1>Your Interview Performance Report</h1>

          <p>
            Role: <strong>{role}</strong>
          </p>

          <p>
            You evaluated {validEvaluations.length} out of 10 questions.
            Your average score is calculated using only your evaluated
            answers.
          </p>
        </section>

        {/* SAVE STATUS */}
        <section className="report-save-status" aria-live="polite">
          {saveStatus === "saving" && (
            <p>⏳ Saving your interview report to Practice History...</p>
          )}

          {saveStatus === "saved" && (
            <p>✅ {saveMessage}</p>
          )}

          {saveStatus === "error" && (
            <p>
              ⚠️ {saveMessage} Your report is visible, but it has not
              been saved to history.
            </p>
          )}
        </section>

        {/* SUMMARY */}
        <section className="report-summary">
          <div className="report-score">
            <span>AVERAGE SCORE</span>

            <strong>
              {averageScore}
              <small>/10</small>
            </strong>

            <div
              className="report-score-track"
              role="progressbar"
              aria-label="Average interview score"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={Number(averageScore)}
            >
              <div
                className="report-score-fill"
                style={{
                  width: `${Math.min(100, average * 10)}%`,
                }}
              />
            </div>

            <p>
              {average >= 8
                ? "Excellent work! Keep practising."
                : average >= 6
                ? "Good progress! Keep improving."
                : "Keep practising and focus on your feedback."}
            </p>
          </div>

          <div className="report-stat">
            <span>Questions Evaluated</span>
            <strong>{validEvaluations.length} / 10</strong>
          </div>

          <div className="report-stat">
            <span>Total Score</span>
            <strong>
              {totalScore.toFixed(0)} / {validEvaluations.length * 10}
            </strong>
          </div>
        </section>

        {/* PERFORMANCE OVERVIEW */}
        <section className="report-section">
          <h2>Performance Overview</h2>

          <div className="report-highlight-grid">
            <article className="report-highlight">
              <span className="highlight-icon">🏆</span>
              <h3>Strongest Answer</h3>
              <p>{strongestAnswer.question}</p>
              <strong>{Number(strongestAnswer.score)}/10</strong>
            </article>

            <article className="report-highlight">
              <span className="highlight-icon">🎯</span>
              <h3>Needs Most Practice</h3>
              <p>{weakestAnswer.question}</p>
              <strong>{Number(weakestAnswer.score)}/10</strong>
            </article>
          </div>

          <p className="report-note">
            These highlights are based on your evaluated question scores.
          </p>
        </section>

        {/* QUESTION-WISE PERFORMANCE */}
        <section className="report-section">
          <h2>Question-wise Performance</h2>

          <div className="report-question-list">
            {validEvaluations.map((item, index) => (
              <article className="report-question" key={index}>
                <div className="report-question-top">
                  <span>
                    Question{" "}
                    {String(
                      Number.isInteger(Number(item.questionIndex))
                        ? Number(item.questionIndex) + 1
                        : index + 1
                    ).padStart(2, "0")}
                  </span>

                  <strong>{Number(item.score)}/10</strong>
                </div>

                <p>{item.question || "Interview question"}</p>

                <div className="report-score-track">
                  <div
                    className="report-score-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, Number(item.score) * 10)
                      )}%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* STRENGTHS AND IMPROVEMENTS */}
        <section className="report-feedback-grid">
          <article className="report-feedback-card">
            <h2>✓ Key Strengths</h2>

            {strengths.length > 0 ? (
              <ul>
                {strengths.slice(0, 8).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No strengths were returned in the evaluations.</p>
            )}
          </article>

          <article className="report-feedback-card">
            <h2>↗ Areas to Improve</h2>

            {improvements.length > 0 ? (
              <ul>
                {improvements.slice(0, 8).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No improvement suggestions were returned.</p>
            )}
          </article>
        </section>

        {/* PRACTICE PLAN */}
        <section className="report-section report-plan">
          <p className="report-label">YOUR NEXT STEPS</p>
          <h2>Personalized Practice Plan</h2>

          {practicePlan.length > 0 ? (
            <ol>
              {practicePlan.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          ) : (
            <p>
              Continue practising and review your question-wise feedback.
            </p>
          )}
        </section>

        <div className="report-disclaimer">
          Scores and suggestions are AI-generated practice feedback, not
          an official hiring assessment.
        </div>

        <div className="report-actions">
          <button onClick={() => navigate("/job-role")}>
            Start Another Interview →
          </button>
        </div>
      </main>
    </div>
  );
}

export default InterviewReport;
