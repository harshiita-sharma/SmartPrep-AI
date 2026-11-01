
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import JobRole from "./pages/JobRole";
import Interview from "./pages/Interview";
import Evaluation from "./pages/Evaluation";
import InterviewReport from "./pages/InterviewReport";
import PracticeHistory from "./pages/PracticeHistory";
import PracticeHistoryDetail from "./pages/PracticeHistoryDetail";
import ProgressDashboard from "./pages/ProgressDashboard";

import "./App.css";
import "./pages/Profile.css";

// ---------- NAVIGATION BAR ----------

function AuthBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="auth-navbar">
      <div
        className="auth-logo"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      >
        SMARTPREP AI
      </div>

      <div className="auth-nav-links">
        <button onClick={() => navigate("/")}>Home</button>

        {location.pathname !== "/" && (
          <button onClick={() => navigate(-1)}>Back</button>
        )}

        <button onClick={() => navigate("/profile")}>
          My Profile
        </button>

        <button onClick={() => navigate("/practice-history")}>
          Practice History
        </button>

        <button onClick={() => navigate("/progress-dashboard")}>
          Progress Dashboard
        </button>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

// ---------- HOME PAGE ----------

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <nav className="home-navbar">
        <div className="logo">SMARTPREP AI</div>

        <div className="home-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>

          <button onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-tagline">
            YOUR PERSONAL AI INTERVIEW COACH
          </p>

          <h1>
            Practice Smart.
            <br />
            <span>Interview Better.</span>
          </h1>

          <p className="hero-description">
            Prepare for your dream job with AI-powered mock interviews.
            Improve your answers, identify your strengths and build
            confidence through practice.
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/login")}
          >
            Start Practicing →
          </button>
        </div>
      </section>

      <section className="features-section" id="features">
        <h2>Why Choose SmartPrep AI?</h2>

        <p className="section-description">
          Everything you need to prepare for your next interview.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <h3>🤖 AI Mock Interviews</h3>
            <p>
              Practice interview questions based on your selected job role.
            </p>
          </div>

          <div className="feature-card">
            <h3>📊 Performance Analysis</h3>
            <p>
              Receive scores, strengths and improvement suggestions
              for your answers.
            </p>
          </div>

          <div className="feature-card">
            <h3>🎯 Role-Based Questions</h3>
            <p>
              Prepare with questions relevant to your career goals.
            </p>
          </div>

          <div className="feature-card">
            <h3>📈 Track Your Progress</h3>
            <p>
              Review your interview history and monitor your progress.
            </p>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <h2>How It Works</h2>

        <div className="steps-grid">
          <div className="step-card">
            <span>01</span>
            <h3>Create Your Account</h3>
            <p>Register and set up your profile.</p>
          </div>

          <div className="step-card">
            <span>02</span>
            <h3>Select Your Role</h3>
            <p>Choose the job role you want to prepare for.</p>
          </div>

          <div className="step-card">
            <span>03</span>
            <h3>Attend Your Interview</h3>
            <p>Answer AI-generated interview questions.</p>
          </div>

          <div className="step-card">
            <span>04</span>
            <h3>Get AI Feedback</h3>
            <p>Review your score and improve your answers.</p>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <h2>Ready to Improve Your Interview Skills?</h2>

        <p>
          Start practicing and work towards becoming interview-ready.
        </p>

        <button
          className="primary-btn"
          onClick={() => navigate("/login")}
        >
          Get Started →
        </button>
      </section>

      <footer className="home-footer">
        <h3>SMARTPREP AI</h3>
        <p>Intelligent Mock Interview and Performance Analysis System</p>
        <p>© 2026 SmartPrep AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ---------- PROFILE PAGE ----------

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    age: "",
    target_role: "",
    preferred_company: "",
    college: "",
    degree: "",
    branch: "",
    graduation_year: "",
    technical_skills: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = sessionStorage.getItem("access_token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Unable to load profile.");
        }

        const user = data.user;

        setProfile({
          name: user.name || "",
          email: user.email || "",
          age: user.age ?? "",
          target_role: user.target_role || "",
          preferred_company: user.preferred_company || "",
          college: user.college || "",
          degree: user.degree || "",
          branch: user.branch || "",
          graduation_year: user.graduation_year ?? "",
          technical_skills: user.technical_skills || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    } else {
      setError("Please log in to view your profile.");
      setLoading(false);
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profile.name,
            age: profile.age === "" ? null : Number(profile.age),
            target_role: profile.target_role || null,
            preferred_company: profile.preferred_company || null,
            college: profile.college || null,
            degree: profile.degree || null,
            branch: profile.branch || null,
            graduation_year:
              profile.graduation_year === ""
                ? null
                : Number(profile.graduation_year),
            technical_skills: profile.technical_skills || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to save profile.");
      }

      const user = data.user;

      setProfile({
        name: user.name || "",
        email: user.email || "",
        age: user.age ?? "",
        target_role: user.target_role || "",
        preferred_company: user.preferred_company || "",
        college: user.college || "",
        degree: user.degree || "",
        branch: user.branch || "",
        graduation_year: user.graduation_year ?? "",
        technical_skills: user.technical_skills || "",
      });

      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-heading">
          <h1>My Profile 👤</h1>
          <p>
            Manage your personal information, education and career preferences.
          </p>
        </div>

        {error && (
          <p className="profile-message profile-error">
            {error}
          </p>
        )}

        <form className="profile-form" onSubmit={handleSave}>
          <h2>Personal Information</h2>

          <div className="profile-grid">
            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
              />
            </div>

            <div className="profile-field">
              <label>Age (Optional)</label>
              <input
                type="number"
                name="age"
                min="13"
                max="100"
                value={profile.age}
                onChange={handleChange}
                placeholder="Enter your age"
              />
            </div>
          </div>

          <h2>Career Preferences</h2>

          <div className="profile-grid">
            <div className="profile-field">
              <label>Target Job Role</label>
              <input
                type="text"
                name="target_role"
                value={profile.target_role}
                onChange={handleChange}
                placeholder="e.g. Software Developer"
              />
            </div>

            <div className="profile-field">
              <label>Preferred Company</label>
              <input
                type="text"
                name="preferred_company"
                value={profile.preferred_company}
                onChange={handleChange}
                placeholder="e.g. Google, Microsoft"
              />
            </div>
          </div>

          <h2>Education Details</h2>

          <div className="profile-grid">
            <div className="profile-field">
              <label>College / University</label>
              <input
                type="text"
                name="college"
                value={profile.college}
                onChange={handleChange}
                placeholder="Enter your college"
              />
            </div>

            <div className="profile-field">
              <label>Degree</label>
              <input
                type="text"
                name="degree"
                value={profile.degree}
                onChange={handleChange}
                placeholder="e.g. B.Tech"
              />
            </div>

            <div className="profile-field">
              <label>Branch</label>
              <input
                type="text"
                name="branch"
                value={profile.branch}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
              />
            </div>

            <div className="profile-field">
              <label>Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                min="2000"
                max="2100"
                value={profile.graduation_year}
                onChange={handleChange}
                placeholder="e.g. 2028"
              />
            </div>
          </div>

          <h2>Technical Skills</h2>

          <div className="profile-field">
            <label>Your Technical Skills</label>
            <textarea
              name="technical_skills"
              value={profile.technical_skills}
              onChange={handleChange}
              placeholder="e.g. Python, C, Java, React, SQL"
              rows="4"
              maxLength={1000}
            />
          </div>

          {message && (
            <p className="profile-message">{message}</p>
          )}

          <button
            type="submit"
            className="profile-save-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <div className="profile-navigation">
          <button
            type="button"
            onClick={() => navigate("/practice-history")}
          >
            📚 View Practice History →
          </button>

          <button
            type="button"
            onClick={() => navigate("/progress-dashboard")}
          >
            📊 View Progress →
          </button>

          <button
            type="button"
            onClick={() => navigate("/job-role")}
          >
            🎯 Start Interview →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- PROTECTED ROUTE ----------

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <AuthBar />
      {children}
    </>
  );
}

// ---------- MAIN APP ----------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-role"
          element={
            <ProtectedRoute>
              <JobRole />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/evaluation"
          element={
            <ProtectedRoute>
              <Evaluation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview-report"
          element={
            <ProtectedRoute>
              <InterviewReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/practice-history"
          element={
            <ProtectedRoute>
              <PracticeHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/practice-history/:sessionId"
          element={
            <ProtectedRoute>
              <PracticeHistoryDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress-dashboard"
          element={
            <ProtectedRoute>
              <ProgressDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
