import type { Severity, SourceId } from "./types";

export const SEVERITY_KO: Record<Severity, string> = {
  critical: "치명",
  high: "높음",
  medium: "중간",
  low: "낮음",
  unknown: "미상",
};

export const SOURCE_KO: Record<SourceId, string> = {
  nvd: "NVD",
  github: "GitHub",
  kev: "CISA KEV",
};

export function severityTone(severity: Severity): "critical" | "high" | "medium" | "low" | "unknown" {
  return severity;
}
