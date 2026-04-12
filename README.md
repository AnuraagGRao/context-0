# 🧠 QuizMaster – General Knowledge Learning Application

A full-stack quiz application built with **FastAPI**, **PostgreSQL**, **React**, and **TailwindCSS**.

## Architecture

```
context-0/
├── backend/                  # Python FastAPI API
│   ├── app/
│   │   ├── main.py           # FastAPI app entry-point & CORS
│   │   ├── config.py         # Pydantic settings from env vars
│   │   ├── database.py       # Async SQLAlchemy engine + session
│   │   ├── models/           # ORM models (User, Category, Question, UserProgress)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # API route handlers (auth, quiz, progress)
│   │   └── core/             # Security (JWT) and dependency helpers
│   ├── alembic/              # Database migrations
│   ├── seed.py               # Sample data seeder
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React + TailwindCSS SPA
│   ├── src/
│   │   ├── api/client.js     # Axios + auth interceptor
│   │   ├── context/          # AuthContext (JWT storage)
│   │   └── components/       # Login, Register, Quiz, Dashboard, Navbar
│   ├── Dockerfile            # Multi-stage production build
│   ├── Dockerfile.dev        # Vite dev server
│   └── nginx.conf
└── docker-compose.yml        # Orchestrates db + backend + frontend
```

## Quick Start (Docker)

```bash
# Clone and start all services
git clone <repo>
cd context-0
docker-compose up --build
```

Services:
| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000        |
| API      | http://localhost:8000        |
| API Docs | http://localhost:8000/docs   |
| Database | localhost:5432               |

## Features

- **JWT Authentication** – register, login, persistent sessions
- **Categories** – Science, History, Geography, Pop Culture, Technology
- **Quiz Engine** – randomised MCQs with immediate answer feedback & explanations
- **Progress Tracking** – accuracy stats, learning streaks, weak subject analysis

## Data Flow

```
Browser (React) ──POST /api/quiz/start──→ FastAPI ──SELECT──→ PostgreSQL
                 ←── questions[] ─────────────────────────────────────────
User selects answers
Browser ──POST /api/quiz/submit──→ FastAPI grades answers → saves UserProgress
        ←── QuizResult (score, per-question feedback) ───────────────────
```

## Development (without Docker)

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Start PostgreSQL separately, then:
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```
