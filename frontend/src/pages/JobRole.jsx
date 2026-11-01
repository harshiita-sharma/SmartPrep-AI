import { useNavigate } from "react-router-dom";
import "./JobRole.css";

function JobRole() {
  const navigate = useNavigate();

  const roles = [
    "Software Developer",
    "Data Analyst",
    "Web Developer",
    "AI/ML Engineer",
    "Database Administrator",
    "Cybersecurity Analyst",
  ];

  return (
    <div className="role-page">
      <div className="role-container">

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <p className="section-label">SMARTPREP AI</p>

        <h1>Select Your Job Role</h1>

        <p className="role-description">
          Choose the role you are preparing for. Your interview questions
          will be tailored according to your selected role.
        </p>

        <div className="role-grid">
          {roles.map((role) => (
            <button
              key={role}
              className="role-card"
              onClick={() =>
                navigate("/interview", {
                  state: { role },
                })
              }
            >
              <span>💼</span>
              <h3>{role}</h3>
              <p>Practice interview questions</p>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

export default JobRole;