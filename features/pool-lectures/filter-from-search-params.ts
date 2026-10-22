import type { LectureFilter } from "./filter-lectures";
import { POOLS } from "./pools";

type SearchParams = Record<string, string | string[] | undefined>;

export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function time(value: string | string[] | undefined) {
  return typeof value === "string" && TIME_PATTERN.test(value) ? value : undefined;
}

function many(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

/** 화면의 조건 폼이 보낸 쿼리스트링(`day`, `from`, `to`, `pool`)을 거르기 조건으로 바꾼다. */
export function filterFromSearchParams(searchParams: SearchParams): LectureFilter {
  const poolIds = POOLS.map((pool) => pool.id);
  return {
    days: many(searchParams.day).filter((d) => WEEKDAYS.includes(d)),
    from: time(searchParams.from),
    to: time(searchParams.to),
    poolIds: many(searchParams.pool).filter((id) => poolIds.includes(id)),
  };
}
