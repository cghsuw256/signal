import { cweLabel } from "./cwe";
import { localizeIssue } from "./ko";
import {
  clip,
  compareIssues,
  emptyIssue,
  issueKey,
  makeCwe,
  mergeIssues,
  normalizeSeverity,
  scoreToSeverity,
  uniq,
} from "./parse";
import type { Brief, DailyCount, Issue, NamedCount, Severity, SeverityCounts } from "./types";

const NVD_PAGE = 2000;
const NVD_MAX_PAGES = 2;
const GH_PAGE = 100;
const GH_MAX_PAGES = 4;
const FEED_LIMIT = 80;
const UA = "SIGNAL-Brief/1.0 (security briefing)";

type NvdCve = {
  id?: string;
  published?: string;
  descriptions?: { lang?: string; value?: string }[];
  metrics?: Record<string, Array<Record<string, unknown>> | undefined>;
  weaknesses?: Array<{
    description?: { lang?: string; value?: string }[];
  }>;
  affected?: Array<{
    affectedData?: Array<{ vendor?: string; product?: string }>;
  }>;
  references?: { url?: string }[];
};

type GhAdvisory = {
  ghsa_id?: string;
  cve_id?: string | null;
  summary?: string;
  description?: string;
  severity?: string;
  published_at?: string;
  html_url?: string;
  cvss_severities?: {
    cvss_v3?: { score?: number };
    cvss_v4?: { score?: number };
  };
  cwes?: { cwe_id?: string; name?: string }[];
  vulnerabilities?: Array<{
    package?: { ecosystem?: string; name?: string };
  }>;
};

type KevItem = {
  cveID?: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  knownRansomwareCampaignUse?: string;
  cwes?: string[];
  notes?: string;
};

export type Catalog = {
  fetchedAt: string;
  from: string;
  to: string;
  catalogTotal: number;
  truncated: boolean;
  issues: Issue[];
};

export async function buildBrief(from: string, to: string): Promise<Brief> {
  const catalog = await buildCatalog(from, to);
  return assembleBrief(catalog, from, to, Boolean(process.env.XAI_API_KEY));
}

export async function buildCatalog(from: string, to: string): Promise<Catalog> {
  const [nvd, github, kev] = await Promise.all([
    fetchNvd(from, to),
    fetchGithub(from, to),
    fetchKev(from, to),
  ]);

  const map = new Map<string, Issue>();
  const add = (issue: Issue) => {
    const key = issueKey(issue.cve, issue.id);
    if (!key) return;
    const existing = map.get(key);
    map.set(key, existing ? mergeIssues(existing, issue) : issue);
  };

  for (const issue of nvd.issues) add(issue);
  for (const issue of github) add(issue);
  for (const issue of kev) add(issue);

  const all = Array.from(map.values());
  return {
    fetchedAt: new Date().toISOString(),
    from,
    to,
    catalogTotal: Math.max(nvd.total, all.length),
    truncated: nvd.truncated || all.length < nvd.total,
    issues: all,
  };
}

export function assembleBrief(
  catalog: Catalog,
  from: string,
  to: string,
  aiAvailable = false,
): Brief {
  const all = catalog.issues
    .filter((issue) => inPublishedRange(issue.published, from, to))
    .map(localizeIssue);
  const severity = countSeverity(all);
  const types = topCwes(all, 10);
  const vendors = topVendors(all, 8);
  const daily = buildDaily(all, from, to);
  const ranked = [...all].sort(compareIssues);
  const kevAll = ranked.filter((i) => i.kev);
  const kevNew = kevAll.slice(0, 12);
  const issues = ranked.slice(0, FEED_LIMIT);
  const fullRange = catalog.from === from && catalog.to === to;
  const catalogTotal = fullRange ? catalog.catalogTotal : all.length;
  const truncated = fullRange ? catalog.truncated : false;
  const analyzed = all.length;
  const days = Math.max(1, daySpan(from, to));

  return {
    from,
    to,
    fetchedAt: catalog.fetchedAt,
    catalogTotal,
    analyzed,
    truncated: truncated || analyzed < catalogTotal,
    sources: {
      nvd: all.filter((i) => i.sources.includes("nvd")).length,
      github: all.filter((i) => i.sources.includes("github")).length,
      kev: all.filter((i) => i.sources.includes("kev")).length,
    },
    severity,
    daily,
    types,
    vendors,
    kevNew,
    kevCount: kevAll.length,
    issues,
    headline: buildHeadline({
      from,
      to,
      days,
      catalogTotal,
      analyzed,
      truncated: truncated || analyzed < catalogTotal,
      severity,
      topType: types[0],
      topVendor: vendors[0],
      kevCount: kevAll.length,
    }),
    aiAvailable,
  };
}

