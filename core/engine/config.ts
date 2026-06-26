// engine-spec.md §1.2 — 도그푸딩 튜닝 노브(D14). 하드코딩 금지, 전부 cfg 주입.

import type { EngineConfig } from './types';

export const DEFAULT_CONFIG: EngineConfig = {
  deferThreshold: 3,
  splitRefuseMax: 2,
  quickWinMin: 2,
  deadlineSoonMs: 24 * 60 * 60 * 1000,
  staleSoftDays: 7,
  staleHardDays: 14,
};
