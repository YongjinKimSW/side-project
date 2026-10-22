import type { LectureFilter } from "./filter-lectures";

type SearchParams = Record<string, string | string[] | undefined>;

export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function time(value: string | string[] | undefined) {
  return typeof value === "string" && TIME_PATTERN.test(value) ? value : undefined;
}

/** 화면의 조건 폼이 보낸 쿼리스트링(`day`, `from`, `to`)을 거르기 조건으로 바꾼다. */
export function filterFromSearchParams(searchParams: SearchParams): LectureFilter {
  const day = searchParams.day;
  const picked = Array.isArray(day) ? day : day ? [day] : [];
  return {
    days: picked.filter((d) => WEEKDAYS.includes(d)),
    from: time(searchParams.from),
    to: time(searchParams.to),
  };
}
