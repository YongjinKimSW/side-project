import { expect, test } from "vitest";

import { readLectures } from "@/features/pool-lectures";

import { type FmcsRow, fakeSites } from "./fake-sites";

const TODAY = "20261022";

// 공단 사이트 `rest/lecture/list` 응답의 한 줄 (목동 성인수영A, 정원 80, 접수 64명).
function fmcsRow(overrides: FmcsRow = {}): FmcsRow {
  return {
    comcd: "YCS02",
    comnm: "목동문화체육센터",
    class_nm: "성인수영A_자유형이상",
    train_stime: "06:00",
    train_etime: "06:50",
    status: "W",
    target_age_name: "성인",
    train_day_nm: "월수금",
    capa: "80",
    reg_person: "64",
    teacher_name: "박종찬",
    category1: "수영",
    category2: "성인남녀수영",
    ...overrides,
  };
}

async function read(sites: Parameters<typeof fakeSites>[0]) {
  const result = await readLectures(fakeSites(sites), TODAY);
  if (!result.ok) throw new Error("읽기에 실패했다");
  return result;
}

test("양천구 센터의 수영 강좌를 구와 수영장과 함께 읽고 잔여석과 정원을 따로 풀어낸다", async () => {
  const { lectures } = await read({ fmcs: { YCS02: [fmcsRow()] } });

  expect(lectures).toEqual([
    {
      poolId: "yangcheon-ycs02",
      district: "양천구",
      poolName: "목동문화체육센터",
      category: "성인남녀수영",
      name: "성인수영A_자유형이상",
      days: "월수금",
      startTime: "06:00",
      endTime: "06:50",
      seatsLeft: 16,
      capacity: 80,
      target: "성인",
      teacher: "박종찬",
      applyStatus: "준비중",
    },
  ]);
});

test("여러 종목을 운영하는 센터에서는 수영으로 분류된 강좌만, 수영만 하는 수영장에서는 모든 강좌를 읽는다", async () => {
  const { lectures } = await read({
    fmcs: {
      GURO01: [
        fmcsRow({ class_nm: "06 성인수영_A", category1: "수영" }),
        fmcsRow({ class_nm: "헬스 오전", category1: "헬스" }),
      ],
      GURO03: [
        fmcsRow({ class_nm: "강습 A", category1: "강습수영" }),
        fmcsRow({ class_nm: "어르신 B", category1: "어르신수영" }),
      ],
    },
  });

  expect(lectures.map((l) => [l.poolId, l.name])).toEqual([
    ["guro-guro01", "06 성인수영_A"],
    ["guro-guro03", "강습 A"],
    ["guro-guro03", "어르신 B"],
  ]);
});

test("접수 인원이 정원을 넘으면 잔여석은 0이고 접수중 상태는 마감으로 보인다", async () => {
  const { lectures } = await read({
    fmcs: { GURO01: [fmcsRow({ status: "R", capa: "75", reg_person: "83" })] },
  });

  expect(lectures[0]).toMatchObject({ seatsLeft: 0, capacity: 75, applyStatus: "마감" });
});

test("접수중에 자리가 남은 강좌는 접수하기로, 접수가 끝난 강좌는 접수종료로 보이고 잔여석은 0이다", async () => {
  const { lectures } = await read({
    fmcs: {
      GURO01: [fmcsRow({ status: "R", capa: "85", reg_person: "84" })],
      EFMC02: [
        fmcsRow({ status: "E", capa: "7", reg_person: "0", category1: "강습수영" }),
      ],
    },
  });

  expect(lectures.map((l) => [l.poolId, l.applyStatus, l.seatsLeft])).toEqual([
    ["guro-guro01", "접수하기", 1],
    ["eunpyeong-efmc02", "접수종료", 0],
  ]);
});

// 강서구 공단 `data/lecture/lectureList` 응답의 한 줄 (마곡레포츠센터 저녁수영, 웹 정원 25, 웹 접수 24명).
function gangseoRow(overrides: Record<string, unknown> = {}) {
  return {
    comnm: "마곡레포츠센터",
    classNm: "19저녁수영_월수금",
    msportsCdNm: "저녁수영",
    trainDayNm: "월,수,금",
    trainStimeNm: "19:00",
    trainEtimeNm: "19:50",
    webCapa: 25,
    webUser: 24,
    webAcceptFinishYn: "N",
    classObj: "성인남여",
    userNm: "고대용",
    // 오늘(20261022)은 신규접수 기간 안이다.
    grpcd: { recSdate: "20261020", recEdate: "20261031", repSdate: "20261015", repEdate: "20261016" },
    ...overrides,
  };
}

test("강서구 수영장의 강좌를 웹 정원과 웹 접수 인원으로 풀어내 읽는다", async () => {
  const { lectures } = await read({ gangseo: { "03": [gangseoRow()] } });

  expect(lectures).toEqual([
    {
      poolId: "gangseo-03",
      district: "강서구",
      poolName: "마곡레포츠센터",
      category: "저녁수영",
      name: "19저녁수영_월수금",
      days: "월수금",
      startTime: "19:00",
      endTime: "19:50",
      seatsLeft: 1,
      capacity: 25,
      target: "성인남여",
      teacher: "고대용",
      applyStatus: "접수하기",
    },
  ]);
});

