// 테스트용 가짜 공단 사이트. 실제 사이트 응답의 모양을 따라 만든다.
// 정해 주지 않은 수영장은 강좌가 하나도 없는 응답을 돌려준다.

export type FmcsRow = Record<string, string>;

export type YeongdeungpoLecture = {
  name: string;
  days: string;
  time: string;
  target: string;
  /** "잔여/정원" 표기 (예: "12/120") */
  seats: string;
  button: "신청" | "마감";
};

export type FakeSites = {
  /** company_code → 그 센터의 강좌 행 */
  fmcs?: Record<string, FmcsRow[]>;
  /** 센터 코드 → 강좌 행 */
  gangseo?: Record<string, Record<string, unknown>[]>;
  /** "서브도메인:종목코드" → 품목 코드 → 품목 이름과 강좌 */
  yeongdeungpo?: Record<
    string,
    Record<string, { label: string; lectures: YeongdeungpoLecture[] }>
  >;
  /** 한 응답에 담는 최대 줄 수. 페이지 이동을 강제할 때 쓴다. */
  perPage?: number;
  /** 요청 주소나 본문에 이 문자열이 들어 있으면 500을 돌려준다. */
  failing?: string[];
};

function ok(body: unknown) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body));
}

function yeongdeungpoHtml(
  subdomain: string,
  sportCode: string,
  items: Record<string, { label: string; lectures: YeongdeungpoLecture[] }>,
  lclSeq: string | null,
  page: number,
  perPage: number
) {
  const options = Object.entries(items)
    .map(([code, item]) => `<option value="${code}" >${item.label}</option>`)
    .join("");
  const select = `<select id="s_lcl_seq" name="s_lcl_seq"><option value="" selected>== 품목 ==</option>${options}</select>`;
  const lectures = lclSeq ? (items[lclSeq]?.lectures ?? []) : [];
  const pageCount = Math.max(1, Math.ceil(lectures.length / perPage));
  const shown = lectures.slice((page - 1) * perPage, page * perPage);
  const rows = shown
    .map(
      (l) => `
      <tr>
        <td rowspan='2' class="ali_l">${l.name}</td>
        <td rowspan='2'>${l.days}</td>
        <td rowspan='2'>${l.time}</td>
        <td rowspan='2'>${l.target}</td>
        <td rowspan='2'>유</td>
        <td>성인 (1개월)</td>
        <td>47,000</td>
        <td rowspan='2'>${l.seats}</td>
        <td><a href="./lect.n.view.asp?it_seq=1&mp_key=10_1" class='btn_sub_s1'>${l.button}</a></td>
      </tr>
      <tr>
        <td>청소년 (1개월)</td>
        <td>32,000</td>
        <td><a href="./lect.n.view.asp?it_seq=1&mp_key=30_1" class='btn_sub_s1'>${l.button}</a></td>
      </tr>`
    )
    .join("");
  const pager = Array.from({ length: pageCount }, (_, i) =>
    i + 1 === page
      ? `<a href='javascript:;' class='on'>${i + 1}</a>`
      : `<a href="/page/lect/lect.n.list.asp?page=${i + 1}&s_lgu_seq=${sportCode}&s_lcl_seq=${lclSeq}">${i + 1}</a>`
  ).join("");
  return `<html><body>${select}
    <table class='tbl_scm1'><thead><tr><th>강좌명</th></tr></thead><tbody>${rows}</tbody></table>
    <div class='bx_paging'><a href='javascript:;'>처음</a>${pager}<a href='javascript:;'>맨끝</a></div>
    <!-- ${subdomain} --></body></html>`;
}

export function fakeSites(sites: FakeSites = {}) {
  return async (input: string, init?: RequestInit): Promise<Response> => {
    const body = typeof init?.body === "string" ? init.body : "";
    if ((sites.failing ?? []).some((f) => input.includes(f) || body.includes(f))) {
      return new Response("error", { status: 500 });
    }
    const url = new URL(input);
    const perPage = sites.perPage ?? 1000;

    if (url.pathname.endsWith("/rest/lecture/list")) {
      const params = init?.method === "POST" ? new URLSearchParams(body) : url.searchParams;
      const rows = sites.fmcs?.[params.get("company_code") ?? ""] ?? [];
      const page = Number(params.get("page") ?? 1);
      const size = Math.min(Number(params.get("page_size") ?? 10), perPage);
      return ok(
        rows
          .slice((page - 1) * size, page * size)
          .map((row) => ({ ...row, total_count: rows.length }))
      );
    }

    if (url.hostname === "sport.gssi.or.kr") {
      const rows = sites.gangseo?.[url.searchParams.get("comcd") ?? ""] ?? [];
      const page = Number(url.searchParams.get("pageIndex") ?? 1);
      const size = Math.min(Number(url.searchParams.get("pageSize") ?? 10), perPage);
      return ok({
        totalCount: rows.length,
        resultList: rows.slice((page - 1) * size, page * size),
      });
    }

    if (url.hostname.endsWith(".y-sisul.or.kr")) {
      const subdomain = url.hostname.split(".")[0];
      const sportCode = url.searchParams.get("s_lgu_seq") ?? "";
      const items = sites.yeongdeungpo?.[`${subdomain}:${sportCode}`] ?? {};
      return ok(
        yeongdeungpoHtml(
          subdomain,
          sportCode,
          items,
          url.searchParams.get("s_lcl_seq"),
          Number(url.searchParams.get("page") ?? 1),
          Math.min(10, perPage)
        )
      );
    }

    return new Response("not found", { status: 404 });
  };
}
