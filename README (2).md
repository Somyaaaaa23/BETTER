**Idea Validator**

*A structured startup idea stress-tester*

**Stack:** Python + Flask • React • PostgreSQL • Claude API

  ---------------- ---------------- ---------------- ----------------------------
  **Python 3.11+** **React 18**     **PostgreSQL     **Claude
                                    15**             claude-sonnet-4-20250514**

  ---------------- ---------------- ---------------- ----------------------------

**Overview**

Idea Validator is a web application that takes a plain-text startup idea
and scores it across six dimensions used by early-stage investors and
product studios. Each dimension gets a score from 0--10, a reasoning
note, and specific red flags. The result is a scorecard with an overall
verdict and a single critical question the founder must answer.

This project was built as an internship assessment submission for
**Better**, a 0--1 product studio based in Jaipur, Rajasthan. The tool
is thematically aligned with Better's core practice: helping founders
ship products that can be sold, adopted, and scaled.

**Features**

-   Submit a startup idea in plain text and receive a structured
    AI-generated scorecard

-   Six weighted scoring dimensions with per-dimension reasoning and
    flags

-   Overall verdict: STRONG, PROMISING, RISKY, or WEAK

-   Critical question surface: the single most important thing the
    founder must answer

-   Session-based history: revisit past analyses without logging in

-   Dimension score trends: compare how different ideas score across the
    same dimensions

-   Admin view: aggregate stats across all submissions (avg score per
    dimension, verdict distribution)

-   Robust AI failure handling: Pydantic validation, retry logic, raw
    response logging

**Scoring Dimensions**

The AI evaluates every idea on exactly six dimensions. Scores are 0--10
per dimension; the overall score is a holistic judgment by the model,
not a weighted average, so a fatal weakness in one dimension can pull
the overall score down even with high scores elsewhere.

  -------- --------------------- ---------------------------------------- ------------
  **\#**   **Dimension**         **Core question asked of the AI**        **Weight**

  **1**    **Problem clarity**   *Is the pain real, specific, and felt    **20%**
                                 frequently?*                             

  **2**    **Target customer**   *Can you describe one real person who    **15%**
                                 has this problem?*                       

  **3**    **Existing            *What do people use today, and why isn't **15%**
           alternatives**        it enough?*                              

  **4**    **Distribution**      *How will the first 10 customers find    **20%**
                                 this and say yes?*                       

  **5**    **Defensibility**     *What stops a funded competitor from     **15%**
                                 copying this in 6 months?*               

  **6**    **Founder--market     *Why are you specifically the right      **15%**
           fit**                 person to solve this?*                   
  -------- --------------------- ---------------------------------------- ------------

**Key Technical Decisions**

**1. Structured JSON output from the AI, enforced with Pydantic**

The system prompt instructs Claude to return only valid JSON matching a
fixed schema. Flask parses and validates this with a Pydantic model
before any database write. If validation fails, the raw response is
logged to analyses.raw_response and a 502 is returned to the frontend.
This makes AI failures visible and debuggable without exposing them to
the user as a crash.

**Tradeoff:** Forcing JSON means occasionally losing nuance in the AI's
phrasing. The benefit is testability --- every response can be asserted
against the schema in unit tests.

**2. dimension_scores as a separate table, not JSONB**

Each of the six dimension scores is stored as its own row in
dimension_scores, not embedded as JSONB in the analyses table. This
enables SQL queries like "what's the average distribution score across
all WEAK verdicts" without application-side parsing.

**Tradeoff:** Six INSERT statements per analysis instead of one.
Acceptable at this scale; the atomicity is handled by wrapping the
writes in a single transaction.

**3. raw_response stored as JSONB**

The full Claude response is persisted verbatim alongside the parsed
result. This means if the scoring prompt changes in future, old
submissions can be re-processed without re-calling the API. It also
provides an audit trail for evaluating prompt quality.

**4. Session-based identity, no auth**

A UUID session is created on first visit and stored in a cookie. All
analyses are linked to a session. This allows history and trend views
without a login wall, which reduces friction for the demo and the MVP
use case.

**Tradeoff:** Sessions are not durable across devices or private
browsing. Acceptable for an MVP; a future iteration would add Google
OAuth.

**5. Retry logic with prompt injection on AI failure**

If Claude returns malformed JSON, the endpoint retries once, injecting
an explicit reminder into the prompt: "You must return ONLY valid JSON.
No prose. No markdown fences." If the retry also fails, the endpoint
returns a 502 with the raw response logged. This prevents silent
failures while keeping the retry surface small.

**Architecture**

