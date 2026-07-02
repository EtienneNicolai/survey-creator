# Guideline 02 — Data Layer (Session 1)

## Scope
This session owns `backend/src/data/` and the Alembic migration setup.

## What to Build

### 1. `backend/src/data/models.py`
Define all SQLAlchemy models exactly as specified in `guidelines/01-project-overview.md`.
This is the shared contract — all sessions import from here. Do not redefine models elsewhere.

The `Base` class uses `DeclarativeBase` (SQLAlchemy 2.x style):
```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
```

All five model classes (User, Survey, Question, Response, Answer) follow from Base.

### 2. `backend/src/data/database.py`
Database engine, session factory, and the `get_db` dependency used by all API routes.

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./survey_creator.db")

# SQLite needs connect_args for thread safety in FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Why `check_same_thread: False`?**
SQLite's default behaviour rejects connections from threads other than the one that created them.
FastAPI uses multiple threads. Without this flag, SQLite raises an error on the first request.
PostgreSQL does not need this — the `if` guard applies it only for SQLite URLs.

### 3. Alembic configuration
Alembic is pre-scaffolded (`alembic.ini` and `alembic/env.py` already exist).
Session 1's only job is to generate and run the initial migration:

```powershell
$env:PYTHONPATH = "C:\Users\Etien\Documents\Projects\survey-creator;C:\Users\Etien\Documents\Projects\survey-creator\backend\lib"
$env:DATABASE_URL = "sqlite:///./survey_creator.db"
python -m alembic revision --autogenerate -m "initial tables"
python -m alembic upgrade head
```

This reads the models from `backend/src/data/models.py` and generates a migration script in
`alembic/versions/`. After `upgrade head`, the SQLite database file exists with all five tables.

Verify the tables were created:
```powershell
python -c "
from sqlalchemy import inspect, create_engine
e = create_engine('sqlite:///./survey_creator.db')
print(inspect(e).get_table_names())
"
```
Expected output: `['answers', 'questions', 'responses', 'surveys', 'users']`

## Key Constraints
- Import `Base` from `backend.src.data.models` in `alembic/env.py` — it is already wired up
- Do not call `Base.metadata.create_all(engine)` anywhere — Alembic manages the schema
- `DATABASE_URL` is always read from the environment — never hardcode a connection string
- Do not import from `backend/src/auth/` or `backend/src/api/`

## __init__.py chain — must create all of these (LEARNINGS.md rule)
From the survey-analyser: the full `__init__.py` chain must be explicit or imports break.
- `backend/__init__.py` (empty)
- `backend/src/__init__.py` (empty)
- `backend/src/data/__init__.py` (empty)
- `backend/tests/__init__.py` (empty)

## Files to Create
- `backend/__init__.py` (empty)
- `backend/src/__init__.py` (empty)
- `backend/src/data/__init__.py` (empty)
- `backend/src/data/models.py`
- `backend/src/data/database.py`
- `backend/tests/__init__.py` (empty)
- `backend/tests/conftest.py` (Session 1 creates shared fixtures — see guideline 08)
- `backend/tests/test_models.py`

## Tests
See `guidelines/08-testing.md`. Tests verify that models can be created, relationships work,
and `get_db` yields a session. Uses an in-memory SQLite database — no file on disk.
