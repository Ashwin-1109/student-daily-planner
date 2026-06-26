"use client";

import { FormEvent, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthPanel() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("Ashwin");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await signIn("credentials", { username, redirect: false });
    setLoading(false);
  }

  if (status === "loading") {
    return <div className="rounded-2xl border border-ember-dim/60 bg-surface/80 p-4 text-sm text-muted">Checking session...</div>;
  }

  if (session?.user) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ember-dim/60 bg-surface/80 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Signed in as</p>
          <p className="font-display text-2xl text-text">@{session.user.name}</p>
        </div>
        <button
          onClick={() => signOut({ redirect: false })}
          className="rounded-full border border-ember-dim px-4 py-2 text-sm text-muted transition hover:border-ember hover:text-text"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="rounded-2xl border border-ember-dim/60 bg-surface/80 p-4 shadow-card">
      <label className="text-xs uppercase tracking-[0.24em] text-muted" htmlFor="username">
        Demo sign in
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="min-w-0 flex-1 rounded-full border border-ember-dim bg-black/35 px-4 py-3 text-text outline-none transition placeholder:text-muted focus:border-ember"
          placeholder="Enter username"
        />
        <button
          disabled={loading || username.trim().length < 2}
          className="rounded-full bg-ember px-6 py-3 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Enter arena"}
        </button>
      </div>
    </form>
  );
}
