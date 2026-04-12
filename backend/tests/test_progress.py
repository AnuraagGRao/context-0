"""Tests for /api/progress/* endpoints."""


async def test_stats_requires_auth(client):
    resp = await client.get("/api/progress/stats")
    assert resp.status_code == 401


async def test_stats_empty_for_new_user(auth_client):
    resp = await auth_client.get("/api/progress/stats")
    assert resp.status_code == 200
    stats = resp.json()
    assert stats["total_quizzes"] == 0
    assert stats["overall_accuracy"] == 0.0
    assert stats["current_streak"] == 0
    assert stats["weak_subjects"] == []
    assert stats["recent_activity"] == []


async def test_stats_after_perfect_quiz(seeded_client):
    qs = (await seeded_client.post("/api/quiz/start", json={"num_questions": 2})).json()
    cat_id = (await seeded_client.get("/api/quiz/categories")).json()[0]["id"]
    answers = [{"question_id": q["id"], "selected_option": q["correct_option"]} for q in qs]
    await seeded_client.post(
        "/api/quiz/submit", json={"category_id": cat_id, "answers": answers}
    )

    stats = (await seeded_client.get("/api/progress/stats")).json()
    assert stats["total_quizzes"] == 1
    assert stats["overall_accuracy"] == 1.0
    assert stats["current_streak"] == 1
    assert len(stats["recent_activity"]) == 1
    activity = stats["recent_activity"][0]
    assert activity["score"] == 2
    assert activity["total_questions"] == 2
    assert activity["category_name"] == "Science"


async def test_stats_weak_subject(seeded_client):
    """A subject with 0% accuracy must appear in weak_subjects."""
    qs = (await seeded_client.post("/api/quiz/start", json={"num_questions": 2})).json()
    cat_id = (await seeded_client.get("/api/quiz/categories")).json()[0]["id"]
    answers = [
        {
            "question_id": q["id"],
            "selected_option": next(o for o in "ABCD" if o != q["correct_option"]),
        }
        for q in qs
    ]
    await seeded_client.post(
        "/api/quiz/submit", json={"category_id": cat_id, "answers": answers}
    )

    stats = (await seeded_client.get("/api/progress/stats")).json()
    assert len(stats["weak_subjects"]) == 1
    ws = stats["weak_subjects"][0]
    assert ws["category_name"] == "Science"
    assert ws["average_accuracy"] == 0.0


async def test_stats_high_accuracy_not_weak_subject(seeded_client):
    """A subject with 100% accuracy must NOT appear in weak_subjects."""
    qs = (await seeded_client.post("/api/quiz/start", json={"num_questions": 2})).json()
    cat_id = (await seeded_client.get("/api/quiz/categories")).json()[0]["id"]
    answers = [{"question_id": q["id"], "selected_option": q["correct_option"]} for q in qs]
    await seeded_client.post(
        "/api/quiz/submit", json={"category_id": cat_id, "answers": answers}
    )

    stats = (await seeded_client.get("/api/progress/stats")).json()
    assert stats["weak_subjects"] == []
