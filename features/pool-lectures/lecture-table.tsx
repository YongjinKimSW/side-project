import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Lecture } from "./lecture";

export function LectureTable({ lectures }: { lectures: Lecture[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>구</TableHead>
          <TableHead>수영장</TableHead>
          <TableHead>소분류</TableHead>
          <TableHead>강좌명</TableHead>
          <TableHead>요일</TableHead>
          <TableHead>시간</TableHead>
          <TableHead className="text-right">잔여석</TableHead>
          <TableHead className="text-right">정원</TableHead>
          <TableHead>대상</TableHead>
          <TableHead>강사</TableHead>
          <TableHead>신청 상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lectures.map((lecture, index) => (
          <TableRow key={`${lecture.poolId}-${index}`}>
            <TableCell>{lecture.district}</TableCell>
            <TableCell>{lecture.poolName}</TableCell>
            <TableCell>{lecture.category}</TableCell>
            <TableCell>{lecture.name}</TableCell>
            <TableCell>{lecture.days}</TableCell>
            <TableCell>{`${lecture.startTime}~${lecture.endTime}`}</TableCell>
            <TableCell className="text-right">{lecture.seatsLeft}</TableCell>
            <TableCell className="text-right">{lecture.capacity}</TableCell>
            <TableCell>{lecture.target}</TableCell>
            <TableCell>{lecture.teacher}</TableCell>
            <TableCell>{lecture.applyStatus}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
