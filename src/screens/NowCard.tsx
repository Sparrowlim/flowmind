// Phase 2 — 화면 02(지금 카드). Decision kind 'card'|'new-greeting'|'auto-split' 공용 처리.
// 02-1(자동 쪼개기 전용 화면)·쪼갤래요 버튼은 Phase 3에서 추가.

import type { Decision, TaskId } from "@core/engine/types";
import { Badge } from "../components/Badge";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { whyNowLabel } from "../lib/whyNow";

type CardDecision = Extract<Decision, { kind: "card" | "new-greeting" | "auto-split" }>;

export function NowCard({
  decision,
  now,
  onStart,
  onDefer,
  onRefuseSplit,
}: {
  decision: CardDecision;
  now: number;
  onStart: (id: TaskId) => void;
  onDefer: (id: TaskId) => void;
  onRefuseSplit: (id: TaskId) => void;
}) {
  const task = decision.task;
  const isAutoSplit = decision.kind === "auto-split";
  const label =
    decision.kind === "new-greeting"
      ? "오늘 새로 담았어요"
      : isAutoSplit
        ? "여러 번 만난 일이에요"
        : whyNowLabel(decision.rule, task, now);

  return (
    <div className="flex min-h-screen flex-col px-7 pt-7">
      <div className="font-body text-[15px] tracking-wide text-ink-faint">지금 할 일</div>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <h1 className="font-display text-[34px] leading-snug text-ink">{task.title}</h1>
        <Badge variant={isAutoSplit ? "calm" : "accent"}>왜 지금? · {label}</Badge>
      </div>
      <div className="flex flex-col gap-3 pb-10">
        <PrimaryButton onClick={() => onStart(task.id)}>지금 시작</PrimaryButton>
        <SecondaryButton onClick={() => (isAutoSplit ? onRefuseSplit(task.id) : onDefer(task.id))}>
          이따 다시
        </SecondaryButton>
      </div>
    </div>
  );
}
