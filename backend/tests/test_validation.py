import pytest
from pydantic import ValidationError
from app.models.schemas import ScorecardResponse


VALID_PAYLOAD = {
    "summary": "A tool that scores startup ideas.",
    "scores": {
        "problem_clarity":    {"score": 7, "reasoning": "Clear pain point.", "flags": []},
        "target_customer":    {"score": 6, "reasoning": "Somewhat defined.", "flags": ["vague persona"]},
        "alternatives":       {"score": 5, "reasoning": "Some alternatives exist.", "flags": []},
        "distribution":       {"score": 4, "reasoning": "No clear channel.", "flags": ["no GTM plan"]},
        "defensibility":      {"score": 3, "reasoning": "Easily copied.", "flags": ["no moat"]},
        "founder_market_fit": {"score": 8, "reasoning": "Strong domain expertise.", "flags": []},
    },
    "overall_score": 5.5,
    "verdict": "PROMISING",
    "critical_question": "How will you acquire the first 10 paying customers?",
    "strengths": ["Clear problem", "Strong founder"],
    "risks": ["No moat", "Crowded market"],
}


def test_valid_payload_parses():
    result = ScorecardResponse.model_validate(VALID_PAYLOAD)
    assert result.verdict == "PROMISING"
    assert result.scores.problem_clarity.score == 7


def test_invalid_verdict_rejected():
    bad = {**VALID_PAYLOAD, "verdict": "MAYBE"}
    with pytest.raises(ValidationError):
        ScorecardResponse.model_validate(bad)


def test_score_out_of_range_rejected():
    bad = dict(VALID_PAYLOAD)
    bad["scores"] = dict(VALID_PAYLOAD["scores"])
    bad["scores"]["problem_clarity"] = {"score": 11, "reasoning": "Too high.", "flags": []}
    with pytest.raises(ValidationError):
        ScorecardResponse.model_validate(bad)


def test_flag_too_long_rejected():
    bad = dict(VALID_PAYLOAD)
    bad["scores"] = dict(VALID_PAYLOAD["scores"])
    bad["scores"]["problem_clarity"] = {
        "score": 5,
        "reasoning": "Fine.",
        "flags": ["this flag has way too many words in it"],
    }
    with pytest.raises(ValidationError):
        ScorecardResponse.model_validate(bad)


def test_missing_dimension_rejected():
    bad = dict(VALID_PAYLOAD)
    scores = dict(VALID_PAYLOAD["scores"])
    del scores["defensibility"]
    bad["scores"] = scores
    with pytest.raises(ValidationError):
        ScorecardResponse.model_validate(bad)
