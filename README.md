# Idea Validator

*A structured startup idea stress-tester*

**Stack:** Python + Flask · React · PostgreSQL · Gemini API

---

## Overview

Idea Validator takes a plain-text startup idea and scores it across six dimensions used by early-stage investors. Each dimension gets a score (0–10), a reasoning note, and specific red flags. The result is a scorecard with an overall verdict and a single critical question the founder must answer.

Built as an internship assessment submission for **Better**, a 0→1 product studio.

---

## Features

- Submit a startup idea and receive a structured AI-generated scorecard
- Six weighted scoring dimensions with per-dimension reasoning and flags
- Overall verdict: `STRONG`, `PROMISING`, `RISKY`, or `WEAK`
- Critical question: the single most important thing the founder must answer
- Session-based history: revisit past analyses without logging in
- Admin stats: aggregate scores and verdict distribution across all submissions
- Robust AI failure handling: Pydantic validation, retry logic, raw response logging

---

## Scoring Dimensions

| # | Dimension | Weight |
|---|-----------|--------|
| 1 | Problem Clarity | 20% |
| 2 | Target Customer | 15% |
| 3 | Existing Alternatives | 15% |
| 4 | Distribution | 20% |
| 5 | Defensibility | 15% |
| 6 | Founder–Market Fit | 15% |

---

## Key Technical Decisions

### 1. Structured JSON output from Gemini, enforced with Pydantic

The system prompt instructs Gemini to return only valid JSON matching a fixed schema. Flask validates this with a Pydantic model before any database write. If validation fails, the raw response is logged and a 502 is returned. This makes AI failures visible and debuggable.

**Tradeoff:** Forcing JSON occasionally loses nuance in phrasing. The benefit is testability — every response can be asserted against the schema.

### 2. `dimension_scores` as a separate table, not JSONB

Each of the six dimension scores is stored as its own row. This enables SQL queries like "average distribution score across all WEAK verdicts" without application-side parsing.

**Tradeoff:** Six INSERTs per analysis instead of one. Handled by wrapping writes in a single transaction.

### 3. Raw response stored as JSON

The full Gemini response is persisted verbatim. If the scoring prompt changes, old submissions can be re-processed without re-calling the API. Also provides an audit trail for evaluating prompt quality.

### 4. Session-based identity, no auth

A UUID session is created on first visit and stored in a cookie. All analyses are linked to a session. Reduces friction for the demo and MVP use case.

**Tradeoff:** Sessions don't survive private browsing or device switching. Google OAuth is the planned upgrade.

### 5. Retry logic with prompt injection on AI failure

If Gemini returns malformed JSON, the endpoint retries once, injecting: *"You must return ONLY valid JSON. No prose. No markdown."* After two failures, returns 502 with the raw response logged.

---

## Architecture

```
idea-validator/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── config.py            # Environment config
│   │   ├── models/
│   │   │   ├── analysis.py      # SQLAlchemy ORM models
│   │   │   └── schemas.py       # Pydantic validation schemas
│   │   ├── routes/
│   │   │   ├── analyze.py       # POST /api/analyze
│   │   │   ├── sessions.py      # GET /api/sessions/:id/analyses
│   │   │   └── admin.py         # GET /api/admin/stats
│   │   └── services/
│   │       ├── gemini_client.py # Gemini API wrapper + retry
│   │       └── scorer.py        # System prompt + user prompt builder
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_validation.py   # Pydantic schema tests
│   │   ├── test_scorer.py       # Prompt construction tests
│   │   └── test_routes.py       # Route integration tests
│   ├── gemini.md                # AI guidance file
│   ├── wsgi.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IdeaForm.jsx
│   │   │   ├── Scorecard.jsx
│   │   │   ├── DimensionCard.jsx
│   │   │   ├── VerdictBadge.jsx
│   │   │   ├── HistoryPanel.jsx
│   │   │   └── LoadingTerminal.jsx
│   │   ├── hooks/
│   │   │   └── useAnalysis.js
│   │   ├── api/
│   │   │   └── client.js
│   │   └── App.jsx
│   └── package.json
├── agents.md                    # AI agent instructions
└── README.md
```

---

## Database Schema

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_hash TEXT
);

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  raw_input TEXT NOT NULL,
  input_word_count INT,
  summary TEXT,
  overall_score NUMERIC(3,1),
  verdict VARCHAR(12),
  critical_question TEXT,
  strengths JSON,
  risks JSON,
  raw_response JSON,
  processing_ms INT,
  error TEXT
);

CREATE TABLE dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  dimension VARCHAR(32) NOT NULL,
  score NUMERIC(3,1) NOT NULL,
  reasoning TEXT,
  flags JSON
);
```

---

## API Routes

| Method + Route | Auth | Description |
|----------------|------|-------------|
| `POST /api/analyze` | Session cookie | Submit an idea; returns full scorecard |
| `GET /api/analyses/:id` | Session cookie | Fetch a single past analysis |
| `GET /api/sessions/:id/analyses` | Session cookie | List all analyses for a session |
| `GET /api/admin/stats` | None (MVP) | Aggregate stats |
| `GET /api/health` | None | Liveness check |

---

## Setup & Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Gemini API key

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
flask --app wsgi db init
flask --app wsgi db migrate -m "initial"
flask --app wsgi db upgrade
flask --app wsgi run --port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

### Environment variables

```
GEMINI_API_KEY=AIzaSy...
DATABASE_URL=postgresql://localhost:5432/idea_validator
FLASK_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
```

### Tests

```bash
cd backend
pytest tests/ -v
```

---

## Known Risks & Weaknesses

- **AI score consistency:** Same idea submitted twice may get slightly different scores. Mitigation: all raw responses are logged.
- **Prompt brittleness:** Gemini API changes can break the JSON contract. Mitigation: Pydantic catches this immediately and retry fires automatically.
- **Session durability:** Cookie sessions don't survive private browsing. Planned fix: Google OAuth.
- **No rate limiting:** A bad actor could run up API costs. Mitigation: `ip_hash` stored for future Redis-backed limiter.
- **Unprotected admin route:** `/api/admin/stats` has no auth. Planned fix: API key header.

---

## Extension Approach

- Add Google OAuth and tie analyses to user accounts
- "Compare two ideas" view: side-by-side scorecards with delta highlights
- Prompt library: templates ('B2B SaaS', 'Marketplace') that adjust dimension weights
- Re-score button: re-run analysis on a newer model using stored `raw_input`
- Webhook on STRONG verdict: auto-post to Slack

---

## AI Usage in This Project

### As a product tool (core feature)
Gemini is called by `/api/analyze` to score each idea. The system prompt is documented in `backend/gemini.md`. All responses are validated by Pydantic before being trusted.

### As a development assistant
Gemini was used to generate boilerplate Flask routes, Pydantic schemas, and React components. All generated code was reviewed manually against the checklist in `agents.md`.
