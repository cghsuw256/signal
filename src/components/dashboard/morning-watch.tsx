import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet } from "@/components/ui/sheet";
import { SEVERITY_KO, severityTone } from "@/lib/security/labels";
import type { Brief, Issue } from "@/lib/security/types";
import { IssueDetail } from "./issue-detail";

export function MorningWatch({ brief }: { brief: Brief }) {
  const [selected, setSelected] = useState<Issue | null>(null);
  const kevIds = new Set(brief.kevNew.map((i) => i.id));
  const critical = brief.issues
    .filter((i) => i.severity === "critical" && !kevIds.has(i.id))
    .slice(0, 5);
  const items = [...brief.kevNew, ...critical].slice(0, 8);

  if (items.length === 0) return null;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <p className="text-xs tracking-wide text-subtle uppercase">오늘 아침에 볼 것</p>
        <h2 className="mt-1 font-display text-2xl text-fg">주의 이슈</h2>
        <p className="mt-1 text-sm text-muted">실제 악용 중과 치명 등급을 앞에 두었습니다</p>
      </div>
      <ol className="flex flex-col gap-2">
        {items.map((issue, index) => (
          <li key={issue.id}>
            <button
              type="button"
              onClick={() => setSelected(issue)}
              className="flex w-full items-start gap-3 rounded-lg bg-surface-2 px-3 py-3 text-left transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
            >
              <span className="mt-0.5 w-5 shrink-0 font-mono text-xs tabular-nums text-subtle">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted">{issue.cve ?? issue.id}</span>
                  <Badge tone={severityTone(issue.severity)}>{SEVERITY_KO[issue.severity]}</Badge>
                  {issue.kev ? <Badge tone="kev">악용 중</Badge> : null}
                </span>
                <span className="mt-1 block text-sm leading-snug text-fg">{issue.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <Sheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.cve ?? selected?.id ?? "이슈"}
      >
        {selected ? <IssueDetail issue={selected} /> : null}
      </Sheet>
    </Card>
  );
}

