def test_create_survey(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "My Survey", "description": "test"})
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "My Survey"
    assert data["share_token"] is not None
    assert data["questions"] == []

def test_list_surveys(auth_client):
    auth_client.post("/api/surveys", json={"title": "S1"})
    auth_client.post("/api/surveys", json={"title": "S2"})
    r = auth_client.get("/api/surveys")
    assert r.status_code == 200
    assert len(r.json()) == 2

def test_get_survey_not_owned(client, auth_client):
    r = auth_client.post("/api/surveys", json={"title": "S"})
    survey_id = r.json()["id"]
    # Register a second user and try to access the survey
    r2 = client.post("/api/auth/register", json={"email": "other@example.com", "password": "pass"})
    token2 = r2.json()["access_token"]
    r3 = client.get(f"/api/surveys/{survey_id}", headers={"Authorization": f"Bearer {token2}"})
    assert r3.status_code == 404

def test_delete_survey(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "To Delete"})
    survey_id = r.json()["id"]
    del_r = auth_client.delete(f"/api/surveys/{survey_id}")
    assert del_r.status_code == 200
    get_r = auth_client.get(f"/api/surveys/{survey_id}")
    assert get_r.status_code == 404

def test_toggle_survey_active(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "Toggle Test"})
    survey_id = r.json()["id"]
    assert r.json()["is_active"] is True
    r2 = auth_client.put(f"/api/surveys/{survey_id}/toggle")
    assert r2.json()["is_active"] is False

def test_add_and_reorder_questions(auth_client):
    r = auth_client.post("/api/surveys", json={"title": "Q Survey"})
    sid = r.json()["id"]
    q1 = auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "text", "label": "Q1"}).json()
    q2 = auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "nps", "label": "Q2"}).json()
    assert q1["order_index"] == 0
    assert q2["order_index"] == 1
    # Reorder: put Q2 first
    r3 = auth_client.post(f"/api/surveys/{sid}/questions/reorder",
        json={"question_ids": [q2["id"], q1["id"]]})
    assert r3.status_code == 200
    survey_r = auth_client.get(f"/api/surveys/{sid}").json()
    questions = survey_r["questions"]
    assert questions[0]["id"] == q2["id"]
    assert questions[1]["id"] == q1["id"]