+-----------------------------------------------------------------------+
| idea-validator/                                                       |
|                                                                       |
| ├── backend/                                                          |
|                                                                       |
| │ ├── app/                                                            |
|                                                                       |
| │ │ ├── \_\_init\_\_.py \# Flask app factory                          |
|                                                                       |
| │ │ ├── routes/                                                       |
|                                                                       |
| │ │ │ ├── analyze.py \# POST /api/analyze                             |
|                                                                       |
| │ │ │ ├── sessions.py \# GET /api/sessions/:id/analyses               |
|                                                                       |
| │ │ │ └── admin.py \# GET /api/admin/stats                            |
|                                                                       |
| │ │ ├── models/                                                       |
|                                                                       |
| │ │ │ ├── analysis.py \# SQLAlchemy ORM models                        |
|                                                                       |
| │ │ │ └── schemas.py \# Pydantic validation schemas                   |
|                                                                       |
| │ │ ├── services/                                                     |
|                                                                       |
| │ │ │ ├── claude_client.py \# Anthropic API wrapper + retry           |
|                                                                       |
| │ │ │ └── scorer.py \# Prompt construction + response parsing         |
|                                                                       |
| │ │ └── config.py \# Environment config                               |
|                                                                       |
| │ ├── migrations/ \# Alembic DB migrations                            |
|                                                                       |
| │ ├── tests/                                                          |
|                                                                       |
| │ │ ├── test_scorer.py \# Unit tests for prompt + parsing             |
|                                                                       |
| │ │ ├── test_routes.py \# Route integration tests                     |
|                                                                       |
| │ │ └── test_validation.py \# Pydantic schema tests                   |
|                                                                       |
| │ ├── claude.md \# AI guidance file (see below)                       |
|                                                                       |
| │ └── requirements.txt                                                |
|                                                                       |
| ├── frontend/                                                         |
|                                                                       |
| │ ├── src/                                                            |
|                                                                       |
| │ │ ├── components/                                                   |
|                                                                       |
| │ │ │ ├── IdeaForm.jsx \# Text input + submit                         |
|                                                                       |
| │ │ │ ├── Scorecard.jsx \# Rendered result                            |
|                                                                       |
| │ │ │ ├── DimensionCard.jsx \# Per-dimension breakdown                |
|                                                                       |
| │ │ │ ├── VerdictBadge.jsx \# STRONG / RISKY etc.                     |
|                                                                       |
| │ │ │ └── HistoryPanel.jsx \# Past analyses from session              |
|                                                                       |
| │ │ ├── hooks/                                                        |
|                                                                       |
| │ │ │ └── useAnalysis.js \# API call + loading state                  |
|                                                                       |
| │ │ ├── api/                                                          |
|                                                                       |
| │ │ │ └── client.js \# Fetch wrapper                                  |
|                                                                       |
| │ │ └── App.jsx                                                       |
|                                                                       |
| │ └── package.json                                                    |
|                                                                       |
| ├── agents.md \# AI agent instructions                                |
|                                                                       |
| └── README.md                                                         |
+-----------------------------------------------------------------------+

**Database Schema**

+-----------------------------------------------------------------------+
| \-- sessions: one per browser visit                                   |
|                                                                       |
| CREATE TABLE sessions (                                               |
|                                                                       |
| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| created_at TIMESTAMP NOT NULL DEFAULT now(),                          |
|                                                                       |
| user_agent TEXT,                                                      |
|                                                                       |
| ip_hash TEXT \-- hashed for privacy, used for rate limiting           |
|                                                                       |
| );                                                                    |
|                                                                       |
| \-- analyses: one per idea submission                                 |
|                                                                       |
| CREATE TABLE analyses (                                               |
|                                                                       |
| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| session_id UUID REFERENCES sessions(id),                              |
|                                                                       |
| created_at TIMESTAMP NOT NULL DEFAULT now(),                          |
|                                                                       |
| raw_input TEXT NOT NULL,                                              |
|                                                                       |
| input_word_count INT,                                                 |
|                                                                       |
| summary TEXT,                                                         |
|                                                                       |
| overall_score NUMERIC(3,1),                                           |
|                                                                       |
| verdict VARCHAR(12), \-- STRONG \| PROMISING \| RISKY \| WEAK         |
|                                                                       |
| critical_question TEXT,                                               |
|                                                                       |
| strengths JSONB,                                                      |
|                                                                       |
| risks JSONB,                                                          |
|                                                                       |
| raw_response JSONB, \-- full AI response for debugging                |
|                                                                       |
| processing_ms INT,                                                    |
|                                                                       |
| error TEXT \-- null on success                                        |
|                                                                       |
| );                                                                    |
|                                                                       |
| \-- dimension_scores: 6 rows per analysis                             |
|                                                                       |
| CREATE TABLE dimension_scores (                                       |
|                                                                       |
| id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                        |
|                                                                       |
| analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,           |
|                                                                       |
| dimension VARCHAR(32) NOT NULL,                                       |
|                                                                       |
| score NUMERIC(3,1) NOT NULL,                                          |
|                                                                       |
| reasoning TEXT,                                                       |
|                                                                       |
| flags JSONB                                                           |
|                                                                       |
| );                                                                    |
|                                                                       |
| CREATE INDEX ON analyses(created_at DESC);                            |
|                                                                       |
| CREATE INDEX ON analyses(session_id);                                 |
|                                                                       |
| CREATE INDEX ON dimension_scores(analysis_id);                        |
+-----------------------------------------------------------------------+

