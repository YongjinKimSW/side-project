import type { Lecture } from "./lecture";
import { lectureKey } from "./lecture-key";
import type { WatchedLecture } from "./seat-change";

const STORAGE_KEY = "pool-lectures:watched";

const listeners = new Set<() => void>();
const NOT_LOADED = Symbol("not loaded");
let cache: WatchedLecture[] | typeof NOT_LOADED = NOT_LOADED;

/** 서버 렌더링에서는 저장소가 없으므로 항상 같은 빈 목록을 돌려준다. */
const EMPTY: WatchedLecture[] = [];
export const getServerWatched = () => EMPTY;

function load(): WatchedLecture[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as WatchedLecture[]) : [];
  } catch {
    return [];
  }
}

/** 마지막으로 저장한 목록. 바뀌지 않았다면 같은 배열을 돌려준다. */
export function getWatched(): WatchedLecture[] {
  if (cache === NOT_LOADED) cache = load();
  return cache;
}

export function setWatched(next: WatchedLecture[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장소를 쓸 수 없으면 이 탭 안에서만 유지한다.
  }
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addWatched(lecture: Lecture) {
  const key = lectureKey(lecture);
  if (getWatched().some((item) => item.key === key)) return;
  setWatched([...getWatched(), { key, lecture, lastSeats: lecture.seatsLeft }]);
}

export function removeWatched(key: string) {
  setWatched(getWatched().filter((item) => item.key !== key));
}

/** 테스트에서 화면을 다시 여는 것처럼 저장소에서 다시 읽게 한다. */
export function resetWatchCache() {
  cache = NOT_LOADED;
}
