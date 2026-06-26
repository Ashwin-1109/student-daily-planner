"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { EmptyState } from "@/components/EmptyState";
import { FeaturePanel } from "@/components/FeaturePanel";
import { JudgeChecklist } from "@/components/JudgeChecklist";
import { Leaderboard } from "@/components/Leaderboard";
import { SquadLeaderboard } from "@/components/SquadLeaderboard";
import { StatsPanel } from "@/components/StatsPanel";
import { TakeCard } from "@/components/TakeCard";
import { TakeComposer } from "@/components/TakeComposer";
import type { ArenaStats, SortMode, SquadStanding, Take } from "@/lib/types";

const sortModes: Array<{ value: SortMode; label: string }> = [
  { value: "hottest", label: "Hottest" },
  { value: "newest", label: "Newest" },
  { value: "spiciest", label: "Spiciest" },
  { value: "underdogs", label: "Underdogs" }
];

export function HotTakeApp() {
  const { data: session } = useSession();
  const [takes, setTakes] = useState<Take[]>([]);
  const [squads, setSquads] = useState<SquadStanding[]>([]);
  const [stats, setStats] = useState<ArenaStats | null>(null);
  const [sort, setSort] = useState<SortMode>("hottest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshExtras = useCallback(async () => {
    const [squadResponse, statsResponse] = await Promise.all([fetch("/api/squads", { cache: "no-store" }), fetch("/api/stats", { cache: "no-store" })]);
    if (squadResponse.ok) setSquads((await squadResponse.json()).squads ?? []);
    if (statsResponse.ok) setStats((await statsResponse.json()).stats ?? null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/takes?sort=${sort}`, { cache: "no-store" });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Failed to load takes.");
      return;
    }
    setTakes(payload.takes);
    await refreshExtras();
  }, [sort, refreshExtras]);

  useEffect(() => {
    refresh();
  }, [refresh, session?.user?.id]);

  const leaderboard = useMemo(() => [...takes].sort((a, b) => b.combinedScore - a.combinedScore).slice(0, 5), [takes]);

  function replaceTake(nextTake: Take) {
    setTakes((current) => current.map((take) => (take.id === nextTake.id ? { ...take, ...nextTake } : take)));
    refreshExtras();
  }

  function addTake(take: Take) {
    setTakes((current) => [take, ...current]);
    refreshExtras();
  }

  return (
    <main className="ember-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-ember-dim/60 bg-black/35 shadow-card backdrop-blur">
          <div className="grid gap-6 p-5 md:grid-cols-[1fr_310px] md:items-center">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.38em] text-ember">Debate stage online · Groq powered</p>
              <h1 className="font-display text-6xl leading-none tracking-tight text-text sm:text-7xl lg:text-8xl">
                Hot <span className="text-ember">Take</span>
              </h1>
              <p className="mt-3 max-w-3xl text-muted">
                Post bold opinions, let AI generate Heat DNA, vote the arena, compare squads, and use Groq to create rebuttals, steelmans, hotter remixes, and debate briefs.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-ember-dim/60 bg-surface/70 p-4 text-sm text-muted">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Judge pitch</p>
              <p className="mt-2 font-display text-4xl text-ember">Not just CRUD</p>
              <p className="mt-2 leading-6">It proves AI value, community mechanics, safety, ranking, deployment readiness, and a unique product story.</p>
            </div>
          </div>
          <div className="border-t border-ember-dim/40 bg-surface/50 p-5">
            <StatsPanel stats={stats} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <TakeComposer onCreated={addTake} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted">Feed</p>
                <h2 className="font-display text-4xl text-text">The arena</h2>
              </div>
              <div className="inline-flex flex-wrap rounded-[1.5rem] border border-ember-dim bg-surface/80 p-1">
                {sortModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setSort(mode.value)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      sort === mode.value ? "bg-ember text-black" : "text-muted hover:text-text"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="rounded-2xl border border-ember bg-surface p-4 text-ember">{error}</div>}
            {loading ? (
              <div className="rounded-[2rem] border border-ember-dim/60 bg-surface/80 p-8 text-muted">Loading takes...</div>
            ) : takes.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-5">
                {takes.map((take) => (
                  <TakeCard key={take.id} take={take} onChanged={replaceTake} />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Leaderboard takes={leaderboard} />
            <SquadLeaderboard squads={squads} />
            <JudgeChecklist />
            <FeaturePanel />
          </aside>
        </div>
      </div>
    </main>
  );
}
