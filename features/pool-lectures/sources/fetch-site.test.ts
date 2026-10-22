import { afterEach, expect, test, vi } from "vitest";

import { fetchSiteFresh } from "./fetch-site";

afterEach(() => vi.unstubAllGlobals());

test("사이트 요청에는 제한 시간이 붙어 있어 응답 없는 사이트가 화면을 막지 못한다", async () => {
  const fetchSpy = vi.fn(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetchSpy);

  await fetchSiteFresh("https://example.test/list", { method: "POST" });

  const init = (fetchSpy.mock.calls[0] as unknown as [string, RequestInit])[1];
  expect(init.signal).toBeInstanceOf(AbortSignal);
  expect(init.signal?.aborted).toBe(false);
  expect(init).toMatchObject({ method: "POST", cache: "no-store" });
});
