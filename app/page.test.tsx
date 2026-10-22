import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import Home from "@/app/page";

function siteRow(name: string, days: string, start: string, end: string) {
  return {
    comnm: "목동문화체육센터",
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

// 소분류마다 같은 두 강좌를 돌려주는 가짜 사이트. 첫 소분류만 이름이 겹치지 않게 한다.
function stubSite(rows = [
  siteRow("월수금반", "월수금", "06:00", "06:50"),
  siteRow("화목토반", "화목토", "07:00", "07:50"),
]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request) => {
      const isFirst = String(input).includes("category_cd=1000010000");
      return new Response(JSON.stringify(isFirst ? rows : []));
    })
  );
}

async function renderHome(searchParams: Record<string, string | string[]> = {}) {
  render(await Home({ searchParams: Promise.resolve(searchParams) }));
}

afterEach(() => vi.unstubAllGlobals());

test("강좌 목록을 수영장, 요일, 시간, 잔여석, 정원과 함께 표로 보여준다", async () => {
  stubSite();

  await renderHome();

  const table = screen.getByRole("table");
  for (const header of ["수영장", "강좌명", "요일", "시간", "잔여석", "정원", "신청 상태"]) {
    expect(
      within(table).getByRole("columnheader", { name: header })
    ).toBeInTheDocument();
  }
  const row = within(table).getByRole("row", { name: /월수금반/ });
  expect(within(row).getByText("목동문화체육센터")).toBeInTheDocument();
  expect(within(row).getByText("06:00~06:50")).toBeInTheDocument();
  expect(within(row).getByText("16")).toBeInTheDocument();
  expect(within(row).getByText("80")).toBeInTheDocument();
  expect(within(row).getByText("준비중")).toBeInTheDocument();
});

test("고른 요일이 하나라도 겹치는 강좌만 보여준다", async () => {
  stubSite();

  await renderHome({ day: "월" });

  expect(screen.getByText("월수금반")).toBeInTheDocument();
  expect(screen.queryByText("화목토반")).not.toBeInTheDocument();
});

test("조건에 맞는 강좌가 없으면 표 대신 없다는 안내를 보여준다", async () => {
  stubSite();

  await renderHome({ day: "일" });

  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText("조건에 맞는 강좌가 없습니다")).toBeInTheDocument();
});

test("사이트를 읽지 못하면 조건에 맞는 강좌 없음과 구별되는 오류 안내를 보여준다", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("error", { status: 500 })));

  await renderHome();

  expect(screen.getByRole("alert")).toHaveTextContent("강좌 정보를 읽지 못했습니다");
  expect(screen.queryByText("조건에 맞는 강좌가 없습니다")).not.toBeInTheDocument();
});
