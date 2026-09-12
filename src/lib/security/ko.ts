import { clip } from "./parse";
import type { Issue } from "./types";

const VULN: [RegExp, string][] = [
  [/stored cross-?site scripting/i, "저장형 크로스사이트 스크립팅(XSS)"],
  [/reflected cross-?site scripting/i, "반사형 크로스사이트 스크립팅(XSS)"],
  [/dom[- ]based cross-?site scripting/i, "DOM 기반 크로스사이트 스크립팅(XSS)"],
  [/cross-?site scripting(?:\s*\(xss\))?/i, "크로스사이트 스크립팅(XSS)"],
  [/cross-?site request forgery(?:\s*\(csrf\))?/i, "크로스사이트 요청 위조(CSRF)"],
  [/server-?side request forgery(?:\s*\(ssrf\))?/i, "서버사이드 요청 위조(SSRF)"],
  [/xml external entit(?:y|ies)(?:\s*\(xxe\))?/i, "XML 외부 개체(XXE)"],
  [/blind sql injection/i, "블라인드 SQL 삽입"],
  [/second-order sql injection/i, "2차 SQL 삽입"],
  [/unauthenticated sql injection/i, "비인증 SQL 삽입"],
  [/generic sql injection/i, "SQL 삽입"],
  [/sql injection/i, "SQL 삽입"],
  [/os command injection/i, "OS 명령 삽입"],
  [/command injection/i, "명령 삽입"],
  [/code injection/i, "코드 삽입"],
  [/php object injection/i, "PHP 객체 삽입"],
  [/template injection/i, "템플릿 삽입"],
  [/arbitrary file (?:upload|uploads)/i, "임의 파일 업로드"],
  [/unrestricted (?:file )?upload/i, "무제한 파일 업로드"],
  [/arbitrary file deletion/i, "임의 파일 삭제"],
  [/arbitrary file (?:read|download)/i, "임의 파일 읽기"],
  [/path traversal/i, "경로 탐색"],
  [/directory traversal/i, "디렉터리 탐색"],
  [/privilege escalation/i, "권한 상승"],
  [/authentication bypass/i, "인증 우회"],
  [/authorization bypass/i, "인가 우회"],
  [/account takeover/i, "계정 탈취"],
  [/missing authorization/i, "권한 부여 누락"],
  [/missing authentication/i, "인증 누락"],
  [/broken access control/i, "접근 제어 미흡"],
  [/improper access control/i, "접근 제어 미흡"],
  [/price manipulation/i, "가격 조작"],
  [/insecure direct object reference/i, "직접 객체 참조(IDOR)"],
  [/open redirect/i, "오픈 리다이렉트"],
  [/server-side request/i, "서버사이드 요청 위조"],
  [/remote code execution/i, "원격 코드 실행"],
  [/arbitrary code execution/i, "임의 코드 실행"],
  [/buffer overflow/i, "버퍼 오버플로"],
  [/use[- ]after[- ]free/i, "해제 후 사용"],
  [/out-of-bounds write/i, "범위 밖 쓰기"],
  [/out-of-bounds read/i, "범위 밖 읽기"],
  [/information disclosure/i, "정보 노출"],
  [/sensitive data exposure/i, "민감 정보 노출"],
  [/hardcoded credentials?/i, "하드코딩된 자격 증명"],
  [/insecure deserialization/i, "안전하지 않은 역직렬화"],
  [/prototype pollution/i, "프로토타입 오염"],
  [/clickjacking/i, "클릭재킹"],
  [/denial of service/i, "서비스 거부"],
];

const PHRASES: [RegExp, string][] = [
  [/\bin all versions up to, and including,\s*/gi, "다음 버전 이하 전체: "],
  [/\bup to, and including,\s*/gi, "다음 이하: "],
  [/\bis vulnerable to\b/gi, "에서 취약점이 있습니다. 유형: "],
  [/\bis affected by (?:a |an )?/gi, "에서 다음 문제가 있습니다: "],
  [/\ballows unauthenticated attackers to\b/gi, "인증되지 않은 공격자가 "],
  [/\ballows authenticated attackers to\b/gi, "인증된 공격자가 "],
  [/\ballows remote attackers to\b/gi, "원격 공격자가 "],
  [/\bunauthenticated attackers\b/gi, "인증되지 않은 공격자"],
  [/\bauthenticated attackers\b/gi, "인증된 공격자"],
  [/\bremote attackers\b/gi, "원격 공격자"],
  [/\bdue to insufficient\b/gi, "다음이 부족하여: "],
  [/\bdue to missing\b/gi, "다음이 없어: "],
  [/\bdue to improper\b/gi, "다음이 부적절하여: "],
  [/\bdue to\b/gi, "원인: "],
  [/\bleading to\b/gi, "결과: "],
  [/\bvia a crafted\b/gi, "조작된 "],
  [/\bvia the\b/gi, "경유: "],
  [/\bplugin for WordPress\b/gi, "워드프레스 플러그인"],
  [/\bWordPress plugin\b/gi, "워드프레스 플러그인"],
  [/\bvulnerability\b/gi, "취약점"],
  [/\barbitrary code\b/gi, "임의 코드"],
  [/\barbitrary file\b/gi, "임의 파일"],
  [/\binject(?:ion)?\b/gi, "삽입"],
  [/\bexecute\b/gi, "실행"],
  [/\bupload\b/gi, "업로드"],
  [/\bbypass\b/gi, "우회"],
];

