from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime
import secrets

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    surveys = relationship("Survey", back_populates="owner", cascade="all, delete-orphan")

class Survey(Base):
    __tablename__ = "surveys"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    share_token = Column(String, unique=True, default=lambda: secrets.token_urlsafe(8))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="surveys")
    questions = relationship(
        "Question", back_populates="survey",
        cascade="all, delete-orphan",
        order_by="Question.order_index"
    )
    responses = relationship("Response", back_populates="survey", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    type = Column(String, nullable=False)   # "nps" | "rating" | "choice" | "text"
    label = Column(String, nullable=False)
    options = Column(JSON, nullable=True)   # list[str] for choice questions, None otherwise
    order_index = Column(Integer, nullable=False, default=0)
    scale_max = Column(Integer, nullable=True)  # 5 or 10 for rating/nps
    survey = relationship("Survey", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Response(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    survey = relationship("Survey", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    value = Column(Text, nullable=False)
    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
