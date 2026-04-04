"""Progress router – user stats, streaks, and weak-subject analysis."""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.deps import get_current_user
from app.database import get_db
from app.models.category import Category
from app.models.progress import UserProgress
from app.models.user import User
from app.schemas.progress import ProgressOut, UserStats, WeakSubject

router = APIRouter(prefix="/api/progress", tags=["progress"])

# Threshold below which a subject is considered "weak"
WEAK_SUBJECT_THRESHOLD = 0.6


@router.get("/stats", response_model=UserStats)
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserStats:
    """
    Return aggregated statistics for the authenticated user:
      - total quizzes taken
      - overall accuracy
      - current daily streak
      - list of weak subjects (accuracy < 60 %)
      - last 10 quiz attempts
    """
    # ── Aggregate stats per category ─────────────────────────────────────────
    agg_result = await db.execute(
        select(
            UserProgress.category_id,
            Category.name.label("category_name"),
            func.count(UserProgress.id).label("attempts"),
            func.avg(UserProgress.accuracy).label("avg_accuracy"),
        )
        .join(Category, UserProgress.category_id == Category.id)
        .where(UserProgress.user_id == current_user.id)
        .group_by(UserProgress.category_id, Category.name)
    )
    rows = agg_result.all()

    total_quizzes = sum(r.attempts for r in rows)
    overall_accuracy = (
        sum(r.avg_accuracy * r.attempts for r in rows) / total_quizzes
        if total_quizzes > 0
        else 0.0
    )

    weak_subjects = [
        WeakSubject(
            category_id=r.category_id,
            category_name=r.category_name,
            average_accuracy=round(r.avg_accuracy, 4),
            attempts=r.attempts,
        )
        for r in rows
        if r.avg_accuracy < WEAK_SUBJECT_THRESHOLD
    ]

    # ── Current streak (max streak across all categories) ────────────────────
    streak_result = await db.execute(
        select(func.max(UserProgress.current_streak)).where(
            UserProgress.user_id == current_user.id
        )
    )
    current_streak: int = streak_result.scalar_one_or_none() or 0

    # ── Recent activity (last 10 attempts) ───────────────────────────────────
    recent_result = await db.execute(
        select(UserProgress, Category.name.label("category_name"))
        .join(Category, UserProgress.category_id == Category.id)
        .where(UserProgress.user_id == current_user.id)
        .order_by(UserProgress.quiz_date.desc())
        .limit(10)
    )
    recent_rows = recent_result.all()

    recent_activity = [
        ProgressOut(
            id=row.UserProgress.id,
            category_id=row.UserProgress.category_id,
            category_name=row.category_name,
            score=row.UserProgress.score,
            total_questions=row.UserProgress.total_questions,
            accuracy=row.UserProgress.accuracy,
            quiz_date=row.UserProgress.quiz_date,
            current_streak=row.UserProgress.current_streak,
        )
        for row in recent_rows
    ]

    return UserStats(
        total_quizzes=total_quizzes,
        overall_accuracy=round(overall_accuracy, 4),
        current_streak=current_streak,
        weak_subjects=weak_subjects,
        recent_activity=recent_activity,
    )
