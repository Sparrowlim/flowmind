// Phase 2 — pickNextCard(core/engine)를 React에서 쓰기 위한 얇은 래퍼.

import { useMemo } from "react";
import { pickNextCard } from "@core/engine/pickNextCard";
import { DEFAULT_CONFIG } from "@core/engine/config";
import type { Decision, Task } from "@core/engine/types";

export function useEngineDecision(tasks: Task[], now: number): Decision {
  return useMemo(() => pickNextCard(tasks, now, DEFAULT_CONFIG), [tasks, now]);
}
