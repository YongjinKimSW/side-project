import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { type Lecture, LectureWatcher, WatchToggle } from "@/features/pool-lectures";

import { resetWatchCache } from "./watch-store";

function lecture(seatsLeft: number, overrides: Partial<Lecture> = {}): Lecture {
  return {
    poolId: "yangcheon-ycs02",
    district: "양천구",
    poolName: "목동문화체육센터",
    category: "성인남녀수영",
    name: "성인수영A",
    days: "월수금",
    startTime: "06:00",
    endTime: "06:50",
    seatsLeft,
    capacity: 80,
    target: "성인",
    teacher: "-",
    applyStatus: "마감",
    ...overrides,
  };
}

// 화면이 1분마다 부르는 /api/lectures 를 흉내 낸다. 호출마다 다음 응답을 돌려준다.
function stubApi(...responses: unknown[]) {
  const fetchSpy = vi.fn(async (_url: string) => {
    const body = responses.length > 1 ? responses.shift() : responses[0];
    return new Response(JSON.stringify(body));
  });
  // 휴대폰 알림을 보내는 /api/notify 호출은 세지 않는다.
  vi.stubGlobal("fetch", (url: string) =>
    String(url).startsWith("/api/notify") ? Promise.resolve(new Response("{}")) : fetchSpy(url)
  );
  return fetchSpy;
}

const ok = (...lectures: Lecture[]) => ({ ok: true, lectures, unreadablePools: [] });

const notifications: { title: string; body?: string }[] = [];
let requestPermission: ReturnType<typeof vi.fn>;

function Page({ target = lecture(0) }: { target?: Lecture }) {
  return (
    <>
      <LectureWatcher />
      <WatchToggle lecture={target} />
    </>
  );
}

const checkbox = () => screen.getByRole("checkbox", { name: "알림: 성인수영A" });

async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  resetWatchCache();
  notifications.length = 0;
  requestPermission = vi.fn(async () => "granted");
  vi.stubGlobal(
    "Notification",
    class {
      static permission = "granted";
      static requestPermission = requestPermission;
      constructor(title: string, options?: { body?: string }) {
        notifications.push({ title, body: options?.body });
      }
    }
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test("강좌에 알림을 걸면 알림 받을 강좌 목록에 나타나고 해제하면 빠진다", async () => {
  stubApi(ok(lecture(0)));
  render(<Page />);

  fireEvent.click(checkbox());
  await tick(0);

  const list = screen.getByRole("region", { name: "알림 받을 강좌" });
  expect(within(list).getByText(/성인수영A/)).toBeInTheDocument();
  expect(within(list).getByText(/목동문화체육센터/)).toBeInTheDocument();
  expect(within(list).getByText(/월수금 06:00~06:50/)).toBeInTheDocument();

  fireEvent.click(within(list).getByRole("button", { name: /해제/ }));
  await tick(0);

  expect(screen.queryByRole("region", { name: "알림 받을 강좌" })).not.toBeInTheDocument();
});

test("처음 강좌를 고를 때 브라우저 알림 권한을 요청한다", async () => {
  vi.stubGlobal(
    "Notification",
    class {
      static permission = "default";
      static requestPermission = requestPermission;
    }
  );
  stubApi(ok(lecture(0)));
  render(<Page />);

  fireEvent.click(checkbox());
  await tick(0);

  expect(requestPermission).toHaveBeenCalledTimes(1);
});

test("고른 강좌가 없으면 사이트를 읽지 않는다", async () => {
  const fetchSpy = stubApi(ok(lecture(0)));
  render(<Page />);

  await tick(5 * 60_000);

  expect(fetchSpy).not.toHaveBeenCalled();
});

test("1분마다 고른 강좌의 수영장만 다시 읽고, 잔여석이 0에서 늘면 화면 알림과 브라우저 알림을 띄운다", async () => {
  const fetchSpy = stubApi(ok(lecture(0)), ok(lecture(3)));
  render(<Page />);
  fireEvent.click(checkbox());
  await tick(0);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect((fetchSpy.mock.calls[0] as unknown as [string])[0]).toBe(
    "/api/lectures?pool=yangcheon-ycs02"
  );

  await tick(59_000);
  expect(fetchSpy).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("자리가 났습니다")).not.toBeInTheDocument();

  await tick(1_000);

  expect(fetchSpy).toHaveBeenCalledTimes(2);
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("자리가 났습니다");
  expect(alert).toHaveTextContent("성인수영A");
  expect(alert).toHaveTextContent("목동문화체육센터");
  expect(alert).toHaveTextContent("3");
  expect(notifications).toHaveLength(1);
  expect(notifications[0].body).toContain("성인수영A");
});

