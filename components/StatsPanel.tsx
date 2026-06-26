"use client";

import type { ArenaStats } from "@/lib/types";

export function StatsPanel({ stats }: { stats: ArenaStats | null }) {
  const items = [
    { label: "Total takes", value: stats?.totalTakes ?? "—" },
    { label: "Total votes", value: stats?.totalVotes ?? "—" },
    { label: "Avg spice", value: stats?.averageSpice ? `${stats.averageSpice}/10` : "—" },
    { label: "Nuclear", value: stats?.nuclearTakes ?? "—" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-3xl border border-ember-dim/60 bg-surface/80 p-4 shadow-card">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{item.label}</p>
          <p className="mt-2 font-display text-4xl text-ember">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
