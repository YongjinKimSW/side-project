import type { Lecture } from "./lecture";
import { POOLS, type Pool, type PoolRef, poolRef } from "./pools";
import { type FetchSite, fetchSiteFresh } from "./sources/fetch-site";
import { readFmcsPool } from "./sources/fmcs";
import { readGangseoPool } from "./sources/gangseo";
import { readYeongdeungpoPool } from "./sources/yeongdeungpo";

export type ReadLecturesResult =
  | { ok: true; lectures: Lecture[]; unreadablePools: PoolRef[] }
  | { ok: false };

/** 오늘 날짜를 서울 기준 YYYYMMDD로 돌려준다. */
export function seoulToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" })
    .format(new Date())
    .replaceAll("-", "");
}

function readPool(pool: Pool, fetchSite: FetchSite, today: string): Promise<Lecture[]> {
  switch (pool.kind) {
    case "fmcs":
      return readFmcsPool(fetchSite, pool);
    case "gangseo":
      return readGangseoPool(fetchSite, pool, today);
    case "yeongdeungpo":
      return readYeongdeungpoPool(fetchSite, pool);
  }
}

/**
 * 모든 수영장을 따로 읽는다. 읽지 못한 수영장은 `unreadablePools`에 모으고 나머지는 그대로 돌려주며,
 * 모든 수영장을 읽지 못했을 때만 실패로 본다.
 */
export async function readLectures(
  fetchSite: FetchSite = fetchSiteFresh,
  today: string = seoulToday()
): Promise<ReadLecturesResult> {
  const settled = await Promise.allSettled(
    POOLS.map((pool) => readPool(pool, fetchSite, today))
  );
  const lectures: Lecture[] = [];
  const unreadablePools: PoolRef[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      lectures.push(...result.value);
    } else {
      console.error(`[pool-lectures] ${POOLS[index].id} 읽기 실패:`, result.reason);
      unreadablePools.push(poolRef(POOLS[index]));
    }
  });
  if (unreadablePools.length === POOLS.length) return { ok: false };
  return { ok: true, lectures, unreadablePools };
}
