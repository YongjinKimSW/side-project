import { expect, test } from "vitest";

import { filterLectures, type Lecture } from "@/features/pool-lectures";

function lecture(
  name: string,
  days: string,
  startTime: string,
  endTime: string,
  poolId = "yangcheon-ycs02"
): Lecture {
  return {
    poolId,
    district: "양천구",
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

test("고른 요일이 모두 수업 요일에 들어 있는 강좌만 보인다", () => {
  const monToSat = lecture("월~토", "월화수목금토", "09:00", "09:50");
  const lectures = [mwf0600, mwf0700, tts0600, monToSat];

  expect(filterLectures(lectures, { days: ["월"] })).toEqual([mwf0600, mwf0700, monToSat]);
  expect(filterLectures(lectures, { days: ["월", "수"] })).toEqual([mwf0600, mwf0700, monToSat]);
  // 월수금 강좌에는 화요일 수업이 없으므로 월과 화를 모두 고르면 보이지 않는다.
  expect(filterLectures(lectures, { days: ["월", "화"] })).toEqual([monToSat]);
  expect(filterLectures(lectures, { days: ["월", "토"] })).toEqual([monToSat]);
  expect(filterLectures(lectures, { days: ["일"] })).toEqual([]);
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

test("고른 수영장의 강좌만 보이고, 고르지 않으면 모든 수영장이 보인다", () => {
  const guro = lecture("구로 강좌", "월수금", "06:00", "06:50", "guro-guro01");
  const mixed = [mwf0600, guro];

  expect(filterLectures(mixed, { days: [], poolIds: ["guro-guro01"] })).toEqual([guro]);
  expect(filterLectures(mixed, { days: [], poolIds: [] })).toEqual(mixed);
  expect(filterLectures(mixed, { days: [] })).toEqual(mixed);
});

// 스펙(target-filter)의 "대상 표기와 묶음의 대응" 표. "all"은 대상 제한이 없다는 뜻이다.
const audienceTable: [target: string, groups: string[] | "all"][] = [
  ["성인", ["adult"]],
  ["성인남녀", ["adult"]],
  ["성인남여", ["adult"]],
  ["성인여성", ["adult"]],
  ["성인 남성", ["adult"]],
  ["성인남녀(효도)", ["adult"]],
  ["청소년", ["teen"]],
  ["중.고생", ["teen"]],
  ["중,고생", ["teen"]],
  ["청소년/성인", ["teen", "adult"]],
  ["청소년~성인", ["teen", "adult"]],
  ["청소년~성인(남)", ["teen", "adult"]],
  ["성인,청소년", ["teen", "adult"]],
  ["청소년/성인남녀", ["teen", "adult"]],
  ["청소년이상", ["teen", "adult", "senior"]],
  ["어린이/청소년/성인남녀", ["child", "teen", "adult"]],
  ["성인남녀/청소년/어린이", ["child", "teen", "adult"]],
  ["초등학생", ["child"]],
  ["초등생", ["child"]],
  ["초등생(1~6년)", ["child"]],
  ["초등4학년이상", ["child"]],
  ["어린이", ["child"]],
  ["어린이(8~13세)", ["child"]],
  ["유아(5~7세)", ["child"]],
  ["영유아(6~7세)", ["child"]],
  ["영.유아(일반)", ["child"]],
  ["7세~초등학생", ["child"]],
  ["7,8,9세", ["child"]],
  ["65세이상", ["senior"]],
  ["만65세이상", ["senior"]],
  ["만60세이상", ["senior"]],
  ["65세이상성인남녀", ["adult", "senior"]],
  ["-", "all"],
  ["전체", "all"],
  ["구분없음", "all"],
  ["해당없음", "all"],
  // 표에 없는 새 표기는 숨기지 않고 대상 제한 없음으로 본다.
  ["처음 보는 표기", "all"],
];

test.each(audienceTable)(
  "대상 표기 %s 는 스펙의 묶음에서만 보인다",
  (target, groups) => {
    const swim = { ...lecture("강좌", "월수금", "06:00", "06:50"), target };

    for (const group of ["child", "teen", "adult", "senior"]) {
      const visible = filterLectures([swim], { days: [], audiences: [group] }).length === 1;
      expect(visible, `${target} / ${group}`).toBe(groups === "all" || groups.includes(group));
    }
  }
);

test("대상을 고르지 않으면 모든 대상이 보이고, 여러 묶음을 고르면 하나라도 해당하는 강좌가 보인다", () => {
  const adult = { ...lecture("성인반", "월수금", "06:00", "06:50"), target: "성인" };
  const child = { ...lecture("어린이반", "월수금", "06:00", "06:50"), target: "초등학생" };
  const senior = { ...lecture("어르신반", "월수금", "06:00", "06:50"), target: "65세이상" };
  const all = [adult, child, senior];

  expect(filterLectures(all, { days: [] })).toEqual(all);
  expect(filterLectures(all, { days: [], audiences: [] })).toEqual(all);
  expect(filterLectures(all, { days: [], audiences: ["child", "senior"] })).toEqual([child, senior]);
});

test("대상은 수영장, 요일과 함께 고르면 모든 조건을 만족하는 강좌만 보인다", () => {
  const match = { ...lecture("맞음", "월수금", "06:00", "06:50", "guro-guro01"), target: "성인" };
  const wrongAudience = { ...match, name: "대상 다름", target: "초등학생" };
  const wrongPool = { ...match, name: "수영장 다름", poolId: "yangcheon-ycs02" };
  const wrongDay = { ...match, name: "요일 다름", days: "화목토" };

  const result = filterLectures([match, wrongAudience, wrongPool, wrongDay], {
    days: ["월"],
    poolIds: ["guro-guro01"],
    audiences: ["adult"],
  });

  expect(result).toEqual([match]);
});

test("수영장과 요일을 함께 고르면 두 조건을 모두 만족하는 강좌만 보인다", () => {
  const guroTts = lecture("구로 화목토", "화목토", "06:00", "06:50", "guro-guro01");
  const guroMwf = lecture("구로 월수금", "월수금", "06:00", "06:50", "guro-guro01");

  const result = filterLectures([mwf0600, guroTts, guroMwf], {
    days: ["월"],
    poolIds: ["guro-guro01"],
  });

  expect(result).toEqual([guroMwf]);
});
