// 화면 04(쪼갤래요). 와이어프레임: 평평한 리스트로 1~3개 스텝, 첫 스텝만 즉시 집중 시작,
// 나머지는 확인 화면 없이 풀에 추가. 부모는 다음 체크인까지 보류(core/state acceptSplit).

import { useState } from "react";
import type { Task, TaskId } from "@core/engine/types";
import { PrimaryButton } from "../components/Button";

const MAX_STEPS = 3;

export function SplitFirstStep({
  task,
  onSubmit,
}: {
  task: Task;
  onSubmit: (parentId: TaskId, stepTitles: string[]) => void;
}) {
  const [steps, setSteps] = useState<string[]>([""]);

  const submit = () => {
    const titles = steps.map((s) => s.trim()).filter(Boolean);
    if (titles.length === 0) return;
    onSubmit(task.id, titles);
  };

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
        {steps.map((step, i) => (
          <input
            key={i}
            autoFocus={i === 0}
            value={step}
            onChange={(e) => setSteps(steps.map((s, j) => (j === i ? e.target.value : s)))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={i === 0 ? "예: 자료 폴더 하나만 열기" : "다음 작은 걸음 (선택)"}
            className="rounded-lg border-[1.5px] border-accent bg-surface px-4 py-4 font-display text-lg text-ink outline-none"
          />
        ))}
        {steps.length < MAX_STEPS && (
          <button
            type="button"
            onClick={() => setSteps([...steps, ""])}
            className="self-start font-body text-sm text-ink-faint"
          >
            ＋ 하나 더 (선택)
          </button>
        )}
        <div className="font-body text-[13px] text-ink-faint">
          첫 걸음부터 바로 시작돼요. 나머지는 풀에서 기다려요.
        </div>
      </div>

      <div className="flex-1" />
      <PrimaryButton className="mb-3" disabled={!steps[0]?.trim()} onClick={submit}>
        이 걸음부터
      </PrimaryButton>
      <p className="mb-10 text-center font-body text-[13px] text-ink-faint">
        쪼개기 카드엔 '쪼갤래요'가 없어요
      </p>
    </div>
  );
}