**API Routes**

  ---------------------------- ------------------ ----------------------------------
  **Method + Route**           **Auth**           **Description**

  POST /api/analyze            Session cookie     Submit an idea; returns full
                                                  scorecard

  GET /api/analyses/:id        Session cookie     Fetch a single past analysis

  GET                          Session cookie     List all analyses for a session
  /api/sessions/:id/analyses                      

  GET /api/admin/stats         None (MVP)         Aggregate stats: avg scores,
                                                  verdict dist.

  GET /api/health              None               Liveness check
  ---------------------------- ------------------ ----------------------------------

**AI Guidance File (claude.md)**

The following file lives at backend/claude.md and is referenced in the
project README and agents.md. It constrains how Claude is used in this
project and serves as the AI guidance artifact for the assessment
submission.

+-----------------------------------------------------------------------+
| \# claude.md --- Idea Validator                                       |
|                                                                       |
| \## Purpose                                                           |
|                                                                       |
| Constrain Claude's behaviour in this project to structured evaluation |
| only.                                                                 |
|                                                                       |
| Claude is not a chatbot here. It is a scoring engine.                 |
|                                                                       |
| \## Claude's role                                                     |
|                                                                       |
| Called once per analysis via POST /api/analyze.                       |
|                                                                       |
| Input: plain-text startup idea from the user.                         |
|                                                                       |
| Output: structured JSON scorecard. Nothing else.                      |
|                                                                       |
| \## Output contract                                                   |
|                                                                       |
| Claude MUST return valid JSON matching this exact schema:             |
|                                                                       |
| {                                                                     |
|                                                                       |
| \"summary\": \"string\",                                              |
|                                                                       |
| \"scores\": {                                                         |
|                                                                       |
| \"problem_clarity\": { \"score\": 0-10, \"reasoning\": \"string\",    |
| \"flags\": \[\"string\"\] },                                          |
|                                                                       |
| \"target_customer\": { \"score\": 0-10, \"reasoning\": \"string\",    |
| \"flags\": \[\] },                                                    |
|                                                                       |
| \"alternatives\": { \"score\": 0-10, \"reasoning\": \"string\",       |
| \"flags\": \[\] },                                                    |
|                                                                       |
| \"distribution\": { \"score\": 0-10, \"reasoning\": \"string\",       |
| \"flags\": \[\] },                                                    |
|                                                                       |
| \"defensibility\": { \"score\": 0-10, \"reasoning\": \"string\",      |
| \"flags\": \[\] },                                                    |
|                                                                       |
| \"founder_market_fit\": { \"score\": 0-10, \"reasoning\": \"string\", |
| \"flags\": \[\] }                                                     |
|                                                                       |
| },                                                                    |
|                                                                       |
| \"overall_score\": 0-10,                                              |
|                                                                       |
| \"verdict\": \"STRONG \| PROMISING \| RISKY \| WEAK\",                |
|                                                                       |
| \"critical_question\": \"string\",                                    |
|                                                                       |
| \"strengths\": \[\"up to 3 strings\"\],                               |
|                                                                       |
| \"risks\": \[\"up to 3 strings\"\]                                    |
|                                                                       |
| }                                                                     |
|                                                                       |
| \## Rules Claude must follow                                          |
|                                                                       |
| \- Return ONLY JSON. No preamble. No markdown fences. No explanation. |
|                                                                       |
| \- Score 0 for any dimension not addressed in the input. Do not be    |
| charitable.                                                           |
|                                                                       |
| \- Do not invent information not present in the user's text.          |
|                                                                       |
| \- overall_score is holistic judgment, NOT a weighted average.        |
|                                                                       |
| \- Flags are ≤5 words each, describing a specific weakness.           |
|                                                                       |
| \- Reasoning is 2--3 sentences per dimension.                         |
|                                                                       |
| \## What Claude must NOT do                                           |
|                                                                       |
| \- Soften feedback to seem encouraging.                               |
|                                                                       |
| \- Add caveats like 'this could work if\...'                          |
|                                                                       |
| \- Return partial JSON.                                               |
|                                                                       |
| \- Ask clarifying questions.                                          |
|                                                                       |
| \## Failure handling (implemented in Flask, not Claude)               |
|                                                                       |
| If Claude returns invalid JSON, Flask logs raw_response and retries   |
| once,                                                                 |
|                                                                       |
| injecting: 'You must return ONLY valid JSON. No prose. No markdown.'  |
|                                                                       |
| After two failures, Flask returns 502 and logs the error.             |
+-----------------------------------------------------------------------+

