"use client";

import type { SquadStanding } from "@/lib/types";

export function SquadLeaderboard({ squads }: { squads: SquadStanding[] }) {
  return (
    <section className="rounded-[2rem] border border-ember-dim/60 bg-surface/85 p-5 shadow-card backdrop-blur">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">Squad leaderboard</p>
        <h2 className="font-display text-3xl tracking-tight text-text">Team heat war.</h2>
      </div>
      <div className="space-y-3">
        {squads.length === 0 ? (
          <p className="text-sm text-muted">Squads appear after takes are posted.</p>
        ) : (
          squads.map((squad, index) => (
            <div key={squad.squad} className="rounded-3xl border border-ember-dim/50 bg-black/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted">#{index + 1}</p>
                  <p className="font-display text-2xl text-text">{squad.squad}</p>
                </div>
                <p className="font-display text-3xl text-ember">{squad.totalHeat}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted">
                <span className="rounded-full border border-ember-dim/50 px-2 py-1">{squad.takes} takes</span>
                <span className="rounded-full border border-ember-dim/50 px-2 py-1">{squad.votes} votes</span>
                <span className="rounded-full border border-ember-dim/50 px-2 py-1">{squad.averageSpice} avg</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