export function inPublishedRange(published: string, from: string, to: string): boolean {
  const day = published.slice(0, 10);
  return Boolean(day) && day >= from && day <= to;
}

function daySpan(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000) + 1;
}

function buildHeadline(input: {
  from: string;
  to: string;
  days: number;
  catalogTotal: number;
  analyzed: number;
  truncated: boolean;
  severity: SeverityCounts;
  topType?: NamedCount;
  topVendor?: NamedCount;
  kevCount: number;
}): string {
  const range =
    input.from === input.to
      ? input.from.replaceAll("-", ".")
      : `${input.from.replaceAll("-", ".")} – ${input.to.replaceAll("-", ".")}`;
  const parts: string[] = [];
  if (input.days <= 2) {
    parts.push(
      `오늘 아침 기준(${range}) 전 세계에서 CVE ${input.catalogTotal.toLocaleString("ko-KR")}건이 공개됐습니다.`,
    );
  } else {
    parts.push(
      `지난 ${input.days}일(${range}) 전 세계에서 CVE ${input.catalogTotal.toLocaleString("ko-KR")}건이 공개됐습니다.`,
    );
  }
  if (input.truncated && input.analyzed < input.catalogTotal) {
    parts.push(
      `이 중 최근 ${input.analyzed.toLocaleString("ko-KR")}건을 분석했습니다.`,
    );
  }
  const hot = input.severity.critical + input.severity.high;
  parts.push(
    `Critical ${input.severity.critical.toLocaleString("ko-KR")}건, High ${input.severity.high.toLocaleString("ko-KR")}건으로 고위험은 총 ${hot.toLocaleString("ko-KR")}건입니다.`,
  );
  if (input.topType) {
    const typeLabel =
      input.topType.name && input.topType.name !== input.topType.id
        ? `${input.topType.name} (${input.topType.id})`
        : input.topType.id;
    parts.push(
      `가장 많았던 유형은 ${typeLabel} ${input.topType.count.toLocaleString("ko-KR")}건입니다.`,
    );
  }
  if (input.topVendor) {
    parts.push(
      `영향이 가장 잦았던 벤더는 ${input.topVendor.name}(${input.topVendor.count.toLocaleString("ko-KR")}건)입니다.`,
    );
  }
  if (input.kevCount > 0) {
    parts.push(
      `같은 기간 CISA가 실제 악용 중으로 지정한 신규 항목은 ${input.kevCount.toLocaleString("ko-KR")}건입니다.`,
    );
  } else {
    parts.push("같은 기간 CISA KEV에 새로 오른 항목은 없습니다.");
  }
  return parts.join(" ");
}

async function fetchNvd(
  from: string,
  to: string,
): Promise<{ issues: Issue[]; total: number; truncated: boolean }> {
  const issues: Issue[] = [];
  let total = 0;
  let truncated = false;
  try {
    for (let page = 0; page < NVD_MAX_PAGES; page += 1) {
      const startIndex = page * NVD_PAGE;
      const url = new URL("https://services.nvd.nist.gov/rest/json/cves/2.0");
      url.searchParams.set("pubStartDate", `${from}T00:00:00.000`);
      url.searchParams.set("pubEndDate", `${to}T23:59:59.999`);
      url.searchParams.set("resultsPerPage", String(NVD_PAGE));
      url.searchParams.set("startIndex", String(startIndex));
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) break;
      const body = (await res.json()) as {
        totalResults?: number;
        vulnerabilities?: { cve: NvdCve }[];
      };
      total = body.totalResults ?? total;
      const rows = body.vulnerabilities ?? [];
      for (const row of rows) {
        const issue = fromNvd(row.cve);
        if (issue) issues.push(issue);
      }
      if (startIndex + rows.length >= total) {
        truncated = false;
        break;
      }
      if (page === NVD_MAX_PAGES - 1 && startIndex + rows.length < total) {
        truncated = true;
      }
      if (rows.length < NVD_PAGE) break;
    }
  } catch {
    truncated = true;
  }
  return { issues, total: Math.max(total, issues.length), truncated };
}

