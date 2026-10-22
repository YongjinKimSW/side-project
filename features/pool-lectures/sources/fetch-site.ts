/** 공단 사이트를 읽는 경계. 테스트는 이것만 바꿔 끼운다. */
export type FetchSite = (url: string, init?: RequestInit) => Promise<Response>;

// 한 사이트가 응답 없이 멈춰도 다른 수영장의 강좌가 보이도록 요청마다 제한 시간을 둔다.
const REQUEST_TIMEOUT_MS = 10_000;

export const fetchSiteFresh: FetchSite = (url, init) =>
  fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

export async function readJson(response: Response) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}
