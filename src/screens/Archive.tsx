// Phase 3 — 화면 06(보관함). 재우기 중인 task를 가벼운 열람으로만 노출(읽기 전용).

import { ageDays } from "@core/engine/age";
import type { Task } from "@core/engine/types";

export function Archive({
  tasks,
  now,
  onClose,
}: {
  tasks: Task[];
  now: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg px-7 pt-7">
      <button
        type="button"
        onClick={onClose}
        className="self-start font-body text-base text-ink-soft"
      >
        ← 닫기
      </button>
      <h1 className="mt-4 font-display text-[28px] text-ink">쌓인 것들</h1>
      <p className="mt-2 font-body text-[15px] leading-relaxed text-ink-faint">
        급하지 않은 일들이 여기서 쉬고 있어요.
        <br />
        재촉하지 않을게요.
      </p>

      <div className="mt-5 flex flex-col gap-3 overflow-y-auto">
        {tasks.length === 0 && (
          <p className="font-body text-sm text-ink-faint">
            지금은 쉬고 있는 일이 없어요.
          </p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-4"
          >
            <span className="font-display text-base text-ink">
              {task.title}
            </span>
            <span className="font-body text-[13px] text-ink-faint">
              {ageDays(task, now)}일 전
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1" />
      <div className="mb-8 rounded-md bg-calm-soft px-4 py-3 text-center font-body text-sm text-calm-text">
        때가 되면 '지금 카드'로 하나씩 데려올게요
      </div>
    </div>
  );
}
