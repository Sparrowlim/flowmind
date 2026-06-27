// Phase 3 — 화면 02-1(자동 쪼개기 제안, 규칙② 전용). Decision.kind === 'auto-split'일 때 진입.

import { useState } from "react";
import type { Task, TaskId } from "@core/engine/types";
import { Badge } from "../components/Badge";
import { PrimaryButton, SecondaryButton, TextLinkButton } from "../components/Button";

export function AutoSplitSuggestion({
  task,
  onAccept,
  onStartAnyway,
  onSkip,
}: {
  task: Task;
  onAccept: (parentId: TaskId, firstStepTitle: string) => void;
  onStartAnyway: (id: TaskId) => void;
  onSkip: (id: TaskId) => void;
}) {
  const [firstStep, setFirstStep] = useState("");

  return (
    <div className="flex min-h-screen flex-col px-7 pt-7">
      <Badge variant="calm">세 번째 만난 일이에요</Badge>
      <h1 className="mt-5 font-display text-[28px] leading-snug text-ink">
        조금 버거운 일일 수 있어요.
        <br />
        작게 나눠볼까요?
      </h1>
      <p className="mt-3 font-body text-base text-ink-soft">{task.title}</p>

      <div className="mt-6 flex flex-col gap-3">
        <div className="font-body text-[13px] font-bold tracking-wide text-accent-text">
          첫 걸음은 뭐예요?
        </div>
        <input
          autoFocus
          value={firstStep}
          onChange={(e) => setFirstStep(e.target.value)}
          placeholder="예: 병원 번호만 찾아두기"
          className="rounded-lg border-[1.5px] border-accent bg-surface px-4 py-4 font-display text-lg text-ink outline-none"
        />
        <div className="font-body text-sm text-ink-faint">여기까지만 해도 충분해요</div>
      </div>

      <div className="flex-1" />
      <div className="mb-10 flex flex-col gap-3">
        <PrimaryButton disabled={!firstStep.trim()} onClick={() => onAccept(task.id, firstStep.trim())}>
          좋아, 쪼개기
        </PrimaryButton>
        <SecondaryButton onClick={() => onStartAnyway(task.id)}>아니, 그냥 시작할래</SecondaryButton>
        <TextLinkButton onClick={() => onSkip(task.id)}>지금은 넘어갈래</TextLinkButton>
      </div>
    </div>
  );
}
