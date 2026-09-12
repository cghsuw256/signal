export type Severity = "critical" | "high" | "medium" | "low" | "unknown";
export type SourceId = "nvd" | "github" | "kev";

export type CweRef = {
  id: string;
  name: string;
  nameKo: string;
};

export type Issue = {
  id: string;
  cve?: string;
  ghsa?: string;
  title: string;
  summary: string;
  severity: Severity;
  score?: number;
  published: string;
  cwes: CweRef[];
  vendors: string[];
  products: string[];
  sources: SourceId[];
  kev: boolean;
  ransomware: boolean;
  url: string;
};

export type NamedCount = {
  id: string;
  name: string;
  count: number;
};

export type DailyCount = {
  date: string;
  count: number;
};

export type SeverityCounts = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
};

export type Brief = {
  from: string;
  to: string;
  fetchedAt: string;
  catalogTotal: number;
  analyzed: number;
  truncated: boolean;
  sources: { nvd: number; github: number; kev: number };
  severity: SeverityCounts;
  daily: DailyCount[];
  types: NamedCount[];
  vendors: NamedCount[];
  kevNew: Issue[];
  kevCount: number;
  issues: Issue[];
  headline: string;
  aiAvailable: boolean;
};

export type AiBrief = {
  ok: true;
  text: string;
} | {
  ok: false;
  error: string;
};
