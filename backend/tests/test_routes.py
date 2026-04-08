import json
from unittest.mock import patch, MagicMock
from app.models.schemas import ScorecardResponse


MOCK_SCORECARD = ScorecardResponse.model_validate({
    "summary": "A test idea.",
    "scores": {
        "problem_clarity":    {"score": 7, "reasoning": "Clear.", "flags": []},
        "target_customer":    {"score": 6, "reasoning": "Defined.", "flags": []},
        "alternatives":       {"score": 5, "reasoning": "Some exist.", "flags": []},
        "distribution":       {"score": 4, "reasoning": "Unclear.", "flags": []},
        "defensibility":      {"score": 3, "reasoning": "Weak.", "flags": []},
        "founder_market_fit": {"score": 8, "reasoning": "Strong.", "flags": []},
    },
    "overall_score": 5.5,
    "verdict": "PROMISING",
    "critical_question": "Who is your first customer?",
    "strengths": ["Clear problem"],
    "risks": ["No moat"],
})

MOCK_RAW = {"summary": "A test idea.", "overall_score": 5.5}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_analyze_empty_body(client):
    r = client.post("/api/analyze", json={})
    assert r.status_code == 400


def test_analyze_too_short(client):
    r = client.post("/api/analyze", json={"idea": "short"})
    assert r.status_code == 400


def test_analyze_success(client):
    with patch("app.routes.analyze.call_groq", return_value=(MOCK_SCORECARD, MOCK_RAW)):
        r = client.post("/api/analyze", json={"idea": "A startup idea that is long enough to pass validation checks."})
        assert r.status_code == 200
        data = r.get_json()
        assert data["verdict"] == "PROMISING"
        assert len(data["dimension_scores"]) == 6


def test_analyze_ai_failure_returns_502(client):
    with patch("app.routes.analyze.call_groq", side_effect=RuntimeError("AI failed")):
        r = client.post("/api/analyze", json={"idea": "A startup idea that is long enough to pass validation checks."})
        assert r.status_code == 502


def test_admin_stats(client):
    r = client.get("/api/admin/stats")
    assert r.status_code == 200
    data = r.get_json()
    assert "total_analyses" in data
    assert "verdict_distribution" in data
