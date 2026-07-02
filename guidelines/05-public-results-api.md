# Guideline 05 — Public & Results API (Session 4)

## Scope
This session owns the `/s/` public routes and `/api/surveys/{id}/results`.
Runs in parallel with Session 3.

## Prerequisites
Sessions 1 and 2 must be complete. This session does not depend on Session 3.

## What to Build

### 1. `backend/src/api/routes/public.py`
Public routes — no authentication required.

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, Response, Answer

router = APIRouter(tags=["public"])
```

#### GET /s/{token} — return survey for a respondent
- Look up Survey by `share_token`
- If not found or `is_active == False`: raise 404 (do not reveal reason)
- Return survey title, description, and ordered questions
- Do NOT return `user_id`, `share_token` or response data
- Questions returned as: `[{id, type, label, options, scale_max, order_index}]`

```python
@router.get("/s/{token}")
def get_public_survey(token: str, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.share_token == token).first()
    if survey is None or not survey.is_active:
        raise HTTPException(status_code=404, detail="Survey not found")
    return {
        "id": survey.id,
        "title": survey.title,
        "description": survey.description,
        "questions": [
            {
                "id": q.id,
                "type": q.type,
                "label": q.label,
                "options": q.options,
                "scale_max": q.scale_max,
                "order_index": q.order_index,
            }
            for q in sorted(survey.questions, key=lambda q: q.order_index)
        ],
    }
```

#### POST /s/{token}/submit — save a response
- Look up survey by token, reject if not found or inactive
- Body: `{"answers": [{"question_id": int, "value": str}]}`
- Validate that all question_ids belong to this survey — reject foreign IDs silently (skip them)
- Create one `Response` record and one `Answer` per valid answer
- Return `{"ok": True}`

```python
class AnswerIn(BaseModel):
    question_id: int
    value: str

class SubmitRequest(BaseModel):
    answers: list[AnswerIn]

@router.post("/s/{token}/submit")
def submit_response(token: str, body: SubmitRequest, db: Session = Depends(get_db)):
    survey = db.query(Survey).filter(Survey.share_token == token).first()
    if survey is None or not survey.is_active:
        raise HTTPException(status_code=404, detail="Survey not found")
    valid_ids = {q.id for q in survey.questions}
    response = Response(survey_id=survey.id)
    db.add(response)
    db.flush()  # get response.id without committing
    for ans in body.answers:
        if ans.question_id in valid_ids and ans.value.strip():
            db.add(Answer(response_id=response.id, question_id=ans.question_id, value=ans.value.strip()))
    db.commit()
    return {"ok": True}
```

**Why `db.flush()` before adding answers?**
`flush()` sends the INSERT for the Response to the database and assigns it an auto-increment ID,
but does not commit. This lets us use `response.id` for the Answer foreign keys in the same
transaction. `db.commit()` at the end makes everything permanent atomically.

### 2. `backend/src/api/routes/results.py`
Results aggregation — authenticated, must own the survey.

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, Question, Answer, User
from backend.src.auth.dependencies import get_current_user

router = APIRouter(tags=["results"])
```

#### GET /api/surveys/{survey_id}/results

For each question in the survey, aggregate its answers:

**NPS questions (scale_max=10, values 0-10):**
```python
def _nps(values: list[int]) -> dict:
    if not values:
        return None
    total = len(values)
    promoters = sum(1 for v in values if v >= 9)
    passives  = sum(1 for v in values if 7 <= v <= 8)
    detractors = total - promoters - passives
    score = round((promoters / total - detractors / total) * 100, 1)
    return {
        "score": score,
        "promoter_pct": round(promoters / total * 100, 1),
        "passive_pct": round(passives / total * 100, 1),
        "detractor_pct": round(detractors / total * 100, 1),
        "promoter_count": promoters,
        "passive_count": passives,
        "detractor_count": detractors,
    }
```

**Rating questions (numeric, 1-5 or 1-10):**
```python
def _rating(values: list[float], scale_max: int) -> dict:
    if not values:
        return None
    mean = round(sum(values) / len(values), 2)
    sorted_vals = sorted(values)
    mid = len(sorted_vals) // 2
    median = sorted_vals[mid] if len(sorted_vals) % 2 else (sorted_vals[mid-1] + sorted_vals[mid]) / 2
    distribution = {str(i): sum(1 for v in values if int(v) == i) for i in range(1, scale_max + 1)}
    return {"mean": mean, "median": median, "distribution": distribution}
```

**Choice questions:**
```python
def _choice(values: list[str]) -> dict:
    from collections import Counter
    counts = dict(Counter(values).most_common())
    return {"counts": counts, "total": len(values)}
```

**Text questions** — return raw answers, no AI processing:
```python
def _text(answers_with_ids: list[tuple[int, str]]) -> list[dict]:
    return [{"response_id": rid, "value": val} for rid, val in answers_with_ids]
```

**The route:**
```python
@router.get("/api/surveys/{survey_id}/results")
def get_results(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    survey = db.get(Survey, survey_id)
    if survey is None or survey.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Survey not found")
    results = []
    for question in sorted(survey.questions, key=lambda q: q.order_index):
        raw_answers = [a for r in survey.responses for a in r.answers if a.question_id == question.id]
        nps = rating = choice = text_answers = None
        if question.type == "nps":
            vals = [int(a.value) for a in raw_answers if a.value.strip().lstrip("-").isdigit()]
            nps = _nps(vals)
        elif question.type == "rating":
            vals = []
            for a in raw_answers:
                try: vals.append(float(a.value))
                except ValueError: pass
            rating = _rating(vals, question.scale_max or 5)
        elif question.type == "choice":
            choice = _choice([a.value for a in raw_answers if a.value.strip()])
        elif question.type == "text":
            text_answers = _text([(a.response_id, a.value) for a in raw_answers if a.value.strip()])
        results.append({
            "question": {"id": question.id, "type": question.type, "label": question.label, "scale_max": question.scale_max},
            "response_count": len(raw_answers),
            "nps": nps,
            "rating": rating,
            "choice": choice,
            "text_answers": text_answers,
        })
    return {
        "survey": {"id": survey.id, "title": survey.title, "response_count": len(survey.responses)},
        "total_responses": len(survey.responses),
        "results": results,
    }
```

## Key Constraints
- Public routes (`/s/`) must NEVER require authentication — they must work without a token
- Never expose `share_token` or `user_id` in the public GET /s/{token} response
- Use 404 for both "not found" and "inactive" — do not leak which condition is true
- `db.flush()` before adding answers — required to get `response.id` in the same transaction
- Do not import from `backend/src/api/routes/surveys.py` or `questions.py`

## Files to Create
- `backend/src/api/routes/public.py`
- `backend/src/api/routes/results.py`
- `backend/tests/test_public.py`
