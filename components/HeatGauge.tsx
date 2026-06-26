type HeatGaugeProps = {
  score: number;
  compact?: boolean;
};

export function HeatGauge({ score, compact = false }: HeatGaugeProps) {
  const width = `${Math.min(100, Math.max(10, score * 10))}%`;
  const flameCount = Math.max(1, Math.min(10, Math.round(score)));

  return (
    <div className={`w-full ${compact ? "space-y-1" : "space-y-2"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.28em] text-muted">Spiciness</span>
        <span className="font-display text-2xl tracking-tight text-ember">{score.toFixed(1)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-ember-dim/70 bg-black/45">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-300 via-ember to-red-700 flame-glow transition-all duration-700"
          style={{ width }}
        />
      </div>
      {!compact && (
        <div className="text-xs tracking-widest text-muted" aria-label={`${flameCount} flame rating`}>
          {Array.from({ length: flameCount }).map((_, index) => (
            <span className="ember-pulse" style={{ animationDelay: `${index * 0.08}s` }} key={index}>
              🔥
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
