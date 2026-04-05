"""
Seed script – populates the database with 5 categories and 8 questions each.
Run after `alembic upgrade head`. Safe to re-run (checks for existing data).
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.category import Category
from app.models.question import Question

SEED_DATA = [
    {
        "name": "Science",
        "description": "Questions about physics, chemistry, biology and more.",
        "icon": "🔬",
        "questions": [
            {
                "text": "What is the chemical symbol for gold?",
                "option_a": "Go",
                "option_b": "Gd",
                "option_c": "Au",
                "option_d": "Ag",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "Gold's symbol Au comes from the Latin word 'aurum'.",
            },
            {
                "text": "How many bones are in the adult human body?",
                "option_a": "196",
                "option_b": "206",
                "option_c": "216",
                "option_d": "226",
                "correct_option": "B",
                "difficulty": "easy",
                "explanation": "An adult human body has 206 bones.",
            },
            {
                "text": "What is the speed of light in a vacuum (approximately)?",
                "option_a": "300,000 km/s",
                "option_b": "150,000 km/s",
                "option_c": "450,000 km/s",
                "option_d": "600,000 km/s",
                "correct_option": "A",
                "difficulty": "medium",
                "explanation": "The speed of light in a vacuum is approximately 299,792 km/s, commonly rounded to 300,000 km/s.",
            },
            {
                "text": "Which planet in our solar system has the most moons?",
                "option_a": "Jupiter",
                "option_b": "Saturn",
                "option_c": "Uranus",
                "option_d": "Neptune",
                "correct_option": "B",
                "difficulty": "medium",
                "explanation": "Saturn has over 140 confirmed moons, more than any other planet.",
            },
            {
                "text": "What is the powerhouse of the cell?",
                "option_a": "Nucleus",
                "option_b": "Ribosome",
                "option_c": "Mitochondria",
                "option_d": "Golgi apparatus",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "Mitochondria produce ATP, the energy currency of the cell.",
            },
            {
                "text": "What is the atomic number of carbon?",
                "option_a": "4",
                "option_b": "6",
                "option_c": "8",
                "option_d": "12",
                "correct_option": "B",
                "difficulty": "medium",
                "explanation": "Carbon has 6 protons, giving it atomic number 6.",
            },
            {
                "text": "Which law states that for every action there is an equal and opposite reaction?",
                "option_a": "Newton's First Law",
                "option_b": "Newton's Second Law",
                "option_c": "Newton's Third Law",
                "option_d": "Hooke's Law",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "Newton's Third Law of Motion describes action-reaction pairs.",
            },
            {
                "text": "What is the half-life of Carbon-14?",
                "option_a": "570 years",
                "option_b": "1,600 years",
                "option_c": "5,730 years",
                "option_d": "14,300 years",
                "correct_option": "C",
                "difficulty": "hard",
                "explanation": "Carbon-14 has a half-life of approximately 5,730 years, used in radiocarbon dating.",
            },
        ],
    },
    {
        "name": "History",
        "description": "World history from ancient civilisations to modern times.",
        "icon": "🏛️",
        "questions": [
            {
                "text": "In which year did World War II end?",
                "option_a": "1943",
                "option_b": "1944",
                "option_c": "1945",
                "option_d": "1946",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "World War II ended in 1945 with Germany surrendering in May and Japan in September.",
            },
            {
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
                "text": "The Great Wall of China was primarily built during which dynasty?",
                "option_a": "Han Dynasty",
                "option_b": "Tang Dynasty",
                "option_c": "Ming Dynasty",
                "option_d": "Qing Dynasty",
                "correct_option": "C",
                "difficulty": "medium",
                "explanation": "The majority of the existing Great Wall was built during the Ming Dynasty (1368–1644).",
            },
            {
                "text": "Which ancient wonder was located in Alexandria, Egypt?",
                "option_a": "Hanging Gardens",
                "option_b": "Colossus of Rhodes",
                "option_c": "Statue of Zeus",
                "option_d": "Lighthouse of Alexandria",
                "correct_option": "D",
                "difficulty": "medium",
                "explanation": "The Lighthouse of Alexandria (Pharos) stood at the entrance to Alexandria's harbour.",
            },
            {
                "text": "In what year did the Berlin Wall fall?",
                "option_a": "1987",
                "option_b": "1989",
                "option_c": "1991",
                "option_d": "1993",
                "correct_option": "B",
                "difficulty": "easy",
                "explanation": "The Berlin Wall fell on November 9, 1989.",
            },
            {
                "text": "Which empire was ruled by Genghis Khan?",
                "option_a": "Ottoman Empire",
                "option_b": "Roman Empire",
                "option_c": "Mongol Empire",
                "option_d": "Persian Empire",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "Genghis Khan founded and ruled the Mongol Empire, the largest contiguous land empire in history.",
            },
            {
                "text": "What was the name of the ship that sank after hitting an iceberg in 1912?",
                "option_a": "Lusitania",
                "option_b": "Britannic",
                "option_c": "Olympic",
                "option_d": "Titanic",
                "correct_option": "D",
                "difficulty": "easy",
                "explanation": "The RMS Titanic sank on April 15, 1912 after striking an iceberg.",
            },
            {
                "text": "The Treaty of Westphalia (1648) ended which conflict?",
                "option_a": "The Hundred Years' War",
                "option_b": "The Thirty Years' War",
                "option_c": "The Seven Years' War",
                "option_d": "The War of the Roses",
                "correct_option": "B",
                "difficulty": "hard",
                "explanation": "The Peace of Westphalia ended the Thirty Years' War and is considered a foundation of modern international relations.",
            },
        ],
    },
    {
        "name": "Geography",
        "description": "Countries, capitals, rivers, mountains and more.",
        "icon": "🌍",
        "questions": [
            {
                "text": "What is the capital of Australia?",
                "option_a": "Sydney",
                "option_b": "Melbourne",
                "option_c": "Brisbane",
                "option_d": "Canberra",
                "correct_option": "D",
                "difficulty": "easy",
                "explanation": "Canberra is the capital city of Australia, chosen as a compromise between Sydney and Melbourne.",
            },
            {
                "text": "Which is the longest river in the world?",
                "option_a": "Amazon",
                "option_b": "Yangtze",
                "option_c": "Nile",
                "option_d": "Mississippi",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "The Nile River in Africa is generally considered the longest river at approximately 6,650 km.",
            },
            {
                "text": "Mount Everest is located on the border of which two countries?",
                "option_a": "India and Tibet",
                "option_b": "Nepal and Tibet",
                "option_c": "Nepal and India",
                "option_d": "China and Bhutan",
                "correct_option": "B",
                "difficulty": "medium",
                "explanation": "Mount Everest straddles the border between Nepal and the Tibet Autonomous Region of China.",
            },
            {
                "text": "Which country has the most natural lakes?",
                "option_a": "Russia",
                "option_b": "United States",
                "option_c": "Canada",
                "option_d": "Finland",
                "correct_option": "C",
                "difficulty": "medium",
                "explanation": "Canada has over 2 million lakes, more than any other country.",
            },
            {
                "text": "What is the smallest country in the world by area?",
                "option_a": "Monaco",
                "option_b": "San Marino",
                "option_c": "Liechtenstein",
                "option_d": "Vatican City",
                "correct_option": "D",
                "difficulty": "easy",
                "explanation": "Vatican City covers approximately 0.44 km², making it the world's smallest country.",
            },
            {
                "text": "The Amazon Rainforest is primarily located in which country?",
                "option_a": "Colombia",
                "option_b": "Peru",
                "option_c": "Brazil",
                "option_d": "Venezuela",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "About 60% of the Amazon Rainforest is located within Brazil.",
            },
            {
                "text": "Which African country has the largest population?",
                "option_a": "Ethiopia",
                "option_b": "Egypt",
                "option_c": "South Africa",
                "option_d": "Nigeria",
                "correct_option": "D",
                "difficulty": "medium",
                "explanation": "Nigeria is the most populous African country with over 220 million people.",
            },
            {
                "text": "The Strait of Malacca separates which two landmasses?",
                "option_a": "Sumatra and the Malay Peninsula",
                "option_b": "Java and Borneo",
                "option_c": "Borneo and the Philippines",
                "option_d": "Sumatra and Java",
                "correct_option": "A",
                "difficulty": "hard",
                "explanation": "The Strait of Malacca is a narrow waterway between the Malay Peninsula and Sumatra.",
            },
        ],
    },
    {
        "name": "Technology",
        "description": "Computing, internet, software and modern technology.",
        "icon": "💻",
        "questions": [
            {
                "text": "What does 'HTTP' stand for?",
                "option_a": "HyperText Transfer Protocol",
                "option_b": "High-Tech Transfer Process",
                "option_c": "HyperText Transmission Program",
                "option_d": "Home Tool Transfer Protocol",
                "correct_option": "A",
                "difficulty": "easy",
                "explanation": "HTTP stands for HyperText Transfer Protocol, the foundation of data communication on the web.",
            },
            {
                "text": "Who co-founded Apple Inc. alongside Steve Jobs?",
                "option_a": "Bill Gates",
                "option_b": "Steve Wozniak",
                "option_c": "Larry Page",
                "option_d": "Mark Zuckerberg",
                "correct_option": "B",
                "difficulty": "easy",
                "explanation": "Steve Wozniak co-founded Apple Inc. with Steve Jobs and Ronald Wayne in 1976.",
            },
            {
                "text": "What programming language was created by Guido van Rossum?",
                "option_a": "Ruby",
                "option_b": "Java",
                "option_c": "Python",
                "option_d": "Perl",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "Python was created by Guido van Rossum and first released in 1991.",
            },
            {
                "text": "What does 'CPU' stand for?",
                "option_a": "Central Processing Unit",
                "option_b": "Core Processing Utility",
                "option_c": "Computer Processing Unit",
                "option_d": "Central Program Unit",
                "correct_option": "A",
                "difficulty": "easy",
                "explanation": "CPU stands for Central Processing Unit, the primary component that executes instructions.",
            },
            {
                "text": "Which company developed the Linux kernel?",
                "option_a": "Microsoft",
                "option_b": "IBM",
                "option_c": "Linus Torvalds (individual)",
                "option_d": "Sun Microsystems",
                "correct_option": "C",
                "difficulty": "medium",
                "explanation": "The Linux kernel was created by Linus Torvalds and first released in 1991.",
            },
            {
                "text": "What does 'SQL' stand for?",
                "option_a": "Structured Query Language",
                "option_b": "Sequential Query Logic",
                "option_c": "Standard Query Language",
                "option_d": "Simple Queue Language",
                "correct_option": "A",
                "difficulty": "easy",
                "explanation": "SQL stands for Structured Query Language, used for managing relational databases.",
            },
            {
                "text": "In binary, what is the decimal value of 1010?",
                "option_a": "8",
                "option_b": "9",
                "option_c": "10",
                "option_d": "12",
                "correct_option": "C",
                "difficulty": "medium",
                "explanation": "1010 in binary = 1×8 + 0×4 + 1×2 + 0×1 = 10 in decimal.",
            },
            {
                "text": "Which sorting algorithm has the best average-case time complexity?",
                "option_a": "Bubble Sort",
                "option_b": "Merge Sort",
                "option_c": "Insertion Sort",
                "option_d": "Selection Sort",
                "correct_option": "B",
                "difficulty": "hard",
                "explanation": "Merge Sort has O(n log n) average and worst-case complexity, better than O(n²) algorithms.",
            },
        ],
    },
    {
        "name": "Sports",
        "description": "Football, Olympics, athletics and world sports.",
        "icon": "⚽",
        "questions": [
            {
                "text": "How many players are on a standard soccer (football) team on the field?",
                "option_a": "9",
                "option_b": "10",
                "option_c": "11",
                "option_d": "12",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "Each soccer team fields 11 players, including the goalkeeper.",
            },
            {
                "text": "In which country were the first modern Olympic Games held?",
                "option_a": "France",
                "option_b": "Greece",
                "option_c": "Italy",
                "option_d": "United Kingdom",
                "correct_option": "B",
                "difficulty": "easy",
                "explanation": "The first modern Olympic Games were held in Athens, Greece in 1896.",
            },
            {
                "text": "Which country has won the most FIFA World Cup titles?",
                "option_a": "Germany",
                "option_b": "Argentina",
                "option_c": "Italy",
                "option_d": "Brazil",
                "correct_option": "D",
                "difficulty": "easy",
                "explanation": "Brazil has won the FIFA World Cup 5 times (1958, 1962, 1970, 1994, 2002).",
            },
            {
                "text": "In tennis, what is the term for a score of 40-40?",
                "option_a": "Advantage",
                "option_b": "Deuce",
                "option_c": "Tie",
                "option_d": "Match point",
                "correct_option": "B",
                "difficulty": "easy",
                "explanation": "When both players reach 40, the score is called 'Deuce'.",
            },
            {
                "text": "How long is a standard marathon race?",
                "option_a": "26.2 miles (42.195 km)",
                "option_b": "25 miles (40.2 km)",
                "option_c": "27 miles (43.5 km)",
                "option_d": "24 miles (38.6 km)",
                "correct_option": "A",
                "difficulty": "medium",
                "explanation": "A standard marathon is 26.2 miles or 42.195 kilometres.",
            },
            {
                "text": "Which sport uses a shuttlecock?",
                "option_a": "Squash",
                "option_b": "Racquetball",
                "option_c": "Badminton",
                "option_d": "Pickleball",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "Badminton is played with a shuttlecock (also called a 'birdie').",
            },
            {
                "text": "In basketball, how many points is a shot from beyond the arc worth?",
                "option_a": "1",
                "option_b": "2",
                "option_c": "3",
                "option_d": "4",
                "correct_option": "C",
                "difficulty": "easy",
                "explanation": "A shot from beyond the three-point arc is worth 3 points.",
            },
            {
                "text": "Which swimmer holds the record for the most Olympic gold medals?",
                "option_a": "Ian Thorpe",
                "option_b": "Mark Spitz",
                "option_c": "Michael Phelps",
                "option_d": "Ryan Lochte",
                "correct_option": "C",
                "difficulty": "medium",
                "explanation": "Michael Phelps won 23 Olympic gold medals, the most of any athlete in history.",
            },
        ],
    },
]


async def seed() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(Category).limit(1))
        if result.scalar_one_or_none() is not None:
            print("Database already seeded – skipping.")
            await engine.dispose()
            return

        print("Seeding database...")
        for cat_data in SEED_DATA:
            questions_data = cat_data.pop("questions")
            category = Category(**cat_data)
            session.add(category)
            await session.flush()  # get category.id

            for q_data in questions_data:
                question = Question(category_id=category.id, **q_data)
                session.add(question)

        await session.commit()
        print(f"Seeded {len(SEED_DATA)} categories with 8 questions each.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
