# SIGNAL · 시그널

전 세계 보안 이슈를 기간별로 모아, 무엇이 가장 많았는지 한눈에 보는 모닝 브리핑 데스크입니다.

어제부터 지금까지 공개된 CVE를 기본으로 보여 주고, 악용 중(CISA KEV)과 치명 등급을 앞에 둡니다. 7일·14일·30일 구간으로 바꿔 유형·벤더 추이 그래프와 이슈 피드를 볼 수 있습니다.

## 출처

- [NIST NVD](https://nvd.nist.gov/)
- [GitHub Advisory Database](https://github.com/advisories)
- [CISA Known Exploited Vulnerabilities](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)

집계는 공개일 기준입니다.

아이폰·브라우저에서 바로 보려면 [시그널 공개 페이지](https://cghsuw256.github.io/signal/)를 엽니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:8080`을 엽니다.

AI 브리핑 버튼은 `XAI_API_KEY`가 있을 때만 활성화됩니다.

## 스택

TanStack Start · React · Tailwind CSS v4 · Recharts