function fromNvd(cve: NvdCve | undefined): Issue | null {
  if (!cve?.id) return null;
  const desc =
    cve.descriptions?.find((d) => d.lang === "en")?.value ??
    cve.descriptions?.[0]?.value ??
    "";
  const { severity, score } = nvdSeverity(cve.metrics);
  const cwes = (cve.weaknesses ?? [])
    .flatMap((w) => w.description ?? [])
    .filter((d) => d.lang === "en" || !d.lang)
    .map((d) => makeCwe(d.value ?? "", d.value))
    .filter((c) => c.id);
  const vendors: string[] = [];
  const products: string[] = [];
  for (const block of cve.affected ?? []) {
    for (const item of block.affectedData ?? []) {
      if (item.vendor) vendors.push(item.vendor);
      if (item.product) products.push(item.product);
    }
  }
  const title = clip(firstSentence(desc) || cve.id, 160);
  return emptyIssue({
    id: cve.id,
    cve: cve.id,
    title,
    summary: clip(desc, 420),
    severity,
    score,
    published: cve.published ?? "",
    cwes: uniqueCwes(cwes),
    vendors: uniq(vendors.filter((v) => !isNoiseVendor(v))),
    products: uniq(products),
    sources: ["nvd"],
    url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
  });
}

function nvdSeverity(metrics: NvdCve["metrics"]): { severity: Severity; score?: number } {
  if (!metrics) return { severity: "unknown" };
  const keys = [
    "cvssMetricV31",
    "cvssMetricV30",
    "cvssMetricV40",
    "cvssMetricV2",
  ] as const;
  for (const key of keys) {
    const first = metrics[key]?.[0];
    if (!first) continue;
    const data = (first.cvssData ?? first) as {
      baseSeverity?: string;
      baseScore?: number;
    };
    const score = typeof data.baseScore === "number" ? data.baseScore : undefined;
    const raw = data.baseSeverity ?? (first as { baseSeverity?: string }).baseSeverity;
    const severity = raw ? normalizeSeverity(raw) : scoreToSeverity(score);
    return { severity, score };
  }
  return { severity: "unknown" };
}

