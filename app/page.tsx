import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  LectureFilterForm,
  LectureTable,
  LectureWatcher,
  TelegramSettings,
  filterFromSearchParams,
  filterLectures,
  readLectures,
} from "@/features/pool-lectures";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = filterFromSearchParams(await searchParams);
  const result = await readLectures();
  const lectures = result.ok ? filterLectures(result.lectures, filter) : [];
  const unreadablePools = result.ok ? result.unreadablePools : [];
  const selectedUnreadable = unreadablePools.filter(
    (pool) => !filter.poolIds?.length || filter.poolIds.includes(pool.id)
  );
  // 고른 수영장을 읽지 못했다면, 결과가 비어 있어도 "강좌 없음"이라고 하지 않는다.
  const emptyBecauseUnreadable = lectures.length === 0 && selectedUnreadable.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          수영장 강좌
        </h1>
        <p className="text-muted-foreground">
          양천구, 구로구, 강서구, 영등포구, 은평구 공공 수영장의 접수 중인 수영
          강좌를 수영장, 요일, 시간대로 걸러 볼 수 있습니다.
        </p>
      </header>
      <LectureWatcher />
      <TelegramSettings />
      <LectureFilterForm filter={filter} />
      {!result.ok ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>강좌 정보를 읽지 못했습니다</AlertTitle>
          <AlertDescription>
            공단 사이트에서 강좌 목록을 가져오지 못했습니다. 잠시 뒤 다시 시도해
            주세요.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {unreadablePools.length > 0 && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>일부 수영장을 읽지 못했습니다</AlertTitle>
              <AlertDescription>
                {unreadablePools
                  .map((pool) => `${pool.district} ${pool.name}`)
                  .join(", ")}
                의 강좌는 아래 표에 없습니다. 잠시 뒤 다시 시도해 주세요.
              </AlertDescription>
            </Alert>
          )}
          {lectures.length > 0 ? (
            <section className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                강좌 {lectures.length}개
              </p>
              <LectureTable lectures={lectures} />
            </section>
          ) : (
            !emptyBecauseUnreadable && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>조건에 맞는 강좌가 없습니다</EmptyTitle>
                  <EmptyDescription>
                    수영장, 요일이나 시간대를 넓혀 다시 걸러 보세요.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )
          )}
        </>
      )}
    </main>
  );
}
