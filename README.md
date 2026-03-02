# SuperNetworkAI

AI-powered matchmaking for cofounders, teammates, and top management. Uses Ikigai-based profiling, vector embeddings, and Groq AI reasoning to match people based on deep motivational alignment — not just skills.

## Repositories
- **Frontend:** https://github.com/gurnooralagh/superrnetworkai
- **Backend:** https://github.com/gurnooralagh/supernetworkai

## Live Demo
- **App:** https://superrnetworkai.lovable.app
- **Backend API docs:** https://supernetworkai-production.up.railway.app/docs

## Loom Videos
- **Video 1:** https://www.loom.com/share/60a39f1b3f8642828a06baab85838f46
- **Video 2:** https://www.loom.com/share/b3348185612e4893a737edf9319d4807

## Test Accounts
Use these to log in to the live app or test the API directly.

| Name | Email | Password | User ID |
|------|-------|----------|---------|
| Dr. Sarah Kim | sarah.kim@example.com | SeedPassword123! | 20223f3a-4842-4a6e-8348-ff20ec9c7d29 |
| James Okafor | james.okafor@example.com | SeedPassword123! | 141f2025-0073-41f0-b286-7c74f73796e9 |

## Tech Stack
- **Frontend:** React + Lovable
- **Backend:** FastAPI (Python)
- **Database:** Supabase + pgvector
- **AI Matching:** Groq llama-3.3-70b-versatile
- **Embeddings:** OpenAI text-embedding-3-small
- **Email:** Resend

## How Matching Works
1. User completes Ikigai-based onboarding (43 fields)
2. Profile embedded using OpenAI text-embedding-3-small
3. pgvector finds 20 most similar profiles via cosine similarity
4. Groq re-ranks with three scores: cofounder, teammate, top_management
5. Results cached in matches table and shown on discover page

## Running Locally
\`\`\`bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
\`\`\`

## Environment Variables
\`\`\`
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_URL=
\`\`\`

## API Endpoints
- POST /profile — create or update profile
- GET /profile/{user_id} — get profile
- POST /profile/{user_id}/confirm-summary — generate AI summary
- POST /match/compute — compute matches
- POST /match/search — semantic search
- POST /connect — send connection request
