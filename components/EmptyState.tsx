export function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-ember-dim/70 bg-surface/60 p-10 text-center">
      <div className="mb-3 text-5xl">🔥</div>
      <h3 className="font-display text-4xl text-text">No takes yet.</h3>
      <p className="mt-2 text-muted">Post the first one and let Groq score the heat.</p>
    </div>
  );
}
