"""Quiz router – fetch randomised questions and submit answers."""
import random

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.deps import get_current_user
from app.database import get_db
from app.models.category import Category
from app.models.question import Question
from app.models.user import User
from app.schemas.quiz import (
    CategoryOut,
    QuestionOut,
    QuizRequest,
    QuizResult,
    QuizSubmission,
)

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[Category]:
    """Return all available question categories."""
    result = await db.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


@router.post("/start", response_model=list[QuestionOut])
async def start_quiz(
    payload: QuizRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Question]:
    """
    Fetch a set of randomised questions for a quiz session.

    Data flow:
      Frontend sends { category_id?, difficulty?, num_questions }
      → Backend queries DB, shuffles results, returns questions WITHOUT correct_option.
    """
    query = select(Question).join(Question.category)

    if payload.category_id is not None:
        query = query.where(Question.category_id == payload.category_id)
    if payload.difficulty is not None:
        query = query.where(Question.difficulty == payload.difficulty)

    result = await db.execute(query)
    questions: list[Question] = list(result.scalars().all())

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found for the given filters.",
        )

    # Shuffle and trim to requested length
    random.shuffle(questions)
    return questions[: payload.num_questions]


@router.post("/submit", response_model=QuizResult)
async def submit_quiz(
    payload: QuizSubmission,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizResult:
    """
    Grade a completed quiz and persist the result.

    Data flow:
      Frontend sends { category_id?, answers: [{question_id, selected_option}] }
      → Backend loads each question, compares answers, calculates score,
        saves UserProgress record, returns detailed per-question feedback.
    """
    from app.models.progress import UserProgress
    from app.schemas.quiz import AnswerResult
    from datetime import date, datetime, timezone

    if not payload.answers:
        raise HTTPException(status_code=400, detail="No answers provided.")

    # Bulk-fetch all referenced questions in one query
    question_ids = [a.question_id for a in payload.answers]
    result = await db.execute(
        select(Question).where(Question.id.in_(question_ids))
    )
    questions_map: dict[int, Question] = {q.id: q for q in result.scalars().all()}

    answer_results: list[AnswerResult] = []
    correct_count = 0

    for answer in payload.answers:
        question = questions_map.get(answer.question_id)
        if question is None:
            continue  # skip unknown question IDs gracefully
        is_correct = question.correct_option == answer.selected_option.upper()
        if is_correct:
            correct_count += 1
        answer_results.append(
            AnswerResult(
                question_id=question.id,
                selected_option=answer.selected_option,
                correct_option=question.correct_option,
                is_correct=is_correct,
                explanation=question.explanation,
            )
        )

    total = len(answer_results)
    accuracy = correct_count / total if total > 0 else 0.0

    # Determine category for progress – use the first question's category if not supplied
    category_id = payload.category_id
    if category_id is None and answer_results:
        first_q = questions_map.get(answer_results[0].question_id)
        category_id = first_q.category_id if first_q else None

    # Persist progress record
    if category_id is not None:
        today = date.today()

        # Compute streak: fetch the most recent progress entry for this user
        latest_result = await db.execute(
            select(UserProgress)
            .where(UserProgress.user_id == current_user.id)
            .order_by(UserProgress.quiz_date.desc())
            .limit(1)
        )
        latest = latest_result.scalars().first()

        if latest is None or latest.last_activity_date is None:
            new_streak = 1
        elif latest.last_activity_date == today:
            # Already played today – carry streak forward
            new_streak = latest.current_streak
        elif (today - latest.last_activity_date).days == 1:
            # Played yesterday – extend streak
            new_streak = latest.current_streak + 1
        else:
            # Gap of more than one day – reset streak
            new_streak = 1

        progress = UserProgress(
            user_id=current_user.id,
            category_id=category_id,
            score=correct_count,
            total_questions=total,
            accuracy=accuracy,
            quiz_date=datetime.now(timezone.utc),
            current_streak=new_streak,
            last_activity_date=today,
        )
        db.add(progress)

    return QuizResult(
        score=correct_count,
        total_questions=total,
        accuracy=accuracy,
        results=answer_results,
    )
