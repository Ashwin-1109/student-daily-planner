# Hot Take — Complete Build Plan

*"May the hottest take win."*

---

## 1. Concept

A social feed where people post controversial opinions ("takes"). The community votes, and two AI features add the "brain":

- **Spiciness Score** — AI rates how controversial a take is (1–10 🔥) the moment it's posted.
- **AI Rebuttal** — On demand, AI generates the strongest counter-argument to any take.

The "win" condition: takes climb a leaderboard ranked by a blend of votes + spiciness.

---

## 2. Design Direction

**Aesthetic:** near-black background, single ember-orange accent, condensed bold display type — feels like a debate stage under hot lights, not a generic SaaS dashboard.

**Palette**
| Token | Hex | Use |
|---|---|---|
| `--bg` | #0B0A0A | App background |
| `--surface` | #161312 | Cards |
| `--ember` | #FF5A1F | Primary accent / CTA |
| `--ember-dim` | #7A2E10 | Borders, secondary accent |
| `--text` | #F4EDE6 | Primary text |
| `--muted` | #8C8580 | Secondary text |

**Type**
- Display: a tight, bold condensed sans (e.g. *Archivo Black* / *Big Shoulders*) for take text and the spiciness number — gives every take the weight of a headline.
- Body/UI: a clean grotesk (e.g. *Inter*) for labels, buttons, metadata.

**Signature element:** the **Heat Gauge** — instead of a plain "8/10" badge, each take gets a horizontal flame-bar that fills and shifts color (amber → red) based on its spiciness score. This is the one visual flourish; everything else stays quiet and disciplined.

**Layout**
```
[ Logo · Hot Take ]              [ Post a Take + ]
------------------------------------------------
[ Take card ]
  "Pineapple belongs on pizza."        🔥🔥🔥🔥🔥🔥 7.2
  — @rishika · 14 votes
  [ Upvote ] [ Downvote ] [ Get AI Rebuttal ]
  > AI Rebuttal (collapsed until clicked)
------------------------------------------------
[ next card ]
```
Feed is a single column, newest/hottest toggle at top. No sidebar clutter — the take itself is the hero.

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | API routes + frontend in one project, trivial Vercel deploy |
| Styling | **Tailwind CSS** | Fast, matches the token system above directly in config |
| Auth | **NextAuth.js (Credentials or GitHub provider)** | Don't roll your own; ships in a day |
| Database | **Supabase (Postgres)** | Free tier, instant REST + SQL, easy `takes`/`votes` tables |
| AI | **Anthropic API (`@anthropic-ai/sdk`)** | One SDK for both scoring and rebuttal calls |
| Deploy | **Vercel** | Zero-config Next.js hosting, free tier, instant public URL |

**Why not Firebase/Mongo:** Postgres gives you real relational queries for "rank by votes + score" with one SQL query instead of client-side aggregation.

---

## 4. Data Model

```sql
create table takes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id),
  text text not null,
  votes int default 0,
  spiciness_score numeric,
  spiciness_reason text,
  created_at timestamp default now()
);

create table rebuttals (
  id uuid primary key default gen_random_uuid(),
  take_id uuid references takes(id),
  content text not null,
  created_at timestamp default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  take_id uuid references takes(id),
  user_id uuid references auth.users(id),
  value int check (value in (-1, 1)),
  unique(take_id, user_id)
);
```

---

## 5. API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/takes` | GET | Feed, sorted by votes/spiciness/newest |
| `/api/takes` | POST | Create a take → triggers spiciness scoring automatically |
| `/api/takes/:id/vote` | POST | Upvote/downvote (one vote per user, enforced by unique constraint) |
| `/api/takes/:id/rebuttal` | POST | On-demand AI rebuttal generation |
| `/api/leaderboard` | GET | Top takes by combined score |

---

## 6. AI Feature Implementation

**Shared helper (`lib/llm.js`):**
```js
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function scoreTake(text) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 150,
    messages: [{
      role: "user",
      content: `Rate how controversial/spicy this opinion is from 1-10, and give a one-sentence reason. Respond ONLY as JSON: {"score": number, "reason": string}.\n\nOpinion: "${text}"`
    }]
  });
  return JSON.parse(msg.content[0].text);
}

export async function generateRebuttal(text) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Write the strongest, most persuasive 2-3 sentence counter-argument to this opinion:\n\n"${text}"`
    }]
  });
  return msg.content[0].text;
}
```

- Scoring runs **synchronously on post** (small token cost, instant feedback).
- Rebuttal runs **on-demand** (button click) to control API spend — don't auto-generate for every take.

---

## 7. Advanced Functionality (stretch goals, in priority order)

1. **Heat decay** — spiciness/vote weight decays over time so old takes don't dominate the leaderboard forever (classic Hacker News ranking formula adapted).
2. **AI moderation pass** — before a take is stored, run a cheap moderation check (hate speech / harassment) so "spicy" doesn't become "harmful." Reject or flag, don't silently post.
3. **Squad/team leaderboards** — matches the screenshot you shared (squad ranking) — group users into squads, rank squads by combined member score.
4. **Take remix** — "Generate a hotter version of this take" using AI, as a fun creation aid.
5. **Daily digest** — a cron job (Vercel Cron) that posts an AI-written summary of the day's hottest take to a pinned announcement.
6. **Rate limiting** — cap rebuttal/scoring calls per user per hour (simple in-memory or Redis counter) to prevent cost blowouts.
7. **Share cards** — auto-generate a shareable image card for a user's top take (matches the "Share tab" feature in your screenshot).

---

## 8. Build Procedure (Day-by-Day, mapped to your tracker)

**Day 1 — Spec & Foundation** *(done)*
- Repo, README with this spec, scaffolded Next.js app that runs.

**Day 2 — Core App**
1. Set up Supabase project, run the SQL above.
2. Wire NextAuth (start with GitHub provider — fastest to configure).
3. Build `GET/POST /api/takes` and the feed UI (no AI yet — just CRUD).
4. Commit `vercel.json`.
5. Deploy a bare-bones version immediately — confirms pipeline works.

**Day 3 — Add the Brain**
1. Add `ANTHROPIC_API_KEY` to `.env.local` (never commit it).
2. Write `lib/llm.js` exactly as above.
3. Add one test call site (e.g. a temporary `/api/test-llm` route) and confirm it returns real data.
4. Delete the test route once confirmed.

**Day 4 — Build Both AI Features**
1. Wire `scoreTake()` into the `POST /api/takes` flow — every new take gets scored automatically.
2. Build the Heat Gauge component to render the score.
3. Wire `generateRebuttal()` into `/api/takes/:id/rebuttal`, triggered by a button, rendered in an expandable panel.
4. Test both end-to-end with real posts.

**Day 5 — Polish & Ship**
1. Error handling: LLM timeout/failure → friendly inline message, never a crash.
2. Add the moderation pass (stretch goal #2) — minimum: a keyword filter if you're short on time.
3. Rate limit rebuttal generation.
4. Final deploy to Vercel, confirm public URL works end-to-end on a fresh browser/incognito.
5. Update README: spec, screenshots, live link, local run instructions.

---

## 9. What "Best" Looks Like by Day 5

- A stranger can open your public URL, post a take, watch it get a live spiciness score, and click to get an AI rebuttal — with zero crashes if the AI call fails.
- README tells that same story in 30 seconds.
- Leaderboard and squad ranking (if you do the stretch goal) make it feel alive, not like a single-user demo.

---

Want me to continue scaffolding the actual code (I'd already started the Next.js project structure) so you have a working repo to push, or do you want to take this plan and build it yourself with Claude Code locally?
