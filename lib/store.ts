import { promises as fs } from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ArenaStats, LocalStore, SortMode, SquadStanding, Take, TakeRecord, VoteValue } from "@/lib/types";

const DEFAULT_SQUADS = ["Phoenix", "Ember", "Nova", "Inferno"];

type DbTake = {
  id: string;
  author_id: string;
  author_name: string;
  squad?: string | null;
  text: string;
  votes: number;
  spiciness_score: number;
  spiciness_reason: string;
  heat_tier?: string | null;
  category?: string | null;
  controversy_type?: string | null;
  audience_split?: string | null;
  safety_level?: string | null;
  tags?: string[] | string | null;
  steelman?: string | null;
  remix?: string | null;
  debate_brief?: string | null;
  created_at: string;
};

type DbRebuttal = {
  take_id: string;
  content: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseServiceKey);

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!hasSupabase) return null;
  if (!supabase) {
    supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false }
    });
  }
  return supabase;
}

function localStorePath() {
  if (process.env.HOT_TAKE_STORE_PATH) return process.env.HOT_TAKE_STORE_PATH;
  if (process.env.VERCEL) return "/tmp/hot-take-store.json";
  return path.join(process.cwd(), "data", "local-store.json");
}

function pickSquad(authorName: string) {
  const total = authorName
    .toLowerCase()
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DEFAULT_SQUADS[total % DEFAULT_SQUADS.length];
}

function normalizeTags(tags: unknown) {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag)).filter(Boolean).slice(0, 4);
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags) as unknown;
      if (Array.isArray(parsed)) return parsed.map((tag) => String(tag)).filter(Boolean).slice(0, 4);
    } catch {
      return tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4);
    }
  }
  return [];
}

function completeTakeRecord(raw: Partial<TakeRecord> & Pick<TakeRecord, "id" | "authorId" | "authorName" | "text" | "votes" | "spicinessScore" | "spicinessReason" | "createdAt">): TakeRecord {
  return {
    id: raw.id,
    authorId: raw.authorId,
    authorName: raw.authorName,
    squad: raw.squad || pickSquad(raw.authorName),
    text: raw.text,
    votes: raw.votes ?? 0,
    spicinessScore: Number(raw.spicinessScore ?? 5),
    spicinessReason: raw.spicinessReason || "No score reason was saved.",
    heatTier: raw.heatTier || (Number(raw.spicinessScore ?? 5) >= 9 ? "Nuclear" : Number(raw.spicinessScore ?? 5) >= 7.5 ? "Scorching" : Number(raw.spicinessScore ?? 5) >= 5.5 ? "Hot" : "Warm"),
    category: raw.category || "General debate",
    controversyType: raw.controversyType || "Opinion challenge",
    audienceSplit: raw.audienceSplit || "Mixed audience reaction",
    safetyLevel: raw.safetyLevel || "Clean debate",
    tags: raw.tags?.length ? raw.tags : ["debate"],
    createdAt: raw.createdAt,
    rebuttal: raw.rebuttal ?? null,
    steelman: raw.steelman ?? null,
    remix: raw.remix ?? null,
    debateBrief: raw.debateBrief ?? null
  };
}

async function ensureLocalStore(): Promise<LocalStore> {
  const file = localStorePath();
  try {
    const raw = await fs.readFile(file, "utf8");
    const store = JSON.parse(raw) as LocalStore;
    return {
      takes: store.takes.map((take) => completeTakeRecord(take as TakeRecord)),
      votes: store.votes ?? []
    };
  } catch {
    const seedRaw = await fs.readFile(path.join(process.cwd(), "data", "seed-takes.json"), "utf8");
    const seed = JSON.parse(seedRaw) as LocalStore;
    const upgraded = {
      takes: seed.takes.map((take) => completeTakeRecord(take as TakeRecord)),
      votes: seed.votes ?? []
    };
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(upgraded, null, 2));
    return upgraded;
  }
}

async function writeLocalStore(store: LocalStore) {
  const file = localStorePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(store, null, 2));
}

function computeCombinedScore(take: Pick<TakeRecord, "votes" | "spicinessScore" | "createdAt" | "heatTier">) {
  const hoursOld = Math.max(1, (Date.now() - new Date(take.createdAt).getTime()) / 36e5);
  const heatDecay = Math.pow(hoursOld + 2, 0.22);
  const tierBoost = take.heatTier === "Nuclear" ? 1.4 : take.heatTier === "Scorching" ? 1.2 : 1;
  return Number(((take.votes + take.spicinessScore * 1.35 * tierBoost) / heatDecay).toFixed(2));
}

function withClientFields(take: TakeRecord, viewerVote: VoteValue | 0 = 0): Take {
  return {
    ...completeTakeRecord(take),
    viewerVote,
    combinedScore: computeCombinedScore(completeTakeRecord(take))
  };
}

