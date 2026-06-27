// 화면 02(지금 카드). Decision kind 'card'|'new-greeting' 처리(auto-split은 02-1 전용 화면, Phase 3).

import type { Decision, TaskId } from "@core/engine/types";
import { Badge } from "../components/Badge";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { whyNowLabel } from "../lib/whyNow";

type CardDecision = Extract<Decision, { kind: "card" | "new-greeting" }>;

export function NowCard({
  decision,
  now,
  onStart,
  onDefer,
  onSplit,
  onOpenMenu,
}: {
  decision: CardDecision;
  now: number;
  onStart: (id: TaskId) => void;
  onDefer: (id: TaskId) => void;
  onSplit: (id: TaskId) => void;
  onOpenMenu: (id: TaskId) => void;
}) {
  const task = decision.task;
  const label = decision.kind === "new-greeting" ? "오늘 새로 담았어요" : whyNowLabel(decision.rule, task, now);

  return (
    <div className="flex min-h-screen flex-col px-7 pt-7">
      <div className="flex items-center justify-between">
        <span className="font-body text-[15px] tracking-wide text-ink-faint">지금 할 일</span>
        <button
          type="button"
          aria-label="더보기"
          onClick={() => onOpenMenu(task.id)}
          className="px-2 font-body text-xl tracking-widest text-ink-faint"
        >
          ···
        </button>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <h1 className="font-display text-[34px] leading-snug text-ink">{task.title}</h1>
        <Badge variant="accent">왜 지금? · {label}</Badge>
      </div>
      <div className="flex flex-col gap-3 pb-10">
        <PrimaryButton onClick={() => onStart(task.id)}>지금 시작</PrimaryButton>
        <div className="flex gap-3">
          <SecondaryButton onClick={() => onDefer(task.id)}>이따 다시</SecondaryButton>
          <SecondaryButton onClick={() => onSplit(task.id)}>쪼갤래요</SecondaryButton>
        </div>
      </div>
    </div>
  );
}
