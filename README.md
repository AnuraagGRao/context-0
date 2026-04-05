# 🧠 QuizMaster

A General Knowledge Learning Application built with FastAPI, PostgreSQL, and React.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy (async), Alembic, PostgreSQL, JWT auth
- **Frontend**: React 19, TailwindCSS, Vite, Axios
- **Infrastructure**: Docker Compose

## Quick Start

```bash
docker-compose up --build
```

Services:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Database | localhost:5432 |

## Features

- 🔐 JWT authentication (register / login)
- 📚 Multiple question categories and difficulty levels
- 🧩 Randomised MCQ quiz engine
- 🔥 Daily streak tracking
- 📊 User progress dashboard with weak-subject detection
- 🛡️ Input validation (password ≥ 8 chars, username ≥ 3 chars)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `SECRET_KEY` | dev placeholder | JWT signing key – **change in production** |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Comma-separated allowed origins |
| `DEBUG` | `false` | Enable SQLAlchemy query logging |