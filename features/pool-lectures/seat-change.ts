import type { Lecture } from "./lecture";
import { lectureKey } from "./lecture-key";

/** 사용자가 알림을 받으려고 고른 강좌와, 마지막으로 확인한 잔여석 */
export type WatchedLecture = {
  key: string;
  lecture: Lecture;
  lastSeats: number;
};

/**
 * 고른 강좌를 새로 읽은 목록과 견줘서, 잔여석이 0에서 늘어난 강좌를 찾는다.
 * `next`는 알린 뒤의 기준(마지막 잔여석)이고, 목록에 없는 강좌는 `missing`에 모으되 기준을 건드리지 않는다.
 */
export function findOpenedSeats(watched: WatchedLecture[], current: Lecture[]) {
  const byKey = new Map(current.map((lecture) => [lectureKey(lecture), lecture]));
  const opened: Lecture[] = [];
  const missing: string[] = [];
  const next = watched.map((item) => {
    const found = byKey.get(item.key);
    if (!found) {
      missing.push(item.key);
      return item;
    }
    if (item.lastSeats === 0 && found.seatsLeft > 0) opened.push(found);
    return { ...item, lecture: found, lastSeats: found.seatsLeft };
  });
  return { opened, next, missing };
}
