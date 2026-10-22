const STORAGE_KEY = "pool-lectures:telegram";

export type TelegramConfig = { token: string; chatId: string };

const listeners = new Set<() => void>();
const NOT_LOADED = Symbol("not loaded");
let cache: TelegramConfig | null | typeof NOT_LOADED = NOT_LOADED;

export const getServerTelegram = () => null;

function load(): TelegramConfig | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as TelegramConfig | null;
    return parsed?.token && parsed.chatId ? parsed : null;
  } catch {
    return null;
  }
}

/** 이 브라우저에 등록된 텔레그램 봇. 등록하지 않았으면 null. */
export function getTelegram(): TelegramConfig | null {
  if (cache === NOT_LOADED) cache = load();
  return cache;
}

export function setTelegram(next: TelegramConfig | null) {
  cache = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 쓸 수 없으면 이 탭 안에서만 유지한다.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeTelegram(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
