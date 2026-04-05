"""ORM model imports – ensures all models are registered with SQLAlchemy metadata."""
from app.models.user import User  # noqa: F401
from app.models.category import Category  # noqa: F401
from app.models.question import Question  # noqa: F401
from app.models.progress import UserProgress  # noqa: F401
