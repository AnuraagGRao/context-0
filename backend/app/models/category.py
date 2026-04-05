"""Category model – organises questions by subject (Science, History, …)."""
from typing import TYPE_CHECKING, List

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.question import Question


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)

    questions: Mapped[List["Question"]] = relationship(
        "Question",
        back_populates="category",
        cascade="all, delete-orphan",
    )