function sortTakes(takes: Take[], sort: SortMode) {
  const copy = [...takes];
  if (sort === "newest") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (sort === "spiciest") return copy.sort((a, b) => b.spicinessScore - a.spicinessScore || b.votes - a.votes);
  if (sort === "underdogs") return copy.sort((a, b) => b.spicinessScore - b.votes / 5 - (a.spicinessScore - a.votes / 5));
  return copy.sort((a, b) => b.combinedScore - a.combinedScore);
}

function mapDbTake(row: DbTake, rebuttal?: string | null, viewerVote: VoteValue | 0 = 0): Take {
  return withClientFields(
    completeTakeRecord({
      id: row.id,
      authorId: row.author_id,
      authorName: row.author_name,
      squad: row.squad || pickSquad(row.author_name),
      text: row.text,
      votes: row.votes ?? 0,
      spicinessScore: Number(row.spiciness_score ?? 5),
      spicinessReason: row.spiciness_reason ?? "No score reason was saved.",
      heatTier: (row.heat_tier as TakeRecord["heatTier"]) || undefined,
      category: row.category || undefined,
      controversyType: row.controversy_type || undefined,
      audienceSplit: row.audience_split || undefined,
      safetyLevel: (row.safety_level as TakeRecord["safetyLevel"]) || undefined,
      tags: normalizeTags(row.tags),
      createdAt: row.created_at,
      rebuttal: rebuttal ?? null,
      steelman: row.steelman ?? null,
      remix: row.remix ?? null,
      debateBrief: row.debate_brief ?? null
    }),
    viewerVote
  );
}

export async function listTakes(sort: SortMode = "hottest", viewerId?: string) {
  const db = getSupabase();

  if (db) {
    const [{ data: takeRows, error: takesError }, { data: rebuttalRows }] = await Promise.all([
      db.from("takes").select("*").limit(100),
      db.from("rebuttals").select("take_id, content")
    ]);

    if (takesError) throw takesError;

    const rebuttalMap = new Map((rebuttalRows as DbRebuttal[] | null | undefined)?.map((r) => [r.take_id, r.content]) ?? []);
    let voteMap = new Map<string, VoteValue>();

    if (viewerId && takeRows?.length) {
      const { data: voteRows } = await db.from("votes").select("take_id, value").eq("user_id", viewerId);
      voteMap = new Map((voteRows as Array<{ take_id: string; value: VoteValue }> | null | undefined)?.map((v) => [v.take_id, v.value]) ?? []);
    }

    return sortTakes(((takeRows as DbTake[] | null) ?? []).map((row) => mapDbTake(row, rebuttalMap.get(row.id), voteMap.get(row.id) ?? 0)), sort);
  }

  const store = await ensureLocalStore();
  const takes = store.takes.map((take) => {
    const viewerVote = viewerId ? store.votes.find((vote) => vote.takeId === take.id && vote.userId === viewerId)?.value ?? 0 : 0;
    return withClientFields(take, viewerVote);
  });

  return sortTakes(takes, sort);
}

export async function getTakeById(id: string) {
  const db = getSupabase();

  if (db) {
    const [{ data: row, error }, { data: rebuttal }] = await Promise.all([
      db.from("takes").select("*").eq("id", id).single(),
      db.from("rebuttals").select("content").eq("take_id", id).maybeSingle()
    ]);
    if (error || !row) return null;
    return mapDbTake(row as DbTake, (rebuttal as { content?: string } | null)?.content ?? null);
  }

  const store = await ensureLocalStore();
  const found = store.takes.find((take) => take.id === id);
  return found ? withClientFields(found) : null;
}

