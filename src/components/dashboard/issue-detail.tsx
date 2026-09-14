import { Badge } from "@/components/ui/badge";
import { formatKoDay } from "@/lib/security/dates";
import { analyzeIssue } from "@/lib/security/analysis";
import { SEVERITY_KO, SOURCE_KO, severityTone } from "@/lib/security/labels";
import type { Issue } from "@/lib/security/types";

export function IssueDetail({ issue }: { issue: Issue }) {
  const original =
    issue.titleEn && issue.titleEn !== issue.title
      ? [issue.titleEn, issue.summaryEn && issue.summaryEn !== issue.summary ? issue.summaryEn : null]
          .filter(Boolean)
          .join("\n\n")
      : "";
  const analysis = analyzeIssue(issue);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <Badge tone={severityTone(issue.severity)}>{SEVERITY_KO[issue.severity]}</Badge>
        {issue.score !== undefined ? <Badge>{`CVSS ${issue.score.toFixed(1)}`}</Badge> : null}
        {issue.kev ? <Badge tone="kev">CISA 악용 중</Badge> : null}
        {issue.ransomware ? <Badge tone="critical">랜섬웨어 캠페인</Badge> : null}
      </div>
      <h3 className="font-display text-xl leading-snug text-fg">{issue.title}</h3>
      <div>
        <p className="text-xs tracking-wide text-subtle uppercase">한글 설명</p>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-fg/90">
          {issue.summary || "설명이 제공되지 않았습니다."}
        </p>
      </div>
      <section className="flex flex-col gap-3 rounded-lg bg-surface-2 p-4">
        <p className="text-xs tracking-wide text-subtle uppercase">분석</p>
        <p className="text-sm text-fg">
          <span className="font-medium">{analysis.priority}</span>
          <span className="text-muted"> · {analysis.priorityWhy}</span>
        </p>
        <Meta label="진입점" value={analysis.entry} />
        <Meta label="전제조건" value={analysis.precond} />
        <Meta label="영향" value={analysis.impact} />
        <Meta label="탐지" value={analysis.detect} />
        <div>
          <p className="text-xs tracking-wide text-subtle uppercase">대응</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm text-fg">
            {analysis.defend.map((step) => (
              <li key={step}>· {step}</li>
            ))}
          </ul>
        </div>
      </section>
      {issue.summaryEn ? (
        <details className="rounded-lg bg-surface-2 px-3 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-xs text-subtle">
            영어 원문
          </summary>
          <p className="pb-3 text-sm leading-relaxed whitespace-pre-wrap text-muted">
            {issue.summaryEn}
            {issue.titleEn && issue.titleEn !== issue.summaryEn ? `\n\n${issue.titleEn}` : ""}
          </p>
        </details>
      ) : original ? (
        <details className="rounded-lg bg-surface-2 px-3 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-xs text-subtle">
            영어 원문
          </summary>
          <p className="pb-3 text-sm leading-relaxed whitespace-pre-wrap text-muted">{original}</p>
        </details>
      ) : null}
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
