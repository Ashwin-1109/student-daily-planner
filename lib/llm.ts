import Groq from "groq-sdk";
import type { HeatTier, SafetyLevel, ScoreResult } from "@/lib/types";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_TIMEOUT_MS = 20000;

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function getModel() {
  return process.env.GROQ_MODEL || DEFAULT_MODEL;
}

function getGroqTimeoutMs() {
  const timeout = Number(process.env.GROQ_TIMEOUT_MS);
  if (!Number.isFinite(timeout) || timeout < 3000) return DEFAULT_TIMEOUT_MS;
  return Math.min(timeout, 60000);
}

async function withGroqTimeout<T>(request: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Groq request timed out")), getGroqTimeoutMs());
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function clampScore(input: unknown) {
  const score = Number(input);
  if (!Number.isFinite(score)) return 5;
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

function heatTierFromScore(score: number): HeatTier {
  if (score >= 9) return "Nuclear";
  if (score >= 7.5) return "Scorching";
  if (score >= 5.5) return "Hot";
  return "Warm";
}

function normalizeSafety(input: unknown): SafetyLevel {
  const raw = String(input ?? "").toLowerCase();
  if (raw.includes("border")) return "Borderline";
  if (raw.includes("care") || raw.includes("caution")) return "Needs care";
  return "Clean debate";
}

function normalizeTags(input: unknown, text: string) {
  const fromInput = Array.isArray(input)
    ? input.map((tag) => String(tag).trim()).filter(Boolean)
    : String(input ?? "")
        .split(/[,#]/)
        .map((tag) => tag.trim())
        .filter(Boolean);

  const fallback = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4)
    .slice(0, 3);

  return Array.from(new Set([...(fromInput.length ? fromInput : fallback)].map((tag) => tag.replace(/^#/, "").slice(0, 18))))
    .slice(0, 4);
}

function fallbackScoreTake(text: string): ScoreResult {
  const lower = text.toLowerCase();
  const spicyWords = ["never", "always", "overrated", "underrated", "ban", "worst", "best", "everyone", "nobody", "should"];
  const hits = spicyWords.filter((word) => lower.includes(word)).length;
  const lengthBoost = Math.min(2, text.length / 140);
  const score = clampScore(3.5 + hits * 0.9 + lengthBoost);

  return {
    score,
    reason: "Fallback score used because Groq was not configured or did not respond; the wording still sounds debatable.",
    heatTier: heatTierFromScore(score),
    category: lower.includes("ai") ? "Education + AI" : lower.includes("movie") ? "Culture" : "General debate",
    controversyType: hits > 1 ? "Absolute claim" : "Opinion challenge",
    audienceSplit: score >= 7 ? "Likely split 60/40 or sharper" : "Likely mild disagreement",
    safetyLevel: "Clean debate",
    tags: normalizeTags([], text)
  };
}

function parseJsonFromText(raw: string, text: string): ScoreResult {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : trimmed;
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;
  const score = clampScore(parsed.score);

  return {
    score,
    reason:
      typeof parsed.reason === "string" && parsed.reason.trim().length > 0
        ? parsed.reason.trim().slice(0, 240)
        : "The opinion creates disagreement across common viewpoints.",
    heatTier: heatTierFromScore(score),
    category: typeof parsed.category === "string" ? parsed.category.trim().slice(0, 40) : "General debate",
    controversyType:
      typeof parsed.controversyType === "string" ? parsed.controversyType.trim().slice(0, 48) : "Opinion challenge",
    audienceSplit: typeof parsed.audienceSplit === "string" ? parsed.audienceSplit.trim().slice(0, 64) : "Mixed audience reaction",
    safetyLevel: normalizeSafety(parsed.safetyLevel),
    tags: normalizeTags(parsed.tags, text)
  };
}

export async function scoreTake(text: string): Promise<ScoreResult> {
  const client = getClient();
  if (!client) return fallbackScoreTake(text);

  try {
    const completion = await withGroqTimeout(client.chat.completions.create({
      model: getModel(),
      temperature: 0.2,
      max_tokens: 260,
      messages: [
        {
          role: "system",
          content:
            "You are Hot Take's Heat DNA engine. Score controversial opinions for a debate app. Return only valid JSON. Keep it safe, respectful, and non-hateful."
        },
        {
          role: "user",
          content: `Analyze this opinion for a social debate feed. Return JSON exactly with these keys: score number 1-10, reason one sentence, category short label, controversyType short label, audienceSplit short phrase, safetyLevel one of Clean debate/Needs care/Borderline, tags array of 2-4 short tags.\n\nOpinion: "${text}"`
        }
      ]
    }));

    const raw = completion.choices[0]?.message?.content ?? "";
    return parseJsonFromText(raw, text);
  } catch (error) {
    console.error("Groq scoreTake failed", error);
    return fallbackScoreTake(text);
  }
}

export async function generateRebuttal(text: string): Promise<string> {
  const client = getClient();
  if (!client) {
    return "Fallback rebuttal: A strong counterpoint is that this take may be too broad. Real situations usually depend on context, evidence, and who is affected.";
  }

  try {
    const completion = await withGroqTimeout(client.chat.completions.create({
      model: getModel(),
      temperature: 0.55,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: "You write sharp but respectful counter-arguments. Do not insult the author. Keep it persuasive, concise, and safe."
        },
        {
          role: "user",
          content: `Write the strongest 2-3 sentence counter-argument to this hot take:\n\n"${text}"`
        }
      ]
    }));

    return completion.choices[0]?.message?.content?.trim() || "A fair counterpoint is that this take needs stronger evidence before people should accept it.";
  } catch (error) {
    console.error("Groq generateRebuttal failed", error);
    return "Fallback rebuttal: The strongest counter is that the take treats a complex issue as simple. Better evidence and real-world exceptions could change the conclusion.";
  }
}

export async function generateSteelman(text: string): Promise<string> {
  const client = getClient();
  if (!client) {
    return "Fallback steelman: The best version of this take is that it challenges a common assumption and asks people to judge the issue by outcomes rather than habit.";
  }

  try {
    const completion = await withGroqTimeout(client.chat.completions.create({
      model: getModel(),
      temperature: 0.45,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content: "You strengthen controversial opinions into their most reasonable version without adding harmful content. Be concise and respectful."
        },
        {
          role: "user",
          content: `Steelman this hot take in 2-3 sentences. Make the argument more thoughtful and defensible:\n\n"${text}"`
        }
      ]
    }));

    return completion.choices[0]?.message?.content?.trim() || "The strongest version of this take is that it asks for a practical result, not blind tradition.";
  } catch (error) {
    console.error("Groq generateSteelman failed", error);
    return "Fallback steelman: The take is strongest when framed around fairness, evidence, and real-world impact rather than personal preference.";
  }
}

export async function generateHotterRemix(text: string): Promise<string> {
  const client = getClient();
  if (!client) {
    return `Fallback hotter remix: ${text.replace(/\.$/, "")} — and pretending otherwise only protects outdated thinking.`;
  }

  try {
    const completion = await withGroqTimeout(client.chat.completions.create({
      model: getModel(),
      temperature: 0.8,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content:
            "You rewrite opinions into sharper, more viral hot takes. Do not create hate, harassment, threats, or personal attacks. Keep under 180 characters."
        },
        {
          role: "user",
          content: `Make this opinion hotter and punchier without making it abusive or unsafe:\n\n"${text}"`
        }
      ]
    }));

    return completion.choices[0]?.message?.content?.trim().replace(/^"|"$/g, "") || text;
  } catch (error) {
    console.error("Groq generateHotterRemix failed", error);
    return `Fallback hotter remix: ${text.replace(/\.$/, "")} — and the debate is overdue.`;
  }
}

export async function generateDebateBrief(text: string): Promise<string> {
  const client = getClient();
  if (!client) {
    return "Fallback debate brief: Claim: the take challenges a common belief. Blind spot: it may ignore exceptions. Best next question: what evidence would change either side's mind?";
  }

  try {
    const completion = await withGroqTimeout(client.chat.completions.create({
      model: getModel(),
      temperature: 0.35,
      max_tokens: 260,
      messages: [
        {
          role: "system",
          content:
            "You are a debate coach. Give a compact, useful analysis. Avoid claiming certainty. Do not fact-check beyond the text; identify what evidence would matter."
        },
        {
          role: "user",
          content: `Create a 3-bullet debate brief for this hot take. Format exactly as three short lines: Core claim, Blind spot, Evidence needed.\n\n"${text}"`
        }
      ]
    }));

    return completion.choices[0]?.message?.content?.trim() || "Core claim: The take questions the default view. Blind spot: Context may change the answer. Evidence needed: real examples and impact data.";
  } catch (error) {
    console.error("Groq generateDebateBrief failed", error);
    return "Core claim: The take questions the default view. Blind spot: Context may change the answer. Evidence needed: real examples and impact data.";
  }
}
