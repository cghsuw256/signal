import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sendPush } from "../src/lib/push/send";
import { briefingKey } from "../src/lib/security/ai";
import { rangeForMorning } from "../src/lib/security/dates";
import { assembleBrief, type Catalog } from "../src/lib/security/ingest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogFile = join(root, "public/data/catalog.json");
const briefingsFile = join(root, "public/data/briefings.json");

function firstBriefingLine(from: string, to: string): string | null {
  try {
    const map = JSON.parse(readFileSync(briefingsFile, "utf8")) as Record<string, string>;
    const text = map[briefingKey(from, to)];
    if (!text) return null;
    const line = text
      .split("\n")
      .map((s) => s.trim())
      .find((s) => s && !s.startsWith("#"));
    return line ? line.slice(0, 140) : null;
  } catch {
    return null;
  }
}

function payloadFromCatalog(): { title: string; body: string } {
  const range = rangeForMorning();
  try {
    const catalog = JSON.parse(readFileSync(catalogFile, "utf8")) as Catalog;
    const brief = assembleBrief(catalog, range.from, range.to, false);
    const briefing = firstBriefingLine(range.from, range.to);
    const top = brief.issues[0];
    const body =
      briefing ??
      [
        `CVE ${brief.catalogTotal.toLocaleString("ko-KR")}건`,
        `치명 ${brief.severity.critical}`,
        brief.types[0] ? `최다 ${brief.types[0].name}` : null,
        top ? top.title : null,
      ]
        .filter(Boolean)
        .join(" · ");
    return { title: "시그널 모닝 리포트", body };
  } catch {
    return { title: "시그널 모닝 리포트", body: "오늘 아침 보안 이슈를 확인해 주세요." };
  }
}

const { title, body } = payloadFromCatalog();
const url = process.env.SIGNAL_PUBLIC_URL?.trim() || "https://cghsuw256.github.io/signal/";
const result = await sendPush({ title, body, url });
console.log(`[fcm] sent ${result.sent} message(s)`);
