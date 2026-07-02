from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, Question, Answer, User
from backend.src.auth.dependencies import get_current_user

router = APIRouter(tags=["results"])


def _nps(values: list) -> dict:
    if not values:
        return None
    total = len(values)
    promoters = sum(1 for v in values if v >= 9)
    passives = sum(1 for v in values if 7 <= v <= 8)
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


def _rating(values: list, scale_max: int) -> dict:
    if not values:
        return None
    mean = round(sum(values) / len(values), 2)
    sorted_vals = sorted(values)
    mid = len(sorted_vals) // 2
    median = sorted_vals[mid] if len(sorted_vals) % 2 else (sorted_vals[mid - 1] + sorted_vals[mid]) / 2
    distribution = {str(i): sum(1 for v in values if int(v) == i) for i in range(1, scale_max + 1)}
    return {"mean": mean, "median": median, "distribution": distribution}


def _choice(values: list) -> dict:
    from collections import Counter
    counts = dict(Counter(values).most_common())
    return {"counts": counts, "total": len(values)}


def _text(answers_with_ids: list) -> list:
    return [{"response_id": rid, "value": val} for rid, val in answers_with_ids]


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
                try:
                    vals.append(float(a.value))
                except ValueError:
                    pass
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
