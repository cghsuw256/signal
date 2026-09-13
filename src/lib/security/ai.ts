import type { AiBrief, Brief } from "./types";

export function briefingKey(from: string, to: string): string {
  return `${from}:${to}`;
}

export function openaiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim();
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
      published: i.published.slice(0, 10),
      vendor: i.vendors[0],
      product: i.products[0],
      type: i.cwes[0]?.nameKo,
      ransomware: i.ransomware,
    })),
    notable: brief.issues.slice(0, 10).map((i) => ({
      id: i.cve ?? i.id,
      title: i.title,
      summary: i.summary.slice(0, 220),
      published: i.published.slice(0, 10),
      severity: i.severity,
      type: i.cwes[0]?.nameKo,
      vendor: i.vendors[0],
      product: i.products[0],
      kev: i.kev,
    })),
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1200,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "당신은 한국어 보안 브리핑 편집장이다. 과장 없이 실무자가 바로 조치하도록 쓴다. 이모지와 영어 마케팅 문구는 쓰지 않는다. 반드시 한국어만 사용한다. 없는 CVE·날짜·제품을 만들지 않는다.",
        },
        {
          role: "user",
          content: `아래 집계로 한국어 브리핑을 작성하라. 형식은 정확히 이 세 블록이다.

## 한눈에
기간 동안 어떤 유형이 많았는지, 치명/높음 규모, 실제 악용(KEV)이 있었는지 4~6문장.

## 주요 취약점
주목할 이슈를 최대 6개. 각 항목은 한 덩어리로:
- 무엇: CVE와 취약점 유형
- 어디: 벤더·제품
- 언제: 공개일
- 어떻게: 공격자가 무엇을 할 수 있는지
- 방어: 패치·설정·완화 한 줄

## 지금 할 일
우선순위 3줄. 가장 위험한 것부터. 구체적 행동만.

사실만 쓰고, 데이터에 없는 내용은 적지 마라.

${JSON.stringify(payload)}`,
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
