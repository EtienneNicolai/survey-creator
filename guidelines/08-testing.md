# Guideline 08 — Testing (All Sessions)

## Test Setup

### `backend/tests/conftest.py` (Session 1 creates this)

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.src.data.models import Base
from backend.src.data.database import get_db
from backend.src.api.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def auth_client(client):
    """A client with a registered and logged-in user. Returns (client, token)."""
    r = client.post("/api/auth/register", json={"email": "test@example.com", "password": "password123"})
    assert r.status_code == 201
    token = r.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
```

**Why `autouse=True` on `setup_db`?**
Every test runs against a freshly created and torn-down in-memory database. This ensures
tests are isolated — no leftover data from a previous test can affect the next one.

## Session 1 Tests — `backend/tests/test_models.py`

```python
import pytest
from backend.src.data.models import User, Survey, Question, Response, Answer

def test_user_create(db):
    user = User(email="a@b.com", password_hash="x")
    db.add(user)
    db.commit()
    db.refresh(user)
    assert user.id is not None
    assert user.email == "a@b.com"

def test_survey_belongs_to_user(db):
    user = User(email="a@b.com", password_hash="x")
    db.add(user); db.commit(); db.refresh(user)
    survey = Survey(user_id=user.id, title="Test Survey")
    db.add(survey); db.commit(); db.refresh(survey)
    assert survey.share_token is not None
    assert len(survey.share_token) > 0
    assert survey.is_active is True

def test_question_order_index(db):
    user = User(email="a@b.com", password_hash="x")
    db.add(user); db.commit(); db.refresh(user)
    survey = Survey(user_id=user.id, title="S")
    db.add(survey); db.commit(); db.refresh(survey)
    q1 = Question(survey_id=survey.id, type="text", label="Q1", order_index=0)
    q2 = Question(survey_id=survey.id, type="nps", label="Q2", order_index=1)
    db.add_all([q1, q2]); db.commit()
    assert len(survey.questions) == 2

def test_cascade_delete_survey(db):
    user = User(email="a@b.com", password_hash="x")
    db.add(user); db.commit(); db.refresh(user)
    survey = Survey(user_id=user.id, title="S")
    db.add(survey); db.commit(); db.refresh(survey)
    q = Question(survey_id=survey.id, type="text", label="Q", order_index=0)
    db.add(q); db.commit()
    db.delete(survey); db.commit()
    assert db.get(Question, q.id) is None
```

## Session 2 Tests — `backend/tests/test_auth.py`

```python
def test_register_returns_token(client):
    r = client.post("/api/auth/register", json={"email": "new@example.com", "password": "pass123"})
    assert r.status_code == 201
    assert "access_token" in r.json()

def test_duplicate_email_rejected(client):
    client.post("/api/auth/register", json={"email": "dup@example.com", "password": "pass"})
    r = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "pass"})
    assert r.status_code == 400
    assert "already" in r.json()["detail"].lower()

def test_login_correct_credentials(client):
    client.post("/api/auth/register", json={"email": "u@example.com", "password": "pass123"})
    r = client.post("/api/auth/login", json={"email": "u@example.com", "password": "pass123"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_wrong_password(client):
    client.post("/api/auth/register", json={"email": "u@example.com", "password": "pass123"})
    r = client.post("/api/auth/login", json={"email": "u@example.com", "password": "wrong"})
    assert r.status_code == 401

def test_me_with_valid_token(auth_client):
    r = auth_client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"

def test_me_with_invalid_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer badtoken"})
    assert r.status_code in (401, 403)
```

## Session 3 Tests — `backend/tests/test_surveys.py`

```python
def test_create_survey(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "My Survey", "description": "test"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "My Survey"
    assert data["share_token"] is not None
    assert data["questions"] == []

def test_list_surveys(auth_client):
    auth_client.post("/api/surveys", json={"title": "S1"})
    auth_client.post("/api/surveys", json={"title": "S2"})
    r = auth_client.get("/api/surveys")
    assert r.status_code == 200
    assert len(r.json()) == 2

def test_get_survey_not_owned(client, auth_client):
    r = auth_client.post("/api/surveys", json={"title": "S"})
    survey_id = r.json()["id"]
    # Register a second user and try to access the survey
    r2 = client.post("/api/auth/register", json={"email": "other@example.com", "password": "pass"})
    token2 = r2.json()["access_token"]
    r3 = client.get(f"/api/surveys/{survey_id}", headers={"Authorization": f"Bearer {token2}"})
    assert r3.status_code == 404

def test_delete_survey(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "To Delete"})
    survey_id = r.json()["id"]
    del_r = auth_client.delete(f"/api/surveys/{survey_id}")
    assert del_r.status_code == 200
    get_r = auth_client.get(f"/api/surveys/{survey_id}")
    assert get_r.status_code == 404

def test_toggle_survey_active(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "Toggle Test"})
    survey_id = r.json()["id"]
    assert r.json()["is_active"] is True
    r2 = auth_client.put(f"/api/surveys/{survey_id}/toggle")
    assert r2.json()["is_active"] is False

def test_add_and_reorder_questions(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "Q Survey"})
    sid = r.json()["id"]
    q1 = auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "text", "label": "Q1"}).json()
    q2 = auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "nps", "label": "Q2"}).json()
    assert q1["order_index"] == 0
    assert q2["order_index"] == 1
    # Reorder: put Q2 first
    r3 = auth_client.post(f"/api/surveys/{sid}/questions/reorder",
        json={"question_ids": [q2["id"], q1["id"]]})
    assert r3.status_code == 200
    survey_r = auth_client.get(f"/api/surveys/{sid}").json()
    questions = survey_r["questions"]
    assert questions[0]["id"] == q2["id"]
    assert questions[1]["id"] == q1["id"]
