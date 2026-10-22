import type { Lecture } from "../lecture";
import type { YeongdeungpoPool } from "../pools";
import type { FetchSite } from "./fetch-site";

const MAX_PAGES = 30;

function strip(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

async function readHtml(fetchSite: FetchSite, pool: YeongdeungpoPool, extra: Record<string, string>) {
  const query = new URLSearchParams({ s_lgu_seq: pool.sportCode, ...extra });
  const response = await fetchSite(
    `https://${pool.subdomain}.y-sisul.or.kr/page/lect/lect.n.list.asp?${query}`
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

/** 종목 페이지의 품목 선택 목록. 품목 코드를 박아 두지 않고 사이트에서 읽는다. */
function readCategories(html: string) {
  const select = html.match(/<select[^>]*name=["']s_lcl_seq["'][^>]*>([\s\S]*?)<\/select>/i);
  if (!select) throw new Error("unexpected page");
  return [...select[1].matchAll(/<option\s+value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi)]
    .filter((option) => option[1] !== "")
    .map((option) => ({ code: option[1], label: strip(option[2]) }));
}

/** 강좌의 첫 줄만 고른다. 대상별 요금이 붙은 둘째 줄에는 강좌명 칸이 없다. */
function readLectureCells(html: string) {
  const table = html.slice(Math.max(0, html.indexOf("tbl_scm1")));
  return table
    .split(/<tr[\s>]/i)
    .slice(1)
    .filter((row) => /class=["']ali_l["']/.test(row))
    .map((row) => [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => strip(cell[1])))
    .filter((cells) => cells.length >= 9);
}

function lastPageNumber(html: string) {
  const pager = html.match(/class=["']bx_paging["'][^>]*>([\s\S]*?)<\/div>/i);
  const numbers = [...(pager?.[1] ?? "").matchAll(/>(\d+)<\/a>/g)].map((m) => Number(m[1]));
  return Math.max(1, ...numbers);
}

function toLecture(pool: YeongdeungpoPool, category: string, cells: string[]): Lecture {
  const [name, days, time, target, , , , seats, button] = cells;
  const [start, end] = time.split("~");
  const [left, capacity] = seats.split("/");
  return {
    poolId: pool.id,
    district: pool.district,
    poolName: pool.name,
    category,
    name,
    days: days.replaceAll(",", ""),
    startTime: start,
    endTime: end,
    seatsLeft: Math.max(0, Number(left)),
    capacity: Number(capacity),
    target,
    teacher: "-",
    applyStatus: button === "신청" ? "접수하기" : button,
  };
}

async function readCategory(
  fetchSite: FetchSite,
  pool: YeongdeungpoPool,
  category: { code: string; label: string }
) {
  const lectures: Lecture[] = [];
  let lastPage = 1;
  for (let page = 1; page <= Math.min(lastPage, MAX_PAGES); page++) {
    const html = await readHtml(fetchSite, pool, { s_lcl_seq: category.code, page: String(page) });
    lastPage = Math.max(lastPage, lastPageNumber(html));
    lectures.push(
      ...readLectureCells(html).map((cells) => toLecture(pool, category.label, cells))
    );
  }
  return lectures;
}

export async function readYeongdeungpoPool(fetchSite: FetchSite, pool: YeongdeungpoPool) {
  const categories = readCategories(await readHtml(fetchSite, pool, {}));
  const perCategory = await Promise.all(
    categories.map((category) => readCategory(fetchSite, pool, category))
  );
  return perCategory.flat();
}
