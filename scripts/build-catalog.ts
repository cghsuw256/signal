import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { briefingKey, generateAiBrief, openaiKey } from "../src/lib/security/ai";
import { rangeForMorning, rangeForPreset } from "../src/lib/security/dates";
import { assembleBrief, buildCatalog } from "../src/lib/security/ingest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { from, to } = rangeForPreset(30);
console.log(`[catalog] fetching ${from} → ${to}`);
const catalog = await buildCatalog(from, to);
const outDir = join(root, "public", "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "catalog.json"), JSON.stringify(catalog));
console.log(
  `[catalog] wrote ${catalog.issues.length} issues (total ${catalog.catalogTotal}) → public/data/catalog.json`,
);

const apiKey = openaiKey();
const briefings: Record<string, string> = {};
if (apiKey) {
  const ranges = [rangeForMorning(), rangeForPreset(7), rangeForPreset(14), rangeForPreset(30)];
  for (const range of ranges) {
    const key = briefingKey(range.from, range.to);
    if (briefings[key]) continue;
    const brief = assembleBrief(catalog, range.from, range.to, true);
    const result = await generateAiBrief(brief, apiKey);
    if (result.ok) {
      briefings[key] = result.text;
      console.log(`[catalog] briefing ${key}`);
    } else {
      console.warn(`[catalog] briefing skip ${key}: ${result.error}`);
    }
  }
} else {
  console.log("[catalog] OPENAI_API_KEY 없음 — AI 브리핑 생략");
}
writeFileSync(join(outDir, "briefings.json"), JSON.stringify(briefings));
