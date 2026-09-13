import type { Issue } from "./types";

export type Priority = "즉시" | "오늘" | "이번 주" | "계획";

export type IssueAnalysis = {
  priority: Priority;
  priorityWhy: string;
  entry: string;
  precond: string;
  impact: string;
  detect: string;
  defend: string[];
};

type Playbook = {
  entry: string;
  impact: string;
  detect: string;
  defend: string[];
};

const PLAYBOOK: Record<string, Playbook> = {
  "CWE-79": {
    entry: "웹 입력값·저장 필드가 출력에 그대로 반영됩니다.",
    impact: "다른 사용자 브라우저에서 스크립트가 실행되어 세션 탈취·위변조가 가능합니다.",
    detect: "입출력에 스크립트 패턴, CSP 위반 로그, 관리자 페이지 이상 요청을 봅니다.",
    defend: ["해당 플러그인/앱을 패치하거나 비활성화", "출력 이스케이프와 CSP 적용", "관리자 세션 재발급"],
  },
  "CWE-89": {
    entry: "검색·정렬 등 쿼리 파라미터가 SQL에 결합됩니다.",
    impact: "DB 조회·수정·유출, 심한 경우 서버 명령 실행으로 이어질 수 있습니다.",
    detect: "DB 오류, 비정상 UNION/SLEEP 쿼리, 대량 덤프 트래픽을 봅니다.",
    defend: ["패치", "파라미터 바인딩 강제", "해당 REST/AJAX 엔드포인트 WAF 차단", "DB 계정 권한 축소"],
  },
  "CWE-22": {
    entry: "파일 경로 파라미터에 ../ 등 상대 경로가 허용됩니다.",
    impact: "웹루트 밖 파일 읽기·삭제·덮어쓰기가 가능합니다.",
    detect: "경로에 .. 또는 민감 파일명(wp-config, /etc/passwd) 요청을 봅니다.",
    defend: ["패치", "경로를 허용 디렉터리로 고정", "해당 업로드/다운로드 URL 차단"],
  },
  "CWE-434": {
    entry: "파일 업로드 확장자·MIME 검증이 없습니다.",
    impact: "웹셸 업로드 후 원격 코드 실행으로 이어질 수 있습니다.",
    detect: "이상한 확장자 업로드, 업로드 디렉터리에서 PHP/JSP 실행 로그를 봅니다.",
    defend: ["패치", "업로드 실행 권한 제거", "확장자 화이트리스트", "업로드 폴더 웹 실행 금지"],
  },
  "CWE-94": {
    entry: "사용자 입력이 코드·템플릿으로 평가됩니다.",
    impact: "원격 코드 실행입니다. 서버 장악 가능성이 큽니다.",
    detect: "비정상 eval/템플릿 렌더, 신규 프로세스·역접속을 봅니다.",
    defend: ["즉시 패치 또는 서비스 중단", "해당 기능 네트워크 차단", "침해 여부 점검"],
  },
  "CWE-78": {
    entry: "입력값이 OS 명령에 붙습니다.",
    impact: "서버에서 임의 명령을 실행할 수 있습니다.",
    detect: "웹 로그의 세미콜론·파이프, 이상 자식 프로세스를 봅니다.",
    defend: ["패치", "명령 실행 API 비활성", "웹 서버 계정 권한 최소화"],
  },
  "CWE-502": {
    entry: "신뢰할 수 없는 직렬화 데이터가 역직렬화됩니다.",
    impact: "객체 주입으로 원격 코드 실행이 흔합니다.",
    detect: "직렬화 매직 바이트, 가젯 클래스 로드, 급격한 CPU 사용을 봅니다.",
    defend: ["패치", "역직렬화 엔드포인트 차단", "허용 클래스 화이트리스트"],
  },
  "CWE-287": {
    entry: "인증 검증이 빠지거나 우회됩니다.",
    impact: "계정 탈취·관리자 권한 획득이 가능합니다.",
    detect: "로그인 없이 관리 API 성공, 대량 세션 발급을 봅니다.",
    defend: ["패치", "해당 엔드포인트 인증 강제", "기존 세션 무효화", "관리자 MFA"],
  },
  "CWE-306": {
    entry: "인증 자체가 없습니다.",
    impact: "누구나 민감 기능을 호출할 수 있습니다.",
    detect: "비로그인 상태에서 쓰기/관리 API 200 응답을 봅니다.",
    defend: ["패치 또는 기능 비활성", "웹 방화벽에서 해당 경로 차단"],
  },
  "CWE-862": {
    entry: "로그인 후에도 권한 검사가 없습니다.",
    impact: "다른 사용자·관리자 기능에 접근할 수 있습니다(IDOR 포함).",
    detect: "수평이동 요청, 타인 ID 파라미터 변조 성공을 봅니다.",
    defend: ["패치", "객체별 권한 검사", "관리 기능은 역할 분리"],
  },
  "CWE-269": {
    entry: "권한 부여·역할 변경 로직이 잘못되어 있습니다.",
    impact: "일반 사용자가 관리자 권한으로 올라갈 수 있습니다.",
    detect: "역할 변경 API, 신규 관리자 계정 생성을 봅니다.",
    defend: ["패치", "권한 변경 감사 로그", "의심 관리자 계정 회수"],
  },
  "CWE-639": {
    entry: "리소스 ID만 바꾸면 남의 데이터에 접근됩니다.",
    impact: "개인정보·업무 데이터 유출 또는 변조입니다.",
    detect: "순번 ID 대량 조회, 비정상 다운로드를 봅니다.",
    defend: ["패치", "서버에서 소유권 검사", "직접 객체 참조를 간접 키로 변경"],
  },
  "CWE-352": {
    entry: "상태 변경 요청에 CSRF 토큰이 없습니다.",
    impact: "피해자가 사이트에 로그인된 채 원치 않는 행동이 실행됩니다.",
    detect: "외부 Origin의 POST, 토큰 없는 상태 변경을 봅니다.",
    defend: ["패치", "SameSite 쿠키", "중요 동작 재인증"],
  },
  "CWE-918": {
    entry: "서버가 사용자 지정 URL로 요청을 보냅니다.",
    impact: "내부망 스캔·클라우드 메타데이터 탈취가 가능합니다.",
    detect: "앱 서버의 내부 IP·169.254.169.254 outbound를 봅니다.",
    defend: ["패치", "URL 화이트리스트", "메타데이터 서비스 차단"],
  },
};

