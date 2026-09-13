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

AI 브리핑은 GitHub Secret `XAI_API_KEY`를 넣으면 매일 배포 때 미리 작성됩니다. 키는 [xAI 콘솔](https://console.x.ai)에서 발급합니다.

## 아침 푸시 (FCM)

`.env`에 Firebase 키만 넣으면 됩니다. 템플릿은 `.env.example`.

1. Firebase 콘솔에서 웹 앱을 만들고 구성 값을 복사합니다.
2. Cloud Messaging → 웹 푸시 인증서에서 VAPID 키를 복사합니다.
3. 프로젝트 설정 → **서비스 계정** → **새 비공개 키 생성**. JSON을 `FIREBASE_SERVICE_ACCOUNT`에 넣으면 매일 아침 토픽 `signal-morning`으로 발송합니다. Cloud Messaging API(기존) 서버 키는 쓰지 않습니다.
4. 아이폰은 홈 화면에 추가한 다음, 앱에서 **아침 알림 받기**를 누릅니다.
5. GitHub Pages를 쓰면 같은 `VITE_FIREBASE_*`와 `FIREBASE_SERVICE_ACCOUNT`를 저장소 Secret으로 넣습니다. 한 대만 받을 때는 앱에서 복사한 토큰을 `FCM_DEVICE_TOKEN`에 넣습니다.

```bash
cp .env.example .env
```

## 스택

TanStack Start · React · Tailwind CSS v4 · Recharts
