
import os
import json
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash
from fastapi import (
    FastAPI,
    HTTPException,
    Depends
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from google import genai
from google.genai import types


# --------------------------------------------------
# 1. ENVIRONMENT CONFIGURATION
# --------------------------------------------------

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "users.db"

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer()


# --------------------------------------------------
# 2. FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="SmartPrep AI API",
    description="AI-powered Mock Interview and Performance Analysis System",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# --------------------------------------------------
# 3. DATABASE CONNECTION
# --------------------------------------------------

def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    connection = get_connection()

    # Users table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            age INTEGER,
            target_role TEXT,
            preferred_company TEXT,
            college TEXT,
            degree TEXT,
            branch TEXT,
            graduation_year INTEGER,
            technical_skills TEXT
        )
    """)

    # Add profile columns to existing databases
    existing_columns = {
        row["name"]
        for row in connection.execute(
            "PRAGMA table_info(users)"
        ).fetchall()
    }

    new_columns = {
        "age": "INTEGER",
        "target_role": "TEXT",
        "preferred_company": "TEXT",
        "college": "TEXT",
        "degree": "TEXT",
        "branch": "TEXT",
        "graduation_year": "INTEGER",
        "technical_skills": "TEXT"
    }

    for column, column_type in new_columns.items():
        if column not in existing_columns:
            connection.execute(
                f"ALTER TABLE users ADD COLUMN {column} {column_type}"
            )

    # Interview sessions table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            average_score REAL NOT NULL,
            total_questions INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Interview answers table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS interview_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            question_index INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            score REAL NOT NULL,
            strengths TEXT NOT NULL,
            improvements TEXT NOT NULL,
            improved_answer TEXT NOT NULL,
            FOREIGN KEY (session_id)
                REFERENCES interview_sessions(id)
                ON DELETE CASCADE
        )
    """)

    connection.commit()
    connection.close()


initialize_database()


# --------------------------------------------------
# 4. PYDANTIC MODELS
# --------------------------------------------------

class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int | None = Field(default=None, ge=13, le=100)
    target_role: str | None = Field(default=None, max_length=100)
    preferred_company: str | None = Field(default=None, max_length=150)
    college: str | None = Field(default=None, max_length=150)
    degree: str | None = Field(default=None, max_length=100)
    branch: str | None = Field(default=None, max_length=100)
    graduation_year: int | None = Field(default=None, ge=2000, le=2100)
    technical_skills: str | None = Field(default=None, max_length=1000)


class InterviewAnswer(BaseModel):
    role: str
    question: str
    answer: str


class EvaluationResult(BaseModel):
    score: float
    strengths: list[str]
    improvements: list[str]
    improved_answer: str


class SavedEvaluation(BaseModel):
    question: str
    answer: str
    score: float = Field(ge=0, le=10)
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    improved_answer: str = ""
    questionIndex: int = Field(default=0, ge=0)


class SaveInterviewRequest(BaseModel):
    role: str = Field(min_length=1, max_length=100)
    evaluations: list[SavedEvaluation] = Field(min_length=1, max_length=10)


# --------------------------------------------------
# 5. JWT AUTHENTICATION
# --------------------------------------------------

def create_access_token(user_id: int):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET_KEY is missing from .env"
        )

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET_KEY is not configured"
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload.get("sub"))

    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    connection = get_connection()

    user = connection.execute(
        """
        SELECT
            id,
            name,
            email,
            created_at,
            age,
            target_role,
            preferred_company,
            college,
            degree,
            branch,
            graduation_year,
            technical_skills
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return dict(user)


# --------------------------------------------------
# 6. HOME AND HEALTH ROUTES
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to SmartPrep AI Backend!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "application": "SmartPrep AI"
    }


# --------------------------------------------------
# 7. USER SIGNUP
# --------------------------------------------------

@app.post("/auth/signup")
def signup(data: SignupRequest):

    connection = get_connection()

    try:
        hashed_password = password_hash.hash(data.password)

        cursor = connection.execute(
            """
            INSERT INTO users (name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                data.name.strip(),
                data.email.lower(),
                hashed_password,
                datetime.now(timezone.utc).isoformat()
            )
        )

        connection.commit()

        return {
            "message": "Account created successfully",
            "user_id": cursor.lastrowid
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    finally:
        connection.close()


# --------------------------------------------------
# 8. USER LOGIN
# --------------------------------------------------

@app.post("/auth/login")
def login(data: LoginRequest):

    connection = get_connection()

    user = connection.execute(
        "SELECT * FROM users WHERE email = ?",
        (data.email.lower(),)
    ).fetchone()

    connection.close()

    if user is None or not password_hash.verify(
        data.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(user["id"])

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }


# --------------------------------------------------
# 9. GET LOGGED-IN USER PROFILE
# --------------------------------------------------

@app.get("/auth/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "user": current_user
    }


# --------------------------------------------------
# 10. UPDATE USER PROFILE
# --------------------------------------------------

@app.put("/auth/profile")
def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    print("AGE RECEIVED FROM FRONTEND:", data.age)

    connection = get_connection()

    try:
        connection.execute(
            """
            UPDATE users
            SET
                name = ?,
                age = ?,
                target_role = ?,
                preferred_company = ?,
                college = ?,
                degree = ?,
                branch = ?,
                graduation_year = ?,
                technical_skills = ?
            WHERE id = ?
            """,
            (
                data.name.strip(),
                data.age,
                data.target_role.strip() if data.target_role else None,
                data.preferred_company.strip() if data.preferred_company else None,
                data.college.strip() if data.college else None,
                data.degree.strip() if data.degree else None,
                data.branch.strip() if data.branch else None,
                data.graduation_year,
                data.technical_skills.strip() if data.technical_skills else None,
                current_user["id"]
            )
        )

        connection.commit()

        updated_user = connection.execute(
            """
            SELECT
                id,
                name,
                email,
                created_at,
                age,
                target_role,
                preferred_company,
                college,
                degree,
                branch,
                graduation_year,
                technical_skills
            FROM users
            WHERE id = ?
            """,
            (current_user["id"],)
        ).fetchone()
        print("AGE SAVED IN DATABASE:", updated_user["age"])

        return {
            "message": "Profile updated successfully",
            "user": dict(updated_user)
        }

    except Exception as error:
        connection.rollback()
        print("Profile update error:", str(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to update profile"
        )

    finally:
        connection.close()


# --------------------------------------------------
# 11. GEMINI INTERVIEW EVALUATION
# --------------------------------------------------

@app.post("/evaluate")
def evaluate_answer(
    data: InterviewAnswer,
    current_user: dict = Depends(get_current_user)
):

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is missing from .env"
        )

    if not data.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty"
        )

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""
You are an experienced technical and HR interview evaluator.

