import { createServerFn } from "@tanstack/react-start";
import { canSendPush, sendPush, subscribeToken } from "./send";

export const registerPush = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => {
    if (!input.token || input.token.length < 20) throw new Error("토큰이 올바르지 않습니다.");
    return input;
  })
  .handler(async ({ data }) => {
    if (!canSendPush()) return { ok: true as const, subscribed: false };
    await subscribeToken(data.token);
    return { ok: true as const, subscribed: true };
  });

export const sendTestPush = createServerFn({ method: "POST" }).handler(async () => {
  if (!canSendPush()) return { ok: false as const, error: "FIREBASE_SERVICE_ACCOUNT가 없습니다." };
  await sendPush({
    title: "시그널 테스트",
    body: "아침 푸시가 이 기기로 도착합니다.",
    url: "/",
  });
  return { ok: true as const };
});
