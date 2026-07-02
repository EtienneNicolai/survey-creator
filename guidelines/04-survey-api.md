# Guideline 04 — Survey & Question API (Session 3)

## Scope
This session owns `/api/surveys` and `/api/questions` routes (all authenticated).
Runs in parallel with Session 4.

## Prerequisites
Sessions 1 and 2 must be complete. This session does not depend on Session 4.

## What to Build

### 1. `backend/src/api/routes/surveys.py`
All authenticated survey CRUD routes.

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, User
from backend.src.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/surveys", tags=["surveys"])
```

#### Routes to implement:

**GET /api/surveys** — list all surveys owned by current user
- Query surveys where `user_id == current_user.id`, order by `created_at` descending
- For each survey, include `response_count` (len of survey.responses)
- Return list of dicts: `{id, title, description, is_active, share_token, response_count, created_at}`

**POST /api/surveys** — create a new survey
- Body: `{"title": str, "description": str | None}`
- Create Survey with `user_id=current_user.id`
- Return full survey dict including empty `questions: []`
- Status 201

**GET /api/surveys/{survey_id}** — get one survey with questions
- Must belong to current_user — raise 404 if not found or wrong owner
- Return survey dict with `questions` array ordered by `order_index`

**PUT /api/surveys/{survey_id}** — update title/description
- Body: `{"title": str | None, "description": str | None}` — only update provided fields
- Return updated survey

**DELETE /api/surveys/{survey_id}** — delete survey and all its questions/responses (cascade handles this)
- Return `{"ok": True}`

**PUT /api/surveys/{survey_id}/toggle** — flip is_active
- `survey.is_active = not survey.is_active`
- Return `{"is_active": survey.is_active}`

#### Ownership guard helper — use in every route:
```python
def _get_owned_survey(survey_id: int, user: User, db: Session) -> Survey:
    survey = db.get(Survey, survey_id)
    if survey is None or survey.user_id != user.id:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey
```

### 2. `backend/src/api/routes/questions.py`
Question management routes.

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, Question, User
from backend.src.auth.dependencies import get_current_user

router = APIRouter(tags=["questions"])
```

#### Routes to implement:

**POST /api/surveys/{survey_id}/questions** — add a question to a survey
- Body: `{"type": str, "label": str, "options": list[str] | None, "scale_max": int | None}`
- Validate type is one of: `"nps"`, `"rating"`, `"choice"`, `"text"`
- Set `order_index` to the current number of questions in the survey (appends to end)
- Return created Question, status 201

**PUT /api/questions/{question_id}** — update a question's content
- Body: `{"label": str | None, "options": list[str] | None, "scale_max": int | None}`
- Must verify the question belongs to a survey owned by current_user
- Only update provided fields
- Return updated Question

**DELETE /api/questions/{question_id}** — delete a question
- Must verify ownership
- Return `{"ok": True}`

**POST /api/surveys/{survey_id}/questions/reorder** — set new question order
- Body: `{"question_ids": [3, 1, 2]}` — ordered list of all question IDs in the survey
- For each id at position i: set `question.order_index = i`
- Validate that all provided IDs belong to this survey — raise 400 if any are foreign
- Return `{"ok": True}`

## Key Constraints
- Every route must verify survey ownership — a user must not be able to see or edit another user's surveys
- The ownership guard raises 404 (not 403) — do not reveal whether a survey exists to non-owners
- `order_index` starts at 0 and increments — never leave gaps
- Do not import from Session 4's route files (`public.py`, `results.py`)

## Files to Create
- `backend/src/api/routes/surveys.py`
- `backend/src/api/routes/questions.py`
- `backend/tests/test_surveys.py`
