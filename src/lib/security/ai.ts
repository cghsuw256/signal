import type { AiBrief, Brief } from "./types";

export function briefingKey(from: string, to: string): string {
  return `${from}:${to}`;
}

export async function generateAiBrief(brief: Brief, apiKey: string): Promise<AiBrief> {
  const payload = {
    period: { from: brief.from, to: brief.to },
    catalogTotal: brief.catalogTotal,
    analyzed: brief.analyzed,
    severity: brief.severity,
    topTypes: brief.types.slice(0, 6),
    topVendors: brief.vendors.slice(0, 6),
    kev: brief.kevNew.slice(0, 8).map((i) => ({
      id: i.cve ?? i.id,
      title: i.title,
      ransomware: i.ransomware,
    })),
    notable: brief.issues.slice(0, 12).map((i) => ({
      id: i.cve ?? i.id,
      title: i.title,
      severity: i.severity,
      type: i.cwes[0]?.nameKo ?? i.cwes[0]?.id,
    })),
  };

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 700,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "당신은 한국어 사이버 위협 브리핑 편집장이다. 과장 없이, 실무자가 바로 읽도록 쓴다. 이모지와 영어 마케팅 문구를 쓰지 않는다. 반드시 한국어로만 답한다.",
        },
        {
          role: "user",
          content: `다음 기간의 전 세계 보안 이슈 집계다. 3개 짧은 문단으로 브리핑하라.
1) 기간 동안 무엇이 가장 많았는지(유형·심각도)
2) 실제로 주의할 항목(KEV·Critical)
3) 방어 우선순위 한 줄 권고
사실만 사용하고, 없는 CVE를 만들지 마라.\n\n${JSON.stringify(payload)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `브리핑 생성에 실패했습니다 (${res.status}).` };
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "브리핑 내용이 비어 있습니다." };
  return { ok: true, text };
}
