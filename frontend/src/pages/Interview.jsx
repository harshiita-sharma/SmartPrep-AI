
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Interview.css";

const questions = [
  "Tell me about yourself and your background.",
  "Why do you want to work in this role?",
  "What are your greatest strengths?",
  "What is one weakness you are working to improve?",
  "Describe a challenging situation and how you handled it.",
  "How do you manage your time and prioritize tasks?",
  "Where do you see yourself in five years?",
  "Why should we hire you?",
  "How do you handle feedback or criticism?",
  "Do you have any questions for us?",
];

function Interview() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = location.state?.role || "Software Developer";
  const previousEvaluations =
    location.state?.previousEvaluations || [];

  const initialQuestionIndex = location.state?.questionIndex || 0;

  const [questionIndex] = useState(initialQuestionIndex);
  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");
  const [answerError, setAnswerError] = useState("");

  const recognitionRef = useRef(null);

  const currentQuestion = questions[questionIndex];

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const speechSupported = Boolean(SpeechRecognition);

  // Show early-finish option after at least one evaluated answer.
  const canFinishEarly = previousEvaluations.length > 0;

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!speechSupported) {
      setSpeechMessage(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechMessage("Listening... Speak your answer.");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setAnswer((previousAnswer) =>
          previousAnswer
            ? previousAnswer + " " + finalTranscript
            : finalTranscript
        );
      }

      if (interimTranscript) {
        setSpeechMessage("Listening: " + interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      setSpeechMessage("Speech recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsListening(false);
    setSpeechMessage("Speech input stopped.");
  };

  const handleSubmit = () => {
    if (!answer.trim()) {
      setAnswerError(
        "Please enter or speak your answer before continuing."
      );
      return;
    }

    setAnswerError("");

    navigate("/evaluation", {
      state: {
        role,
        question: currentQuestion,
        answer,
        questionIndex,
        previousEvaluations,
      },
    });
  };

  const handleFinishEarly = () => {
    if (!canFinishEarly) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    navigate("/interview-report", {
      state: {
        role,
        evaluations: previousEvaluations,
        previousEvaluations,
        totalQuestions: questions.length,
        attemptedQuestions: previousEvaluations.length,
        completedEarly: true,
      },
    });
  };

  return (
    <div className="interview-page">
      <header className="interview-header">
        <h2>🎯 SMARTPREP AI</h2>

        <button
          type="button"
          className="change-role-btn"
          onClick={() => navigate("/job-role")}
        >
          Change Role
        </button>
      </header>

      <main className="interview-container">
        <div className="interview-heading">
          <span className="interview-label">AI MOCK INTERVIEW</span>

          <h1>Let's Begin Your Interview</h1>

          <p>
            Answer each question clearly and confidently.
            Your responses will be evaluated by AI.
          </p>
        </div>

        <section className="question-card">
          <div className="question-top">
            <span className="question-tag">CURRENT ROLE</span>
            <span className="role-name">{role}</span>
          </div>

          <div className="question-progress">
            Question {questionIndex + 1} of {questions.length}
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${
                  ((questionIndex + 1) / questions.length) * 100
                }%`,
              }}
            />
          </div>

          <h2 className="question-text">{currentQuestion}</h2>

          <section className="speech-section">
            <label className="answer-label" htmlFor="answer">
              Your Answer
            </label>

            <textarea
              id="answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your answer here or use the microphone to speak..."
              rows="7"
            />

            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={!speechSupported}
              className={`speech-btn ${
                isListening ? "listening" : ""
              }`}
            >
              {isListening ? "⏹ Stop Speaking" : "🎙 Start Speaking"}
            </button>

            {speechMessage && (
              <p role="status" className="speech-message">
                {speechMessage}
              </p>
            )}

            {!speechSupported && (
              <p className="speech-message">
                Speech recognition is unavailable in this browser.
                You can still type your answer.
              </p>
            )}
          </section>

          {answerError && (
            <p role="alert" className="answer-error">
              {answerError}
            </p>
          )}

          <div className="interview-actions">
            <button
              type="button"
              className="submit-answer-btn"
              onClick={handleSubmit}
            >
              Submit Answer →
            </button>

            {canFinishEarly && (
              <button
                type="button"
                className="finish-interview-btn"
                onClick={handleFinishEarly}
              >
                Finish Interview & View Report
              </button>
            )}
          </div>
        </section>

        <div className="interview-footer">
          <p>
            Take your time. Think clearly and answer naturally.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Interview;