Evaluate the candidate's answer fairly and constructively.

Job Role: {data.role}

Interview Question:
{data.question}

Candidate's Answer:
{data.answer}

Evaluate based on:
1. Relevance to the question.
2. Clarity and structure.
3. Technical or conceptual correctness.
4. Completeness and examples.
5. Professional communication.

Give a score between 0 and 10.

Provide:
- Score
- Strengths
- Improvements
- An improved sample answer

Do not invent candidate experience or qualifications.
Keep feedback specific and useful.
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=EvaluationResult
            )
        )

        result = EvaluationResult.model_validate_json(
            response.text
        )

        return {
            "role": data.role,
            "question": data.question,
            "score": result.score,
            "strengths": result.strengths,
            "improvements": result.improvements,
            "improved_answer": result.improved_answer
        }

    except Exception as error:
        print("Gemini evaluation error:", str(error))

        raise HTTPException(
            status_code=502,
            detail="Unable to evaluate answer. Please try again."
        )


# --------------------------------------------------
# 12. SAVE COMPLETED INTERVIEW
# --------------------------------------------------

@app.post("/interviews/save")
def save_interview(
    data: SaveInterviewRequest,
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()

    try:
        valid_evaluations = []

        for item in data.evaluations:
            if not item.question.strip() or not item.answer.strip():
                continue

            valid_evaluations.append(item)

        if not valid_evaluations:
            raise HTTPException(
                status_code=400,
                detail="No valid interview answers to save"
            )

        average_score = sum(
            item.score for item in valid_evaluations
        ) / len(valid_evaluations)

        cursor = connection.execute(
            """
            INSERT INTO interview_sessions
            (user_id, role, average_score, total_questions, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                current_user["id"],
                data.role.strip(),
                round(average_score, 2),
                len(valid_evaluations),
                datetime.now(timezone.utc).isoformat()
            )
        )

        session_id = cursor.lastrowid

        for item in valid_evaluations:
            connection.execute(
                """
                INSERT INTO interview_answers
                (
                    session_id,
                    question_index,
                    question,
                    answer,
                    score,
                    strengths,
                    improvements,
                    improved_answer
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    item.questionIndex,
                    item.question,
                    item.answer,
                    item.score,
                    json.dumps(item.strengths),
                    json.dumps(item.improvements),
                    item.improved_answer
                )
            )

        connection.commit()

        return {
            "message": "Interview saved successfully",
            "session_id": session_id,
            "average_score": round(average_score, 2),
            "total_questions": len(valid_evaluations)
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception as error:
        connection.rollback()
        print("Save interview error:", str(error))

        raise HTTPException(
            status_code=500,
            detail="Unable to save interview history"
        )

    finally:
        connection.close()


# --------------------------------------------------
# 13. GET USER'S PRACTICE HISTORY
# --------------------------------------------------

@app.get("/interviews/history")
def get_interview_history(
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()

    sessions = connection.execute(
        """
        SELECT
            id,
            role,
            average_score,
            total_questions,
            created_at
        FROM interview_sessions
        WHERE user_id = ?
        ORDER BY created_at DESC
        """,
        (current_user["id"],)
    ).fetchall()

    connection.close()

    return {
        "history": [dict(session) for session in sessions]
    }


# --------------------------------------------------
# 14. GET ONE INTERVIEW'S FULL DETAILS
# --------------------------------------------------

@app.get("/interviews/history/{session_id}")
def get_interview_details(
    session_id: int,
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()

    session = connection.execute(
        """
        SELECT *
        FROM interview_sessions
        WHERE id = ? AND user_id = ?
        """,
        (session_id, current_user["id"])
    ).fetchone()

    if session is None:
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )

    answers = connection.execute(
        """
        SELECT
            question_index,
            question,
            answer,
            score,
            strengths,
            improvements,
            improved_answer
        FROM interview_answers
        WHERE session_id = ?
        ORDER BY question_index ASC, id ASC
        """,
        (session_id,)
    ).fetchall()

    connection.close()

    answer_list = []

    for answer in answers:
        item = dict(answer)
        item["strengths"] = json.loads(item["strengths"])
        item["improvements"] = json.loads(item["improvements"])
        answer_list.append(item)

    return {
        "session": dict(session),
        "answers": answer_list
    }
