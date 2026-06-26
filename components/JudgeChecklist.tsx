export function JudgeChecklist() {
  const checks = [
    ["Day 1", "Spec, README, project scaffold, Vercel config"],
    ["Day 2", "Auth, CRUD feed, voting, data model, local/Supabase store"],
    ["Day 3", "Real Groq SDK call from server env var"],
    ["Day 4", "Spiciness scoring, heat gauge, rebuttal, steelman, remix, debate brief"],
    ["Day 5", "Polish, moderation, rate limiting, leaderboard, squad ranking, docs"]
  ];

  return (
    <section className="rounded-[2rem] border border-ember-dim/60 bg-surface/85 p-5 shadow-card backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-muted">Judge mode</p>
      <h2 className="mt-1 font-display text-3xl text-text">5-task proof checklist.</h2>
      <div className="mt-4 space-y-3">
        {checks.map(([day, text]) => (
          <div key={day} className="rounded-2xl border border-ember-dim/50 bg-black/25 p-3">
            <p className="font-bold text-ember">✓ {day}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
