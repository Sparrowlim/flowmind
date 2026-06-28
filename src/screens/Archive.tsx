// Phase 3+ — 화면 06(보관함). "열람 + 항목당 단 하나의 출구"만 허용(설계원칙1과의 긴장 — 분류·정렬·
// 다중선택은 금지). 재우기/쿨다운/보관/쪼개기중을 사유 배지로 구분해 "왜 여기 있는지" 보이게 한다.

import { useState } from "react";
import { ageDays } from "@core/engine/age";
import type { DormantReason, Task, TaskId } from "@core/engine/types";
import { Badge } from "../components/Badge";

function reasonLabel(reason: DormantReason | undefined): string {
  switch (reason) {
    case "snooze":
      return "다음 체크인에 다시";
    case "cooldown":
      return "7일 쉼";
    case "archived":
      return "보관함에 둠";
    default:
      return "쉬고 있어요";
  }
}

export function Archive({
  dormantTasks,
  splittingParents,
  now,
  onClose,
  onWakeAndStart,
  onWakeToEngine,
}: {
  dormantTasks: Task[];
  splittingParents: { parent: Task; children: Task[] }[];
  now: number;
  onClose: () => void;
  onWakeAndStart: (id: TaskId) => void;
  onWakeToEngine: (id: TaskId) => void;
}) {
  const [expandedId, setExpandedId] = useState<TaskId | null>(null);
  const empty = dormantTasks.length === 0 && splittingParents.length === 0;

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

      <div className="mt-5 flex flex-col gap-3 overflow-y-auto pb-24">
        {empty && (
          <p className="font-body text-sm text-ink-faint">
            지금은 쉬고 있는 일이 없어요.
          </p>
        )}

        {splittingParents.map(({ parent, children }) => {
          const doneCount = children.filter((c) => c.state === "done").length;
          return (
            <div
              key={parent.id}
              className="rounded-lg border border-border bg-surface px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-base text-ink">
                  {parent.title}
                </span>
                <Badge variant="calm">
                  쪼개는 중 ({doneCount}/{children.length})
                </Badge>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 font-body text-sm text-ink-faint"
                  >
                    <span>{child.state === "done" ? "✓" : "○"}</span>
                    <span
                      className={
                        child.state === "done" ? "line-through" : undefined
                      }
                    >
                      {child.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {dormantTasks.map((task) => {
          const expanded = expandedId === task.id;
          return (
            <div
              key={task.id}
              className="rounded-lg border border-border bg-surface px-4 py-4"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setExpandedId(expanded ? null : task.id)}
              >
                <span className="font-display text-base text-ink">
                  {task.title}
                </span>
                <span className="font-body text-[13px] text-ink-faint">
                  {ageDays(task, now)}일 전
                </span>
              </button>
              <Badge variant="calm" className="mt-2">
                {reasonLabel(task.dormantReason)}
              </Badge>
              {expanded && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onWakeAndStart(task.id)}
                    className="flex-1 rounded-md bg-accent px-3 py-2 font-body text-sm font-bold text-white"
                  >
                    지금 이거 할래
                  </button>
                  <button
                    type="button"
                    onClick={() => onWakeToEngine(task.id)}
                    className="flex-1 rounded-md border border-border bg-bg px-3 py-2 font-body text-sm text-ink-soft"
                  >
                    지금 카드로 가져와
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