PLAYBOOK["CWE-77"] = PLAYBOOK["CWE-78"];
PLAYBOOK["CWE-95"] = PLAYBOOK["CWE-94"];
PLAYBOOK["CWE-98"] = PLAYBOOK["CWE-22"];
PLAYBOOK["CWE-23"] = PLAYBOOK["CWE-22"];
PLAYBOOK["CWE-36"] = PLAYBOOK["CWE-22"];
PLAYBOOK["CWE-285"] = PLAYBOOK["CWE-862"];
PLAYBOOK["CWE-284"] = PLAYBOOK["CWE-862"];
PLAYBOOK["CWE-863"] = PLAYBOOK["CWE-862"];
PLAYBOOK["CWE-288"] = PLAYBOOK["CWE-287"];
PLAYBOOK["CWE-200"] = {
  entry: "오류 메시지·API 응답에 민감 정보가 포함됩니다.",
  impact: "계정·경로·설정이 노출되어 다음 공격의 사전 정찰이 됩니다.",
  detect: "스택 트레이스, 토큰, 내부 경로가 응답에 있는지 봅니다.",
  defend: ["패치", "프로덕션 오류 메시지 일반화", "로그 접근 통제"],
};
PLAYBOOK["CWE-798"] = {
  entry: "코드·이미지에 비밀번호가 고정되어 있습니다.",
  impact: "공개되는 순간 모든 설치본이 같은 자격 증명으로 뚫립니다.",
  detect: "기본 계정 로그인 시도, 저장소 유출 알림을 봅니다.",
  defend: ["패치", "하드코딩 비밀 즉시 교체", "비밀 관리 시스템으로 이전"],
};
PLAYBOOK["CWE-416"] = {
  entry: "해제된 메모리를 다시 사용합니다.",
  impact: "크래시 또는 코드 실행으로 이어질 수 있습니다.",
  detect: "반복 크래시, 익스플로잇 PoC 트래픽을 봅니다.",
  defend: ["벤더 패치", "해당 서비스 노출면 축소"],
};
PLAYBOOK["CWE-787"] = {
  entry: "버퍼 범위를 넘어 씁니다.",
  impact: "원격 코드 실행 또는 서비스 중단이 가능합니다.",
  detect: "크래시 덤프, 비정상 패킷 길이를 봅니다.",
  defend: ["즉시 패치", "해당 포트 인터넷 차단"],
};
PLAYBOOK["CWE-119"] = PLAYBOOK["CWE-787"];
PLAYBOOK["CWE-121"] = PLAYBOOK["CWE-787"];
PLAYBOOK["CWE-122"] = PLAYBOOK["CWE-787"];
PLAYBOOK["CWE-125"] = {
  entry: "버퍼 밖을 읽습니다.",
  impact: "메모리 정보 유출 또는 크래시입니다.",
  detect: "반복 읽기 요청, 크래시를 봅니다.",
  defend: ["패치", "해당 서비스 노출 최소화"],
};

