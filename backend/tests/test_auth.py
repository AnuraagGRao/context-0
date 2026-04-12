"""Tests for /api/auth/* endpoints."""


async def test_register_success(client):
    resp = await client.post(
        "/api/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "Password1"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["username"] == "alice"
    assert data["email"] == "alice@example.com"
    assert "id" in data
    assert data["is_active"] is True
    assert "hashed_password" not in data


async def test_register_duplicate_username(client):
    await client.post(
        "/api/auth/register",
        json={"username": "bob", "email": "bob@example.com", "password": "Password1"},
    )
    resp = await client.post(
        "/api/auth/register",
        json={"username": "bob", "email": "bob2@example.com", "password": "Password1"},
    )
    assert resp.status_code == 409


async def test_register_duplicate_email(client):
    await client.post(
        "/api/auth/register",
        json={"username": "carol", "email": "carol@example.com", "password": "Password1"},
    )
    resp = await client.post(
        "/api/auth/register",
        json={"username": "carol2", "email": "carol@example.com", "password": "Password1"},
    )
    assert resp.status_code == 409


async def test_register_password_too_short(client):
    resp = await client.post(
        "/api/auth/register",
        json={"username": "dave", "email": "dave@example.com", "password": "Ab1"},
    )
    assert resp.status_code == 422


async def test_register_password_no_digit(client):
    resp = await client.post(
        "/api/auth/register",
        json={"username": "eve", "email": "eve@example.com", "password": "NoDigitsHere"},
    )
    assert resp.status_code == 422


async def test_register_password_no_letter(client):
    resp = await client.post(
        "/api/auth/register",
        json={"username": "frank", "email": "frank@example.com", "password": "12345678"},
    )
    assert resp.status_code == 422


async def test_login_success(client):
    await client.post(
        "/api/auth/register",
        json={"username": "grace", "email": "grace@example.com", "password": "Password1"},
    )
    resp = await client.post(
        "/api/auth/login",
        data={"username": "grace", "password": "Password1"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client):
    await client.post(
        "/api/auth/register",
        json={"username": "henry", "email": "henry@example.com", "password": "Password1"},
    )
    resp = await client.post(
        "/api/auth/login",
        data={"username": "henry", "password": "WrongPass1"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 401


async def test_login_unknown_user(client):
    resp = await client.post(
        "/api/auth/login",
        data={"username": "nobody", "password": "Password1"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 401


async def test_get_me_authenticated(auth_client):
    resp = await auth_client.get("/api/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "testuser"
    assert "hashed_password" not in data


async def test_get_me_unauthenticated(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
