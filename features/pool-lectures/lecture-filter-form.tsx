import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { LectureFilter } from "./filter-lectures";
import { WEEKDAYS } from "./filter-from-search-params";

/** 요일과 시간대를 쿼리스트링(GET)으로 보내는 조건 폼. 서버가 다시 읽어 거른다. */
export function LectureFilterForm({ filter }: { filter: LectureFilter }) {
  return (
    <form method="get" className="flex flex-col gap-6">
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">요일</FieldLegend>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {WEEKDAYS.map((day) => (
              <Field key={day} orientation="horizontal" className="w-auto">
                <Checkbox
                  id={`day-${day}`}
                  name="day"
                  value={day}
                  defaultChecked={filter.days.includes(day)}
                />
                <FieldLabel htmlFor={`day-${day}`}>{day}</FieldLabel>
              </Field>
            ))}
          </div>
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">시간대</FieldLegend>
          <div className="flex flex-wrap items-center gap-3">
            <Field className="w-auto">
              <FieldLabel htmlFor="from" className="sr-only">
                시작 시각
              </FieldLabel>
              <Input id="from" name="from" type="time" defaultValue={filter.from} />
            </Field>
            <span aria-hidden>~</span>
            <Field className="w-auto">
              <FieldLabel htmlFor="to" className="sr-only">
                끝 시각
              </FieldLabel>
              <Input id="to" name="to" type="time" defaultValue={filter.to} />
            </Field>
          </div>
        </FieldSet>
      </FieldGroup>
      <div className="flex gap-3">
        <Button type="submit">강좌 거르기</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          초기화
        </Link>
      </div>
    </form>
  );
}
