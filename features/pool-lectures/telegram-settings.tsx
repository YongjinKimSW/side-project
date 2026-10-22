"use client";

import { useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { sendPhoneMessage } from "./phone-notify";
import { getServerTelegram, getTelegram, setTelegram, subscribeTelegram } from "./telegram-store";

/** 휴대폰으로 알림을 받을 텔레그램 봇을 이 브라우저에 등록한다. */
export function TelegramSettings() {
  const config = useSyncExternalStore(subscribeTelegram, getTelegram, getServerTelegram);
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function register() {
    const next = { token: token.trim(), chatId: chatId.trim() };
    if (!next.token || !next.chatId) return;
    const ok = await sendPhoneMessage("텔레그램이 연결되었습니다. 자리가 나면 여기로 알려 드립니다.", next);
    if (ok) {
      setTelegram(next);
      setToken("");
      setChatId("");
      setResult(null);
    } else {
      setResult("테스트 메시지를 보내지 못했습니다. 토큰과 채팅 ID를 확인해 주세요.");
    }
  }

  return (
    <section aria-labelledby="telegram-title" className="flex flex-col gap-3">
      <h2 id="telegram-title" className="text-lg font-semibold">
        휴대폰 알림 (텔레그램)
      </h2>
      {config ? (
        <div className="flex flex-wrap items-center gap-3">
          <Badge>연결됨</Badge>
          <span className="text-sm text-muted-foreground">채팅 ID {config.chatId}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void sendPhoneMessage("테스트 알림입니다.", config)}>
            테스트 전송
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setTelegram(null)}>
            연결 해제
          </Button>
        </div>
      ) : (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void register();
          }}
        >
          <Input
            aria-label="봇 토큰"
            type="password"
            placeholder="봇 토큰"
            className="w-72"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <Input
            aria-label="채팅 ID"
            placeholder="채팅 ID"
            className="w-40"
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
          />
          <Button type="submit">연결</Button>
        </form>
      )}
      <p className="text-sm text-muted-foreground">
        BotFather로 만든 봇의 토큰과, 그 봇에게 먼저 메시지를 보낸 뒤 확인한 채팅 ID를 넣으면 이 브라우저에 저장됩니다.
        탭이 열려 있는 동안 자리가 나면 휴대폰으로도 알립니다.
      </p>
      {result && <p className="text-sm text-destructive">{result}</p>}
    </section>
  );
}