**Setup & Running Locally**

**Prerequisites**

-   Python 3.11+

-   Node.js 18+

-   PostgreSQL 15+

-   An Anthropic API key

**Backend**

+-----------------------------------------------------------------------+
| cd backend                                                            |
|                                                                       |
| python -m venv venv && source venv/bin/activate                       |
|                                                                       |
| pip install -r requirements.txt                                       |
|                                                                       |
| \# Copy and fill in environment variables                             |
|                                                                       |
| cp .env.example .env                                                  |
|                                                                       |
| \# Run migrations                                                     |
|                                                                       |
| flask db upgrade                                                      |
|                                                                       |
| \# Start the dev server                                               |
|                                                                       |
| flask run \--port 5000                                                |
+-----------------------------------------------------------------------+

**Frontend**

+-----------------------------------------------------------------------+
| cd frontend                                                           |
|                                                                       |
| npm install                                                           |
|                                                                       |
| npm run dev \# starts on http://localhost:5173                        |
+-----------------------------------------------------------------------+

**Environment variables (.env)**

+-----------------------------------------------------------------------+
| ANTHROPIC_API_KEY=sk-ant-\...                                         |
|                                                                       |
| DATABASE_URL=postgresql://localhost:5432/idea_validator               |
|                                                                       |
| FLASK_SECRET_KEY=your-secret-key-here                                 |
|                                                                       |
| FLASK_ENV=development                                                 |
+-----------------------------------------------------------------------+

**Testing**

+-----------------------------------------------------------------------+
| cd backend                                                            |
|                                                                       |
| pytest tests/ -v                                                      |
+-----------------------------------------------------------------------+

  ----------------------- -----------------------------------------------
  **Test file**           **What it covers**

  test_validation.py      Pydantic schema rejects malformed AI responses;
                          accepts valid ones

  test_scorer.py          Prompt construction includes all 6 dimensions;
                          retry logic triggers correctly

  test_routes.py          POST /analyze returns 200 with valid input; 400
                          on empty input; 502 on AI failure
  ----------------------- -----------------------------------------------

**Known Risks & Weaknesses**

-   **AI score consistency:** The same idea submitted twice may get
    slightly different scores. Mitigation: log all raw responses so
    drift can be detected over time.

-   **Prompt brittleness:** Changes to Claude's API or model behaviour
    can break the JSON contract. Mitigation: Pydantic validation catches
    this immediately and the retry fires automatically.

-   **Session durability:** Cookie-based sessions don't survive private
    browsing or device switching. Acceptable for MVP; Google OAuth is
    the planned upgrade.

-   **Rate limiting:** The MVP does not limit submissions per session. A
    bad actor could run up API costs. Mitigation: ip_hash is stored for
    future rate limiting; a simple Redis-backed limiter is the planned
    fix.

-   **No auth on admin stats:** The /api/admin/stats route is
    unprotected. Acceptable for an internal demo; a simple API key
    header is the planned fix.

**Extension Approach**

-   Add Google OAuth and tie analyses to user accounts (replace session
    cookies)

-   Add a 'compare two ideas' view: side-by-side scorecards with delta
    highlights

-   Add a prompt library: let users pick from templates ('B2B SaaS',
    'Consumer app', 'Marketplace') that adjust dimension weights

-   Expose the admin stats as a leaderboard of anonymised top-scoring
    ideas

-   Add a 're-score' button: re-runs the analysis on a newer model
    version using the stored raw_input

-   Webhook on verdict: if verdict is STRONG, auto-post to a Slack
    channel

**AI Usage in This Project**

Claude was used at two levels in building this project:

**1. As a product tool (the core feature)**

Claude claude-sonnet-4-20250514 is called by the /api/analyze endpoint
to score each idea. The system prompt is fully documented in claude.md.
All generated responses are validated by Pydantic before being trusted.

**2. As a development assistant**

Claude was used during development to generate boilerplate Flask routes,
Pydantic schemas, and React components. All generated code was reviewed
manually before merging. The review checklist:

-   Does the generated route handle all error cases, or does it assume
    happy path?

-   Does the generated Pydantic model enforce types strictly, or does it
    coerce silently?

-   Does the generated React component handle loading, error, and empty
    states?

Generated code that failed the checklist was rewritten manually.


