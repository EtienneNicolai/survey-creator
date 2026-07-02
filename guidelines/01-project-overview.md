# Guideline 01 — Project Overview & Shared Contracts

## Goal
Build a full survey platform where:
1. Clients register and log in to their own account
2. They build surveys in a drag-and-drop builder (NPS, rating, multiple choice, open text questions)
3. They share a unique link — anyone with the link can fill in the survey with no login required
4. Responses are stored permanently in the database
5. The client views live results (charts per question type) as responses come in
6. A survey can be toggled active/inactive to stop accepting responses

## What is different from the survey analyser
The survey analyser uploaded an existing CSV and analysed it in memory. This project:
- Has user accounts and authentication
- Stores everything in a database (SQLAlchemy + SQLite locally, PostgreSQL on Railway)
- Has a survey builder UI instead of a column mapper
- Has a public response form accessible without login
- Has no AI analysis layer (results are pure aggregation)

## Database Models
Defined in `backend/src/data/models.py`. All sessions import from here — do not redefine elsewhere.

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime
import secrets

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    surveys = relationship("Survey", back_populates="owner", cascade="all, delete-orphan")

class Survey(Base):
    __tablename__ = "surveys"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    share_token = Column(String, unique=True, default=lambda: secrets.token_urlsafe(8))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="surveys")
    questions = relationship(
        "Question", back_populates="survey",
        cascade="all, delete-orphan",
        order_by="Question.order_index"
    )
    responses = relationship("Response", back_populates="survey", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    type = Column(String, nullable=False)   # "nps" | "rating" | "choice" | "text"
    label = Column(String, nullable=False)
    options = Column(JSON, nullable=True)   # list[str] for choice questions, None otherwise
    order_index = Column(Integer, nullable=False, default=0)
    scale_max = Column(Integer, nullable=True)  # 5 or 10 for rating/nps
    survey = relationship("Survey", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    survey = relationship("Survey", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    value = Column(Text, nullable=False)
    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
```

## API Contracts
All backend routes use the `/api/` prefix except public survey routes (`/s/`).
This avoids conflicts with React Router's client-side routes on the same domain.

### Auth
**POST /api/auth/register**
Request: `{"email": "user@example.com", "password": "secret123"}`
Response `201`: `{"access_token": "eyJ...", "token_type": "bearer"}`
Response `400`: `{"detail": "Email already registered"}`

**POST /api/auth/login**
Request: `{"email": "user@example.com", "password": "secret123"}`
Response `200`: `{"access_token": "eyJ...", "token_type": "bearer"}`
Response `401`: `{"detail": "Invalid credentials"}`

**GET /api/auth/me**
Header: `Authorization: Bearer <token>`
Response `200`: `{"id": 1, "email": "user@example.com"}`

### Surveys (all require auth header)
**GET /api/surveys** → list of surveys with response_count
```json
[{"id": 1, "title": "Customer Feedback", "is_active": true, "response_count": 42, "created_at": "2025-01-15T09:23:00"}]
```

**POST /api/surveys** → `{"title": "...", "description": "..."}` → full Survey object

**GET /api/surveys/{id}** → Survey with questions array

**PUT /api/surveys/{id}** → `{"title": "...", "description": "..."}` → updated Survey

**DELETE /api/surveys/{id}** → `{"ok": true}`

**PUT /api/surveys/{id}/toggle** → `{"is_active": true}` or `{"is_active": false}`

### Questions (all require auth)
**POST /api/surveys/{id}/questions**
Request: `{"type": "rating", "label": "How satisfied were you?", "scale_max": 5, "options": null}`
Response `201`: Question object

**PUT /api/questions/{id}**
Request: `{"label": "...", "options": [...], "scale_max": 5}`
Response `200`: updated Question object

**DELETE /api/questions/{id}** → `{"ok": true}`

**POST /api/surveys/{id}/questions/reorder**
Request: `{"question_ids": [3, 1, 2]}` (ordered list of question IDs)
Response `200`: `{"ok": true}`

### Public (no auth required)
**GET /s/{token}** → Survey with questions (only if is_active=true)
Response `404` if token not found or survey inactive.

**POST /s/{token}/submit**
Request: `{"answers": [{"question_id": 1, "value": "4"}, {"question_id": 2, "value": "Great service"}]}`
Response `200`: `{"ok": true}`
Response `404`: survey not found or inactive

### Results (requires auth, must own the survey)
**GET /api/surveys/{id}/results**
```json
{
  "survey": {"id": 1, "title": "...", "response_count": 42},
  "total_responses": 42,
  "results": [
    {
      "question": {"id": 1, "type": "nps", "label": "Would you recommend us?", "scale_max": 10},
      "response_count": 40,
      "nps": {"score": 42.0, "promoter_pct": 58.0, "passive_pct": 26.0, "detractor_pct": 16.0,
               "promoter_count": 23, "passive_count": 10, "detractor_count": 7},
      "rating": null,
      "choice": null,
      "text_answers": null
    },
    {
      "question": {"id": 3, "type": "text", "label": "What could we improve?", "scale_max": null},
      "response_count": 38,
      "nps": null,
      "rating": null,
      "choice": null,
      "text_answers": [{"response_id": 1, "value": "Faster delivery"}, ...]
    }
  ]
}
```

## Session Boundaries
- **Session 1** owns: `backend/src/data/models.py`, `backend/src/data/database.py`, Alembic setup
- **Session 2** owns: `backend/src/auth/`, `/api/auth` routes
- **Session 3** owns: `/api/surveys` and `/api/questions` routes — parallel with Session 4
- **Session 4** owns: `/s/` public routes and `/api/surveys/{id}/results` — parallel with Session 3
- **Session 5** owns: `backend/src/api/main.py`, all router registration, static file serving
- **Session 6** owns: `frontend/src/` — all TypeScript React pages and components

⚠️ **Sessions 3 and 4 can run in parallel.** Both depend on Sessions 1 and 2. They do not import from each other. Running them simultaneously halves the wall-clock time for those two sessions.

Import chain (no circular imports allowed):
`api → auth → data`
`api → data` (direct)
Sessions must not import from each other at the same layer level.

## Dependencies

### Backend (`requirements.txt`)
| PyPI name | Import as | Verify |
|---|---|---|
| `fastapi` | `from fastapi import FastAPI` | `python -c "from fastapi import FastAPI; print('OK')"` |
| `uvicorn` | `import uvicorn` | `python -c "import uvicorn; print('OK')"` |
| `sqlalchemy` | `from sqlalchemy import Column` | `python -c "from sqlalchemy import Column; print('OK')"` |
| `alembic` | `import alembic` | `python -c "import alembic; print('OK')"` |
| `passlib[bcrypt]` | `from passlib.context import CryptContext` | `python -c "from passlib.context import CryptContext; print('OK')"` |
| `PyJWT` | `import jwt` | `python -c "import jwt; print('OK')"` |
| `python-multipart` | `from multipart.multipart import parse_options_header` | `python -c "from multipart.multipart import parse_options_header; print('OK')"` |
| `pytest` | `import pytest` | `python -c "import pytest; print('OK')"` |
| `pytest-asyncio` | `import pytest_asyncio` | `python -c "import pytest_asyncio; print('OK')"` |
| `httpx` | `import httpx` | `python -c "import httpx; print('OK')"` |
| `python-dotenv` | `from dotenv import load_dotenv` | `python -c "from dotenv import load_dotenv; print('OK')"` |
| `psycopg2-binary` | `import psycopg2` | `python -c "import psycopg2; print('OK')"` |

⚠️ **`passlib[bcrypt]` install trap**: the PyPI install name includes the extra `[bcrypt]`. Without it, bcrypt hashing will fail silently or fall back to a different algorithm. Always install as `passlib[bcrypt]` not just `passlib`.

⚠️ **`PyJWT` vs `python-jose`**: this project uses `PyJWT` which imports as `import jwt`. Do not confuse with `python-jose` which imports as `from jose import jwt`. If `import jwt` fails after install, the wrong package may be installed.

⚠️ **`psycopg2-binary`** may fail on Windows if PostgreSQL client libs are not installed. This is only needed for Railway. If it fails in `check.py`, note the failure but proceed — local dev uses SQLite and does not need it.

### Frontend (`frontend/package.json`)
| Package | Used for |
|---|---|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Client-side routing (login, surveys, builder, public form, results) |
| `axios` | HTTP calls to backend API |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Drag-and-drop question reordering in builder |
| `recharts` | Charts on results dashboard |
| `typescript`, `@types/react`, `@types/react-dom` | TypeScript support |

The `frontend/` directory is pre-scaffolded including `tsconfig.json`. Session 6 only needs to run `npm install` — do NOT run `npm create vite`.

## Phase 0 — Setup (must complete before any session writes code)

```powershell
# 1. Install Python packages
python -m pip install --target=backend\lib -r requirements.txt

# 2. Set PYTHONPATH (BOTH project root and lib — LEARNINGS.md rule)
$env:PYTHONPATH = "$PSScriptRoot;$PSScriptRoot\backend\lib"

# 3. Verify imports
python check.py

# 4. Run initial Alembic migration to create tables
$env:DATABASE_URL = "sqlite:///./survey_creator.db"
python -m alembic upgrade head

# 5. Install frontend packages
cd frontend && npm install && cd ..
```

All `check.py` lines must print ✓ before any session begins.
(psycopg2-binary may show ✗ on Windows — that is acceptable for local development)
