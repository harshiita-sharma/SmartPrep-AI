
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Evaluation.css";

function Evaluation() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = location.state?.role || "Software Developer";

  const question =
    location.state?.question ||
    "Tell me about yourself and your background.";

  const answer = location.state?.answer || "";

  const questionIndex = location.state?.questionIndex ?? 0;

  const previousEvaluations =
    location.state?.previousEvaluations || [];

  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // ---------- GEMINI EVALUATION ----------

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function getEvaluation() {
      if (!answer.trim()) {
        setError(
          "Your answer is missing. Return to the question and try again."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setEvaluation(null);

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/evaluate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem(
                "access_token"
              )}`,
            },
            body: JSON.stringify({
              role,
              question,
              answer,
            }),
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.detail ||
              `Evaluation failed (HTTP ${response.status}).`
          );
        }

        if (!cancelled) {
          setEvaluation(data);
        }
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setError(
            err.message || "Could not connect to the backend."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getEvaluation();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [role, question, answer, retryKey]);

  // ---------- RETRY EVALUATION ----------

  function retryEvaluation() {
    setError("");
    setEvaluation(null);
    setRetryKey((previous) => previous + 1);
  }

  // ---------- START NEW INTERVIEW ----------

  function startNewInterview() {
    navigate("/job-role");
  }

  // ---------- CREATE EVALUATION OBJECT ----------

  function createCurrentEvaluation() {
    return {
      question,
      answer,
      score: Number(evaluation.score),
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      improved_answer: evaluation.improved_answer || "",
      questionIndex,
    };
  }

  // ---------- CONTINUE INTERVIEW ----------

  function continueInterview() {
    if (!evaluation) return;

    const currentEvaluation = createCurrentEvaluation();

    const allEvaluations = [
      ...previousEvaluations,
      currentEvaluation,
    ];

    if (questionIndex < 9) {
      navigate("/interview", {
        state: {
          role,
          questionIndex: questionIndex + 1,
          previousEvaluations: allEvaluations,
        },
      });
    } else {
      navigate("/interview-report", {
        state: {
          role,
          evaluations: allEvaluations,
        },
      });
    }
  }

  // ---------- FINISH INTERVIEW EARLY ----------

  function finishInterview() {
    if (!evaluation) return;

    const currentEvaluation = createCurrentEvaluation();

    const allEvaluations = [
      ...previousEvaluations,
      currentEvaluation,
    ];

    navigate("/interview-report", {
      state: {
        role,
        evaluations: allEvaluations,
      },
    });
  }

  // ---------- RETURN TO QUESTION ----------

  function returnToQuestion() {
    navigate("/interview", {
      state: {
        role,
        questionIndex,
        question,
        answer,
        previousEvaluations,
      },
    });
  }

  // ---------- UI ----------

  return (
    <div className="evaluation-page">
      <header className="evaluation-header">
        <div className="evaluation-logo">
          🎯 SMARTPREP AI
        </div>

        <button
          className="back-interview-btn"
          onClick={startNewInterview}
        >
          New Interview
        </button>
      </header>

      <main className="evaluation-container">
        <div className="evaluation-title">
          <p>AI PERFORMANCE ANALYSIS</p>

          <h1>Your Interview Feedback</h1>

          <span>
            {role} • Question{" "}
            {String(questionIndex + 1).padStart(2, "0")} / 10
          </span>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="score-card" aria-live="polite">
            <div>
              <h2>Analyzing your answer...</h2>

              <p>
                Gemini is preparing your feedback. Please wait.
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}

        {error && !loading && (
          <div className="feedback-card" role="alert">
            <h3>Evaluation unavailable</h3>

            <p>{error}</p>

            <button onClick={retryEvaluation}>
              Retry This Answer
            </button>

            <button
              className="back-interview-btn"
              onClick={returnToQuestion}
            >
              Return to This Question
            </button>
          </div>
        )}

        {/* SUCCESSFUL EVALUATION */}

        {evaluation && !loading && (
          <>
            <div className="score-card">
              <div>
                <p>ANSWER SCORE</p>

                <h2>
                  {evaluation.score}
                  <span>/10</span>
                </h2>
              </div>

              <div className="score-message">
                <strong>
                  {evaluation.score >= 8
                    ? "Excellent Performance!"
                    : evaluation.score >= 6
                    ? "Good Progress!"
                    : "Room to Improve"}
                </strong>

                <p>
                  AI-generated feedback, not an official hiring assessment.
                </p>
              </div>
            </div>

            {/* STRENGTHS AND IMPROVEMENTS */}

            <div className="feedback-grid">
              <div className="feedback-card">
                <h3>✓ Strengths</h3>

                <ul>
                  {(evaluation.strengths || []).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="feedback-card">
                <h3>⚠ Areas to Improve</h3>

                <ul>
                  {(evaluation.improvements || []).map(
                    (item, index) => (
                      <li key={index}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* USER ANSWER */}

            <div className="answer-section">
              <h2>Your Answer</h2>

              <div className="answer-box">
                {answer}
              </div>
            </div>

            {/* IMPROVED ANSWER */}

            <div className="improved-section">
              <p>AI SUGGESTION</p>

              <h2>Improved Answer</h2>

              <div className="improved-box">
                {evaluation.improved_answer}
              </div>
            </div>

            {/* ACTION BUTTONS */}

            <div className="evaluation-actions">
              <button
                className="continue-btn"
                onClick={continueInterview}
              >
                {questionIndex < 9
                  ? "Continue Interview →"
                  : "View Final Report →"}
              </button>

              {questionIndex < 9 && (
                <button
                  className="finish-interview-btn"
                  onClick={finishInterview}
                >
                  Finish Interview & View Report
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Evaluation;
