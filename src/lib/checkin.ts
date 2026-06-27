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

// "오늘은 쉬어갈래요"를 눌러 오늘 하루는 카드 큐를 보지 않기로 한 상태.
export function isDismissedToday(
  settings: StoredSettings,
  now: number,
): boolean {
  const today = todayUtcDateString(now);
  return (
    settings.dismissedToday === today && settings.lastCheckinDate !== today
  );
}
