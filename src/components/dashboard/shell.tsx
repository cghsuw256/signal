import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { loadBrief, loadSummary } from "@/lib/security/api";
import type { AiBrief, Brief } from "@/lib/security/types";
import {
  formatMorningTitle,
  isMorningRange,
  rangeForMorning,
} from "@/lib/security/dates";
import { BriefCard } from "./brief-card";
import { ChartsPanel } from "./charts-panel";
import { IssueFeed } from "./issue-feed";
import { MorningWatch } from "./morning-watch";
import { ApplyButton, PeriodPicker } from "./period-picker";
import { PushCard } from "./push-card";
import { StatStrip, StatStripSkeleton } from "./stat-strip";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function readSearch(defaults: { from: string; to: string }) {
  if (typeof window === "undefined") return defaults;
  const sp = new URLSearchParams(window.location.search);
  const from = sp.get("from");
  const to = sp.get("to");
  if (from && to) return { from, to };
  return defaults;
}

function writeSearch(next: { from: string; to: string }) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("from", next.from);
  url.searchParams.set("to", next.to);
  window.history.replaceState(null, "", url);
}

export function Dashboard({
  from,
  to,
  onApply,
  loadBrief: loadBriefFn = loadBrief,
  loadSummary: loadSummaryFn = loadSummary,
  onRegisterPush,
  onTestPush,
}: {
  from?: string;
  to?: string;
  onApply?: (next: { from: string; to: string }) => void;
  loadBrief?: (from: string, to: string) => Promise<Brief>;
  loadSummary?: (from: string, to: string) => Promise<AiBrief>;
  onRegisterPush?: (token: string) => Promise<void>;
  onTestPush?: () => Promise<void>;
} = {}) {
  const defaults = useMemo(() => rangeForMorning(), []);
  const initial = from && to ? { from, to } : readSearch(defaults);
  const appliedFrom = from ?? initial.from;
  const appliedTo = to ?? initial.to;
  const [draft, setDraft] = useState({ from: appliedFrom, to: appliedTo });
  const morning = isMorningRange(appliedFrom, appliedTo);

  const briefQuery = useQuery({
    queryKey: ["brief", appliedFrom, appliedTo],
    queryFn: () => loadBriefFn(appliedFrom, appliedTo),
  });

  const aiMutation = useMutation({
    mutationFn: () => loadSummaryFn(appliedFrom, appliedTo),
  });

  useEffect(() => {
    if (!briefQuery.data?.aiAvailable) return;
    aiMutation.mutate();
  }, [appliedFrom, appliedTo, briefQuery.data?.aiAvailable]);

  const apply = (next: { from: string; to: string }) => {
    setDraft(next);
    if (onApply) onApply(next);
    else writeSearch(next);
    aiMutation.reset();
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="stagger-in">
              <p className="flex items-center gap-2 text-xs tracking-[0.18em] text-subtle uppercase">
                <span className="live-dot size-2 rounded-full bg-accent" />
                SIGNAL
                {morning ? <span className="tracking-normal text-muted">모닝 리포트</span> : null}
              </p>
              <h1 className="mt-2 font-display text-4xl leading-none text-fg sm:text-5xl">시그널</h1>
              <p className="mt-3 font-display text-lg text-fg sm:text-xl">
                {morning ? formatMorningTitle(appliedTo) : "전 세계 보안 이슈 브리핑"}
              </p>
              <p className="mt-2 max-w-md text-sm text-muted">
                {morning
                  ? "어제부터 지금까지 공개된 이슈를 모아, 아침에 볼 것만 앞에 둡니다."
                  : "기간을 골라 무엇이 가장 많았는지 한눈에 봅니다."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="flex flex-col gap-4 p-4">
              <div>
                <p className="text-xs tracking-wide text-subtle uppercase">조회 기간</p>
                <p className="mt-1 text-sm text-muted">
                  {morning ? "매일 아침 08:00 발송" : "NVD · GitHub · CISA KEV"}
                </p>
              </div>
              <PeriodPicker
                from={draft.from}
                to={draft.to}
                onChange={setDraft}
                onPreset={apply}
              />
              <ApplyButton
                pending={briefQuery.isFetching}
                morning={isMorningRange(draft.from, draft.to)}
                onClick={() => apply(draft)}
              />
            </Card>
            <PushCard onRegister={onRegisterPush} onTest={onTestPush} />
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            {briefQuery.isLoading ? (
              <>
                <StatStripSkeleton />
                <Card className="flex flex-col gap-3 p-5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </Card>
              </>
            ) : briefQuery.isError ? (
              <Card className="p-5">
                <h2 className="font-display text-xl text-fg">데이터를 가져오지 못했습니다</h2>
                <p className="mt-2 text-sm text-muted">
                  {briefQuery.error instanceof Error
                    ? briefQuery.error.message
                    : "잠시 후 다시 시도해 주세요."}
                </p>
              </Card>
            ) : briefQuery.data ? (
              <>
                <StatStrip brief={briefQuery.data} />
                <BriefCard
                  brief={briefQuery.data}
                  aiText={aiMutation.data?.ok ? aiMutation.data.text : undefined}
                  aiPending={aiMutation.isPending}
                  aiError={
                    aiMutation.data && !aiMutation.data.ok
                      ? aiMutation.data.error
                      : aiMutation.error instanceof Error
                        ? aiMutation.error.message
                        : undefined
                  }
                  onSummarize={() => aiMutation.mutate()}
                />
                {morning ? <MorningWatch brief={briefQuery.data} /> : null}
                <ChartsPanel brief={briefQuery.data} />
                <IssueFeed issues={briefQuery.data.issues} />
              </>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-subtle sm:px-6">
          <p>출처: NIST NVD, GitHub Advisory Database, CISA Known Exploited Vulnerabilities.</p>
          <p>모닝 리포트는 한국 시간 기준이며, 매일 아침 앱과 메일로 브리핑을 보냅니다.</p>
        </div>
      </footer>
    </div>
  );
}