test("잔여석이 0이 아닌 값에서 바뀌거나 0에서 0이면 알리지 않는다", async () => {
  stubApi(ok(lecture(2)), ok(lecture(5)), ok(lecture(0)), ok(lecture(0)));
  render(<Page target={lecture(2)} />);
  fireEvent.click(checkbox());
  await tick(0);

  await tick(60_000);
  await tick(60_000);
  await tick(60_000);

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(notifications).toHaveLength(0);
});

test("알림을 닫아도 계속 감시하고, 같은 잔여석으로 다시 알리지 않는다", async () => {
  stubApi(ok(lecture(0)), ok(lecture(3)), ok(lecture(3)));
  render(<Page />);
  fireEvent.click(checkbox());
  await tick(60_000);
  expect(screen.getByRole("alert")).toBeInTheDocument();

  fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "닫기" }));
  await tick(60_000);

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "알림 받을 강좌" })).toBeInTheDocument();
  expect(notifications).toHaveLength(1);
});

test("화면을 다시 열었을 때 마지막 잔여석이 0이었는데 지금 자리가 나 있으면 바로 알린다", async () => {
  stubApi(ok(lecture(0)));
  const first = render(<Page />);
  fireEvent.click(checkbox());
  await tick(0);
  first.unmount();

  stubApi(ok(lecture(4)));
  render(<LectureWatcher />);
  await tick(0);

  expect(screen.getByRole("alert")).toHaveTextContent("성인수영A");
  expect(screen.getByRole("alert")).toHaveTextContent("4");
});

test("고른 강좌는 화면을 다시 열어도 남아 있다", async () => {
  stubApi(ok(lecture(0)));
  const first = render(<Page />);
  fireEvent.click(checkbox());
  await tick(0);
  first.unmount();

  render(<Page />);
  await tick(0);

  expect(screen.getByRole("region", { name: "알림 받을 강좌" })).toHaveTextContent("성인수영A");
  expect(checkbox()).toBeChecked();
});

test("수영장을 읽지 못한 주기에는 알리지 않고 확인하지 못했다고 보여 주며 다음 주기에 다시 시도한다", async () => {
  stubApi({ ok: false }, ok(lecture(2)));
  render(<Page />);
  fireEvent.click(checkbox());
  await tick(0);

  const list = screen.getByRole("region", { name: "알림 받을 강좌" });
  expect(list).toHaveTextContent("확인하지 못함");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  await tick(60_000);

  expect(screen.getByRole("alert")).toHaveTextContent("자리가 났습니다");
});

test("고른 강좌가 사이트 목록에서 사라졌으면 사라졌다고 보여 주고 알리지 않는다", async () => {
  stubApi(ok(lecture(5, { name: "다른 강좌" })));
  render(<Page />);
  fireEvent.click(checkbox());
  await tick(0);

  expect(screen.getByRole("region", { name: "알림 받을 강좌" })).toHaveTextContent(
    "목록에서 사라짐"
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("브라우저 알림을 거부했어도 화면 알림은 뜬다", async () => {
  vi.stubGlobal(
    "Notification",
    class {
      static permission = "denied";
      static requestPermission = vi.fn(async () => "denied");
    }
  );
  stubApi(ok(lecture(0)), ok(lecture(1)));
  render(<Page />);
  fireEvent.click(checkbox());
  await tick(60_000);

  expect(screen.getByRole("alert")).toHaveTextContent("자리가 났습니다");
  expect(notifications).toHaveLength(0);
});
