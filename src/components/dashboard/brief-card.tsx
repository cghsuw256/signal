import { NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isMorningRange } from "@/lib/security/dates";
import type { Brief } from "@/lib/security/types";

export function BriefCard({
  brief,
  aiText,
  aiPending,
  aiError,
  onSummarize,
}: {
  brief: Brief;
  aiText?: string;
  aiPending?: boolean;
  aiError?: string;
  onSummarize: () => void;
}) {
  const morning = isMorningRange(brief.from, brief.to);

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-subtle uppercase">
            {morning ? "모닝 리포트" : "기간 요약"}
          </p>
          <h2 className="mt-1 font-display text-2xl text-fg">
            {morning ? "아침 브리핑" : "브리핑"}
          </h2>
        </div>
        {brief.aiAvailable ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSummarize}
            disabled={aiPending}
            className="min-w-36"
          >
            <NotebookPen className="size-3.5" />
            {aiPending ? "작성 중…" : aiText ? "다시 작성" : "AI 브리핑"}
          </Button>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-fg/90">{brief.headline}</p>
      {aiError ? <p className="text-sm text-crit">{aiError}</p> : null}
      {aiPending && !aiText ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : null}
      {aiText ? (
        <div className="rounded-lg bg-surface-2 p-4">
          <p className="mb-2 text-xs tracking-wide text-subtle uppercase">AI 브리핑</p>
          <BriefingBody text={aiText} />
        </div>
      ) : null}
    </Card>
  );
}

function BriefingBody({ text }: { text: string }) {
  const lines = text.split(/\n/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;
        if (/^##\s+/.test(line)) {
          return (
            <h3 key={i} className="pt-2 font-display text-lg text-fg">
              {line.replace(/^##\s+/, "")}
            </h3>
          );
        }
        if (/^[-*]\s+/.test(line)) {
          return (
            <p key={i} className="pl-3 text-muted">
              · {line.replace(/^[-*]\s+/, "")}
            </p>
          );
        }
        return (
          <p key={i} className="text-fg/90">
            {line}
          </p>
        );
      })}
    </div>
  );
}
