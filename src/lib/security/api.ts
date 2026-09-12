import { assembleBrief, type Catalog } from "./ingest";
import type { AiBrief, Brief } from "./types";

let catalogPromise: Promise<Catalog> | null = null;

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

export async function loadBrief(from: string, to: string): Promise<Brief> {
  const catalog = await loadCatalog();
  return assembleBrief(catalog, from, to, false);
}

export async function loadSummary(): Promise<AiBrief> {
  return { ok: false, error: "이 공개 페이지에서는 AI 브리핑을 제공하지 않습니다." };
}