test("강서구 강좌의 신청 상태는 사이트 화면과 같은 규칙으로 정해진다", async () => {
  const closedPeriod = { recSdate: "20261025", recEdate: "20261031", repSdate: "20261015", repEdate: "20261016" };
  const reapplyPeriod = { recSdate: "20261025", recEdate: "20261031", repSdate: "20261021", repEdate: "20261023" };
  const { lectures } = await read({
    gangseo: {
      "02": [
        gangseoRow({ classNm: "정원 소진", webUser: 25 }),
        gangseoRow({ classNm: "웹접수마감", webAcceptFinishYn: "Y" }),
        gangseoRow({ classNm: "접수 전", grpcd: closedPeriod }),
        gangseoRow({ classNm: "재수강기간", grpcd: reapplyPeriod }),
        gangseoRow({ classNm: "접수 중" }),
      ],
      "01": [gangseoRow({ classNm: "올림픽센터 접수 전", grpcd: closedPeriod })],
    },
  });

  expect(lectures.map((l) => [l.name, l.applyStatus, l.seatsLeft])).toEqual([
    // 01번 센터는 접수·재수강 기간 밖이면 준비중이 아니라 마감으로 보인다.
    ["올림픽센터 접수 전", "마감", 1],
    ["정원 소진", "마감", 0],
    ["웹접수마감", "마감", 1],
    ["접수 전", "준비중", 1],
    ["재수강기간", "재수강 신청기간", 1],
    ["접수 중", "접수하기", 1],
  ]);
});

// 영등포 제1스포츠센터 수영 품목의 한 강좌 (실제 사이트 예시). 사이트는 대상별 요금 때문에 한 강좌를 두 줄로 보여 준다.
const ydLecture = {
  name: "새벽06A(★26년 7월 추첨강좌★)",
  days: "월,수,금",
  time: "06:00~06:50",
  target: "성인남녀",
  seats: "12/120",
  button: "신청" as const,
};

test("영등포구 수영장의 강좌를 HTML 표에서 읽고, 대상별로 두 줄인 강좌를 하나로 합친다", async () => {
  const { lectures } = await read({
    yeongdeungpo: { "spc:1": { "1": { label: "수영", lectures: [ydLecture] } } },
  });

  expect(lectures).toEqual([
    {
      poolId: "yeongdeungpo-spc",
      district: "영등포구",
      poolName: "영등포 제1스포츠센터",
      category: "수영",
      name: "새벽06A(★26년 7월 추첨강좌★)",
      days: "월수금",
      startTime: "06:00",
      endTime: "06:50",
      seatsLeft: 12,
      capacity: 120,
      target: "성인남녀",
      teacher: "-",
      applyStatus: "접수하기",
    },
  ]);
});

test("영등포구는 품목마다, 페이지마다 읽고 마감된 강좌는 마감으로 보인다", async () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ ...ydLecture, name: `수영${i}` }));
  const full = { ...ydLecture, name: "소수반", seats: "0/3", button: "마감" as const };

  const { lectures } = await read({
    yeongdeungpo: {
      "spc3:25": {
        "178": { label: "수영", lectures: many },
        "180": { label: "소수반", lectures: [full] },
      },
    },
  });

  expect(lectures).toHaveLength(13);
  expect(lectures.map((l) => l.name).slice(0, 12)).toEqual(many.map((l) => l.name));
  expect(lectures[12]).toMatchObject({
    poolId: "yeongdeungpo-spc3",
    category: "소수반",
    seatsLeft: 0,
    capacity: 3,
    applyStatus: "마감",
  });
});

test("일부 수영장을 읽지 못해도 읽은 수영장의 강좌는 돌려주고 읽지 못한 수영장을 알린다", async () => {
  const result = await readLectures(
    fakeSites({
      fmcs: { YCS02: [fmcsRow()], GURO01: [fmcsRow({ class_nm: "구로 강좌" })] },
      failing: ["gurosisul.or.kr"],
    }),
    TODAY
  );

  if (!result.ok) throw new Error("일부만 실패했는데 전체 실패로 처리됐다");
  expect(result.lectures.map((l) => l.poolId)).toEqual(["yangcheon-ycs02"]);
  expect(result.unreadablePools.map((p) => [p.district, p.name])).toEqual([
    ["구로구", "신도림생활체육관"],
    ["구로구", "구로구민체육센터"],
    ["구로구", "50플러스수영장"],
  ]);
});

test("모든 수영장을 읽지 못하면 읽기 실패로 알린다", async () => {
  const result = await readLectures(fakeSites({ failing: ["://"] }), TODAY);

  expect(result).toEqual({ ok: false });
});

test("사이트가 한 번에 다 주지 않아도 모든 페이지를 읽는다", async () => {
  const rows = Array.from({ length: 5 }, (_, i) => fmcsRow({ class_nm: `강좌${i}` }));

  const { lectures } = await read({ fmcs: { YCS02: rows }, perPage: 2 });

  expect(lectures.map((l) => l.name)).toEqual(["강좌0", "강좌1", "강좌2", "강좌3", "강좌4"]);
});
