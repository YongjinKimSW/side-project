"use client";

import { BellIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Lecture } from "./lecture";
import { sendPhoneMessage } from "./phone-notify";
import { findOpenedSeats } from "./seat-change";
import { getTelegram } from "./telegram-store";
import {
  getServerWatched,
  getWatched,
  removeWatched,
  setWatched,
  subscribe,
} from "./watch-store";

const CHECK_INTERVAL_MS = 60_000;

type Status = "ok" | "failed" | "missing";

type OpenedAlert = { id: number; lecture: Lecture };

function describe(lecture: Lecture) {
  return `${lecture.district} ${lecture.poolName} ${lecture.name} (${lecture.days} ${lecture.startTime}~${lecture.endTime})`;
}

function notify(lecture: Lecture) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  new Notification("자리가 났습니다", {
    body: `${describe(lecture)} 잔여석 ${lecture.seatsLeft}`,
  });
}

/** 텔레그램이 등록되어 있으면 휴대폰으로도 보낸다. 이 화면이 열려 있을 때만 호출된다. */
function notifyPhone(lecture: Lecture) {
  const config = getTelegram();
  if (!config) return;
  void sendPhoneMessage(`자리가 났습니다
${describe(lecture)}
잔여석 ${lecture.seatsLeft}`, config);
}

/**
 * 알림 받으려고 고른 강좌를 보여 주고, 화면이 열려 있는 동안 1분마다 그 강좌가 속한 수영장을 다시 읽어
 * 잔여석이 0에서 늘면 알린다. 화면을 열 때도 한 번 바로 확인해서 닫아 둔 사이에 난 자리를 놓치지 않는다.
 */
export function LectureWatcher() {
  const watched = useSyncExternalStore(subscribe, getWatched, getServerWatched);
  const [alerts, setAlerts] = useState<OpenedAlert[]>([]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const nextAlertId = useRef(0);

  // 확인은 고른 강좌가 속한 수영장이 바뀔 때만 다시 시작한다.
  const poolKey = [...new Set(watched.map((item) => item.lecture.poolId))].sort().join(",");

  useEffect(() => {
    if (!poolKey) return;
    let cancelled = false;

    async function check() {
      const current = getWatched();
      const failedAll = () =>
        setStatus(Object.fromEntries(current.map((item) => [item.key, "failed" as const])));
      try {
        const query = poolKey.split(",").map((id) => `pool=${encodeURIComponent(id)}`).join("&");
        const response = await fetch(`/api/lectures?${query}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (!body.ok) return failedAll();

        const unreadable = new Set<string>(body.unreadablePools.map((pool: { id: string }) => pool.id));
        const readable = current.filter((item) => !unreadable.has(item.lecture.poolId));
        const { opened, next, missing } = findOpenedSeats(readable, body.lectures);

        const updates = new Map(next.map((item) => [item.key, item]));
        setWatched(getWatched().map((item) => updates.get(item.key) ?? item));
        setStatus(
          Object.fromEntries(
            current.map((item) => [
              item.key,
              unreadable.has(item.lecture.poolId)
                ? "failed"
                : missing.includes(item.key)
                  ? "missing"
                  : "ok",
            ])
          )
        );
        setCheckedAt(new Date().toLocaleTimeString("ko-KR"));
        if (opened.length > 0) {
          setAlerts((previous) => [
            ...previous,
            ...opened.map((lecture) => ({ id: nextAlertId.current++, lecture })),
          ]);
          opened.forEach(notify);
          opened.forEach(notifyPhone);
        }
      } catch {
        if (!cancelled) failedAll();
      }
    }

    void check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [poolKey]);

  if (watched.length === 0 && alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {alerts.map(({ id, lecture }) => (
        <Alert key={id}>
          <BellIcon />
          <AlertTitle>자리가 났습니다</AlertTitle>
          <AlertDescription>
            <span>
              {describe(lecture)} 잔여석 {lecture.seatsLeft}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 w-fit"
              onClick={() => setAlerts((previous) => previous.filter((a) => a.id !== id))}
            >
              닫기
            </Button>
          </AlertDescription>
        </Alert>
      ))}
      {watched.length > 0 && (
        <section aria-labelledby="watched-title" className="flex flex-col gap-3">
          <h2 id="watched-title" className="text-lg font-semibold">
            알림 받을 강좌
          </h2>
          <p className="text-sm text-muted-foreground">
            이 화면이 열려 있는 동안 1분마다 확인합니다.
            {checkedAt && ` 마지막 확인 ${checkedAt}`}
          </p>
          <ul className="flex flex-col gap-2">
            {watched.map((item) => (
              <li key={item.key} className="flex flex-wrap items-center gap-3">
                <span>{describe(item.lecture)}</span>
                <span className="text-sm text-muted-foreground">잔여석 {item.lastSeats}</span>
                {status[item.key] === "failed" && <Badge variant="destructive">확인하지 못함</Badge>}
                {status[item.key] === "missing" && <Badge variant="secondary">목록에서 사라짐</Badge>}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeWatched(item.key)}
                >
                  해제
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