const FALLBACK: Playbook = {
  entry: "입력·인증·권한 경계에서 검증이 빠져 있습니다.",
  impact: "데이터 유출, 권한 상승 또는 서비스 장애로 이어질 수 있습니다.",
  detect: "해당 제품의 비정상 트래픽과 인증 실패·성공 비율을 봅니다.",
  defend: ["벤더 패치 적용", "해당 기능 비활성 또는 네트워크 제한", "관리 인터페이스 노출 축소"],
};

function hay(issue: Issue): string {
  return `${issue.title} ${issue.titleEn ?? ""} ${issue.summary} ${issue.summaryEn ?? ""}`.toLowerCase();
}

function precondOf(issue: Issue): string {
  const h = hay(issue);
  if (
    issue.kev ||
    /unauthenticated|인증 없이|비인증|authentication bypass|인증 우회/.test(h)
  ) {
    return "인증 없이 원격에서 시도할 수 있습니다.";
  }
  if (/authenticated|로그인 후|logged-in/.test(h)) {
    return "로그인된 사용자 권한이 필요합니다. 권한 수준은 패치를 확인하세요.";
  }
  if (issue.cwes.some((c) => c.id === "CWE-787" || c.id === "CWE-416" || c.id === "CWE-119")) {
    return "해당 서비스를 네트워크에서 호출할 수 있으면 원격 공격이 가능합니다.";
  }
  return "원격 또는 인증된 경로일 수 있습니다. 원문에서 전제를 확인하세요.";
}

function priorityOf(issue: Issue): { priority: Priority; why: string } {
  if (issue.kev && issue.ransomware) {
    return { priority: "즉시", why: "CISA KEV에 올랐고 랜섬웨어 캠페인에 쓰입니다." };
  }
  if (issue.kev) {
    return { priority: "즉시", why: "실제 악용이 확인된 CISA KEV 항목입니다." };
  }
  if (issue.ransomware) {
    return { priority: "즉시", why: "랜섬웨어 공격에 활용된 기록이 있습니다." };
  }
  const h = hay(issue);
  const rce = /원격 코드|remote code|임의 코드|역직렬화|명령 삽입/.test(h);
  if (issue.severity === "critical" && (/인증 없이|unauthenticated/.test(h) || rce)) {
    return { priority: "오늘", why: "치명 등급에 비인증 또는 코드 실행 성격입니다." };
  }
  if (issue.severity === "critical") {
    return { priority: "오늘", why: "CVSS 치명 등급입니다." };
  }
  if (issue.severity === "high") {
    return { priority: "이번 주", why: "높음 등급입니다. 노출된 제품부터 패치하세요." };
  }
  return { priority: "계획", why: "중간 이하입니다. 정기 패치에 포함하세요." };
}

export function analyzeIssue(issue: Issue): IssueAnalysis {
  const book =
    issue.cwes.map((c) => PLAYBOOK[c.id]).find(Boolean) ??
    FALLBACK;
  const { priority, why } = priorityOf(issue);
  const defend = [...book.defend];
  if (issue.kev && !defend[0]?.includes("즉시")) {
    defend.unshift("실제 악용 중이므로 패치 전까지 해당 기능을 닫거나 격리");
  }
  return {
    priority,
    priorityWhy: why,
    entry: book.entry,
    precond: precondOf(issue),
    impact: book.impact,
    detect: book.detect,
    defend,
  };
}

export function analysisPayload(issue: Issue) {
  const a = analyzeIssue(issue);
  return {
    id: issue.cve ?? issue.id,
    title: issue.title,
    published: issue.published.slice(0, 10),
    severity: issue.severity,
    score: issue.score,
    vendor: issue.vendors[0],
    product: issue.products[0],
    type: issue.cwes[0]?.nameKo,
    kev: issue.kev,
    ransomware: issue.ransomware,
    summary: issue.summary.slice(0, 180),
    ...a,
  };
}
