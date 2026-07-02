def _create_survey_with_questions(auth_client):
    """Helper: create a survey with one of each question type. Returns (survey, share_token)."""
    r = auth_client.post("/api/surveys", json={"title": "Public Test"})
    sid = r.json()["id"]
    token = r.json()["share_token"]
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "nps", "label": "Recommend?", "scale_max": 10})
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "rating", "label": "Rating", "scale_max": 5})
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "choice", "label": "Choice", "options": ["A", "B", "C"]})
    auth_client.post(f"/api/surveys/{sid}/questions",
        json={"type": "text", "label": "Comments"})
    return r.json(), token


def test_public_get_survey(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    r = client.get(f"/api/s/{token}")
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == "Public Test"
    assert len(data["questions"]) == 4
    # share_token must NOT be in public response
    assert "share_token" not in data
    assert "user_id" not in data


def test_public_survey_not_found(client):
    r = client.get("/api/s/nonexistent-token")
    assert r.status_code == 404


def test_public_inactive_survey_hidden(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    auth_client.put(f"/api/surveys/{survey['id']}/toggle")  # deactivate
    r = client.get(f"/api/s/{token}")
    assert r.status_code == 404


def test_submit_response(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    questions = client.get(f"/api/s/{token}").json()["questions"]
    answers = [{"question_id": q["id"], "value": "5" if q["type"] != "text" else "Great"} for q in questions]
    r = client.post(f"/api/s/{token}/submit", json={"answers": answers})
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_results_aggregation(client, auth_client):
    survey, token = _create_survey_with_questions(auth_client)
    questions = client.get(f"/api/s/{token}").json()["questions"]
    # Submit 3 responses
    for _ in range(3):
        answers = [
            {"question_id": questions[0]["id"], "value": "9"},   # nps
            {"question_id": questions[1]["id"], "value": "4"},   # rating
            {"question_id": questions[2]["id"], "value": "A"},   # choice
            {"question_id": questions[3]["id"], "value": "Good comment"},  # text
        ]
        client.post(f"/api/s/{token}/submit", json={"answers": answers})
    r = auth_client.get(f"/api/surveys/{survey['id']}/results")
    assert r.status_code == 200
    data = r.json()
    assert data["total_responses"] == 3
    nps_result = next(res for res in data["results"] if res["question"]["type"] == "nps")
    assert nps_result["nps"]["score"] == 100.0  # all 9s = all promoters
    rating_result = next(res for res in data["results"] if res["question"]["type"] == "rating")
    assert rating_result["rating"]["mean"] == 4.0
    choice_result = next(res for res in data["results"] if res["question"]["type"] == "choice")
    assert choice_result["choice"]["counts"]["A"] == 3


def test_results_requires_auth(client, auth_client):
    survey, _ = _create_survey_with_questions(auth_client)
    r = client.get(f"/api/surveys/{survey['id']}/results")
    assert r.status_code in (401, 403)
