"""Tests for /api/quiz/* endpoints."""


async def test_list_categories_empty(client):
    resp = await client.get("/api/quiz/categories")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_categories_returns_seeded(seeded_client):
    resp = await seeded_client.get("/api/quiz/categories")
    assert resp.status_code == 200
    cats = resp.json()
    assert len(cats) == 1
    assert cats[0]["name"] == "Science"
    assert cats[0]["icon"] == "🔬"


async def test_start_quiz_requires_auth(client):
    resp = await client.post("/api/quiz/start", json={"num_questions": 1})
    assert resp.status_code == 401


async def test_start_quiz_returns_questions(seeded_client):
    resp = await seeded_client.post("/api/quiz/start", json={"num_questions": 2})
    assert resp.status_code == 200
    questions = resp.json()
    assert len(questions) == 2
    for q in questions:
        assert "id" in q
        assert "text" in q
        assert "option_a" in q and "option_b" in q and "option_c" in q and "option_d" in q
        assert "correct_option" in q
        assert "category" in q


async def test_start_quiz_respects_num_questions(seeded_client):
    resp = await seeded_client.post("/api/quiz/start", json={"num_questions": 1})
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_start_quiz_category_filter(seeded_client):
    cat_id = (await seeded_client.get("/api/quiz/categories")).json()[0]["id"]
    resp = await seeded_client.post(
        "/api/quiz/start", json={"category_id": cat_id, "num_questions": 2}
    )
    assert resp.status_code == 200
    assert all(q["category"]["id"] == cat_id for q in resp.json())


async def test_start_quiz_unknown_category_returns_404(seeded_client):
    resp = await seeded_client.post(
        "/api/quiz/start", json={"category_id": 9999, "num_questions": 1}
    )
    assert resp.status_code == 404


async def test_start_quiz_difficulty_easy_matches(seeded_client):
    resp = await seeded_client.post(
        "/api/quiz/start", json={"difficulty": "easy", "num_questions": 2}
    )
    assert resp.status_code == 200
    assert all(q["difficulty"] == "easy" for q in resp.json())


async def test_start_quiz_difficulty_no_match_returns_404(seeded_client):
    resp = await seeded_client.post(
        "/api/quiz/start", json={"difficulty": "hard", "num_questions": 1}
    )
    assert resp.status_code == 404


async def test_submit_quiz_requires_auth(client):
    resp = await client.post(
        "/api/quiz/submit",
        json={"answers": [{"question_id": 1, "selected_option": "A"}]},
    )
    assert resp.status_code == 401


async def test_submit_quiz_empty_answers_returns_400(auth_client):
    resp = await auth_client.post("/api/quiz/submit", json={"answers": []})
    assert resp.status_code == 400


async def test_submit_quiz_all_correct(seeded_client):
    qs = (await seeded_client.post("/api/quiz/start", json={"num_questions": 2})).json()
    answers = [{"question_id": q["id"], "selected_option": q["correct_option"]} for q in qs]
    resp = await seeded_client.post("/api/quiz/submit", json={"answers": answers})
    assert resp.status_code == 200
    result = resp.json()
    assert result["score"] == 2
    assert result["total_questions"] == 2
    assert result["accuracy"] == 1.0
    assert all(r["is_correct"] for r in result["results"])


async def test_submit_quiz_all_wrong(seeded_client):
    qs = (await seeded_client.post("/api/quiz/start", json={"num_questions": 2})).json()
    answers = [
        {
            "question_id": q["id"],
            "selected_option": next(o for o in "ABCD" if o != q["correct_option"]),
        }
        for q in qs
    ]
    resp = await seeded_client.post("/api/quiz/submit", json={"answers": answers})
    assert resp.status_code == 200
    result = resp.json()
    assert result["score"] == 0
    assert result["accuracy"] == 0.0
    assert not any(r["is_correct"] for r in result["results"])


async def test_submit_quiz_returns_explanation_and_correct_option(seeded_client):
    qs = (await seeded_client.post("/api/quiz/start", json={"num_questions": 1})).json()
    resp = await seeded_client.post(
        "/api/quiz/submit",
        json={"answers": [{"question_id": qs[0]["id"], "selected_option": "A"}]},
    )
    assert resp.status_code == 200
    r = resp.json()["results"][0]
    assert r["correct_option"] == qs[0]["correct_option"]
    assert r["explanation"] is not None
