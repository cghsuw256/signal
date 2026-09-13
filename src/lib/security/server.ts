import { createServerFn } from "@tanstack/react-start";
import { generateAiBrief, openaiKey } from "./ai";
import { buildBrief } from "./ingest";
import type { AiBrief, Brief } from "./types";

const CACHE_VER = "v5";
const TTL_MS = 10 * 60 * 1000;
const briefCache = new Map<string, { at: number; data: Brief }>();
const aiCache = new Map<string, { at: number; text: string }>();

function assertRange(from: string, to: string): { from: string; to: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new Error("날짜 형식이 올바르지 않습니다.");
  }
  if (from > to) throw new Error("시작일이 종료일보다 늦습니다.");
  const span =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
  if (span > 30) throw new Error("조회 기간은 최대 30일입니다.");
  if (span < 0) throw new Error("조회 기간이 올바르지 않습니다.");
  return { from, to };
}

async function getBriefCached(from: string, to: string): Promise<Brief> {
  const key = `${CACHE_VER}:${from}:${to}`;
  const hit = briefCache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await buildBrief(from, to);
  briefCache.set(key, { at: Date.now(), data });
  return data;
}

export const fetchBrief = createServerFn({ method: "POST" })
  .validator((input: { from: string; to: string }) => assertRange(input.from, input.to))
  .handler(async ({ data }): Promise<Brief> => {
    return getBriefCached(data.from, data.to);
  });

export const summarizeBrief = createServerFn({ method: "POST" })
  .validator((input: { from: string; to: string }) => assertRange(input.from, input.to))
  .handler(async ({ data }): Promise<AiBrief> => {
    const key = `${data.from}:${data.to}`;
    const hit = aiCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return { ok: true, text: hit.text };

    const apiKey = openaiKey();
    if (!apiKey) return { ok: false, error: "OPENAI_API_KEY가 없습니다." };

    const brief = await getBriefCached(data.from, data.to);
    const result = await generateAiBrief(brief, apiKey);
    if (result.ok) aiCache.set(key, { at: Date.now(), text: result.text });
    return result;
  });
