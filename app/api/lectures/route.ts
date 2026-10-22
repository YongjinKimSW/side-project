import { readLectures } from "@/features/pool-lectures";

/** 알림 받을 강좌가 속한 수영장만 다시 읽어 돌려준다. 화면이 1분마다 부른다. */
export async function GET(request: Request) {
  const poolIds = new URL(request.url).searchParams.getAll("pool");
  if (poolIds.length === 0) {
    return Response.json({ ok: false, message: "pool is required" }, { status: 400 });
  }
  return Response.json(await readLectures(undefined, undefined, poolIds));
}
