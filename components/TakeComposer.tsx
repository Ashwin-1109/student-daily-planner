"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthPanel } from "@/components/AuthPanel";
import type { Take } from "@/lib/types";

type TakeComposerProps = {
  onCreated: (take: Take) => void;
};

const squadOptions = ["Phoenix", "Ember", "Nova", "Inferno"];
const promptChips = [
  "College marks matter less than proof-of-work projects.",
  "AI should be treated like a calculator, not cheating.",
  "Most productivity advice is just guilt in a nicer font.",
  "Group projects should have separate marks for every member."
];

export function TakeComposer({ onCreated }: TakeComposerProps) {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [squad, setSquad] = useState("Phoenix");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/takes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, squad })
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || "Could not post this take.");
      return;
    }

    onCreated(payload.take);
    setText("");
  }

  if (!session?.user) return <AuthPanel />;

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-ember-dim/70 bg-surface/85 p-5 shadow-card backdrop-blur">
      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted">Post a take</p>
          <h2 className="font-display text-3xl tracking-tight text-text">Make the room hotter.</h2>
          <p className="mt-1 text-sm text-muted">Groq creates Heat DNA: score, category, split, safety, tags, and judge-friendly reasoning.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-ember-dim px-3 py-1 text-xs text-muted">@{session.user.name}</span>
          <select
            value={squad}
            onChange={(event) => setSquad(event.target.value)}
            className="rounded-full border border-ember-dim bg-black/35 px-3 py-2 text-sm font-bold text-text outline-none focus:border-ember"
            aria-label="Choose squad"
          >
            {squadOptions.map((option) => (
              <option key={option} value={option} className="bg-surface text-text">
                Squad {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={280}
        rows={4}
        className="w-full resize-none rounded-3xl border border-ember-dim/70 bg-black/35 p-4 text-lg text-text outline-none transition placeholder:text-muted focus:border-ember"
        placeholder="Example: Group projects should be banned unless everyone gets separate marks."
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {promptChips.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setText(prompt)}
            className="rounded-full border border-ember-dim/60 px-3 py-1.5 text-xs text-muted transition hover:border-ember hover:text-text"
          >
            Use prompt
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted">
          {text.length}/280 · moderation + rate limit + AI scoring.
          {error && <span className="ml-2 text-ember">{error}</span>}
        </div>
        <button
          disabled={loading || text.trim().length < 8}
          className="rounded-full bg-ember px-6 py-3 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Scoring heat..." : "Post take +"}
        </button>
      </div>
    </form>
  );
}
