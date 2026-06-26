import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!apiKey || apiKey === "your_groq_api_key_here") {
  console.error("Groq verification failed: GROQ_API_KEY is missing in .env.local.");
  process.exit(1);
}

const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model,
    temperature: 0.2,
    max_tokens: 80,
    messages: [
      {
        role: "system",
        content: "Reply with one short sentence confirming the Hot Take app can use Groq."
      },
      {
        role: "user",
        content: "Verify connectivity."
      }
    ]
  })
});

const raw = await response.text();

if (!response.ok) {
  let message = raw;
  try {
    const parsed = JSON.parse(raw);
    message = parsed.error?.message || parsed.message || raw;
  } catch {
  }

  console.error(`Groq verification failed (${response.status}): ${message}`);
  process.exit(1);
}

const payload = JSON.parse(raw);
const sample = payload.choices?.[0]?.message?.content?.trim();

console.log(`Groq verification passed with model ${model}.`);
if (sample) console.log(`Sample: ${sample}`);