```

## Session 4 Tests — `backend/tests/test_public.py`

```python
def _create_survey_with_questions(auth_client):
    """Helper: create a survey with one of each question type. Returns (survey, share_token)."""
    r = auth_client.post("/api/surveys", json={"title": "Public Test"})
    sid = r.json()["id"]
    token = r.json()["share_token"]
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "nps", "label": "Recommend?", "scale_max": 10})
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "rating", "label": "Rating", "scale_max": 5})
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "choice", "label": "Choice", "options": ["A", "B", "C"]})
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "text", "label": "Comments"})
    return r.json(), token

def test_public_get_survey(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    r = client.get(f"/s/{token}")
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Public Test"
    assert len(data["questions"]) == 4
    # share_token must NOT be in public response
    assert "share_token" not in data
    assert "user_id" not in data

def test_public_survey_not_found(client):
    r = client.get("/s/nonexistent-token")
    assert r.status_code == 404

def test_public_inactive_survey_hidden(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    auth_client.put(f"/api/surveys/{survey['id']}/toggle")  # deactivate
    r = client.get(f"/s/{token}")
    assert r.status_code == 404

def test_submit_response(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    questions = client.get(f"/s/{token}").json()["questions"]
    answers = [{"question_id": q["id"], "value": "5" if q["type"] != "text" else "Great"} for q in questions]
    r = client.post(f"/s/{token}/submit", json={"answers": answers})
    assert r.status_code == 200
    assert r.json() == {"ok": True}

def test_results_aggregation(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    questions = client.get(f"/s/{token}").json()["questions"]
    # Submit 3 responses
    for _ in range(3):
        answers = [
            {"question_id": questions[0]["id"], "value": "9"},   # nps
            {"question_id": questions[1]["id"], "value": "4"},   # rating
            {"question_id": questions[2]["id"], "value": "A"},   # choice
            {"question_id": questions[3]["id"], "value": "Good comment"},  # text
        ]
        client.post(f"/s/{token}/submit", json={"answers": answers})
    r = auth_client.get(f"/api/surveys/{survey['id']}/results")
    assert r.status_code == 200
    data = r.json()
    assert data["total_responses"] == 3
    nps_result = next(res for res in data["results"] if res["question"]["type"] == "nps")
    assert nps_result["nps"]["score"] == 100.0  # all 9s = all promoters
    rating_result = next(res for res in data["results"] if res["question"]["type"] == "rating")
    assert rating_result["rating"]["mean"] == 4.0
    choice_result = next(res for res in data["results"] if res["question"]["type"] == "choice")
    assert choice_result["choice"]["counts"]["A"] == 3

def test_results_requires_auth(client, auth_client):
    survey, _ = _create_survey_with_questions(auth_client)
    r = client.get(f"/api/surveys/{survey['id']}/results")
    assert r.status_code in (401, 403)
```

## Running Tests

```powershell
$env:PYTHONPATH = "C:\Users\Etien\Documents\Projects\survey-creator;C:\Users\Etien\Documents\Projects\survey-creator\backend\lib"
python -m pytest backend/tests/ -v
```

Expected: all tests green. Tests run against in-memory SQLite — no database file created.

## Test Count Summary
| Session | File | Tests |
|---|---|---|
| 1 | test_models.py | 4 |
| 2 | test_auth.py | 6 |
| 3 | test_surveys.py | 6 |
| 4 | test_public.py | 6 |
| **Total** | | **22** |
