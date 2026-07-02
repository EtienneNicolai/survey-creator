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
