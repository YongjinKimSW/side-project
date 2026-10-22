"use client";

import { useSyncExternalStore } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import type { Lecture } from "./lecture";
import { lectureKey } from "./lecture-key";
import { addWatched, getServerWatched, getWatched, removeWatched, subscribe } from "./watch-store";

/** 브라우저 알림 권한은 처음 강좌를 고르는 순간 한 번 묻는다. */
function askNotificationPermission() {
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function WatchToggle({ lecture }: { lecture: Lecture }) {
  const watched = useSyncExternalStore(subscribe, getWatched, getServerWatched);
  const key = lectureKey(lecture);

  return (
    <Checkbox
      aria-label={`알림: ${lecture.name}`}
      checked={watched.some((item) => item.key === key)}
      onCheckedChange={(checked) => {
        if (checked) {
          addWatched(lecture);
          askNotificationPermission();
        } else {
          removeWatched(key);
        }
      }}
    />
  );
}
