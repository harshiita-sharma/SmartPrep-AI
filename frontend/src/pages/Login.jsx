
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "http://127.0.0.1:8000";

export default function Login() {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";

      const body = isSignup
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong.");
      }

      if (isSignup) {
        setMessage("Account created! You can now log in.");
        setIsSignup(false);
        setPassword("");
      } else {
        sessionStorage.setItem("access_token", data.access_token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        navigate("/job-role");
      }
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that FastAPI is running."
          : error.message
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-background-glow glow-one"></div>
      <div className="login-background-glow glow-two"></div>

      <div className="login-container">
        <section className="login-intro">
          <Link to="/" className="login-brand">
            <span className="brand-icon">✦</span>
            SMARTPREP<span>AI</span>
          </Link>

          <div className="intro-content">
            <div className="intro-tag">
              <span className="status-dot"></span>
              YOUR PERSONAL AI INTERVIEW COACH
            </div>

            <h1>
              Your next opportunity
              <br />
              starts <span>with practice.</span>
            </h1>

            <p>
              Build confidence, improve your answers, and prepare
              for your next interview with intelligent AI-powered feedback.
            </p>

            <div className="intro-features">
              <div className="intro-feature">
                <span>✧</span>
                <div>
                  <strong>Smart Interview Practice</strong>
                  <small>Practice questions based on your chosen role.</small>
                </div>
              </div>

              <div className="intro-feature">
                <span>◈</span>
                <div>
                  <strong>AI-Powered Feedback</strong>
                  <small>Understand your strengths and areas to improve.</small>
                </div>
              </div>

              <div className="intro-feature">
                <span>↗</span>
                <div>
                  <strong>Track Your Progress</strong>
                  <small>Learn from every interview session.</small>
                </div>
              </div>
            </div>
          </div>

          <p className="intro-footer">
            PRACTICE SMARTER. INTERVIEW BETTER.
          </p>
        </section>

        <section className="login-form-section">
          <div className="login-card">
            <div className="form-top">
              <div className="form-icon">✦</div>
              <span className="form-label">SMARTPREP AI ACCOUNT</span>
            </div>

            <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>

            <p className="form-description">
              {isSignup
                ? "Join SmartPrep and start your interview preparation."
                : "Enter your details to continue your preparation."}
            </p>

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <label className="login-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={1}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label className="login-field">
                <span>Email Address</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label className="login-field">
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={isSignup ? 8 : 1}
                  maxLength={128}
                  required
                />
              </label>

              <button
                type="submit"
                className="login-submit"
                disabled={isLoading}
              >
                {isLoading
                  ? "Please wait..."
                  : isSignup
                    ? "Create Account →"
                    : "Login to Your Account →"}
              </button>
            </form>

            {message && (
              <p
                className={`login-message ${
                  message.startsWith("Account created") ? "success" : "error"
                }`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            )}

            <div className="login-divider">
              <span>OR</span>
            </div>

            <p className="login-switch">
              {isSignup
                ? "Already have an account?"
                : "New to SmartPrep AI?"}

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsSignup(!isSignup);
                  setMessage("");
                }}
              >
                {isSignup ? " Login" : " Create an account"}
              </button>
            </p>

            <Link to="/" className="back-home">
              ← Back to Home
            </Link>
          </div>

          <p className="login-copyright">
            © 2026 SmartPrep AI. All rights reserved.
          </p>
        </section>
      </div>
    </main>
  );
}
