import { Bell, Copy, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  disablePush,
  enablePush,
  isIosDevice,
  isPushReady,
  isStandaloneDisplay,
  savedPushToken,
} from "@/lib/push/client";

export function PushCard({
  onRegister,
  onTest,
}: {
  onRegister?: (token: string) => Promise<void>;
  onTest?: () => Promise<void>;
}) {
  const ready = isPushReady();
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(true);

  useEffect(() => {
    setToken(savedPushToken());
    setIos(isIosDevice());
    setStandalone(isStandaloneDisplay());
  }, []);

  const enable = async () => {
    setError(null);
    setPending(true);
    try {
      const next = await enablePush();
      setToken(next);
      if (onRegister) await onRegister(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림을 켜지 못했습니다.");
    } finally {
      setPending(false);
    }
  };

  const disable = async () => {
    await disablePush();
    setToken(null);
  };

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div>
        <p className="flex items-center gap-2 text-xs tracking-wide text-subtle uppercase">
          <Bell className="size-3.5" />
          아침 푸시
        </p>
        <p className="mt-1 text-sm text-muted">
          {!ready
            ? ".env에 Firebase 키를 넣으면 켜집니다."
            : token
              ? "이 기기로 매일 아침 브리핑을 보냅니다."
              : "키만 있으면 알림 허용 한 번으로 켜집니다."}
        </p>
      </div>

      {ios && !standalone ? (
        <p className="text-xs leading-relaxed text-muted">
          아이폰은 Safari 공유 → 홈 화면에 추가한 뒤, 그 아이콘에서 알림을 켜 주세요.
        </p>
      ) : null}

      {ready && !token ? (
        <Button onClick={() => void enable()} disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Bell className="size-4" />}
          {pending ? "연결 중…" : "아침 알림 받기"}
        </Button>
      ) : null}

      {token ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => void copy()}>
              <Copy className="size-4" />
              {copied ? "복사됨" : "토큰 복사"}
            </Button>
            <Button variant="ghost" onClick={() => void disable()}>
              끄기
            </Button>
          </div>
          {onTest ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setPending(true);
                setError(null);
                void onTest()
                  .catch((err) => setError(err instanceof Error ? err.message : "테스트 실패"))
                  .finally(() => setPending(false));
              }}
            >
              테스트 보내기
            </Button>
          ) : null}
          <p className="break-all font-mono text-[10px] leading-relaxed text-subtle">{token}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-crit">{error}</p> : null}
    </Card>
  );
}
