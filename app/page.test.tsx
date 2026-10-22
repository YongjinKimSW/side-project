import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import Home from "@/app/page";
import { type FakeSites, type FmcsRow, fakeSites } from "@/features/pool-lectures/fake-sites";

function siteRow(name: string, days: string, start: string, end: string): FmcsRow {
  return {
    category1: "수영",
    category2: "성인남녀수영",
    class_nm: name,
    train_day_nm: days,
    train_stime: start,
    train_etime: end,
    capa: "80",
    reg_person: "64",
    target_age_name: "성인",
    teacher_name: "박종찬",
    status: "W",
  };
}

// 목동에는 월수금반과 화목토반이, 구로 신도림에는 구로반이 있는 가짜 사이트들.
function stubSites(extra: Partial<FakeSites> = {}) {
  vi.stubGlobal(
    "fetch",
    fakeSites({
      fmcs: {
        YCS02: [
          siteRow("월수금반", "월수금", "06:00", "06:50"),
          siteRow("화목토반", "화목토", "07:00", "07:50"),
        ],
        GURO01: [siteRow("구로반", "월수금", "08:00", "08:50")],
      },
      ...extra,
    })
  );
}

async function renderHome(searchParams: Record<string, string | string[]> = {}) {
  return render(await Home({ searchParams: Promise.resolve(searchParams) }));
}

afterEach(() => vi.unstubAllGlobals());

test("강좌 목록을 구, 수영장, 요일, 시간, 잔여석, 정원과 함께 표로 보여준다", async () => {
  stubSites();

  await renderHome();

  const table = screen.getByRole("table");
  for (const header of ["구", "수영장", "강좌명", "요일", "시간", "잔여석", "정원", "신청 상태"]) {
    expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
  }
  const row = within(table).getByRole("row", { name: /월수금반/ });
  expect(within(row).getByText("양천구")).toBeInTheDocument();
  expect(within(row).getByText("목동문화체육센터")).toBeInTheDocument();
  expect(within(row).getByText("06:00~06:50")).toBeInTheDocument();
  expect(within(row).getByText("16")).toBeInTheDocument();
  expect(within(row).getByText("80")).toBeInTheDocument();
  expect(within(row).getByText("준비중")).toBeInTheDocument();
  expect(within(table).getByRole("row", { name: /구로반/ })).toBeInTheDocument();
});

test("필터에서 수영장을 구별로 묶어 고를 수 있고 14곳이 모두 나온다", async () => {
  stubSites();

  const { container } = await renderHome();

  for (const district of ["양천구", "구로구", "강서구", "영등포구", "은평구"]) {
    expect(screen.getByText(district, { selector: "legend" })).toBeInTheDocument();
  }
  expect(container.querySelectorAll('input[name="pool"]')).toHaveLength(14);
});

test("고른 수영장의 강좌만 보여주고 고른 수영장은 선택된 채로 남는다", async () => {
  stubSites();

  const { container } = await renderHome({ pool: "guro-guro01" });

  expect(screen.getByText("구로반")).toBeInTheDocument();
  expect(screen.queryByText("월수금반")).not.toBeInTheDocument();
  const checked = [...container.querySelectorAll<HTMLInputElement>('input[name="pool"]')]
    .filter((input) => input.checked)
    .map((input) => input.value);
  expect(checked).toEqual(["guro-guro01"]);
});

test("필터에서 대상 묶음 4개를 고를 수 있고, 고른 대상에 맞는 강좌만 보여준다", async () => {
  stubSites({
    fmcs: {
      YCS02: [
        { ...siteRow("어른반", "월수금", "06:00", "06:50"), target_age_name: "성인" },
        { ...siteRow("어린이반", "월수금", "07:00", "07:50"), target_age_name: "초등생(1~6년)" },
        { ...siteRow("모두반", "월수금", "08:00", "08:50"), target_age_name: "전체" },
      ],
    },
  });

  const { container } = await renderHome({ audience: "child" });

  expect(screen.getByText("대상", { selector: "legend" })).toBeInTheDocument();
  expect(container.querySelectorAll('input[name="audience"]')).toHaveLength(4);
  expect(screen.getByText("어린이반")).toBeInTheDocument();
  expect(screen.getByText("모두반")).toBeInTheDocument();
  expect(screen.queryByText("어른반")).not.toBeInTheDocument();
  const checked = [...container.querySelectorAll<HTMLInputElement>('input[name="audience"]')]
    .filter((input) => input.checked)
    .map((input) => input.value);
  expect(checked).toEqual(["child"]);
  // 표의 대상 열은 사이트의 표기를 그대로 보여 준다.
  expect(screen.getByText("초등생(1~6년)")).toBeInTheDocument();
});

test("고른 요일이 하나라도 겹치는 강좌만 보여준다", async () => {
  stubSites();

  await renderHome({ day: "화" });

  expect(screen.getByText("화목토반")).toBeInTheDocument();
  expect(screen.queryByText("월수금반")).not.toBeInTheDocument();
});

test("조건에 맞는 강좌가 없으면 표 대신 없다는 안내를 보여준다", async () => {
  stubSites();

  await renderHome({ day: "일" });

  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText("조건에 맞는 강좌가 없습니다")).toBeInTheDocument();
});

test("일부 수영장을 읽지 못하면 읽은 수영장의 강좌는 보여주고 읽지 못한 수영장을 알린다", async () => {
  stubSites({ failing: ["gurosisul.or.kr"] });

  await renderHome();

  expect(screen.getByText("월수금반")).toBeInTheDocument();
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("일부 수영장을 읽지 못했습니다");
  expect(alert).toHaveTextContent("구로구 신도림생활체육관");
  expect(alert).toHaveTextContent("구로구 50플러스수영장");
});

test("고른 수영장을 읽지 못했으면 강좌가 없다고 하지 않고 읽지 못했다고 알린다", async () => {
  stubSites({ failing: ["gurosisul.or.kr"] });

  await renderHome({ pool: "guro-guro01" });

  expect(screen.getByRole("alert")).toHaveTextContent("구로구 신도림생활체육관");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByText("조건에 맞는 강좌가 없습니다")).not.toBeInTheDocument();
});

test("모든 수영장을 읽지 못하면 조건에 맞는 강좌 없음과 구별되는 오류 안내를 보여준다", async () => {
  vi.stubGlobal("fetch", fakeSites({ failing: ["://"] }));

  await renderHome();

  expect(screen.getByRole("alert")).toHaveTextContent("강좌 정보를 읽지 못했습니다");
  expect(screen.queryByText("조건에 맞는 강좌가 없습니다")).not.toBeInTheDocument();
});
