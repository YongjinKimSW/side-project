import { expect, test, vi } from "vitest";

import { readLectures } from "@/features/pool-lectures";

// 공단 사이트 `rest/lecture/list` 응답의 한 줄 (성인수영A, 정원 80, 접수 64명).
function siteRow(overrides: Record<string, string> = {}) {
  return {
    comcd: "YCS02",
    comnm: "목동문화체육센터",
    class_cd: "00001",
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

function jsonResponse(rows: unknown[]) {
  return new Response(JSON.stringify(rows));
}

test("소분류 하나라도 읽지 못하면 일부만 보여 주지 않고 읽기 실패로 알린다", async () => {
  const fetchSite = vi.fn(async (input: string | URL | Request) =>
    String(input).includes("1000040000")
      ? new Response("error", { status: 500 })
      : jsonResponse([siteRow()])
  );

  expect(await readLectures(fetchSite)).toEqual({ ok: false });
});

test("수영 소분류 4개의 강좌를 모두 읽고 잔여석과 정원을 따로 풀어낸다", async () => {
  const requested: string[] = [];
  const fetchSite = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    requested.push(url.searchParams.get("category_cd") ?? "");
    return jsonResponse([
      siteRow({ class_nm: `강좌-${url.searchParams.get("category_cd")}` }),
    ]);
  });

  const result = await readLectures(fetchSite);

  expect(requested.sort()).toEqual([
    "1000010000",
    "1000030000",
    "1000040000",
    "1000050000",
  ]);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.lectures).toHaveLength(4);
  expect(result.lectures[0]).toEqual({
    poolName: "목동문화체육센터",
    category: "성인남녀수영",
    name: "강좌-1000010000",
    days: "월수금",
    startTime: "06:00",
    endTime: "06:50",
    seatsLeft: 16,
    capacity: 80,
    target: "성인",
    teacher: "박종찬",
    applyStatus: "준비중",
  });
});
