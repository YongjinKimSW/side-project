import type { Lecture } from "../lecture";
import type { FmcsPool } from "../pools";
import { type FetchSite, readJson } from "./fetch-site";

const PAGE_SIZE = 500;
const MAX_PAGES = 20;

type SiteRow = {
  category1: string;
  category2: string;
  class_nm: string;
  train_day_nm: string;
  train_stime: string;
  train_etime: string;
  capa: string;
  reg_person: string;
  target_age_name: string | null;
  teacher_name: string;
  status: string;
  total_count?: number;
};

function applyStatus(row: SiteRow) {
  const full = Number(row.reg_person) >= Number(row.capa);
  switch (row.status) {
    case "R":
    case "RW":
      return full ? "마감" : "접수하기";
    case "W":
      return "준비중";
    case "E":
      return "접수종료";
    case "OFF":
      return "현장접수";
    default:
      return row.status;
  }
}

// 사이트 화면과 같은 규칙: 접수 중인 상태가 아니거나 정원을 넘으면 잔여석은 0이다.
function seatsLeft(row: SiteRow) {
  const open = ["R", "RW", "OFF", "W"].includes(row.status);
  const left = Number(row.capa) - Number(row.reg_person);
  return open && left > 0 ? left : 0;
}

function toLecture(pool: FmcsPool, row: SiteRow): Lecture {
  return {
    poolId: pool.id,
    district: pool.district,
    poolName: pool.name,
    category: row.category2,
    name: row.class_nm,
    days: row.train_day_nm,
    startTime: row.train_stime,
    endTime: row.train_etime,
    seatsLeft: seatsLeft(row),
    capacity: Number(row.capa),
    target: row.target_age_name ?? "-",
    teacher: row.teacher_name,
    applyStatus: applyStatus(row),
  };
}

async function readPage(fetchSite: FetchSite, pool: FmcsPool, page: number) {
  const query = new URLSearchParams({
    company_code: pool.companyCode,
    mem_no: "",
    search_type: "%", // 신규접수 목록
    category_cd: "",
    category_level: "9", // 센터의 모든 분류
    class_nm: "",
    train_day: "",
    adult_gubn: "",
    lecturer_nm: "",
    page: String(page),
    page_size: String(PAGE_SIZE),
  }).toString();
  const url = `${pool.base}/rest/lecture/list`;
  const response =
    pool.method === "GET"
      ? await fetchSite(`${url}?${query}`)
      : await fetchSite(url, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: query,
        });
  const rows = await readJson(response);
  if (!Array.isArray(rows)) throw new Error("unexpected response");
  return rows as SiteRow[];
}

export async function readFmcsPool(fetchSite: FetchSite, pool: FmcsPool) {
  const rows: SiteRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const pageRows = await readPage(fetchSite, pool, page);
    rows.push(...pageRows);
    const total = Number(pageRows[0]?.total_count ?? 0);
    if (pageRows.length === 0 || rows.length >= total) break;
  }
  return rows
    .filter((row) => !pool.swimmingCategory || row.category1 === pool.swimmingCategory)
    .map((row) => toLecture(pool, row));
}
