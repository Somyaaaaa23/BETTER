import hashlib
import time
import logging
from flask import Blueprint, request, jsonify, session
from app import db
from app.models.analysis import Session as UserSession, Analysis, DimensionScore
from app.services.groq_client import call_groq
from app.services.scorer import SYSTEM_PROMPT, build_user_prompt

bp = Blueprint("analyze", __name__)
logger = logging.getLogger(__name__)

DIMENSION_KEYS = [
    "problem_clarity",
    "target_customer",
    "alternatives",
    "distribution",
    "defensibility",
    "founder_market_fit",
]


def _get_or_create_session() -> UserSession:
    sid = session.get("sid")
    if sid:
        user_session = db.session.get(UserSession, sid)
        if user_session:
            return user_session

    ip = request.remote_addr or ""
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()
    user_session = UserSession(
        user_agent=request.headers.get("User-Agent", "")[:512],
        ip_hash=ip_hash,
    )
    db.session.add(user_session)
    db.session.flush()
    session["sid"] = user_session.id
    return user_session


@bp.post("/api/analyze")
def analyze():
    body = request.get_json(silent=True) or {}
    idea_text = (body.get("idea") or "").strip()

    if not idea_text:
        return jsonify({"error": "idea is required"}), 400
    if len(idea_text) < 20:
        return jsonify({"error": "idea is too short (min 20 characters)"}), 400
    if len(idea_text) > 5000:
        return jsonify({"error": "idea is too long (max 5000 characters)"}), 400

    user_session = _get_or_create_session()
    word_count = len(idea_text.split())

    analysis = Analysis(
        session_id=user_session.id,
        raw_input=idea_text,
        input_word_count=word_count,
    )
    db.session.add(analysis)
    # Ensure analysis.id exists before creating DimensionScore rows.
    db.session.flush()

    start = time.monotonic()
    try:
        scorecard, raw_dict = call_groq(SYSTEM_PROMPT, build_user_prompt(idea_text))
        elapsed_ms = int((time.monotonic() - start) * 1000)

        analysis.summary = scorecard.summary
        analysis.overall_score = scorecard.overall_score
        analysis.verdict = scorecard.verdict
        analysis.critical_question = scorecard.critical_question
        analysis.strengths = scorecard.strengths
        analysis.risks = scorecard.risks
        analysis.raw_response = raw_dict
        analysis.processing_ms = elapsed_ms

        for key in DIMENSION_KEYS:
            dim = getattr(scorecard.scores, key)
            db.session.add(DimensionScore(
                analysis_id=analysis.id,
                dimension=key,
                score=dim.score,
                reasoning=dim.reasoning,
                flags=dim.flags,
            ))

        db.session.commit()
        return jsonify(analysis.to_dict()), 200

    except RuntimeError as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        analysis.error = str(e)
        analysis.processing_ms = elapsed_ms
        db.session.commit()
        logger.error("Analysis failed for session %s: %s", user_session.id, e)
        return jsonify({"error": "AI scoring failed. Please try again."}), 502

    except Exception as e:
        db.session.rollback()
        logger.exception("Unexpected analysis failure for session %s", user_session.id)
        return jsonify({"error": "Internal server error"}), 500
