const BLOCKED_PHRASES = [
  "kill yourself",
  "go die",
  "i will kill",
  "bomb threat",
  "doxx",
  "private address"
];

export function moderateTake(text: string) {
  const normalized = text.toLowerCase();
  const matched = BLOCKED_PHRASES.find((phrase) => normalized.includes(phrase));

  if (matched) {
    return {
      allowed: false,
      reason:
        "This take crosses into harm, threats, or private information. Rewrite it as an opinion, not an attack."
    };
  }

  return { allowed: true, reason: null };
}
