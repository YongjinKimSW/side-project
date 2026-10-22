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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          수영장 강좌
        </h1>
        <p className="text-muted-foreground">
          목동문화체육센터의 접수 중인 수영 강좌를 요일과 시간대로 걸러 볼 수
          있습니다.
        </p>
      </header>
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
      ) : lectures.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>조건에 맞는 강좌가 없습니다</EmptyTitle>
            <EmptyDescription>
              요일이나 시간대를 넓혀 다시 걸러 보세요.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            강좌 {lectures.length}개
          </p>
          <LectureTable lectures={lectures} />
        </section>
      )}
    </main>
  );
}
