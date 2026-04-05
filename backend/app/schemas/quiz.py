"""Pydantic schemas for Quiz endpoints."""
from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    id: int
    name: str
    description: str | None
    icon: str | None

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    """Question data sent to the client – correct answer is NOT exposed."""
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    difficulty: str
    category: CategoryOut

    model_config = {"from_attributes": True}


class QuizRequest(BaseModel):
    """Parameters for requesting a new quiz."""
    category_id: int | None = None      # None → mixed categories
    difficulty: str | None = None       # None → mixed difficulties
    num_questions: int = Field(default=10, ge=1, le=20)  # 1–20 questions


class AnswerItem(BaseModel):
    """A single answer submitted by the user."""
    question_id: int
    selected_option: str   # 'A', 'B', 'C', or 'D'


class QuizSubmission(BaseModel):
    """Full quiz submission payload."""
    category_id: int | None = None
    answers: list[AnswerItem]


class AnswerResult(BaseModel):
    """Per-question grading result returned to the client."""
    question_id: int
    selected_option: str
    correct_option: str
    is_correct: bool
    explanation: str | None


class QuizResult(BaseModel):
    """Overall quiz result returned after submission."""
    score: int
    total_questions: int
    accuracy: float
    results: list[AnswerResult]
