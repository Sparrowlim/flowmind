// engine-spec.md §3.3 — 단일 task → 캐스케이드 티어 분류(위에서 첫 매칭). S3: ③ 동시충족 시 deadline-soon 라벨 우선.

import { ageDays, isSameCalendarDay } from './age';
import type { EngineConfig, Task, WhyNowRule } from './types';

export interface Classification {
  tier: number; // 작을수록 우선
  rule: WhyNowRule;
}

export function classify(task: Task, now: number, cfg: EngineConfig): Classification {
  const isPunctual =
    task.deadline !== undefined && isSameCalendarDay(task.deadline, now) && task.important;
  if (isPunctual) {
    return { tier: 0, rule: 'punctuality' };
  }

  const isDeadlineSoon =
    task.deadline !== undefined && task.deadline - now <= cfg.deadlineSoonMs;
  const isAgingPromoted = ageDays(task, now) >= cfg.staleHardDays;
  if (isDeadlineSoon || isAgingPromoted) {
    // S3: 둘 다 충족하면 deadline-soon이 더 행동가능한 사유라 라벨 우선.
    return { tier: 1, rule: isDeadlineSoon ? 'deadline-soon' : 'aging-promoted' };
  }

  const isQuickWin = task.estimateMin !== undefined && task.estimateMin <= cfg.quickWinMin;
  if (isQuickWin) {
    return { tier: 2, rule: 'quick-win' };
  }

  const isStale = ageDays(task, now) >= cfg.staleSoftDays;
  if (isStale) {
    return { tier: 3, rule: 'stale' };
  }

  if (task.important) {
    return { tier: 4, rule: 'important' };
  }

  return { tier: 5, rule: 'floor' }; // 불변식 ⒜ — 항상 매칭, 엔진 빈손 불가
}
