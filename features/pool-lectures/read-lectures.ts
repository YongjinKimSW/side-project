import type { Lecture } from "./lecture";

// 목동문화체육센터(YCS02)의 수영 대분류 안에 있는 소분류 4개.
const POOL_CODE = "YCS02";
const CATEGORY_CODES = [
  "1000010000", // 성인남녀수영
  "1000030000", // 유아,어린이,청소년수영
  "1000040000", // 아쿠아로빅
  "1000050000", // 월자유수영
];

const LIST_URL = "https://www.ycs.or.kr/rest/lecture/list";

type FetchSite = (input: string) => Promise<Response>;

type SiteRow = {
  comnm: string;
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
};

export type ReadLecturesResult =
  | { ok: true; lectures: Lecture[] }
  | { ok: false };

function applyStatus(row: SiteRow) {
  const full = Number(row.reg_person) >= Number(row.capa);
  switch (row.status) {
    case "R":
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
  const open = ["R", "OFF", "W"].includes(row.status);
  const left = Number(row.capa) - Number(row.reg_person);
  return open && left > 0 ? left : 0;
}

function toLecture(row: SiteRow): Lecture {
  return {
    poolName: row.comnm,
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

function listUrl(categoryCode: string) {
  const params = new URLSearchParams({
    company_code: POOL_CODE,
    mem_no: "",
    search_type: "%", // 신규접수 목록
    category_cd: categoryCode,
    category_level: "2",
    class_nm: "",
    train_day: "",
    adult_gubn: "",
    lecturer_nm: "",
    page: "1",
    page_size: "100",
  });
  return `${LIST_URL}?${params}`;
}

async function readCategory(fetchSite: FetchSite, categoryCode: string) {
  const response = await fetchSite(listUrl(categoryCode));
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) throw new Error("unexpected response");
  return (rows as SiteRow[]).map(toLecture);
}

/** 사이트를 읽지 못하면 일부만 보여 주지 않고 전체를 실패로 돌려준다. */
export async function readLectures(
  fetchSite: FetchSite = (url) => fetch(url, { cache: "no-store" })
): Promise<ReadLecturesResult> {
  try {
    const perCategory = await Promise.all(
      CATEGORY_CODES.map((code) => readCategory(fetchSite, code))
    );
    return { ok: true, lectures: perCategory.flat() };
  } catch {
    return { ok: false };
  }
}
