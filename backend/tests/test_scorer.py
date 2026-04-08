from app.services.scorer import SYSTEM_PROMPT, build_user_prompt

DIMENSIONS = [
    "problem_clarity",
    "target_customer",
    "alternatives",
    "distribution",
    "defensibility",
    "founder_market_fit",
]


def test_system_prompt_contains_all_dimensions():
    for dim in DIMENSIONS:
        assert dim in SYSTEM_PROMPT, f"Missing dimension in system prompt: {dim}"


def test_system_prompt_enforces_json_only():
    assert "ONLY valid JSON" in SYSTEM_PROMPT


def test_system_prompt_forbids_charitable_scoring():
    assert "Do not be charitable" in SYSTEM_PROMPT


def test_build_user_prompt_includes_idea():
    prompt = build_user_prompt("  My great idea  ")
    assert "My great idea" in prompt


def test_build_user_prompt_strips_whitespace():
    prompt = build_user_prompt("  padded  ")
    assert prompt.endswith("padded")
