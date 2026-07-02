def test_register_returns_token(client):
    r = client.post("/api/auth/register", json={"email": "new@example.com", "password": "pass123"})
    assert r.status_code == 201
    assert "access_token" in r.json()

def test_duplicate_email_rejected(client):
    client.post("/api/auth/register", json={"email": "dup@example.com", "password": "pass"})
    r = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "pass"})
    assert r.status_code == 400
    assert "already" in r.json()["detail"].lower()

def test_login_correct_credentials(client):
    client.post("/api/auth/register", json={"email": "u@example.com", "password": "pass123"})
    r = client.post("/api/auth/login", json={"email": "u@example.com", "password": "pass123"})
    assert r.status_code == 200
    assert "access_token" in r.json()

def test_login_wrong_password(client):
    client.post("/api/auth/register", json={"email": "u@example.com", "password": "pass123"})
    r = client.post("/api/auth/login", json={"email": "u@example.com", "password": "wrong"})
    assert r.status_code == 401

def test_me_with_valid_token(auth_client):
    r = auth_client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"

def test_me_with_invalid_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer badtoken"})
    assert r.status_code in (401, 403)
