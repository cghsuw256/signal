import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rangeForPreset } from "../src/lib/security/dates";
import { buildCatalog } from "../src/lib/security/ingest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { from, to } = rangeForPreset(30);
console.log(`[catalog] fetching ${from} → ${to}`);
const catalog = await buildCatalog(from, to);
const outDir = join(root, "public", "data");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "catalog.json");
writeFileSync(outFile, JSON.stringify(catalog));
console.log(
  `[catalog] wrote ${catalog.issues.length} issues (total ${catalog.catalogTotal}) → public/data/catalog.json`,
);
