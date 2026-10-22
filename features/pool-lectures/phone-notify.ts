import type { TelegramConfig } from "./telegram-store";

/** 서버를 거쳐 텔레그램으로 보낸다. 보냈으면 true. */
export async function sendPhoneMessage(text: string, config: TelegramConfig | null) {
  try {
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, ...config }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
