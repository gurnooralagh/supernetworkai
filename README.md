# SuperNetworkAI

AI-powered matchmaking for cofounders, teammates, and top management. Built on the premise that the best professional relationships aren't about overlapping CVs — they're about aligned values, complementary thinking styles, and shared missions.

**Live demo:** https://superrnetworkai.lovable.app
**Backend API docs:** https://supernetworkai-production.up.railway.app/docs

---

## The Problem

Most professional networking tools match on skills and titles. That produces connections between people who look similar on paper — not people who will actually work well together. The hardest part of finding a cofounder or key hire isn't identifying someone with the right background. It's knowing whether your working styles, decision-making approaches, and deeper motivations are compatible.

SuperNetworkAI matches on what's underneath the CV: how people think, what drives them, what they've built and why, how they behave under pressure, and what frustrates them about collaboration. The result is matches ranked by genuine alignment — not keyword overlap.

---

## How It Works

### 1. Ikigai-Based Profiling

Onboarding collects 43 fields across five frameworks:

- **Basics** — role, intent (cofounder / teammate / top management), availability, working style
- **Ikigai** — passion, strength, mission, vocation (8 fields derived from the Japanese concept of meaningful work)
- **Collaboration fit** — who they work best with, what frustrates them, what successful collaboration looks like
- **Portfolio Part 1** — what they built, who it was for, what they knew going in, what assumption was wrong, what they did first, their role
- **Portfolio Part 2** — hardest decision, what they'd do differently, biggest learning, how it changed their thinking, how they work under pressure

This isn't a form — it's a structured reflection. The answers give the AI enough signal to assess compatibility at a level that a LinkedIn profile or a short bio cannot.

### 2. Embedding + Vector Search

When a profile is confirmed, the full text of all 43 fields is concatenated and embedded using `text-embedding-3-small`. The resulting 1536-dimensional vector is stored in Supabase with pgvector.

When computing matches, a cosine similarity search via a Supabase RPC (`match_profiles`) retrieves the top-20 most semantically similar profiles. Similarity ranking from the RPC is explicitly preserved when fetching full profile data — a subtle issue where `.in_()` queries lose vector order, fixed by re-sorting against the original RPC row positions.

### 3. Groq Reranking

The top candidates from vector search are passed to Groq (`llama-3.3-70b-versatile`) for structured scoring. Each candidate is scored across three dimensions:

- **Cofounder** — complementary skills, shared mission, compatible working styles
- **Teammate** — functional fit, collaboration style, domain overlap
- **Top Management** — leadership profile, strategic alignment

The model outputs a JSON object with per-category scores (0–100), a `best_category`, an `overall_score`, and a plain-English explanation of why the two people match. The prompt weights semantic alignment at 60%, intent compatibility at 25%, and skills overlap at 15%.

Results are cached in a `matches` table and shown immediately on the Discover page.

### 4. Two-Stage Search

The Search tab uses a different pipeline to separate fast discovery from deep scoring:

1. **Name search** — ILIKE match on the `name` field, results appear first
2. **Vector search** — query string embedded and matched against profile vectors with a minimum similarity threshold (0.25) to filter unrelated results
3. **On-demand pair scoring** — a "Check Match" button triggers a single Groq call for exactly one pair, returning the full compatibility breakdown without scoring every result in the list

This design keeps the Search tab instant for discovery while making the expensive AI scoring explicit and user-initiated.

### 5. Incremental Match Refresh

New users join the platform after your initial matches are computed. A "Refresh Matches" button on the My Matches tab runs a targeted update:

1. Fetch all `matched_user_id`s already in the `matches` table for the current user
2. Run vector search → filter to candidates not yet scored
3. Call Groq **only on new candidates** — existing matches are untouched
4. Upsert new scores, return the full list sorted by overall score

Cost stays proportional to new joiners, not the total platform size.

### 6. Connect Flow

When a user clicks Connect on a match, a modal collects a personal message. The backend then:

