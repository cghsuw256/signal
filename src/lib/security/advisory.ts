import type { Issue } from "./types";

export type AdvisoryFacts = {
  product?: string;
  kind?: string;
  via?: string;
  version?: string;
  due?: string;
  who?: string;
  role?: string;
  action?: string;
  unauth: boolean;
  auth: boolean;
};

const KIND: [RegExp, string][] = [
  [/stored cross-?site scripting/i, "저장형 크로스사이트 스크립팅(XSS)"],
  [/reflected cross-?site scripting/i, "반사형 크로스사이트 스크립팅(XSS)"],
  [/dom[- ]based cross-?site scripting/i, "DOM 기반 크로스사이트 스크립팅(XSS)"],
  [/cross-?site scripting(?:\s*\(xss\))?/i, "크로스사이트 스크립팅(XSS)"],
  [/sql injection/i, "SQL 삽입"],
  [/os command injection/i, "OS 명령 삽입"],
  [/command injection/i, "명령 삽입"],
  [/arbitrary file upload/i, "임의 파일 업로드"],
  [/path traversal/i, "경로 탐색"],
  [/missing authorization/i, "권한 부여 누락"],
  [/missing authentication/i, "인증 누락"],
  [/authentication bypass/i, "인증 우회"],
  [/privilege escalation/i, "권한 상승"],
  [/remote code execution/i, "원격 코드 실행"],
  [/server-?side request forgery/i, "서버사이드 요청 위조(SSRF)"],
  [/cross-?site request forgery/i, "크로스사이트 요청 위조(CSRF)"],
  [/insecure deserialization/i, "안전하지 않은 역직렬화"],
  [/information disclosure/i, "정보 노출"],
];

const DUE: [RegExp, string][] = [
  [/insufficient input sanitization and output escaping/i, "입력값 살균과 출력 이스케이프 부족"],
  [/insufficient input sanitization/i, "입력값 살균 부족"],
  [/insufficient output escaping/i, "출력 이스케이프 부족"],
  [/missing (?:a )?capability check/i, "권한(capability) 검사 누락"],
  [/missing authorization/i, "권한 검사 누락"],
  [/missing nonce validation/i, "nonce 검증 누락"],
  [/improper neutralization/i, "입력값 무력화 미흡"],
  [/lack of type checking/i, "타입 검사 부족"],
];

const ROLE: [RegExp, string][] = [
  [/subscriber/i, "구독자(Subscriber)"],
  [/contributor/i, "기여자(Contributor)"],
  [/author/i, "글쓴이(Author)"],
  [/editor/i, "편집자(Editor)"],
  [/shop manager/i, "상점 관리자"],
  [/administrator|admin-level/i, "관리자(Administrator)"],
];

const ACTION: [RegExp, string][] = [
  [
    /inject arbitrary web scripts in pages that will execute whenever a user accesses an injected page/i,
    "페이지에 임의 스크립트를 넣을 수 있고, 다른 사용자가 그 페이지를 열면 실행됩니다",
  ],
  [/inject arbitrary web scripts/i, "임의 스크립트를 삽입할 수 있습니다"],
  [/execute arbitrary code/i, "임의 코드를 실행할 수 있습니다"],
  [/upload arbitrary files/i, "임의 파일을 업로드할 수 있습니다"],
  [/extract sensitive(?: data| information)?/i, "민감 정보를 빼낼 수 있습니다"],
  [/bypass authentication/i, "인증을 우회할 수 있습니다"],
  [/delete arbitrary files/i, "임의 파일을 삭제할 수 있습니다"],
  [/make a web server perform unintended requests/i, "서버가 의도하지 않은 요청을 보내게 할 수 있습니다"],
];

function pick<T>(pairs: [RegExp, T][], text: string): T | undefined {
  for (const [re, value] of pairs) {
    if (re.test(text)) return value;
  }
  return undefined;
}

