// 화면 01(아침 체크인) 게이트 — 앱 상태 전용 로직, core/engine과는 무관(plan.md 화면 인벤토리 01).
// lastCheckinDate/dismissedToday는 "UTC YYYY-MM-DD" 문자열(db.ts)이라 문자열 비교로 충분.

import type { StoredSettings } from "@data/local/db";

export function todayUtcDateString(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

// 오늘 아직 체크인 안 했고, "오늘은 쉬어갈래요"도 누르지 않은 상태.
export function needsCheckin(settings: StoredSettings, now: number): boolean {
  const today = todayUtcDateString(now);
  return (
    settings.lastCheckinDate !== today && settings.dismissedToday !== today
  );
}

// "오늘은 쉬어갈래요"(체크인 전) 또는 "오늘 그만"(완료 후)을 눌러 오늘 하루는
// 카드 큐를 보지 않기로 한 상태. 체크인 여부와 무관하게 dismissedToday만으로 판단—
// 체크인을 이미 했어도 "오늘 그만"은 그 뒤에 누르는 동작이라 lastCheckinDate로 막으면 안 됨.
export function isDismissedToday(
  settings: StoredSettings,
  now: number,
): boolean {
  return settings.dismissedToday === todayUtcDateString(now);
}
