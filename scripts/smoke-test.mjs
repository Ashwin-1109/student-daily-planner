import fs from "node:fs";
import path from "node:path";

const required = [
  "app/page.tsx",
  "app/api/takes/route.ts",
  "app/api/takes/[id]/vote/route.ts",
  "app/api/takes/[id]/rebuttal/route.ts",
  "app/api/takes/[id]/steelman/route.ts",
  "app/api/takes/[id]/remix/route.ts",
  "app/api/takes/[id]/brief/route.ts",
  "app/api/squads/route.ts",
  "components/JudgeChecklist.tsx",
  "components/SquadLeaderboard.tsx",
  "lib/llm.ts",
  "supabase/schema.sql",
  "vercel.json"
];

const missing = required.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length) {
  console.error("Missing files:", missing.join(", "));
  process.exit(1);
}

const llmSource = fs.readFileSync(path.join(process.cwd(), "lib/llm.ts"), "utf8");
const expectedFns = ["scoreTake", "generateRebuttal", "generateSteelman", "generateHotterRemix", "generateDebateBrief"];
const missingFns = expectedFns.filter((name) => !llmSource.includes(`function ${name}`));

if (!llmSource.includes("client.chat.completions.create") || missingFns.length) {
  console.error("Groq AI call site or AI functions missing.", missingFns);
  process.exit(1);
}

console.log("Smoke test passed: advanced project structure, Groq call sites, AI tools and judge features found.");
