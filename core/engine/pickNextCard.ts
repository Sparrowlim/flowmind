// engine-spec.md §3 — pickNextCard 계약. 위에서 첫 매칭에 즉시 반환(게이트 순서: S1 확정값 B).

import { isSameCalendarDay } from './age';
import { classify } from './classify';
import { compareForResumeGate, compareForSplitGate, compareWithinTier } from './tiebreak';
import type { Decision, EngineConfig, Task } from './types';

// D12 — "담은 당일 체크인에 한해 1회": 아직 한 번도 안 서빙됨 AND 오늘 만든 것.
function isNewGreeting(task: Task, now: number): boolean {
  return task.lastServedAt === undefined && isSameCalendarDay(task.createdAt, now);
}

function pickBy(tasks: Task[], cmp: (a: Task, b: Task) => number): Task {
  return tasks.reduce((best, t) => (cmp(t, best) < 0 ? t : best));
}

export function pickNextCard(pool: Task[], now: number, cfg: EngineConfig): Decision {
  // §3.0 — 후보 = 활성 AND 재우기 해제(INV-6: dormant는 어떤 게이트/티어에도 등장 불가).
  const candidates = pool.filter(
    (t) => t.state !== 'done' && (t.dormantUntil === undefined || t.dormantUntil <= now),
  );

  if (candidates.length === 0) {
    const hasUnfinished = pool.some((t) => t.state !== 'done');
    return hasUnfinished ? { kind: 'empty-dormant' } : { kind: 'empty-all-done' };
  }

  // GATE-RESUME(1) — S1: 이어하기 우선(몰입 중단 방지).
  const resuming = candidates.filter((t) => t.focusPausedAt !== undefined);
  if (resuming.length > 0) {
    return { kind: 'resume', task: pickBy(resuming, (a, b) => compareForResumeGate(a, b, now)) };
  }

  // GATE-GREETING(2)
  const greeting = candidates.filter((t) => isNewGreeting(t, now));
  if (greeting.length > 0) {
    return {
      kind: 'new-greeting',
      task: pickBy(greeting, (a, b) => compareWithinTier(a, b, now)),
    };
  }

  // GATE-SPLIT(3) — S2: deferCount 내림차순(가장 많이 미룬 것) 우선.
  const splitting = candidates.filter((t) => t.deferCount >= cfg.deferThreshold);
  if (splitting.length > 0) {
    return {
      kind: 'auto-split',
      task: pickBy(splitting, (a, b) => compareForSplitGate(a, b, now)),
    };
  }

  // CASCADE(4) — 티어 분류 후 같은 티어 내 타이브레이크(D13).
  const ranked = candidates
    .map((task) => ({ task, ...classify(task, now, cfg) }))
    .sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : compareWithinTier(a.task, b.task, now)));

  const top = ranked[0]!; // candidates.length > 0 보장됨 + floor가 항상 매칭(불변식 ⒜)
  return { kind: 'card', task: top.task, rule: top.rule };
}
