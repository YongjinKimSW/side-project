import { afterEach, expect, test, vi } from "vitest";

import { GET } from "@/app/api/lectures/route";
import { fakeSites } from "@/features/pool-lectures/fake-sites";

afterEach(() => vi.unstubAllGlobals());

const row = {
  category1: "수영",
  category2: "성인남녀수영",
  class_nm: "성인수영A",
  train_day_nm: "월수금",
  train_stime: "06:00",
  train_etime: "06:50",
  capa: "80",
  reg_person: "80",
  target_age_name: "성인",
  teacher_name: "박종찬",
  status: "R",
};

test("고른 수영장의 강좌를 JSON으로 돌려준다", async () => {
  vi.stubGlobal("fetch", fakeSites({ fmcs: { YCS02: [row], GURO01: [row] } }));

  const response = await GET(new Request("http://localhost/api/lectures?pool=yangcheon-ycs02"));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(body.lectures).toHaveLength(1);
  expect(body.lectures[0]).toMatchObject({ poolId: "yangcheon-ycs02", name: "성인수영A", seatsLeft: 0 });
  expect(body.unreadablePools).toEqual([]);
});

test("수영장을 하나도 고르지 않으면 요청이 잘못되었다고 알린다", async () => {
  const response = await GET(new Request("http://localhost/api/lectures"));

  expect(response.status).toBe(400);
});
