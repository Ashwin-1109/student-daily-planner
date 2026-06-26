# Hot Take — Advanced Groq Edition

> **May the hottest take win.**

Hot Take is a social debate arena where users post controversial opinions, vote, and use AI to understand both sides. This version is upgraded for judging: it is not only CRUD. It includes real Groq-powered AI features, ranking logic, moderation, rate limits, squad competition, and a judge-proof checklist.

---

## Why this will impress a judge

Most hackathon/social-feed demos stop at post + vote. This project adds a product layer around the core topic:

1. **AI Heat DNA** when a take is posted:
   - Spiciness score from 1–10
   - Heat tier: Warm, Hot, Scorching, Nuclear
   - Category
   - Controversy type
   - Audience split prediction
   - Safety level
   - Tags
2. **Four AI debate tools**:
   - Strongest rebuttal
   - Steelman the take
   - Hotter remix
   - Debate brief: core claim, blind spot, evidence needed
3. **Community mechanics**:
   - Upvote/downvote
   - Hottest/newest/spiciest/underdog sorting
   - Leaderboard
   - Squad leaderboard
4. **Production thinking**:
   - Server-side Groq SDK call
   - Environment variable secrets
   - Rate limiting
   - Basic moderation
   - Cached AI outputs
   - Supabase schema for production
   - Local JSON fallback for instant demos
5. **Judge mode**:
   - The UI includes a visible 5-task proof checklist so the reviewer understands what was completed.

---

## 5-task tracker proof

| Task | Completed evidence |
|---|---|
| Day 1 — Spec & foundation | Next.js 14 project, README, app scaffold, Vercel config |
| Day 2 — Core app | Demo auth, create/read/vote takes, local/Supabase storage, API routes |
| Day 3 — Add the brain | Real Groq SDK imported and called from `lib/llm.ts` using `GROQ_API_KEY` |
| Day 4 — AI features | Heat DNA scoring, Heat Gauge, rebuttal, steelman, remix, debate brief |
| Day 5 — Polish & ship | Moderation, rate limits, leaderboard, squad ranking, error fallbacks, deploy docs |

---

## Tech stack

- **Next.js 14 App Router**
- **React 18**
- **Tailwind CSS**
- **NextAuth Credentials demo login**
- **Groq SDK** for AI calls
- **Supabase optional production database**
- **Local JSON storage fallback** for easy demo without DB setup
- **Vercel-ready config**

---

## Main routes

| Route | Method | Purpose |
|---|---:|---|
| `/api/takes` | GET | Feed with sort support |
| `/api/takes` | POST | Create take + Groq Heat DNA scoring |
| `/api/takes/:id/vote` | POST | Upvote/downvote |
| `/api/takes/:id/rebuttal` | POST | AI counter-argument |
| `/api/takes/:id/steelman` | POST | AI improves the argument |
| `/api/takes/:id/remix` | POST | AI creates a hotter safe version |
| `/api/takes/:id/brief` | POST | AI debate coach brief |
| `/api/leaderboard` | GET | Top takes |
| `/api/squads` | GET | Squad ranking |
| `/api/stats` | GET | Arena statistics |
| `/api/health` | GET | Deployment health check |

---

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows, you can also double-click:

```txt
start-hot-take.bat
```

Open:

```txt
http://localhost:3000
```

---

## Environment variables

```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-long-random-secret
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Optional Supabase production variables:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

If Supabase is not configured, the app uses local JSON storage automatically.

---

## Important security note

Never commit your Groq API key. Keep it in `.env.local` locally and in Vercel Environment Variables for deployment.

If an API key was pasted publicly or committed accidentally, rotate it immediately.

---

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and Vercel.

The app works without Supabase for demos, but Supabase is recommended for real deployment persistence.

---

## Build and test

```bash
npm run smoke
npm run verify:groq
npm run build
```

Expected smoke output:

```txt
Smoke test passed: advanced project structure, Groq call sites, AI tools and judge features found.
```

---

## Vercel deployment

1. Push this project to GitHub.
2. Import it in Vercel.
3. Add environment variables:
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GROQ_API_KEY`
   - optional Supabase variables
4. Deploy.

---

## Demo script for judging

1. Sign in with any username.
2. Choose a squad.
3. Post a bold take.
4. Show the AI Heat DNA appearing instantly.
5. Click AI rebuttal.
6. Click steelman.
7. Click hotter remix.
8. Click debate brief.
9. Upvote/downvote.
10. Show leaderboard + squad leaderboard + judge checklist.

This tells a complete story: **social app + AI brain + safety + competition + deployment readiness**.
