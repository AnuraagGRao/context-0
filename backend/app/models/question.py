"""Question model – stores MCQ questions with four answer options."""
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.category import Category


class DifficultyLevel(str):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Four possible answer choices stored as plain columns for simplicity
    option_a: Mapped[str] = mapped_column(String(500), nullable=False)
    option_b: Mapped[str] = mapped_column(String(500), nullable=False)
    option_c: Mapped[str] = mapped_column(String(500), nullable=False)
    option_d: Mapped[str] = mapped_column(String(500), nullable=False)
    # Correct answer is 'A', 'B', 'C', or 'D'
    correct_option: Mapped[str] = mapped_column(
        Enum("A", "B", "C", "D", name="answer_option"), nullable=False
    )
    difficulty: Mapped[str] = mapped_column(
        Enum("easy", "medium", "hard", name="difficulty_level"), nullable=False, default="medium"
    )
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    category: Mapped["Category"] = relationship("Category", back_populates="questions")
