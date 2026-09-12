import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { formatKoDay } from "@/lib/security/dates";
import { SEVERITY_KO, SOURCE_KO, severityTone } from "@/lib/security/labels";
import type { Issue, Severity } from "@/lib/security/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: "all" | "kev" | Severity; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "kev", label: "악용 중" },
  { id: "critical", label: "치명" },
  { id: "high", label: "높음" },
];

export function IssueFeed({ issues }: { issues: Issue[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Issue | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return issues.filter((issue) => {
      if (filter === "kev" && !issue.kev) return false;
      if (filter !== "all" && filter !== "kev" && issue.severity !== filter) return false;
      if (!query) return true;
      const hay = `${issue.cve ?? ""} ${issue.title} ${issue.vendors.join(" ")} ${issue.cwes.map((c) => c.id).join(" ")}`.toLowerCase();
      return hay.includes(query);
    });
  }, [issues, filter, q]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-fg">이슈 피드</h2>
          <p className="text-sm text-muted">심각도와 악용 여부를 우선해 정렬했습니다</p>
        </div>
        <p className="text-xs tabular-nums text-subtle">{filtered.length.toLocaleString("ko-KR")}건</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-11 rounded-md px-4 text-sm font-medium transition-[background-color,color] duration-150",
                filter === f.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="CVE, 벤더, CWE 검색"
          className="sm:max-w-xs sm:ml-auto"
        />
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <li className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-subtle shadow-[var(--shadow-border)]">
            조건에 맞는 이슈가 없습니다
          </li>
        ) : (
          filtered.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => setSelected(issue)}
                className="flex w-full flex-col gap-2 rounded-xl bg-surface px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted">{issue.cve ?? issue.id}</span>
                  <Badge tone={severityTone(issue.severity)}>{SEVERITY_KO[issue.severity]}</Badge>
                  {issue.kev ? <Badge tone="kev">악용 중</Badge> : null}
                  {issue.ransomware ? <Badge tone="critical">랜섬웨어</Badge> : null}
                </div>
                <p className="text-sm leading-snug text-fg">{issue.title}</p>
                <p className="text-xs text-subtle">
                  {[
                    issue.cwes[0] ? issue.cwes[0].nameKo : null,
                    issue.vendors[0],
                    issue.published ? formatKoDay(issue.published.slice(0, 10)) : null,
                    issue.sources.map((s) => SOURCE_KO[s]).join(" · "),
                  ]
                    .filter(Boolean)
                    .join("  ·  ")}
                </p>
              </button>
            </li>
          ))
        )}
      </ul>

      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.cve ?? selected?.id ?? "이슈"}
      >
        {selected ? <IssueDetail issue={selected} /> : null}
      </Sheet>
    </section>
  );
}

function IssueDetail({ issue }: { issue: Issue }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <Badge tone={severityTone(issue.severity)}>{SEVERITY_KO[issue.severity]}</Badge>
        {issue.score !== undefined ? (
          <Badge>{`CVSS ${issue.score.toFixed(1)}`}</Badge>
        ) : null}
        {issue.kev ? <Badge tone="kev">CISA 악용 중</Badge> : null}
        {issue.ransomware ? <Badge tone="critical">랜섬웨어 캠페인</Badge> : null}
      </div>
      <h3 className="font-display text-xl leading-snug text-fg">{issue.title}</h3>
      <p className="text-sm leading-relaxed text-muted">{issue.summary || "설명이 제공되지 않았습니다."}</p>
      <Meta label="공개일" value={issue.published ? formatKoDay(issue.published.slice(0, 10)) : "—"} />
      <Meta
        label="유형"
        value={issue.cwes.length ? issue.cwes.map((c) => `${c.nameKo} (${c.id})`).join(", ") : "—"}
      />
      <Meta label="벤더" value={issue.vendors.join(", ") || "—"} />
      <Meta label="제품" value={issue.products.join(", ") || "—"} />
      <Meta label="출처" value={issue.sources.map((s) => SOURCE_KO[s]).join(" · ")} />
      {issue.url ? (
        <a
          href={issue.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          원문 보기
        </a>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-subtle uppercase">{label}</p>
      <p className="mt-1 text-sm text-fg">{value}</p>
    </div>
  );
}
