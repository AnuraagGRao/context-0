"""Re-export all models so Alembic autogenerate can discover them."""
from app.models.user import User
from app.models.category import Category
from app.models.question import Question
from app.models.progress import UserProgress

__all__ = ["User", "Category", "Question", "UserProgress"]
