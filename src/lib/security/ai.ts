import { analysisPayload } from "./analysis";
import type { AiBrief, Brief } from "./types";

export function briefingKey(from: string, to: string): string {
  return `${from}:${to}`;
}

export function openaiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim();
}

export async function generateAiBrief(brief: Brief, apiKey: string): Promise<AiBrief> {
  const payload = {
    method:
      "우선순위는 악용증거(KEV·랜섬웨어) > 비인증/RCE 치명 > 높음 > 그 외. 각 이슈는 진입점·전제조건·영향·탐지·대응 순으로 본다.",
    period: { from: brief.from, to: brief.to },
    catalogTotal: brief.catalogTotal,
    analyzed: brief.analyzed,
    severity: brief.severity,
    topTypes: brief.types.slice(0, 6),
    topVendors: brief.vendors.slice(0, 6),
    kev: brief.kevNew.slice(0, 8).map(analysisPayload),
    notable: brief.issues.slice(0, 8).map(analysisPayload),
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 1600,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "당신은 취약점 분석 실무 책임자다. 과장 없이 한국어만 쓴다. 이모지와 마케팅 문구는 금지. 데이터에 없는 CVE·날짜·제품을 만들지 않는다. 이미 계산된 priority/entry/precond/impact/defend를 존중하되, 문장만 다듬는다.",
        },
        {
          role: "user",
          content: `아래 집계와 사전 분석으로 브리핑을 작성하라. 형식은 정확히 이 네 블록이다.

## 위협 지형
기간 동안 유형·심각도·KEV 규모를 4문장. 왜 지금 봐야 하는지.

## 심층 분석
최대 5개. 각 이슈를 다음 순서로 한 덩어리:
- 무엇/어디/언제
- 진입점
- 전제조건
- 영향
- 대응 (패치 + 패치 전 완화)

## 우선순위 큐
즉시 / 오늘 / 이번 주 세 줄. 이슈 ID를 붙인다.

## 방어 원칙
공통으로 적용할 탐지·패치·노출 축소 3줄.

사실만 사용하라.

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
