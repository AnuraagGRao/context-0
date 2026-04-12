"""Initial schema – creates all tables."""
from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("username", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # categories
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("icon", sa.String(50), nullable=True),
    )

    # questions
    op.create_table(
        "questions",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("category_id", sa.Integer, sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("option_a", sa.String(500), nullable=False),
        sa.Column("option_b", sa.String(500), nullable=False),
        sa.Column("option_c", sa.String(500), nullable=False),
        sa.Column("option_d", sa.String(500), nullable=False),
        sa.Column("correct_option", sa.Enum("A", "B", "C", "D", name="answer_option"), nullable=False),
        sa.Column("difficulty", sa.Enum("easy", "medium", "hard", name="difficulty_level"), nullable=False, server_default="medium"),
        sa.Column("explanation", sa.Text, nullable=True),
    )

    # user_progress
    op.create_table(
        "user_progress",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category_id", sa.Integer, sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("score", sa.Integer, nullable=False),
        sa.Column("total_questions", sa.Integer, nullable=False),
        sa.Column("accuracy", sa.Float, nullable=False),
        sa.Column("quiz_date", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
        sa.Column("current_streak", sa.Integer, default=0),
        sa.Column("last_activity_date", sa.Date, nullable=True),
    )


def downgrade() -> None:
    op.drop_table("user_progress")
    op.drop_table("questions")
    op.drop_table("categories")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS answer_option")
    op.execute("DROP TYPE IF EXISTS difficulty_level")
