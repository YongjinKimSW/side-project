import { expect, test } from "vitest";

import { type Lecture, findOpenedSeats, lectureKey } from "@/features/pool-lectures";

function lecture(name: string, seatsLeft: number): Lecture {
  return {
    poolId: "yangcheon-ycs02",
    district: "양천구",
    poolName: "목동문화체육센터",
    category: "성인남녀수영",
    name,
    days: "월수금",
    startTime: "06:00",
    endTime: "06:50",
    seatsLeft,
    capacity: 80,
    target: "성인",
    teacher: "-",
    applyStatus: "마감",
  };
}

const watch = (l: Lecture) => ({ key: lectureKey(l), lecture: l, lastSeats: l.seatsLeft });

test("잔여석이 0이던 강좌에 자리가 나면 알린다", () => {
  const before = lecture("성인수영A", 0);
  const after = lecture("성인수영A", 3);

  const { opened, next } = findOpenedSeats([watch(before)], [after]);

  expect(opened).toEqual([after]);
  expect(next[0]).toMatchObject({ lastSeats: 3, lecture: after });
});

test("0에서 0이거나 1 이상에서 다른 값으로 바뀐 경우에는 알리지 않는다", () => {
  const stillFull = findOpenedSeats([watch(lecture("가", 0))], [lecture("가", 0)]);
  const changed = findOpenedSeats([watch(lecture("나", 5))], [lecture("나", 2)]);
  const grew = findOpenedSeats([watch(lecture("다", 2))], [lecture("다", 7)]);

  expect(stillFull.opened).toEqual([]);
  expect(changed.opened).toEqual([]);
  expect(grew.opened).toEqual([]);
});

test("알린 뒤 기준이 새 잔여석으로 바뀌어 같은 소식을 다시 알리지 않고, 0이 되었다가 다시 늘면 알린다", () => {
  const first = findOpenedSeats([watch(lecture("가", 0))], [lecture("가", 3)]);
  const again = findOpenedSeats(first.next, [lecture("가", 3)]);
  const full = findOpenedSeats(again.next, [lecture("가", 0)]);
  const reopened = findOpenedSeats(full.next, [lecture("가", 1)]);

  expect(first.opened).toHaveLength(1);
  expect(again.opened).toEqual([]);
  expect(full.opened).toEqual([]);
  expect(reopened.opened).toHaveLength(1);
});

test("목록에 없는 강좌는 알리지 않고 사라진 것으로 알려 주며 기준은 그대로 둔다", () => {
  const gone = watch(lecture("사라짐", 0));

  const { opened, next, missing } = findOpenedSeats([gone], [lecture("다른 강좌", 5)]);

  expect(opened).toEqual([]);
  expect(missing).toEqual([gone.key]);
  expect(next).toEqual([gone]);
});

test("강좌 식별은 수영장, 소분류, 이름, 요일, 시간으로 한다", () => {
  const a = lecture("성인수영A", 1);

  expect(lectureKey(a)).toBe(lectureKey({ ...a, seatsLeft: 9, applyStatus: "접수하기" }));
  expect(lectureKey(a)).not.toBe(lectureKey({ ...a, startTime: "07:00" }));
  expect(lectureKey(a)).not.toBe(lectureKey({ ...a, poolId: "guro-guro01" }));
});
