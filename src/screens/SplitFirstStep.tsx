// Phase 3 — 화면 04(쪼갤래요, 첫 걸음). 일반 지금 카드의 "쪼갤래요" 버튼에서 진입.

import { useState } from "react";
import type { Task, TaskId } from "@core/engine/types";
import { PrimaryButton } from "../components/Button";

export function SplitFirstStep({
  task,
  onSubmit,
}: {
  task: Task;
  onSubmit: (parentId: TaskId, firstStepTitle: string) => void;
}) {
  const [firstStep, setFirstStep] = useState("");

  return (
    <div className="flex min-h-screen flex-col px-7 pt-7">
      <h1 className="font-display text-[30px] leading-snug text-ink">
        어디서부터
        <br />
        시작할까요?
      </h1>
      <p className="mt-3 font-body text-base text-ink-soft">
        가장 작은 한 걸음을 직접 적어요. 나머지는 잊어도 돼요.
      </p>
      <p className="mt-2 font-body text-sm text-ink-faint">{task.title}</p>

      <div className="mt-6 flex flex-col gap-3">
        <div className="font-body text-[13px] font-bold tracking-wide text-accent-text">
          첫 걸음은 뭐예요?
        </div>
        <input
          autoFocus
          value={firstStep}
          onChange={(e) => setFirstStep(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && firstStep.trim() && onSubmit(task.id, firstStep.trim())}
          placeholder="예: 자료 폴더 하나만 열기"
          className="rounded-lg border-[1.5px] border-accent bg-surface px-4 py-4 font-display text-lg text-ink outline-none"
        />
      </div>

      <div className="flex-1" />
      <PrimaryButton
        className="mb-10"
        disabled={!firstStep.trim()}
        onClick={() => onSubmit(task.id, firstStep.trim())}
      >
        이 걸음부터
      </PrimaryButton>
    </div>
  );
}
