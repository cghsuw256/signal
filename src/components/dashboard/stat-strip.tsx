import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Brief } from "@/lib/security/types";

export function StatStrip({ brief }: { brief: Brief }) {
  const items = [
    {
      label: "공개 CVE",
      value: brief.catalogTotal.toLocaleString("ko-KR"),
      hint: brief.truncated
        ? `분석 ${brief.analyzed.toLocaleString("ko-KR")}건`
        : "전량 분석",
    },
    {
      label: "치명 / 높음",
      value: `${brief.severity.critical.toLocaleString("ko-KR")} / ${brief.severity.high.toLocaleString("ko-KR")}`,
      hint: "고위험",
    },
    {
      label: "최다 유형",
      value: brief.types[0]?.name ?? "—",
      hint: brief.types[0]
        ? `${brief.types[0].id} · ${brief.types[0].count.toLocaleString("ko-KR")}건`
        : "데이터 없음",
    },
    {
      label: "CISA 악용 중",
      value: brief.kevCount.toLocaleString("ko-KR"),
      hint: "기간 내 신규 등재",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="flex flex-col gap-2 p-4">
          <p className="text-xs tracking-wide text-subtle uppercase">{item.label}</p>
          <p className="font-display text-2xl leading-tight text-fg tabular-nums">
            {item.value}
          </p>
          <p className="text-xs text-muted">{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}

export function StatStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-3 p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-20" />
        </Card>
      ))}
    </div>
  );
}
