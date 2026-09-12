import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatKoShort } from "@/lib/security/dates";
import { SEVERITY_KO } from "@/lib/security/labels";
import type { Brief } from "@/lib/security/types";

const SEV_COLORS: Record<string, string> = {
  critical: "var(--color-crit)",
  high: "var(--color-high)",
  medium: "var(--color-med)",
  low: "var(--color-low)",
  unknown: "var(--color-subtle)",
};

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-surface-2 px-3 py-2 text-xs text-fg shadow-[var(--shadow-border)]">
      {label ? <p className="mb-1 text-muted">{label}</p> : null}
      {payload.map((p) => (
        <p key={p.name} className="tabular-nums">
          {p.name}: {Number(p.value).toLocaleString("ko-KR")}
        </p>
      ))}
    </div>
  );
}

export function ChartsPanel({ brief }: { brief: Brief }) {
  const severity = [
    { name: SEVERITY_KO.critical, key: "critical", count: brief.severity.critical },
    { name: SEVERITY_KO.high, key: "high", count: brief.severity.high },
    { name: SEVERITY_KO.medium, key: "medium", count: brief.severity.medium },
    { name: SEVERITY_KO.low, key: "low", count: brief.severity.low },
    { name: SEVERITY_KO.unknown, key: "unknown", count: brief.severity.unknown },
  ].filter((d) => d.count > 0);

  const types = brief.types.map((t) => ({
    id: t.id,
    name: shortenLabel(t.name === t.id ? t.id : t.name),
    full: t.name === t.id ? t.id : `${t.name} (${t.id})`,
    count: t.count,
  }));

  const vendors = brief.vendors.map((v) => ({
    name: v.name.length > 14 ? `${v.name.slice(0, 13)}…` : v.name,
    full: v.name,
    count: v.count,
  }));

  const daily = brief.daily.map((d) => ({
    ...d,
    label: formatKoShort(d.date),
  }));

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="p-4 sm:p-5">
        <h3 className="mb-1 font-display text-lg text-fg">어떤 유형이 가장 많았나</h3>
        <p className="mb-4 text-xs text-muted">CWE 기준 상위 유형</p>
        <div className="h-64">
          {types.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={types} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={108}
                  tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTip />}
                  formatter={(value) => [Number(value).toLocaleString("ko-KR"), "건"]}
                  labelFormatter={(_, items) => (items?.[0]?.payload as { full?: string })?.full ?? ""}
                />
                <Bar dataKey="count" name="건" radius={[0, 4, 4, 0]} fill="var(--color-chart-1)" barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="mb-1 font-display text-lg text-fg">심각도 분포</h3>
        <p className="mb-4 text-xs text-muted">분석 대상 기준</p>
        <div className="h-64">
          {severity.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severity} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" name="건" radius={[4, 4, 0, 0]} barSize={28}>
                  {severity.map((d) => (
                    <Cell key={d.key} fill={SEV_COLORS[d.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="mb-1 font-display text-lg text-fg">일별 공개 추이</h3>
        <p className="mb-4 text-xs text-muted">분석에 포함된 이슈</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--color-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="건"
                stroke="var(--color-chart-2)"
                fill="var(--color-chart-2)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="mb-1 font-display text-lg text-fg">영향이 잦은 벤더</h3>
        <p className="mb-4 text-xs text-muted">패키지·제품 기준</p>
        <div className="h-56">
          {vendors.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendors} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTip />}
                  labelFormatter={(_, items) => (items?.[0]?.payload as { full?: string })?.full ?? ""}
                />
                <Bar dataKey="count" name="건" radius={[0, 4, 4, 0]} fill="var(--color-chart-4)" barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-subtle">
      표시할 데이터가 없습니다
    </div>
  );
}

function shortenLabel(name: string): string {
  const stripped = name.replace(/\s*\([^)]+\)\s*/g, "").trim();
  if (stripped.length <= 12) return stripped;
  return `${stripped.slice(0, 11)}…`;
}
