// engine-spec.md §4 (D13 결정 재현성) — 전순서(total order) 비교자. 랜덤·동시성 의존 금지.

import { ageMs } from './age';
import type { Task } from './types';

// 같은 게이트/티어 내 다중 후보 → 1개 선정.
// 1. 나이 내림차순(오래 묵은 것 우선) 2. important 우선 3. createdAt 오름차순(먼저 만든 것).
export function compareWithinTier(a: Task, b: Task, now: number): number {
  const ageDiff = ageMs(b, now) - ageMs(a, now);
  if (ageDiff !== 0) return ageDiff;

  if (a.important !== b.important) return a.important ? -1 : 1;

  return a.createdAt - b.createdAt;
}

// GATE-SPLIT 다중 후보(S2): deferCount 내림차순(가장 많이 미룬 것) → compareWithinTier.
export function compareForSplitGate(a: Task, b: Task, now: number): number {
  const deferDiff = b.deferCount - a.deferCount;
  if (deferDiff !== 0) return deferDiff;
  return compareWithinTier(a, b, now);
}

// GATE-RESUME 다중 후보: focusPausedAt 내림차순(가장 최근 멈춘 것) → compareWithinTier.
export function compareForResumeGate(a: Task, b: Task, now: number): number {
  const pausedDiff = (b.focusPausedAt ?? 0) - (a.focusPausedAt ?? 0);
  if (pausedDiff !== 0) return pausedDiff;
  return compareWithinTier(a, b, now);
}
