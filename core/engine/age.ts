// engine-spec.md §3.1 (D7) — 나이 계산. 전역시간 금지, now는 인자로 주입.

import type { Task } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function ageMs(task: Task, now: number): number {
  return now - (task.lastServedAt ?? task.createdAt);
}

// "나이=달력 일수"(D14, MVP=단순). ms를 일수로 환산.
export function ageDays(task: Task, now: number): number {
  return Math.floor(ageMs(task, now) / MS_PER_DAY);
}

// UTC 기준 같은 달력일인지(타임존 환경차로 인한 비결정성을 피해 UTC로 고정, D13 결정 재현성).
export function isSameCalendarDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getUTCFullYear() === db.getUTCFullYear() &&
    da.getUTCMonth() === db.getUTCMonth() &&
    da.getUTCDate() === db.getUTCDate()
  );
}

// plan §4.5 SNOOZE("이따 다시"/"넘어갈래" 쿨다운 = 다음 체크인). 체크인은 하루 1회 리듬(§2 설계원칙3)이므로
// "다음 체크인"을 다음 달력일 00:00 UTC로 고정(D13: 같은 now → 같은 결과).
export function startOfNextUtcDay(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0);
}