1. Fetches both profiles and the pre-computed match data (falls back to a fresh Groq call if the match isn't cached)
2. Generates a 2–3 sentence plain-English description of the sender using Groq
3. Composes and sends an HTML email via Resend with the match score, compatibility breakdown, AI explanation, and a link to the sender's full profile
4. Saves the connection to the `connections` table with status `pending`
5. Logs a `connect_attempt` event to `user_events` for analytics

The receiver's email is captured silently at onboarding from their Supabase auth session and stored as `contact_email` — no separate email field required.

---

## Architecture

```
Frontend (React + Vite + shadcn/ui)
    │
    ├── /onboarding     — 6-step form, profile save, AI summary generation
    ├── /discover        — My Matches tab (cached) + Search tab (live vector)
    ├── /profile/[id]   — Public profile view
    └── Auth pages       — Supabase Auth (email/password + magic link)
    │
    ▼
Backend (FastAPI + Python) — deployed on Railway
    │
    ├── /profile         — CRUD, embedding trigger, summary generation
    ├── /match           — compute, refresh, search-profiles, score-pair
    └── /connect         — email sending, connection storage, event logging
    │
    ▼
Supabase (PostgreSQL + pgvector)
    │
    ├── profiles         — 43-field profile data + 1536-dim embedding vector
    ├── matches          — cached pair scores (cofounder / teammate / mgmt)
    ├── connections      — connect requests with status + message
    └── user_events      — behavioural logging (connect_attempt, etc.)
```

**Services used:**
| Layer | Tool |
|---|---|
| Frontend | React 18, Vite, TypeScript, shadcn/ui, Tailwind CSS |
| Backend | FastAPI, Pydantic, Python 3.13 |
| Database | Supabase (PostgreSQL + pgvector) |
| Vector search | pgvector cosine similarity via Supabase RPC |
| Embeddings | OpenAI `text-embedding-3-small` |
| AI scoring | Groq `llama-3.3-70b-versatile` |
| Email | Resend |
| Auth | Supabase Auth |
| Hosting | Vercel (frontend), Railway (backend) |

---

## Design Decisions Worth Noting

**Why Ikigai?**
Standard onboarding asks what you do. Ikigai asks why you do it and what you're trying to become. The portfolio questions are particularly high-signal: how someone describes a wrong assumption or a decision they'd reverse tells you more about their working style than their job title ever could.

**Why two-stage matching (vector → Groq)?**
Pure vector search is fast and cheap but produces similarity without judgment — it finds profiles that use similar language, not profiles that would actually work well together. Pure Groq scoring is expensive at scale. The pipeline uses pgvector to narrow the candidate set cheaply, then applies LLM reasoning only where it matters.

**Why cache matches but not search scores?**
My Matches should feel instant — the scores are already computed and stored. Search is exploratory: showing every result pre-scored would be expensive and most results won't be actioned. Making the user explicitly request a score ("Check Match") aligns cost with intent.

**Why Groq over GPT-4?**
Latency. Scoring a batch of 20 candidates sequentially with GPT-4 takes 30–60 seconds. Groq's inference speed makes individual pair scoring feel near-instant (~2s), which is what enables the on-demand Check Match UX.

**Background tasks for post-onboarding processing:**
Embedding generation and match computation run in a FastAPI `BackgroundTasks` callback after the user confirms their profile summary. The confirm endpoint returns immediately — the user lands on Discover while the heavy work runs async. This avoids a loading screen that would otherwise take 10–15 seconds.

**Similarity threshold tuning:**
The pgvector RPC has no minimum threshold — it returns the top-N regardless of relevance. Short queries (single words) have lower cosine similarity to long profile embeddings than multi-word phrases. A 0.25 threshold was chosen after testing: strict enough to filter genuinely unrelated profiles, permissive enough to return results for single-keyword searches like "climate" or "healthcare".

---

**Full API reference:** https://supernetworkai-production.up.railway.app/docs

---

## Test Accounts

| Name | Email | Password |
|------|-------|----------|
| Priya Sharma | priya.sharma@example.com | SeedPassword123! |
| James Okafor | james.okafor@example.com | SeedPassword123! |
| David Koh | david.koh@example.com | SeedPassword123! |

---

## Project Status

Core features complete and working:

- [x] Full onboarding flow (6 steps, 43 fields)
- [x] AI-generated profile summary with user confirmation
- [x] Vector embedding on profile confirm (background task)
- [x] My Matches — cached, sorted by overall score
- [x] Incremental match refresh — scores new users only
- [x] Search — hybrid name + vector, on-demand pair scoring
- [x] Connect flow — Groq-generated email via Resend
- [x] Public profile pages
- [x] Supabase Auth (signup, login, email verification, password reset)