export async function createTake(input: {
  authorId: string;
  authorName: string;
  squad?: string;
  text: string;
  spicinessScore: number;
  spicinessReason: string;
  heatTier: TakeRecord["heatTier"];
  category: string;
  controversyType: string;
  audienceSplit: string;
  safetyLevel: TakeRecord["safetyLevel"];
  tags: string[];
}) {
  const db = getSupabase();
  const createdAt = new Date().toISOString();
  const record = completeTakeRecord({
    id: crypto.randomUUID(),
    authorId: input.authorId,
    authorName: input.authorName,
    squad: input.squad || pickSquad(input.authorName),
    text: input.text,
    votes: 0,
    spicinessScore: input.spicinessScore,
    spicinessReason: input.spicinessReason,
    heatTier: input.heatTier,
    category: input.category,
    controversyType: input.controversyType,
    audienceSplit: input.audienceSplit,
    safetyLevel: input.safetyLevel,
    tags: input.tags,
    createdAt,
    rebuttal: null,
    steelman: null,
    remix: null,
    debateBrief: null
  });

  if (db) {
    const { data, error } = await db
      .from("takes")
      .insert({
        author_id: record.authorId,
        author_name: record.authorName,
        squad: record.squad,
        text: record.text,
        votes: 0,
        spiciness_score: record.spicinessScore,
        spiciness_reason: record.spicinessReason,
        heat_tier: record.heatTier,
        category: record.category,
        controversy_type: record.controversyType,
        audience_split: record.audienceSplit,
        safety_level: record.safetyLevel,
        tags: record.tags,
        created_at: createdAt
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapDbTake(data as DbTake, null);
  }

  const store = await ensureLocalStore();
  store.takes.unshift(record);
  await writeLocalStore(store);
  return withClientFields(record);
}

export async function voteTake(takeId: string, userId: string, value: VoteValue) {
  const db = getSupabase();

  if (db) {
    const { data: existing } = await db.from("votes").select("value").eq("take_id", takeId).eq("user_id", userId).maybeSingle();

    const oldValue = (existing as { value?: VoteValue } | null)?.value ?? 0;
    const nextValue = oldValue === value ? 0 : value;
    const delta = nextValue - oldValue;

    if (nextValue === 0) {
      await db.from("votes").delete().eq("take_id", takeId).eq("user_id", userId);
    } else {
      await db.from("votes").upsert({ take_id: takeId, user_id: userId, value: nextValue }, { onConflict: "take_id,user_id" });
    }

    const { data: takeRow } = await db.from("takes").select("votes").eq("id", takeId).single();
    const nextVotes = Number((takeRow as { votes?: number } | null)?.votes ?? 0) + delta;
    const { data, error } = await db.from("takes").update({ votes: nextVotes }).eq("id", takeId).select("*").single();
    if (error) throw error;
    return mapDbTake(data as DbTake, null, nextValue as VoteValue | 0);
  }

  const store = await ensureLocalStore();
  const take = store.takes.find((item) => item.id === takeId);
  if (!take) throw new Error("Take not found");

  const existingIndex = store.votes.findIndex((vote) => vote.takeId === takeId && vote.userId === userId);
  const existing = existingIndex >= 0 ? store.votes[existingIndex] : null;
  const oldValue = existing?.value ?? 0;
  const nextValue = oldValue === value ? 0 : value;
  const delta = nextValue - oldValue;

  if (nextValue === 0 && existingIndex >= 0) {
    store.votes.splice(existingIndex, 1);
  } else if (existingIndex >= 0) {
    store.votes[existingIndex] = { takeId, userId, value: nextValue as VoteValue };
  } else {
    store.votes.push({ takeId, userId, value: nextValue as VoteValue });
  }

  take.votes += delta;
  await writeLocalStore(store);
  return withClientFields(take, nextValue as VoteValue | 0);
}

export async function saveRebuttal(takeId: string, content: string) {
  const db = getSupabase();

  if (db) {
    await db.from("rebuttals").upsert({ take_id: takeId, content }, { onConflict: "take_id" });
    return content;
  }

  const store = await ensureLocalStore();
  const take = store.takes.find((item) => item.id === takeId);
  if (!take) throw new Error("Take not found");
  take.rebuttal = content;
  await writeLocalStore(store);
  return content;
}

export async function saveAiField(takeId: string, field: "steelman" | "remix" | "debateBrief", content: string) {
  const db = getSupabase();
  const dbField = field === "debateBrief" ? "debate_brief" : field;

  if (db) {
    await db.from("takes").update({ [dbField]: content }).eq("id", takeId);
    return content;
  }

  const store = await ensureLocalStore();
  const take = store.takes.find((item) => item.id === takeId);
  if (!take) throw new Error("Take not found");
  take[field] = content;
  await writeLocalStore(store);
  return content;
}

export async function leaderboard(limit = 10) {
  const takes = await listTakes("hottest");
  return takes.slice(0, limit);
}

export async function squadLeaderboard(): Promise<SquadStanding[]> {
  const takes = await listTakes("hottest");
  const map = new Map<string, SquadStanding>();

  takes.forEach((take) => {
    const current = map.get(take.squad) ?? { squad: take.squad, takes: 0, votes: 0, averageSpice: 0, totalHeat: 0 };
    current.takes += 1;
    current.votes += take.votes;
    current.totalHeat += take.combinedScore;
    current.averageSpice += take.spicinessScore;
    map.set(take.squad, current);
  });

  return Array.from(map.values())
    .map((standing) => ({
      ...standing,
      averageSpice: Number((standing.averageSpice / Math.max(1, standing.takes)).toFixed(1)),
      totalHeat: Number(standing.totalHeat.toFixed(2))
    }))
    .sort((a, b) => b.totalHeat - a.totalHeat);
}

export async function arenaStats(): Promise<ArenaStats> {
  const takes = await listTakes("hottest");
  const totalVotes = takes.reduce((sum, take) => sum + take.votes, 0);
  const averageSpice = takes.reduce((sum, take) => sum + take.spicinessScore, 0) / Math.max(1, takes.length);
  const nuclearTakes = takes.filter((take) => take.heatTier === "Nuclear").length;
  return {
    totalTakes: takes.length,
    totalVotes,
    averageSpice: Number(averageSpice.toFixed(1)),
    nuclearTakes
  };
}
