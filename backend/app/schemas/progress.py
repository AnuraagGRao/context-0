"""Pydantic schemas for Progress endpoints."""
from datetime import datetime

from pydantic import BaseModel


class ProgressOut(BaseModel):
    id: int
    category_id: int
    category_name: str
    score: int
    total_questions: int
    accuracy: float
    quiz_date: datetime
    current_streak: int

    model_config = {"from_attributes": True}


class WeakSubject(BaseModel):
    """Category where the user's average accuracy is below threshold."""
    category_id: int
    category_name: str
    average_accuracy: float
    attempts: int


class UserStats(BaseModel):
    """Aggregated stats shown on the dashboard."""
    total_quizzes: int
    overall_accuracy: float
    current_streak: int
    weak_subjects: list[WeakSubject]
    recent_activity: list[ProgressOut]