function cleanProduct(raw: string): string {
  return raw
    .replace(/\s+[-–—].*$/, "")
    .replace(/\s*\([^)]{0,80}\)\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function extractFacts(en: string): AdvisoryFacts {
  const text = en.replace(/\s+/g, " ").trim();
  const product =
    text.match(/^The\s+(.+?)\s+(?:plugin|theme) for WordPress/i)?.[1] ??
    text.match(/^(.+?)\s+plugin for WordPress/i)?.[1];
  const via =
    text.match(/via (?:the )?['‘’"`]([^'’"`]+)['‘’"`]/i)?.[1] ??
    text.match(/via (?:the )?([A-Za-z0-9_{}.-]+) parameter/i)?.[1];
  const version =
    text.match(/up to(?:, and including,)?\s*([0-9][\w.-]*)/i)?.[1]?.replace(/[.,]+$/, "") ??
    text.match(/before\s*([0-9][\w.-]*)/i)?.[1];
  const dueEn = text.match(/due to ([^.]+)/i)?.[1];
  const role = pick(ROLE, text);
  const unauth = /unauthenticated/i.test(text);
  const auth = /authenticated/i.test(text) && !unauth;
  let who: string | undefined;
  if (unauth) who = "인증되지 않은 공격자";
  else if (auth && role) who = `${role} 이상 권한의 로그인 사용자`;
  else if (auth) who = "로그인된 공격자";
  const actionEn = text.match(/this makes it possible for .+? to ([^.]+)/i)?.[1];
  return {
    product: product ? cleanProduct(product) : undefined,
    kind: pick(KIND, text),
    via,
    version,
    due: dueEn ? (pick(DUE, dueEn) ?? dueEn.trim()) : pick(DUE, text),
    who,
    role,
    action: actionEn ? (pick(ACTION, actionEn) ?? pick(ACTION, text)) : pick(ACTION, text),
    unauth,
    auth,
  };
}

const PHRASE: [RegExp, string][] = [
  ...KIND,
  ...DUE,
  [/\bin all versions up to, and including,\s*/gi, "다음 버전 이하 전체: "],
  [/\bup to, and including,\s*/gi, "다음 이하: "],
  [/\bplugin for WordPress\b/gi, "워드프레스 플러그인"],
  [/\btheme for WordPress\b/gi, "워드프레스 테마"],
  [/\bis vulnerable to\b/gi, "에서 다음 취약점이 있습니다:"],
  [/\bthis makes it possible for\b/gi, "그래서"],
  [/\bunauthenticated attackers\b/gi, "인증되지 않은 공격자"],
  [/\bauthenticated attackers\b/gi, "인증된 공격자"],
  [/\bwith contributor-level access and above\b/gi, "기여자(Contributor) 이상 권한으로"],
  [/\bwith subscriber-level access and above\b/gi, "구독자(Subscriber) 이상 권한으로"],
  [/\bwith author-level access and above\b/gi, "글쓴이(Author) 이상 권한으로"],
  [/\bwith administrator-level access and above\b/gi, "관리자 이상 권한으로"],
  [/\binject arbitrary web scripts in pages that will execute whenever a user accesses an injected page\b/gi,
    "페이지에 임의 스크립트를 넣을 수 있으며 다른 사용자가 그 페이지를 열면 실행됩니다"],
  [/\barbitrary web scripts\b/gi, "임의 스크립트"],
  [/\bparameter\b/gi, "매개변수"],
  [/\bvulnerability\b/gi, "취약점"],
  [/\bdue to\b/gi, "원인:"],
];

function phraseKo(text: string): string {
  let s = text.replace(/\s+/g, " ").trim();
  for (const [re, ko] of PHRASE) s = s.replace(re, ko);
  return s.replace(/\s{2,}/g, " ").trim();
}

export function translateAdvisory(en: string, issue?: Issue): string {
  const text = en.replace(/\s+/g, " ").trim();
  if (!text) return "";
  const f = extractFacts(text);
  const kind = f.kind ?? issue?.cwes[0]?.nameKo;
  if (f.product && kind) {
    const bits: string[] = [];
    const ver = f.version ? `${f.version} 이하 모든 버전에서 ` : "";
    bits.push(
      `워드프레스 ${/theme for WordPress/i.test(text) ? "테마" : "플러그인"} 「${f.product}」은 ${ver}${kind}에 취약합니다.`,
    );
    if (f.via) bits.push(`공격 경로는 '${f.via}' 매개변수입니다.`);
    if (f.due) bits.push(`원인은 ${f.due}입니다.`);
    if (f.who && f.action) bits.push(`${f.who}가 ${f.action}.`);
    else if (f.who) bits.push(`${f.who}가 이 취약점을 이용할 수 있습니다.`);
    else if (f.action) bits.push(`공격자는 ${f.action}.`);
    return bits.join(" ");
  }
  return phraseKo(text);
}