async function fetchGithub(from: string, to: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  let nextUrl: string | undefined =
    `https://api.github.com/advisories?per_page=${GH_PAGE}&sort=published&order=desc&published=${from}..${to}`;
  try {
    for (let page = 0; page < GH_MAX_PAGES && nextUrl; page += 1) {
      const pageUrl = nextUrl;
      const res: Response = await fetch(pageUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": UA,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(typeof process !== "undefined" && process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const rows = (await res.json()) as GhAdvisory[];
      for (const row of rows) {
        const issue = fromGithub(row);
        if (issue) issues.push(issue);
      }
      const link: string = res.headers.get("link") ?? "";
      const next: RegExpMatchArray | null = link.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = next?.[1];
      if (rows.length < GH_PAGE) break;
    }
  } catch {
    /* keep whatever we got */
  }
  return issues;
}

function fromGithub(row: GhAdvisory): Issue | null {
  const id = row.cve_id || row.ghsa_id;
  if (!id) return null;
  const score = row.cvss_severities?.cvss_v3?.score ?? row.cvss_severities?.cvss_v4?.score;
  const ecosystems = uniq(
    (row.vulnerabilities ?? []).map((v) => v.package?.ecosystem ?? "").filter(Boolean),
  );
  const packages = uniq(
    (row.vulnerabilities ?? []).map((v) => v.package?.name ?? "").filter(Boolean),
  );
  return emptyIssue({
    id,
    cve: row.cve_id ?? undefined,
    ghsa: row.ghsa_id,
    title: clip(row.summary || id, 160),
    summary: clip(row.description || row.summary || "", 420),
    severity: normalizeSeverity(row.severity),
    score,
    published: row.published_at ?? "",
    cwes: uniqueCwes((row.cwes ?? []).map((c) => makeCwe(c.cwe_id ?? "", c.name))),
    vendors: ecosystems,
    products: packages,
    sources: ["github"],
    url: row.html_url || (row.cve_id ? `https://nvd.nist.gov/vuln/detail/${row.cve_id}` : ""),
  });
}

async function fetchKev(from: string, to: string): Promise<Issue[]> {
  try {
    const res = await fetch(
      "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
      {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as { vulnerabilities?: KevItem[] };
    const issues: Issue[] = [];
    for (const row of body.vulnerabilities ?? []) {
      const added = row.dateAdded ?? "";
      if (added < from || added > to) continue;
      if (!row.cveID) continue;
      issues.push(
        emptyIssue({
          id: row.cveID,
          cve: row.cveID,
          title: clip(row.vulnerabilityName || row.cveID, 160),
          summary: clip(row.shortDescription || "", 420),
          severity: "high",
          published: `${added}T00:00:00.000`,
          cwes: uniqueCwes((row.cwes ?? []).map((id) => makeCwe(id))),
          vendors: uniq([row.vendorProject ?? ""]),
          products: uniq([row.product ?? ""]),
          sources: ["kev"],
          kev: true,
          ransomware: (row.knownRansomwareCampaignUse ?? "").toLowerCase() === "known",
          url: `https://nvd.nist.gov/vuln/detail/${row.cveID}`,
        }),
      );
    }
    return issues;
  } catch {
    return [];
  }
}

function uniqueCwes(list: ReturnType<typeof makeCwe>[]): ReturnType<typeof makeCwe>[] {
  const map = new Map<string, ReturnType<typeof makeCwe>>();
  for (const c of list) {
    if (!c.id || c.id === "NVD-CWE-NOINFO") continue;
    if (!map.has(c.id)) map.set(c.id, { ...c, nameKo: cweLabel(c.id, c.name) });
  }
  return Array.from(map.values()).slice(0, 6);
}

function firstSentence(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  const m = t.match(/^.{20,180}?[.!]/);
  return m ? m[0] : t.slice(0, 160);
}

function countSeverity(issues: Issue[]): SeverityCounts {
  const out: SeverityCounts = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
  for (const issue of issues) out[issue.severity] += 1;
  return out;
}

function topCwes(issues: Issue[], n: number): NamedCount[] {
  const counts = new Map<string, { name: string; count: number }>();
  for (const issue of issues) {
    const seen = new Set<string>();
    for (const cwe of issue.cwes) {
      if (!cwe.id || seen.has(cwe.id)) continue;
      seen.add(cwe.id);
      const cur = counts.get(cwe.id) ?? { name: cwe.nameKo || cwe.name, count: 0 };
      cur.count += 1;
      counts.set(cwe.id, cur);
    }
  }
  return Array.from(counts.entries())
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function isNoiseVendor(name: string): boolean {
  const key = name.trim().toLowerCase();
  return (
    !key ||
    key === "n/a" ||
    key === "na" ||
    key === "unknown" ||
    key === "none" ||
    key === "-" ||
    key === "nvd" ||
    key === "unspecified"
  );
}

function topVendors(issues: Issue[], n: number): NamedCount[] {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    const seen = new Set<string>();
    for (const vendor of issue.vendors) {
      const key = vendor.trim();
      if (isNoiseVendor(key) || seen.has(key.toLowerCase())) continue;
      seen.add(key.toLowerCase());
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([id, count]) => ({ id, name: id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function buildDaily(issues: Issue[], from: string, to: string): DailyCount[] {
  const days: string[] = [];
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let t = start; t <= end; t += 86400000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  const counts = new Map(days.map((d) => [d, 0]));
  for (const issue of issues) {
    const d = (issue.published || "").slice(0, 10);
    if (counts.has(d)) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return days.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}
