import { cweLabel } from "./cwe";
import type { CweRef, Issue, Severity, SourceId } from "./types";

const SEV_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

export function normalizeSeverity(raw: string | undefined | null): Severity {
  const s = (raw ?? "").toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "medium" || s === "moderate") return "medium";
  if (s === "low") return "low";
  if (s === "none") return "low";
  return "unknown";
}

export function scoreToSeverity(score: number | undefined): Severity {
  if (score === undefined || Number.isNaN(score)) return "unknown";
  if (score >= 9) return "critical";
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

export function makeCwe(id: string, name?: string): CweRef {
  const clean = id.trim().toUpperCase().startsWith("CWE-")
    ? id.trim().toUpperCase()
    : id.trim();
  return { id: clean, name: name ?? clean, nameKo: cweLabel(clean, name) };
}

export function emptyIssue(partial: Partial<Issue> & { id: string }): Issue {
  return {
    title: "",
    summary: "",
    severity: "unknown",
    published: "",
    cwes: [],
    vendors: [],
    products: [],
    sources: [],
    kev: false,
    ransomware: false,
    url: "",
    ...partial,
  };
}

export function mergeIssues(into: Issue, extra: Partial<Issue> & { sources?: SourceId[] }): Issue {
  const sources = Array.from(new Set([...into.sources, ...(extra.sources ?? [])]));
  const vendors = uniq([...into.vendors, ...(extra.vendors ?? [])]);
  const products = uniq([...into.products, ...(extra.products ?? [])]);
  const cwes = mergeCwes(into.cwes, extra.cwes ?? []);
  const severity =
    SEV_RANK[extra.severity ?? "unknown"] > SEV_RANK[into.severity]
      ? (extra.severity as Severity)
      : into.severity;
  const score =
    extra.score !== undefined && (into.score === undefined || extra.score > into.score)
      ? extra.score
      : into.score;
  const title =
    extra.title && extra.title.length > into.title.length ? extra.title : into.title || extra.title || "";
  const summary =
    extra.summary && extra.summary.length > into.summary.length
      ? extra.summary
      : into.summary || extra.summary || "";
  return {
    ...into,
    ...extra,
    id: into.id,
    cve: into.cve ?? extra.cve,
    ghsa: into.ghsa ?? extra.ghsa,
    title,
    summary: clip(summary, 2400),
    severity,
    score,
    published: earlier(into.published, extra.published) ?? into.published,
    cwes,
    vendors,
    products,
    sources,
    kev: into.kev || Boolean(extra.kev),
    ransomware: into.ransomware || Boolean(extra.ransomware),
    url: into.url || extra.url || "",
  };
}

function mergeCwes(a: CweRef[], b: CweRef[]): CweRef[] {
  const map = new Map<string, CweRef>();
  for (const c of [...a, ...b]) {
    if (!c.id) continue;
    if (!map.has(c.id)) map.set(c.id, c);
  }
  return Array.from(map.values()).slice(0, 6);
}

export function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const t = item.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

export function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function earlier(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

export function issueKey(cve?: string | null, fallback?: string): string {
  if (cve && /^CVE-\d{4}-\d+/i.test(cve)) return cve.toUpperCase();
  return fallback ?? "";
}

export function compareIssues(a: Issue, b: Issue): number {
  if (a.kev !== b.kev) return a.kev ? -1 : 1;
  if (SEV_RANK[a.severity] !== SEV_RANK[b.severity]) {
    return SEV_RANK[b.severity] - SEV_RANK[a.severity];
  }
  if ((b.score ?? 0) !== (a.score ?? 0)) return (b.score ?? 0) - (a.score ?? 0);
  return (b.published || "").localeCompare(a.published || "");
}
