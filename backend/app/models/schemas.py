from typing import Literal
from pydantic import BaseModel, Field, field_validator


class DimensionResult(BaseModel):
    score: float = Field(ge=0, le=10)
    reasoning: str = Field(min_length=1)
    flags: list[str] = Field(default_factory=list, max_length=5)

    @field_validator("flags")
    @classmethod
    def flags_short(cls, v: list[str]) -> list[str]:
        for flag in v:
            if len(flag.split()) > 6:
                raise ValueError(f"Flag too long (max 6 words): {flag!r}")
        return v


class ScoresBlock(BaseModel):
    problem_clarity: DimensionResult
    target_customer: DimensionResult
    alternatives: DimensionResult
    distribution: DimensionResult
    defensibility: DimensionResult
    founder_market_fit: DimensionResult


class ScorecardResponse(BaseModel):
    summary: str = Field(min_length=1)
    scores: ScoresBlock
    overall_score: float = Field(ge=0, le=10)
    verdict: Literal["STRONG", "PROMISING", "RISKY", "WEAK"]
    critical_question: str = Field(min_length=1)
    strengths: list[str] = Field(max_length=3)
    risks: list[str] = Field(max_length=3)
