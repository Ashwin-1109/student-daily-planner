"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { HeatGauge } from "@/components/HeatGauge";
import type { Take, VoteValue } from "@/lib/types";

type TakeCardProps = {
  take: Take;
  onChanged: (take: Take) => void;
};

type ToolKey = "rebuttal" | "steelman" | "remix" | "brief";

const toolLabels: Record<ToolKey, string> = {
  rebuttal: "AI rebuttal",
  steelman: "Steelman",
  remix: "Hotter remix",
  brief: "Debate brief"
};

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function panelTitle(active: ToolKey) {
  if (active === "rebuttal") return "Strongest counter-argument";
  if (active === "steelman") return "Best possible version of this take";
  if (active === "remix") return "Shareable hotter version";
  return "Judge-friendly debate lens";
}

export function TakeCard({ take, onChanged }: TakeCardProps) {
  const { data: session } = useSession();
  const [currentTake, setCurrentTake] = useState(take);
  const [activeTool, setActiveTool] = useState<ToolKey | null>(take.rebuttal ? "rebuttal" : null);
  const [loadingTool, setLoadingTool] = useState<ToolKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTake(next: Take) {
    setCurrentTake(next);
    onChanged(next);
  }

  async function vote(value: VoteValue) {
    setError(null);
    const response = await fetch(`/api/takes/${currentTake.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Vote failed.");
      return;
    }
    updateTake({ ...currentTake, ...payload.take });
  }

  async function runTool(tool: ToolKey) {
    const cached =
      tool === "rebuttal"
        ? currentTake.rebuttal
        : tool === "steelman"
          ? currentTake.steelman
          : tool === "remix"
            ? currentTake.remix
            : currentTake.debateBrief;

    if (cached) {
      setActiveTool((current) => (current === tool ? null : tool));
      return;
    }

    setLoadingTool(tool);
    setError(null);
    const route = tool === "brief" ? "brief" : tool;
    const response = await fetch(`/api/takes/${currentTake.id}/${route}`, { method: "POST" });
    const payload = await response.json();
    setLoadingTool(null);

    if (!response.ok) {
      setError(payload.error || `Could not generate ${toolLabels[tool]}.`);
      return;
    }

    const nextTake = {
      ...currentTake,
      rebuttal: payload.rebuttal ?? currentTake.rebuttal,
      steelman: payload.steelman ?? currentTake.steelman,
      remix: payload.remix ?? currentTake.remix,
      debateBrief: payload.debateBrief ?? currentTake.debateBrief
    };
    updateTake(nextTake);
    setActiveTool(tool);
  }

  async function copyShareCard() {
    const shareText = `🔥 Hot Take (${currentTake.spicinessScore.toFixed(1)}/10 ${currentTake.heatTier})\n“${currentTake.text}”\n@${currentTake.authorName} · ${currentTake.votes} votes · Squad ${currentTake.squad}`;
    await navigator.clipboard?.writeText(shareText).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const activeContent =
    activeTool === "rebuttal"
      ? currentTake.rebuttal
      : activeTool === "steelman"
        ? currentTake.steelman
        : activeTool === "remix"
          ? currentTake.remix
          : activeTool === "brief"
            ? currentTake.debateBrief
            : null;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-ember-dim/60 bg-surface/85 shadow-card backdrop-blur transition hover:border-ember/80 hover:shadow-ember">
      <div className="border-b border-ember-dim/40 bg-black/20 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
          <span className="rounded-full border border-ember-dim/70 px-3 py-1 text-ember">{currentTake.heatTier}</span>
          <span>{currentTake.category}</span>
          <span>·</span>
          <span>{currentTake.controversyType}</span>
          <span>·</span>
          <span>Squad {currentTake.squad}</span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-5 md:grid-cols-[1fr_230px] md:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="rounded-full border border-ember-dim px-3 py-1">@{currentTake.authorName}</span>
              <span>{relativeTime(currentTake.createdAt)}</span>
              <span>·</span>
              <span>{currentTake.votes} votes</span>
              <span>·</span>
              <span>{currentTake.combinedScore} rank heat</span>
            </div>
            <h3 className="font-display text-4xl leading-[0.95] tracking-tight text-text md:text-5xl">“{currentTake.text}”</h3>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">{currentTake.spicinessReason}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-ember-dim/50 bg-black/25 p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Audience split</p>
                <p className="mt-1 text-sm font-bold text-text">{currentTake.audienceSplit}</p>
              </div>
              <div className="rounded-2xl border border-ember-dim/50 bg-black/25 p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Safety</p>
                <p className="mt-1 text-sm font-bold text-text">{currentTake.safetyLevel}</p>
              </div>
              <div className="rounded-2xl border border-ember-dim/50 bg-black/25 p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Tags</p>
                <p className="mt-1 truncate text-sm font-bold text-text">{currentTake.tags.map((tag) => `#${tag}`).join(" ")}</p>
              </div>
            </div>
          </div>
          <HeatGauge score={currentTake.spicinessScore} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ember-dim/50 pt-4">
          <button
            disabled={!session?.user}
            onClick={() => vote(1)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              currentTake.viewerVote === 1 ? "border-ember bg-ember text-black" : "border-ember-dim text-muted hover:border-ember hover:text-text"
            }`}
          >
            Upvote
          </button>
          <button
            disabled={!session?.user}
            onClick={() => vote(-1)}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              currentTake.viewerVote === -1 ? "border-ember bg-ember text-black" : "border-ember-dim text-muted hover:border-ember hover:text-text"
            }`}
          >
            Downvote
          </button>

          {(["rebuttal", "steelman", "remix", "brief"] as ToolKey[]).map((tool) => (
            <button
              key={tool}
              disabled={!session?.user || Boolean(loadingTool)}
              onClick={() => runTool(tool)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                activeTool === tool ? "border-ember bg-ember text-black" : "border-ember-dim text-muted hover:border-ember hover:text-text"
              }`}
            >
              {loadingTool === tool ? "Groq thinking..." : toolLabels[tool]}
            </button>
          ))}

          <button
            onClick={copyShareCard}
            className="rounded-full border border-ember-dim px-4 py-2 text-sm font-bold text-muted transition hover:border-ember hover:text-text"
          >
            {copied ? "Copied" : "Copy share card"}
          </button>
          {error && <span className="text-sm text-ember">{error}</span>}
        </div>

        {activeTool && activeContent && (
          <div className="mt-5 rounded-3xl border border-ember-dim/60 bg-black/35 p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-muted">{panelTitle(activeTool)}</p>
            <p className="whitespace-pre-line leading-7 text-text">{activeContent}</p>
          </div>
        )}
      </div>
    </article>
  );
}
