import { audienceGroupsOf } from "./audience";
import type { Lecture } from "./lecture";

export type LectureFilter = {
  /** 고른 대상 묶음. 없거나 비어 있으면 모든 대상을 본다. */
  audiences?: string[];
  /** 고른 요일 한 글자씩 (예: ["월", "수"]). 모두 수업 요일에 들어 있는 강좌만 남기고, 비어 있으면 요일로 거르지 않는다. */
  days: string[];
  /** "HH:MM". 없으면 그쪽은 제한하지 않는다. */
  from?: string;
  to?: string;
  /** 고른 수영장. 없거나 비어 있으면 모든 수영장을 본다. */
  poolIds?: string[];
};

/**
 * 요일은 고른 요일이 모두 수업 요일에 들어 있을 때, 시간대는 조금이라도 겹칠 때 남긴다.
 * 시간대의 끝과 강좌의 시작이 같은 시각처럼 맞닿기만 하는 경우는 겹치지 않는다.
 */
export function filterLectures(lectures: Lecture[], filter: LectureFilter) {
  return lectures.filter((lecture) => {
    const poolMatches =
      !filter.poolIds?.length || filter.poolIds.includes(lecture.poolId);
    const groups = audienceGroupsOf(lecture.target);
    const audienceMatches =
      !filter.audiences?.length ||
      groups === "all" ||
      groups.some((group) => filter.audiences?.includes(group));
    const dayMatches =
      filter.days.length === 0 ||
      filter.days.every((day) => lecture.days.includes(day));
    const startsBeforeEnd = !filter.to || lecture.startTime < filter.to;
    const endsAfterStart = !filter.from || lecture.endTime > filter.from;
    return (
      poolMatches && audienceMatches && dayMatches && startsBeforeEnd && endsAfterStart
    );
  });
}
