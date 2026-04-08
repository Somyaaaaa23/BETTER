# groq.md — Idea Validator

## Purpose
Constrain Groq model behaviour in this project to structured evaluation only.
The model is not a chatbot here. It is a scoring engine.

## Groq role
Called once per analysis via POST /api/analyze.
Input: plain-text startup idea from the user.
Output: structured JSON scorecard. Nothing else.

## Output contract
The model MUST return valid JSON matching this exact schema:

```json
{
  "summary": "string",
  "scores": {
    "problem_clarity":    { "score": 0-10, "reasoning": "string", "flags": ["string"] },
    "target_customer":    { "score": 0-10, "reasoning": "string", "flags": [] },
    "alternatives":       { "score": 0-10, "reasoning": "string", "flags": [] },
    "distribution":       { "score": 0-10, "reasoning": "string", "flags": [] },
    "defensibility":      { "score": 0-10, "reasoning": "string", "flags": [] },
    "founder_market_fit": { "score": 0-10, "reasoning": "string", "flags": [] }
  },
  "overall_score": 0-10,
  "verdict": "STRONG | PROMISING | RISKY | WEAK",
  "critical_question": "string",
  "strengths": ["up to 3 strings"],
  "risks": ["up to 3 strings"]
}
```

## Rules
- Return ONLY JSON. No preamble. No markdown fences. No explanation.
- Score 0 for any dimension not addressed in the input. Do not be charitable.
- Do not invent information not present in the user's text.
- overall_score is holistic judgment, NOT a weighted average.
- Flags are <=6 words each, describing a specific weakness.
- Reasoning is 2-3 sentences per dimension.

## Failure handling
If the model returns invalid JSON, Flask logs raw_response and retries once,
injecting: "You must return ONLY valid JSON. No prose. No markdown."
After two failures, Flask returns 502 and logs the error.