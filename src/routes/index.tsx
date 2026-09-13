import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Dashboard } from "@/components/dashboard/shell";
import { rangeForMorning } from "@/lib/security/dates";
import { fetchBrief, summarizeBrief } from "@/lib/security/server";
import { registerPush, sendTestPush } from "@/lib/push/server";

type Search = { from?: string; to?: string };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    from: typeof s.from === "string" ? s.from : undefined,
    to: typeof s.to === "string" ? s.to : undefined,
  }),
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const defaults = useMemo(() => rangeForMorning(), []);
  return (
    <Dashboard
      from={search.from ?? defaults.from}
      to={search.to ?? defaults.to}
      onApply={(next) => {
        void navigate({ search: next });
      }}
      loadBrief={(from, to) => fetchBrief({ data: { from, to } })}
      loadSummary={(from, to) => summarizeBrief({ data: { from, to } })}
      onRegisterPush={async (token) => {
        await registerPush({ data: { token } });
      }}
      onTestPush={async () => {
        const result = await sendTestPush();
        if (!result.ok) throw new Error(result.error);
      }}
    />
  );
}
