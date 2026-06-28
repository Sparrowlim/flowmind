// Phase 2 — plan.md §2.3 "왜 지금?" 접힌 카피(규칙별 한 줄). 펼친 상세(마감·예상시간·중요)는
// NowCard의 "자세히 보기" 토글에서 task 필드를 직접 보여준다.

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
