from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, Question, User
from backend.src.auth.dependencies import get_current_user

router = APIRouter(tags=["questions"])

VALID_TYPES = {"nps", "rating", "choice", "text"}


class QuestionCreate(BaseModel):
    type: str
    label: str
    options: list[str] | None = None
    scale_max: int | None = None


class QuestionUpdate(BaseModel):
    label: str | None = None
    options: list[str] | None = None
    scale_max: int | None = None


class ReorderBody(BaseModel):
    question_ids: list[int]


def _get_owned_survey(survey_id: int, user: User, db: Session) -> Survey:
    survey = db.get(Survey, survey_id)
    if survey is None or survey.user_id != user.id:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


def _get_owned_question(question_id: int, user: User, db: Session) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    survey = db.get(Survey, question.survey_id)
    if survey is None or survey.user_id != user.id:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


def _question_dict(q: Question) -> dict:
    return {
        "id": q.id,
        "survey_id": q.survey_id,
        "type": q.type,
        "label": q.label,
        "options": q.options,
        "scale_max": q.scale_max,
        "order_index": q.order_index,
    }


@router.post("/api/surveys/{survey_id}/questions", status_code=201)
def add_question(
    survey_id: int,
    body: QuestionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid question type. Must be one of: {', '.join(VALID_TYPES)}")

    survey = _get_owned_survey(survey_id, current_user, db)

    # order_index is the current count of questions (appends to end)
    order_index = len(survey.questions)

    question = Question(
        survey_id=survey.id,
        type=body.type,
        label=body.label,
        options=body.options,
        scale_max=body.scale_max,
        order_index=order_index,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return _question_dict(question)


@router.put("/api/questions/{question_id}")
def update_question(
    question_id: int,
    body: QuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = _get_owned_question(question_id, current_user, db)
    if body.label is not None:
        question.label = body.label
    if body.options is not None:
        question.options = body.options
    if body.scale_max is not None:
        question.scale_max = body.scale_max
    db.commit()
    db.refresh(question)
    return _question_dict(question)


@router.delete("/api/questions/{question_id}")
def delete_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = _get_owned_question(question_id, current_user, db)
    db.delete(question)
    db.commit()
    return {"ok": True}


@router.post("/api/surveys/{survey_id}/questions/reorder")
def reorder_questions(
    survey_id: int,
    body: ReorderBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    survey = _get_owned_survey(survey_id, current_user, db)

    # Validate all IDs belong to this survey
    survey_question_ids = {q.id for q in survey.questions}
    for qid in body.question_ids:
        if qid not in survey_question_ids:
            raise HTTPException(status_code=400, detail=f"Question {qid} does not belong to this survey")

    # Build a lookup map and apply new order_index values
    question_map = {q.id: q for q in survey.questions}
    for i, qid in enumerate(body.question_ids):
        question_map[qid].order_index = i

    db.commit()
    return {"ok": True}
