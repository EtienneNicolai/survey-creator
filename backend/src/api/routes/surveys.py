from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.src.data.database import get_db
from backend.src.data.models import Survey, User
from backend.src.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/surveys", tags=["surveys"])


class SurveyCreate(BaseModel):
    title: str
    description: str | None = None


class SurveyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


def _get_owned_survey(survey_id: int, user: User, db: Session) -> Survey:
    survey = db.get(Survey, survey_id)
    if survey is None or survey.user_id != user.id:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


def _survey_dict(survey: Survey, include_questions: bool = True) -> dict:
    return {
        "id": survey.id,
        "title": survey.title,
        "description": survey.description,
        "is_active": survey.is_active,
        "share_token": survey.share_token,
        "response_count": len(survey.responses),
        "questions": [_question_dict(q) for q in sorted(survey.questions, key=lambda q: q.order_index)] if include_questions else [],
        "created_at": survey.created_at.isoformat() if survey.created_at else None,
    }


def _question_dict(q) -> dict:
    return {
        "id": q.id,
        "survey_id": q.survey_id,
        "type": q.type,
        "label": q.label,
        "options": q.options,
        "scale_max": q.scale_max,
        "order_index": q.order_index,
    }


@router.get("")
def list_surveys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    surveys = (
        db.query(Survey)
        .filter(Survey.user_id == current_user.id)
        .order_by(Survey.created_at.desc())
        .all()
    )
    return [_survey_dict(s, include_questions=False) for s in surveys]


@router.post("", status_code=201)
def create_survey(
    body: SurveyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    survey = Survey(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    result = _survey_dict(survey, include_questions=True)
    return result


@router.get("/{survey_id}")
def get_survey(
    survey_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    survey = _get_owned_survey(survey_id, current_user, db)
    return _survey_dict(survey, include_questions=True)


@router.put("/{survey_id}")
def update_survey(
    survey_id: int,
    body: SurveyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    survey = _get_owned_survey(survey_id, current_user, db)
    if body.title is not None:
        survey.title = body.title
    if body.description is not None:
        survey.description = body.description
    db.commit()
    db.refresh(survey)
    return _survey_dict(survey, include_questions=True)


@router.delete("/{survey_id}")
def delete_survey(
    survey_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    survey = _get_owned_survey(survey_id, current_user, db)
    db.delete(survey)
    db.commit()
    return {"ok": True}


@router.put("/{survey_id}/toggle")
def toggle_survey(
    survey_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    survey = _get_owned_survey(survey_id, current_user, db)
    survey.is_active = not survey.is_active
    db.commit()
    db.refresh(survey)
    return {"is_active": survey.is_active}
