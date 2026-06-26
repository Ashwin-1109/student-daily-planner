"use client";

import { HeatGauge } from "@/components/HeatGauge";
import type { Take } from "@/lib/types";

type LeaderboardProps = {
  takes: Take[];
};

export function Leaderboard({ takes }: LeaderboardProps) {
  return (
    <aside className="rounded-[2rem] border border-ember-dim/60 bg-surface/85 p-5 shadow-card backdrop-blur lg:sticky lg:top-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Leaderboard</p>
        <h2 className="font-display text-3xl tracking-tight text-text">May the hottest win.</h2>
      </div>

      <div className="space-y-4">
        {takes.slice(0, 5).map((take, index) => (
          <div key={take.id} className="rounded-3xl border border-ember-dim/50 bg-black/25 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-display text-3xl text-ember">#{index + 1}</span>
              <span className="text-xs text-muted">{take.combinedScore} heat</span>
            </div>
            <p className="line-clamp-2 text-sm font-bold leading-5 text-text">{take.text}</p>
            <div className="mt-3">
              <HeatGauge score={take.spicinessScore} compact />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
