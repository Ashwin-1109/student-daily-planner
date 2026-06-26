export function FeaturePanel() {
  const features = [
    "Heat DNA: AI score, reason, category, controversy type, audience split, safety level, tags",
    "Four Groq tools: rebuttal, steelman, hotter remix, debate brief",
    "Ranking formula blends votes, spice, nuclear boost, and time decay",
    "Squad leaderboard makes it feel like a live campus/team competition",
    "Safe-by-design: moderation, API rate limits, cached AI outputs, env-only secrets"
  ];

  return (
    <section className="rounded-[2rem] border border-ember-dim/60 bg-surface/85 p-5 shadow-card backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-muted">Uniqueness</p>
      <h2 className="mt-1 font-display text-3xl text-text">Why this impresses.</h2>
      <div className="mt-4 space-y-3">
        {features.map((feature) => (
          <p key={feature} className="rounded-2xl border border-ember-dim/50 bg-black/25 p-3 text-sm leading-6 text-muted">
            <span className="mr-2 text-ember">◆</span>
            {feature}
          </p>
        ))}
      </div>
    </section>
  );
}
