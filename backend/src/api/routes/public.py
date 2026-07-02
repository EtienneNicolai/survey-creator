from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, Response, Answer

router = APIRouter(tags=["public"])


@router.get("/api/s/{token}")
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


class AnswerIn(BaseModel):
    question_id: int
    value: str


class SubmitRequest(BaseModel):
    answers: list[AnswerIn]


@router.post("/api/s/{token}/submit")
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
