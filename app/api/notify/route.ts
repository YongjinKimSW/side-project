/**
 * 텔레그램 봇으로 휴대폰에 알린다. 화면에서 등록한 토큰과 채팅 ID를 받고,
 * 없으면 서버 환경 변수(`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)를 쓴다.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { text?: unknown; token?: unknown; chatId?: unknown }
    | null;
  if (typeof body?.text !== "string" || body.text === "") {
    return Response.json({ ok: false, message: "text is required" }, { status: 400 });
  }
  const token = typeof body.token === "string" && body.token ? body.token : process.env.TELEGRAM_BOT_TOKEN;
  const chatId = typeof body.chatId === "string" && body.chatId ? body.chatId : process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return Response.json({ ok: false, message: "telegram is not configured" }, { status: 503 });
  }
  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: body.text }),
  }).catch(() => null);
  const ok = response?.ok ?? false;
  return Response.json({ ok }, { status: ok ? 200 : 502 });
}
