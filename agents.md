# agents.md — Idea Validator

## Project context
Idea Validator is a Flask + React + PostgreSQL app that scores startup ideas using Gemini.
The AI is used as a scoring engine, not a chatbot. All AI output is validated before use.

## Coding standards for AI-generated code

### Python / Flask
- All routes must handle error cases explicitly — no happy-path-only code.
- All external data (request bodies, AI responses) must be validated before use.
- Use Pydantic models for AI response validation. Never trust raw AI output.
- Database writes must be wrapped in transactions. Never partial-commit.
- Log errors with context (session_id, analysis_id) — never swallow exceptions silently.
- No hardcoded secrets. All config via environment variables through `app/config.py`.

### React / Frontend
- Every API call must handle loading, error, and empty states.
- No inline styles — use Tailwind classes only.
- Components must be small and single-purpose.
- No direct fetch calls in components — use the `api/client.js` wrapper.

## Review checklist for AI-generated code
Before accepting any AI-generated code, verify:
- [ ] Does the route handle all error cases, or does it assume happy path?
- [ ] Does the Pydantic model enforce types strictly, or does it coerce silently?
- [ ] Does the React component handle loading, error, and empty states?
- [ ] Are there any hardcoded secrets or environment-specific values?
- [ ] Does the code introduce any new dependencies not in requirements.txt / package.json?

## What AI agents must NOT do
- Modify the Pydantic schema in `schemas.py` without updating the system prompt in `scorer.py`.
- Remove retry logic from `gemini_client.py`.
- Add unauthenticated routes that expose user data.
- Bypass the `call_gemini` wrapper to call Gemini directly from routes.
- Generate code that silently ignores validation errors.

## File ownership
| File | Purpose | Change carefully |
|------|---------|-----------------|
| `app/models/schemas.py` | Pydantic contract for AI output | Yes — must match scorer.py prompt |
| `app/services/scorer.py` | System prompt | Yes — must match schemas.py |
| `app/services/gemini_client.py` | Retry + validation logic | Yes |
| `app/models/analysis.py` | DB schema | Yes — requires migration |
