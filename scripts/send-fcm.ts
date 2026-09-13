import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { rangeForMorning } from "../src/lib/security/dates";
import { assembleBrief, type Catalog } from "../src/lib/security/ingest";
import { sendPush } from "../src/lib/push/send";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogFile = join(root, "public/data/catalog.json");

function payloadFromCatalog(): { title: string; body: string } {
  try {
    const catalog = JSON.parse(readFileSync(catalogFile, "utf8")) as Catalog;
    const range = rangeForMorning();
    const brief = assembleBrief(catalog, range.from, range.to, false);
    const top = brief.issues[0];
    const body = [
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
