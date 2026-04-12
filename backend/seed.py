"""Seed database with sample categories and questions."""
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = "postgresql+asyncpg://quiz_user:quiz_pass@db:5432/quiz_db"

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

CATEGORIES = [
    {"name": "Science", "description": "Physics, Chemistry, Biology and more", "icon": "🔬"},
    {"name": "History", "description": "World history from ancient times to modern era", "icon": "📜"},
    {"name": "Geography", "description": "Countries, capitals, rivers and mountains", "icon": "🌍"},
    {"name": "Pop Culture", "description": "Movies, music, celebrities and trends", "icon": "🎬"},
    {"name": "Technology", "description": "Computers, internet and modern tech", "icon": "💻"},
]

QUESTIONS = [
    # Science
    {
        "category": "Science",
        "text": "What is the chemical symbol for gold?",
        "option_a": "Go",
        "option_b": "Gd",
        "option_c": "Au",
        "option_d": "Ag",
        "correct_option": "C",
        "difficulty": "easy",
        "explanation": "Gold's symbol 'Au' comes from the Latin word 'Aurum'.",
    },
    {
        "category": "Science",
        "text": "How many bones are in the adult human body?",
        "option_a": "196",
        "option_b": "206",
        "option_c": "216",
        "option_d": "226",
        "correct_option": "B",
        "difficulty": "medium",
        "explanation": "The adult human body has 206 bones.",
    },
    {
        "category": "Science",
        "text": "What is the speed of light in a vacuum (approximately)?",
        "option_a": "150,000 km/s",
        "option_b": "200,000 km/s",
        "option_c": "300,000 km/s",
        "option_d": "400,000 km/s",
        "correct_option": "C",
        "difficulty": "easy",
        "explanation": "The speed of light in a vacuum is approximately 299,792 km/s.",
    },
    {
        "category": "Science",
        "text": "Which planet has the most moons in our solar system?",
        "option_a": "Jupiter",
        "option_b": "Saturn",
        "option_c": "Uranus",
        "option_d": "Neptune",
        "correct_option": "B",
        "difficulty": "medium",
        "explanation": "As of recent discoveries, Saturn holds the record with over 140 confirmed moons.",
    },
    # History
    {
        "category": "History",
        "text": "In which year did World War II end?",
        "option_a": "1943",
        "option_b": "1944",
        "option_c": "1945",
        "option_d": "1946",
        "correct_option": "C",
        "difficulty": "easy",
        "explanation": "World War II ended in 1945 with Germany's surrender in May and Japan's in September.",
    },
    {
        "category": "History",
        "text": "Who was the first President of the United States?",
        "option_a": "John Adams",
        "option_b": "Thomas Jefferson",
        "option_c": "Benjamin Franklin",
        "option_d": "George Washington",
        "correct_option": "D",
        "difficulty": "easy",
        "explanation": "George Washington served as the first US President from 1789 to 1797.",
    },
    {
        "category": "History",
        "text": "The ancient city of Rome is said to have been founded in which year (BC)?",
        "option_a": "753 BC",
        "option_b": "500 BC",
        "option_c": "1000 BC",
        "option_d": "300 BC",
        "correct_option": "A",
        "difficulty": "medium",
        "explanation": "According to tradition, Rome was founded by Romulus in 753 BC.",
    },
    # Geography
    {
        "category": "Geography",
        "text": "What is the capital city of Australia?",
        "option_a": "Sydney",
        "option_b": "Melbourne",
        "option_c": "Brisbane",
        "option_d": "Canberra",
        "correct_option": "D",
        "difficulty": "easy",
        "explanation": "Canberra has been the capital of Australia since 1913.",
    },
    {
        "category": "Geography",
        "text": "Which is the longest river in the world?",
        "option_a": "Amazon",
        "option_b": "Nile",
        "option_c": "Yangtze",
        "option_d": "Mississippi",
        "correct_option": "B",
        "difficulty": "easy",
        "explanation": "The Nile River in Africa is widely considered the longest river at ~6,650 km.",
    },
    {
        "category": "Geography",
        "text": "Which country has the largest land area in the world?",
        "option_a": "China",
        "option_b": "Canada",
        "option_c": "United States",
        "option_d": "Russia",
        "correct_option": "D",
        "difficulty": "easy",
        "explanation": "Russia is the largest country by land area at approximately 17.1 million km².",
    },
    # Pop Culture
    {
        "category": "Pop Culture",
        "text": "Which film won the Academy Award for Best Picture in 2020?",
        "option_a": "1917",
        "option_b": "Joker",
        "option_c": "Parasite",
        "option_d": "Once Upon a Time in Hollywood",
        "correct_option": "C",
        "difficulty": "medium",
        "explanation": "Parasite (2019) by Bong Joon-ho became the first non-English film to win Best Picture.",
    },
    {
        "category": "Pop Culture",
        "text": "Which artist released the album 'Thriller' in 1982?",
        "option_a": "Prince",
        "option_b": "Michael Jackson",
        "option_c": "David Bowie",
        "option_d": "Elton John",
        "correct_option": "B",
        "difficulty": "easy",
        "explanation": "Michael Jackson's 'Thriller' is the best-selling music album of all time.",
    },
    # Technology
    {
        "category": "Technology",
        "text": "Who co-founded Apple Inc. with Steve Jobs?",
        "option_a": "Bill Gates",
        "option_b": "Steve Wozniak",
        "option_c": "Larry Page",
        "option_d": "Mark Zuckerberg",
        "correct_option": "B",
        "difficulty": "easy",
        "explanation": "Steve Wozniak co-founded Apple in 1976 alongside Steve Jobs and Ronald Wayne.",
    },
    {
        "category": "Technology",
        "text": "What does 'HTTP' stand for?",
        "option_a": "HyperText Transfer Protocol",
        "option_b": "High Transfer Text Protocol",
        "option_c": "HyperText Transmission Process",
        "option_d": "Hybrid Text Transfer Protocol",
        "correct_option": "A",
        "difficulty": "easy",
        "explanation": "HTTP stands for HyperText Transfer Protocol.",
    },
    {
        "category": "Technology",
        "text": "Which programming language was created by Guido van Rossum?",
        "option_a": "Java",
        "option_b": "Ruby",
        "option_c": "Python",
        "option_d": "Perl",
        "correct_option": "C",
        "difficulty": "easy",
        "explanation": "Python was created by Guido van Rossum and first released in 1991.",
    },
]


async def seed() -> None:
    from app.models.category import Category
    from app.models.question import Question
    from sqlalchemy.future import select

    async with AsyncSessionLocal() as db:
        # Skip if already seeded
        existing = await db.execute(select(Category))
        if existing.scalars().first():
            print("Database already seeded, skipping.")
            return

        # Insert categories
        cat_map: dict[str, int] = {}
        for cat_data in CATEGORIES:
            cat = Category(**cat_data)
            db.add(cat)
            await db.flush()
            cat_map[cat.name] = cat.id

        # Insert questions
        for q_data in QUESTIONS:
            category_name = q_data.pop("category")
            q = Question(category_id=cat_map[category_name], **q_data)
            db.add(q)

        await db.commit()
        print(f"Seeded {len(CATEGORIES)} categories and {len(QUESTIONS)} questions.")


if __name__ == "__main__":
    asyncio.run(seed())
