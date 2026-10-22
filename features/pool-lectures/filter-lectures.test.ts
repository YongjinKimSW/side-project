import { expect, test } from "vitest";

import { filterLectures, type Lecture } from "@/features/pool-lectures";

function lecture(name: string, days: string, startTime: string, endTime: string): Lecture {
  return {
    poolName: "목동문화체육센터",
    category: "성인남녀수영",
    name,
    days,
    startTime,
    endTime,
    seatsLeft: 0,
    capacity: 80,
    target: "성인",
    teacher: "-",
    applyStatus: "준비중",
  };
}

const mwf0600 = lecture("월수금 06시", "월수금", "06:00", "06:50");
const mwf0700 = lecture("월수금 07시", "월수금", "07:00", "07:50");
const tts0600 = lecture("화목토 06시", "화목토", "06:00", "06:50");
const all = [mwf0600, mwf0700, tts0600];

test("아무 조건도 고르지 않으면 모든 강좌가 보인다", () => {
  expect(filterLectures(all, { days: [] })).toEqual(all);
});

test("요일이 하나라도 겹치는 강좌만 보인다", () => {
  const result = filterLectures(all, { days: ["월"] });

  expect(result).toEqual([mwf0600, mwf0700]);
});

test("시간대와 조금이라도 겹치는 강좌만 보이고, 맞닿기만 하면 제외한다", () => {
  const result = filterLectures(all, { days: [], from: "06:00", to: "07:00" });

  expect(result).toEqual([mwf0600, tts0600]);
});

test("끝 시각만 정하면 그 전에 시작하는 강좌가, 시작 시각만 정하면 그 뒤에 끝나는 강좌가 보인다", () => {
  expect(filterLectures(all, { days: [], to: "06:30" })).toEqual([mwf0600, tts0600]);
  expect(filterLectures(all, { days: [], from: "07:30" })).toEqual([mwf0700]);
});

test("요일과 시간대를 모두 고르면 두 조건을 모두 만족하는 강좌만 보인다", () => {
  const result = filterLectures(all, { days: ["화"], from: "06:00", to: "07:00" });

  expect(result).toEqual([tts0600]);
});
