export type Lecture = {
  /** 수영장을 가리키는 값. 필터에서 수영장을 고를 때 쓴다. */
  poolId: string;
  /** 수영장이 속한 구 (예: "양천구") */
  district: string;
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
  /** 사이트가 신청 열에 보여 주는 표기를 같은 어휘로 맞춘 값 (예: "준비중", "접수하기", "마감") */
  applyStatus: string;
};