function hasHangul(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text);
}

function latinHeavy(text: string): boolean {
  const letters = text.replace(/[^A-Za-z\uAC00-\uD7A3]/g, "");
  if (!letters) return false;
  const hangul = (letters.match(/[\uAC00-\uD7A3]/g) ?? []).length;
  return hangul / letters.length < 0.35;
}

function vulnKo(text: string, fallback = ""): string {
  for (const [re, ko] of VULN) {
    if (re.test(text)) return ko;
  }
  return fallback;
}

function iGa(word: string): string {
  const chars = [...word];
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    const cp = chars[i]?.codePointAt(0);
    if (cp && cp >= 0xac00 && cp <= 0xd7a3) {
      return (cp - 0xac00) % 28 === 0 ? `${word}가` : `${word}이`;
    }
  }
  return `${word}가`;
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s+[-–—].*$/, "")
    .replace(/\s*\([^)]{0,80}\)\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractVia(text: string): string | undefined {
  return (
    text.match(/via (?:the )?['‘’"`]([^'’"`]+)['‘’"`]/i)?.[1] ??
    text.match(/via (?:the )?([A-Za-z0-9_{}.-]+) parameter/i)?.[1]
  );
}

function extractVersion(text: string): string | undefined {
  const incl = text.match(/up to, and including,\s*([0-9][\w.-]*)/i)?.[1];
  const before = text.match(/before\s*([0-9][\w.-]*)/i)?.[1];
  const raw = incl ?? before;
  return raw?.replace(/[.,]+$/, "");
}

function wpTitle(text: string, cweKo?: string): string | null {
  const m = text.match(
    /^The\s+(.+?)(?:\s+plugin for WordPress|\s+WordPress plugin)\b([\s\S]*)$/i,
  );
  if (!m) return null;
  const name = cleanName(m[1] ?? "");
  const rest = m[2] ?? "";
  if (!name) return null;
  const vuln = vulnKo(`${text} ${rest}`, cweKo);
  const via = extractVia(text);
  const ver = extractVersion(text);
  const who = /unauthenticated/i.test(text)
    ? "인증 없이"
    : /authenticated/i.test(text)
      ? "로그인 후"
      : "";
  const head = vuln
    ? `워드프레스 플러그인 「${name}」에서 ${iGa(vuln)} 발견됐습니다`
    : `워드프레스 플러그인 「${name}」에서 취약점이 발견됐습니다`;
  const bits = [head];
  if (who) bits.push(who);
  if (via) bits.push(`'${via}' 매개변수`);
  if (ver) bits.push(`${ver} 이하`);
  return `${bits.join(". ")}.`;
}

function githubStyle(text: string, cweKo?: string): string | null {
  const m = text.match(
    /^(Missing Authorization|Missing Authentication|SQL Injection|Cross-Site Scripting|Privilege Escalation|Authentication Bypass|Improper Access Control|Path Traversal|Unrestricted Upload)\s+in\s+(.+)$/i,
  );
  if (!m) return null;
  const product = cleanName(m[2] ?? "");
  const vuln = vulnKo(m[1] ?? "", cweKo);
  if (!product || !vuln) return null;
  return `${product}의 ${vuln} 취약점`;
}

function phraseKo(text: string): string {
  let s = text;
  for (const [re, ko] of [...VULN, ...PHRASES]) {
    s = s.replace(re, ko);
  }
  return s.replace(/\s{2,}/g, " ").trim();
}

export function localizeTitle(text: string, issue: Issue): string {
  const cweKo = issue.cwes[0]?.nameKo;
  return wpTitle(text, cweKo) ?? githubStyle(text, cweKo) ?? phraseKo(text);
}

export function localizeSummary(text: string, issue: Issue): string {
  if (!text.trim()) return "";
  const cweKo = issue.cwes[0]?.nameKo;
  const wp = wpTitle(text, cweKo);
  if (wp) {
    const via = extractVia(text);
    const extra = via ? ` 요청의 '${via}' 값을 통해 공격할 수 있습니다.` : "";
    return `${wp}${extra}`;
  }
  return phraseKo(text);
}

export function localizeIssue(issue: Issue): Issue {
  const titleEn = issue.titleEn ?? issue.title;
  const summaryEn = issue.summaryEn ?? issue.summary;
  if (hasHangul(titleEn) && (!summaryEn || hasHangul(summaryEn))) return issue;

  let title = localizeTitle(titleEn, issue);
  let summary = localizeSummary(summaryEn, issue);

  if (latinHeavy(title)) {
    const subject = issue.products[0] || issue.vendors[0];
    const kind = issue.cwes[0]?.nameKo;
    if (subject && kind) title = `${subject}의 ${kind} 취약점`;
    else if (kind) title = `${kind} 취약점`;
  }
  if (summary && latinHeavy(summary)) {
    const kind = issue.cwes[0]?.nameKo;
    if (kind) {
      summary = `${kind} 취약점입니다. 제품·버전과 공격 경로는 원문을 확인하세요.`;
    }
  }

  return {
    ...issue,
    titleEn,
    summaryEn,
    title: clip(title, 160),
    summary: clip(summary, 420),
  };
}
