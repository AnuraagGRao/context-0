"""Initial database schema – creates all tables and enum types."""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Enum types ──────────────────────────────────────────────────────────
    answer_option = sa.Enum("A", "B", "C", "D", name="answer_option")
    difficulty_level = sa.Enum("easy", "medium", "hard", name="difficulty_level")

    answer_option.create(op.get_bind(), checkfirst=True)
    difficulty_level.create(op.get_bind(), checkfirst=True)

    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── categories ───────────────────────────────────────────────────────────
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(50), nullable=True),
    )
    op.create_index("ix_categories_id", "categories", ["id"])

    # ── questions ────────────────────────────────────────────────────────────
    op.create_table(
        "questions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "category_id",
            sa.Integer,
            sa.ForeignKey("categories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("option_a", sa.String(500), nullable=False),
        sa.Column("option_b", sa.String(500), nullable=False),
        sa.Column("option_c", sa.String(500), nullable=False),
        sa.Column("option_d", sa.String(500), nullable=False),
        sa.Column("correct_option", sa.Enum("A", "B", "C", "D", name="answer_option"), nullable=False),
        sa.Column(
            "difficulty",
            sa.Enum("easy", "medium", "hard", name="difficulty_level"),
            nullable=False,
            server_default="medium",
        ),
        sa.Column("explanation", sa.Text, nullable=True),
    )
    op.create_index("ix_questions_id", "questions", ["id"])
    op.create_index("ix_questions_category_id", "questions", ["category_id"])

    # ── user_progress ─────────────────────────────────────────────────────────
    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "category_id",
            sa.Integer,
            sa.ForeignKey("categories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("score", sa.Integer, nullable=False),
        sa.Column("total_questions", sa.Integer, nullable=False),
        sa.Column("accuracy", sa.Float, nullable=False),
        sa.Column(
            "quiz_date",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("current_streak", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.Date, nullable=True),
    )
    op.create_index("ix_user_progress_id", "user_progress", ["id"])
    op.create_index("ix_user_progress_user_id", "user_progress", ["user_id"])
    op.create_index("ix_user_progress_category_id", "user_progress", ["category_id"])
    op.create_index("ix_user_progress_quiz_date", "user_progress", ["quiz_date"])


def downgrade() -> None:
    op.drop_table("user_progress")
    op.drop_table("questions")
    op.drop_table("categories")
    op.drop_table("users")

    sa.Enum(name="answer_option").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="difficulty_level").drop(op.get_bind(), checkfirst=True)
