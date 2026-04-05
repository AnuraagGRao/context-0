"""Question model – stores MCQ questions with four answer options."""
import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.category import Category


class DifficultyLevel(str, enum.Enum):
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
    option_a: Mapped[str] = mapped_column(String(500), nullable=False)
    option_b: Mapped[str] = mapped_column(String(500), nullable=False)
    option_c: Mapped[str] = mapped_column(String(500), nullable=False)
    option_d: Mapped[str] = mapped_column(String(500), nullable=False)
    correct_option: Mapped[str] = mapped_column(
        Enum("A", "B", "C", "D", name="answer_option"), nullable=False
    )
    difficulty: Mapped[str] = mapped_column(
        Enum("easy", "medium", "hard", name="difficulty_level"),
        default="medium",
        nullable=False,
    )
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped["Category"] = relationship("Category", back_populates="questions")
