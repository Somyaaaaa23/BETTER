import uuid
from datetime import datetime, timezone
from app import db


def _uuid():
    return str(uuid.uuid4())


class Session(db.Model):
    __tablename__ = "sessions"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    user_agent = db.Column(db.Text)
    ip_hash = db.Column(db.Text)

    analyses = db.relationship("Analysis", backref="session", lazy=True, cascade="all, delete-orphan")


class Analysis(db.Model):
    __tablename__ = "analyses"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    session_id = db.Column(db.String(36), db.ForeignKey("sessions.id"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    raw_input = db.Column(db.Text, nullable=False)
    input_word_count = db.Column(db.Integer)
    summary = db.Column(db.Text)
    overall_score = db.Column(db.Numeric(3, 1))
    verdict = db.Column(db.String(12))  # STRONG | PROMISING | RISKY | WEAK
    critical_question = db.Column(db.Text)
    strengths = db.Column(db.JSON)
    risks = db.Column(db.JSON)
    raw_response = db.Column(db.JSON)
    processing_ms = db.Column(db.Integer)
    error = db.Column(db.Text)

    dimension_scores = db.relationship(
        "DimensionScore", backref="analysis", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "raw_input": self.raw_input,
            "summary": self.summary,
            "overall_score": float(self.overall_score) if self.overall_score is not None else None,
            "verdict": self.verdict,
            "critical_question": self.critical_question,
            "strengths": self.strengths,
            "risks": self.risks,
            "dimension_scores": [d.to_dict() for d in self.dimension_scores],
        }


class DimensionScore(db.Model):
    __tablename__ = "dimension_scores"

    id = db.Column(db.String(36), primary_key=True, default=_uuid)
    analysis_id = db.Column(db.String(36), db.ForeignKey("analyses.id"), nullable=False)
    dimension = db.Column(db.String(32), nullable=False)
    score = db.Column(db.Numeric(3, 1), nullable=False)
    reasoning = db.Column(db.Text)
    flags = db.Column(db.JSON)

    def to_dict(self):
        return {
            "dimension": self.dimension,
            "score": float(self.score),
            "reasoning": self.reasoning,
            "flags": self.flags or [],
        }
