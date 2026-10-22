import type { Lecture } from "../lecture";
import type { GangseoPool } from "../pools";
import { type FetchSite, readJson } from "./fetch-site";

const PAGE_SIZE = 500;
const MAX_PAGES = 20;
const SWIMMING_SPORT_CODE = "01";

type SiteRow = {
  msportsCdNm: string;
  classNm: string;
  trainDayNm: string;
  trainStimeNm: string;
  trainEtimeNm: string;
  webCapa: number;
  webUser: number;
  webAcceptFinishYn: string;
  classObj: string | null;
  userNm: string | null;
  grpcd: { recSdate: string; recEdate: string; repSdate: string; repEdate: string };
};

type SitePage = { totalCount: number; resultList: SiteRow[] };

const within = (today: string, from: string, to: string) => today >= from && today <= to;

// 사이트 화면(lecture.list.js)이 신청 열을 정하는 순서를 그대로 따른다.
function applyStatus(pool: GangseoPool, row: SiteRow, today: string) {
  const { recSdate, recEdate, repSdate, repEdate } = row.grpcd;
  const receiving = within(today, recSdate, recEdate);
  const reapplying = within(today, repSdate, repEdate);
  if (row.webCapa - row.webUser <= 0) return "마감";
  if (pool.centerCode === "01" && !receiving && !reapplying) return "마감";
  if (!receiving) return reapplying ? "재수강 신청기간" : "준비중";
  return row.webAcceptFinishYn === "Y" ? "마감" : "접수하기";
}

function toLecture(pool: GangseoPool, row: SiteRow, today: string): Lecture {
  return {
    poolId: pool.id,
    district: pool.district,
    poolName: pool.name,
    category: row.msportsCdNm,
    name: row.classNm,
    days: row.trainDayNm.replaceAll(",", ""),
    startTime: row.trainStimeNm,
    endTime: row.trainEtimeNm,
    seatsLeft: Math.max(0, row.webCapa - row.webUser),
    capacity: row.webCapa,
    target: row.classObj ?? "-",
    teacher: row.userNm ?? "-",
    applyStatus: applyStatus(pool, row, today),
  };
}

async function readPage(fetchSite: FetchSite, pool: GangseoPool, page: number) {
  const query = new URLSearchParams({
    comcd: pool.centerCode,
    sportsCd: SWIMMING_SPORT_CODE,
    msportsCd: "all",
    pageIndex: String(page),
    pageSize: String(PAGE_SIZE),
    startRow: String((page - 1) * PAGE_SIZE),
  });
  const body = await readJson(
    await fetchSite(`https://sport.gssi.or.kr/data/lecture/lectureList/?${query}`)
  );
  const result = body as Partial<SitePage>;
  if (!Array.isArray(result.resultList)) throw new Error("unexpected response");
  return { total: Number(result.totalCount ?? 0), rows: result.resultList };
}

export async function readGangseoPool(fetchSite: FetchSite, pool: GangseoPool, today: string) {
  const rows: SiteRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await readPage(fetchSite, pool, page);
    rows.push(...result.rows);
    if (result.rows.length === 0 || rows.length >= result.total) break;
  }
  return rows.map((row) => toLecture(pool, row, today));
}
