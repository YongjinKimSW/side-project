export const AUDIENCES = [
  { id: "child", label: "유아·어린이" },
  { id: "teen", label: "청소년" },
  { id: "adult", label: "성인" },
  { id: "senior", label: "65세 이상" },
] as const;

export type AudienceId = (typeof AUDIENCES)[number]["id"];

const UNRESTRICTED = new Set(["", "-", "전체", "구분없음", "해당없음"]);

/**
 * 사이트마다 다른 대상 표기를 대상 묶음으로 옮긴다.
 * 대상 제한이 없거나 어느 묶음으로도 읽히지 않는 표기는 "all"로 돌려줘서 어떤 묶음을 골라도 보이게 한다.
 */
export function audienceGroupsOf(target: string): AudienceId[] | "all" {
  const text = target.trim();
  if (UNRESTRICTED.has(text)) return "all";

  const groups = new Set<AudienceId>();
  // "65세"의 "5세"를 유아 나이로 읽지 않도록 숫자 바로 뒤의 "세"는 제외한다.
  if (/유아|어린이|초등|(^|[^0-9])[5-9]세/.test(text)) groups.add("child");
  if (/청소년|중[.,]고생/.test(text)) groups.add("teen");
  if (/성인/.test(text)) groups.add("adult");
  if (/65세|60세/.test(text)) groups.add("senior");
  // "청소년이상"은 청소년부터 위로 모든 연령을 뜻한다.
  if (/청소년이상/.test(text)) {
    groups.add("adult");
    groups.add("senior");
  }
  return groups.size === 0 ? "all" : [...groups];
}
