# Survey Creator — Agent Instructions

## What is this project
A full survey platform. Clients register/login, build surveys with drag-and-drop question editors,
share a unique public link, and view live results as responses come in.

## Tech Stack
- **Backend**: FastAPI + SQLAlchemy (SQLite local, PostgreSQL on Railway) + PyJWT + passlib[bcrypt]
- **Database migrations**: Alembic (not create_all — always use Alembic)
- **Frontend**: TypeScript React + Vite + react-router-dom + @dnd-kit + recharts
- **No AI analysis** — results are pure aggregation (NPS score, rating mean, choice counts, text list)

## Folder layout
```
backend/
  lib/         — pip install --target goes here
  src/
    data/      — models.py, database.py
    auth/      — hashing.py, jwt.py, dependencies.py
    api/
      routes/  — auth.py, surveys.py, questions.py, public.py, results.py
      main.py  — FastAPI app wires all routers + serves frontend/dist
  tests/       — conftest.py + test_*.py
frontend/
  src/         — TypeScript React (pre-scaffolded, run npm install not npm create vite)
guidelines/    — session-by-session implementation guides
alembic/       — migration scripts
```

## How to run PYTHONPATH
ALWAYS set BOTH the project root and `backend/lib` before any Python command:
```powershell
$env:PYTHONPATH = "C:\Users\Etien\Documents\Projects\survey-creator;C:\Users\Etien\Documents\Projects\survey-creator\backend\lib"
```
This is required because packages are installed to `backend/lib` not site-packages.
Use `python -m uvicorn` not bare `uvicorn` for the same reason.

## Session map
| Session | Guideline | What it builds |
|---|---|---|
| 1 | 02-data-layer.md | models.py, database.py, Alembic migration |
| 2 | 03-auth-layer.md | hashing, JWT, dependencies, /api/auth routes |
| 3 | 04-survey-api.md | /api/surveys + /api/questions routes (parallel with 4) |
| 4 | 05-public-results-api.md | /s/ public routes + /api/.../results (parallel with 3) |
| 5 | 06-api-main.md | FastAPI app wiring + static serving |
| 6 | 07-frontend.md | Full TypeScript React UI |

Sessions 3 and 4 can run in parallel — they depend only on Sessions 1 and 2 and do not import from each other.

## Key traps (read before writing any code)
1. `passlib[bcrypt]` — install with the `[bcrypt]` extra or bcrypt silently fails
2. `PyJWT` imports as `import jwt` — do NOT install `python-jose`
3. All `__init__.py` files must exist: backend/, backend/src/, backend/src/data/, backend/src/auth/, backend/src/api/, backend/src/api/routes/, backend/tests/
4. `datetime.now(timezone.utc)` not `datetime.utcnow()` (deprecated Python 3.12+)
5. The FastAPI catch-all `/{full_path:path}` must be registered LAST — after all API routers
6. Public routes `/s/` must never require authentication
7. `db.flush()` before creating Answer records — need response.id before commit
8. Never hardcode DATABASE_URL — always read from os.environ with SQLite fallback

## Running tests
```powershell
$env:PYTHONPATH = "C:\Users\Etien\Documents\Projects\survey-creator;C:\Users\Etien\Documents\Projects\survey-creator\backend\lib"
python -m pytest backend/tests/ -v
```

## Starting the app locally
Double-click `start.bat` — it sets PYTHONPATH, builds frontend if needed, starts uvicorn.
Then open: http://localhost:8000
