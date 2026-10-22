export type Lecture = {
  poolName: string;
  category: string;
  name: string;
  /** 수업 요일을 한 글자씩 이어 붙인 값 (예: "월수금") */
  days: string;
  /** "HH:MM" */
  startTime: string;
  /** "HH:MM" */
  endTime: string;
  seatsLeft: number;
  capacity: number;
  target: string;
  teacher: string;
  /** 공단 사이트가 신청 열에 보여 주는 표기 (예: "준비중", "접수하기") */
  applyStatus: string;
};
