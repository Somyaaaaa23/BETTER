from flask import Blueprint, jsonify
from sqlalchemy import func
from app import db
from app.models.analysis import Analysis, DimensionScore

bp = Blueprint("admin", __name__)


@bp.get("/api/admin/stats")
def stats():
    total = db.session.query(func.count(Analysis.id)).filter(Analysis.error.is_(None)).scalar()

    verdict_dist = (
        db.session.query(Analysis.verdict, func.count(Analysis.id))
        .filter(Analysis.error.is_(None), Analysis.verdict.isnot(None))
        .group_by(Analysis.verdict)
        .all()
    )

    avg_by_dimension = (
        db.session.query(DimensionScore.dimension, func.avg(DimensionScore.score))
        .group_by(DimensionScore.dimension)
        .all()
    )

    avg_overall = (
        db.session.query(func.avg(Analysis.overall_score))
        .filter(Analysis.error.is_(None))
        .scalar()
    )

    return jsonify({
        "total_analyses": total,
        "avg_overall_score": round(float(avg_overall), 2) if avg_overall else None,
        "verdict_distribution": {v: c for v, c in verdict_dist},
        "avg_dimension_scores": {d: round(float(s), 2) for d, s in avg_by_dimension},
    }), 200


@bp.get("/api/health")
def health():
    return jsonify({"status": "ok"}), 200
