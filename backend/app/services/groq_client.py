import json
import logging

from flask import current_app
from groq import Groq
from pydantic import ValidationError

from app.models.schemas import ScorecardResponse

logger = logging.getLogger(__name__)

RETRY_INJECTION = (
    "\n\nCRITICAL: You must return ONLY valid JSON. No prose. No markdown fences. "
    "No explanation. Raw JSON only."
)


def _build_request_payload(system_prompt: str, user_prompt: str, model: str) -> dict:
    return {
        "model": model,
        "temperature": 0.2,
        "max_tokens": 2048,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
    }


def _call_groq_api(system_prompt: str, user_prompt: str) -> dict:
    api_key = current_app.config.get("GROQ_API_KEY")
    model = current_app.config.get("GROQ_MODEL", "llama-3.1-8b-instant")

    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    try:
        client = Groq(api_key=api_key.strip())
        completion = client.chat.completions.create(**_build_request_payload(system_prompt, user_prompt, model))
        return completion.model_dump()
    except Exception as e:
        raise RuntimeError(f"Groq API request failed for model '{model}': {e}") from e


def _extract_model_text(response_payload: dict) -> str:
    try:
        return response_payload["choices"][0]["message"]["content"].strip()
    except Exception as e:
        raise RuntimeError(f"Invalid Groq response format: {e}")


def call_groq(system_prompt: str, user_prompt: str) -> tuple[ScorecardResponse, dict]:
    raw_text = None

    for attempt in range(2):
        try:
            prompt = user_prompt if attempt == 0 else user_prompt + RETRY_INJECTION

            response_payload = _call_groq_api(system_prompt, prompt)
            raw_text = _extract_model_text(response_payload)

            raw_dict = json.loads(raw_text)

            scorecard = ScorecardResponse.model_validate(raw_dict)

            return scorecard, raw_dict

        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning(
                "⚠️ Attempt %d failed: %s\nRAW: %s",
                attempt + 1,
                e,
                raw_text,
            )

            if attempt == 1:
                raise RuntimeError(
                    f"Groq returned invalid JSON after 2 attempts: {e}"
                )

        except Exception as e:
            logger.error("Unexpected Groq error: %s", e)
            raise