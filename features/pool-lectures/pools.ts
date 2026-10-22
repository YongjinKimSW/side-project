/** 화면과 필터가 수영장을 가리키는 데 쓰는 최소 정보 */
export type PoolRef = {
  id: string;
  district: string;
  name: string;
};

export type FmcsPool = PoolRef & {
  kind: "fmcs";
  /** 강좌 목록 호출의 기준 주소 (경로 접두어 포함) */
  base: string;
  method: "GET" | "POST";
  companyCode: string;
  /** 여러 종목을 운영하는 센터에서 수영으로 분류된 강좌만 남기는 기준. 없으면 모두 남긴다. */
  swimmingCategory?: string;
};

export type GangseoPool = PoolRef & {
  kind: "gangseo";
  centerCode: string;
};

export type YeongdeungpoPool = PoolRef & {
  kind: "yeongdeungpo";
  /** 센터 서브도메인 (예: "spc") */
  subdomain: string;
  /** 수영 종목 코드 */
  sportCode: string;
};

export type Pool = FmcsPool | GangseoPool | YeongdeungpoPool;

const YANGCHEON = "https://www.ycs.or.kr";
const EUNPYEONG = "https://www.efmc.or.kr";
const GURO = "https://www.gurosisul.or.kr/sports";

export const POOLS: Pool[] = [
  {
    kind: "fmcs", id: "yangcheon-ycs01", district: "양천구", name: "신월문화체육센터",
    base: YANGCHEON, method: "GET", companyCode: "YCS01", swimmingCategory: "수영",
  },
  {
    kind: "fmcs", id: "yangcheon-ycs02", district: "양천구", name: "목동문화체육센터",
    base: YANGCHEON, method: "GET", companyCode: "YCS02", swimmingCategory: "수영",
  },
  {
    kind: "fmcs", id: "yangcheon-ycs", district: "양천구", name: "양천구민체육센터",
    base: YANGCHEON, method: "GET", companyCode: "YCS", swimmingCategory: "수영",
  },
  {
    kind: "fmcs", id: "guro-guro01", district: "구로구", name: "신도림생활체육관",
    base: GURO, method: "POST", companyCode: "GURO01", swimmingCategory: "수영",
  },
  {
    kind: "fmcs", id: "guro-guro02", district: "구로구", name: "구로구민체육센터",
    base: GURO, method: "POST", companyCode: "GURO02", swimmingCategory: "수영프로그램",
  },
  {
    kind: "fmcs", id: "guro-guro03", district: "구로구", name: "50플러스수영장",
    base: GURO, method: "POST", companyCode: "GURO03",
  },
  { kind: "gangseo", id: "gangseo-01", district: "강서구", name: "강서구민올림픽체육센터", centerCode: "01" },
  { kind: "gangseo", id: "gangseo-02", district: "강서구", name: "공항동문화체육센터", centerCode: "02" },
  { kind: "gangseo", id: "gangseo-03", district: "강서구", name: "마곡레포츠센터", centerCode: "03" },
  { kind: "yeongdeungpo", id: "yeongdeungpo-spc", district: "영등포구", name: "영등포 제1스포츠센터", subdomain: "spc", sportCode: "1" },
  { kind: "yeongdeungpo", id: "yeongdeungpo-spc2", district: "영등포구", name: "영등포 제2스포츠센터", subdomain: "spc2", sportCode: "10" },
  { kind: "yeongdeungpo", id: "yeongdeungpo-spc3", district: "영등포구", name: "영등포 제3스포츠센터", subdomain: "spc3", sportCode: "25" },
  {
    kind: "fmcs", id: "eunpyeong-efmc01", district: "은평구", name: "은평종합스포츠타운",
    base: EUNPYEONG, method: "GET", companyCode: "EFMC01", swimmingCategory: "수영 프로그램",
  },
  {
    kind: "fmcs", id: "eunpyeong-efmc02", district: "은평구", name: "은평청여울수영장",
    base: EUNPYEONG, method: "GET", companyCode: "EFMC02",
  },
];

export function poolRef({ id, district, name }: Pool): PoolRef {
  return { id, district, name };
}

/** 필터가 구별로 묶어 보여 주는 수영장 목록 */
export function poolGroups() {
  const groups: { district: string; pools: PoolRef[] }[] = [];
  for (const pool of POOLS) {
    const group = groups.find((g) => g.district === pool.district);
    if (group) group.pools.push(poolRef(pool));
    else groups.push({ district: pool.district, pools: [poolRef(pool)] });
  }
  return groups;
}
