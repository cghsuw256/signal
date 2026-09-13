import { briefingKey } from "./ai";
import { assembleBrief, type Catalog } from "./ingest";
import type { AiBrief, Brief } from "./types";

let catalogPromise: Promise<Catalog> | null = null;
let briefingsPromise: Promise<Record<string, string>> | null = null;

async function loadCatalog(): Promise<Catalog> {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const url = `${import.meta.env.BASE_URL}data/catalog.json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("모닝 데이터를 불러오지 못했습니다.");
      return (await res.json()) as Catalog;
    })();
  }
  return catalogPromise;
}

async function loadBriefings(): Promise<Record<string, string>> {
  if (!briefingsPromise) {
    briefingsPromise = (async () => {
      const url = `${import.meta.env.BASE_URL}data/briefings.json`;
      const res = await fetch(url);
      if (!res.ok) return {};
      return (await res.json()) as Record<string, string>;
    })();
  }
  return briefingsPromise;
}

export async function loadBrief(from: string, to: string): Promise<Brief> {
  const [catalog, briefings] = await Promise.all([loadCatalog(), loadBriefings()]);
  return assembleBrief(catalog, from, to, Boolean(briefings[briefingKey(from, to)]));
}

export async function loadSummary(from: string, to: string): Promise<AiBrief> {
  const briefings = await loadBriefings();
  const text = briefings[briefingKey(from, to)];
  if (text) return { ok: true, text };
  return { ok: false, error: "이 기간 브리핑은 매일 아침 배포 때 만들어집니다." };
}
