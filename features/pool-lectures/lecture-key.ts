import type { Lecture } from "./lecture";

/** 같은 강좌를 다시 읽었을 때 알아보는 값. 잔여석처럼 자주 바뀌는 값은 넣지 않는다. */
export function lectureKey(lecture: Lecture) {
  return [
    lecture.poolId,
    lecture.category,
    lecture.name,
    lecture.days,
    lecture.startTime,
    lecture.endTime,
  ].join("|");
}
