// Phase 2 — plan.md §2.3 "왜 지금?" 접힌 카피(규칙별 한 줄). 펼친 카피는 Phase 3+에서.

import { ageDays } from "@core/engine/age";
import type { Task, WhyNowRule } from "@core/engine/types";

export function whyNowLabel(rule: WhyNowRule, task: Task, now: number): string {
  switch (rule) {
    case "punctuality":
      return "오늘 마감";
    case "deadline-soon":
      return "마감이 가까워요";
    case "aging-promoted":
      return "너무 오래 묵었어요";
    case "quick-win":
      return "2분이면 끝";
    case "stale":
      return `${ageDays(task, now)}일째 방치`;
    case "important":
      return "중요 표시한 일";
    case "floor":
      return "가장 오래 기다린 일";
  }
}
