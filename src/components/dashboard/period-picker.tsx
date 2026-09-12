import { useEffect, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatKoRange,
  isMorningRange,
  rangeForMorning,
  rangeForPreset,
} from "@/lib/security/dates";
import { cn } from "@/lib/utils";

const PRESETS: { id: "morning" | 7 | 14 | 30; label: string }[] = [
  { id: "morning", label: "모닝" },
  { id: 7, label: "7일" },
  { id: 14, label: "14일" },
  { id: 30, label: "30일" },
];

function DateField(props: ComponentProps<"input">) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <div className="h-11 rounded-md bg-surface-2" />;
  return <Input type="date" {...props} />;
}

function rangeForId(id: (typeof PRESETS)[number]["id"]) {
  return id === "morning" ? rangeForMorning() : rangeForPreset(id);
}

export function PeriodPicker({
  from,
  to,
  onChange,
  onPreset,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  onPreset?: (next: { from: string; to: string }) => void;
}) {
  const active = PRESETS.find((p) => {
    const r = rangeForId(p.id);
    return r.from === from && r.to === to;
  });
  const morning = isMorningRange(from, to);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={String(p.id)}
            type="button"
            onClick={() => {
              const next = rangeForId(p.id);
              onChange(next);
              onPreset?.(next);
            }}
            className={cn(
              "h-11 min-w-14 rounded-md px-4 text-sm font-medium transition-[background-color,color] duration-150",
              active?.id === p.id
                ? "bg-accent text-accent-fg"
                : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-subtle">시작</span>
          <DateField
            value={from}
            max={to}
            onChange={(e) => {
              const next = e.target.value;
              if (next) onChange({ from: next, to });
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-subtle">종료</span>
          <DateField
            value={to}
            min={from}
            max={rangeForMorning().to}
            onChange={(e) => {
              const next = e.target.value;
              if (next) onChange({ from, to: next });
            }}
          />
        </label>
      </div>
      <p className="text-xs text-subtle">
        {morning
          ? `${formatKoRange(from, to)} · 어제부터 지금까지`
          : `${formatKoRange(from, to)} · 최대 30일`}
      </p>
    </div>
  );
}

export function ApplyButton({
  onClick,
  pending,
  morning,
}: {
  onClick: () => void;
  pending?: boolean;
  morning?: boolean;
}) {
  return (
    <Button className="w-full" onClick={onClick} disabled={pending}>
      {pending ? "수집 중…" : morning ? "모닝 리포트" : "이 기간 분석"}
    </Button>
  );
}
