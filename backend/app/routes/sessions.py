from flask import Blueprint, jsonify, session
from app import db
from app.models.analysis import Session as UserSession, Analysis

bp = Blueprint("sessions", __name__)


@bp.get("/api/sessions/<session_id>/analyses")
def list_analyses(session_id: str):
    # Only allow access to own session
    if session.get("sid") != session_id:
        return jsonify({"error": "forbidden"}), 403

    user_session = db.session.get(UserSession, session_id)
    if not user_session:
        return jsonify({"error": "session not found"}), 404

    analyses = (
        db.session.query(Analysis)
        .filter_by(session_id=session_id, error=None)
        .order_by(Analysis.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([a.to_dict() for a in analyses]), 200


@bp.get("/api/analyses/<analysis_id>")
def get_analysis(analysis_id: str):
    analysis = db.session.get(Analysis, analysis_id)
    if not analysis:
        return jsonify({"error": "not found"}), 404
    if analysis.session_id != session.get("sid"):
        return jsonify({"error": "forbidden"}), 403
    return jsonify(analysis.to_dict()), 200


@bp.get("/api/session/current")
def current_session():
    sid = session.get("sid")
    if not sid:
        return jsonify({"session_id": None}), 200
    return jsonify({"session_id": sid}), 200
