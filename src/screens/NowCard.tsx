// 화면 02(지금 카드). Decision kind 'card'|'new-greeting' 처리(auto-split은 02-1 전용 화면, Phase 3).
// 접힌 카피(왜 지금? 한 줄)는 항상 보이고, 캡처 때 입력한 마감·예상시간·중요는 접어두되
// "자세히 보기"로 펼쳐 검증 가능하게 한다(투명성=위임 신뢰).

import { useState } from "react";
import type { Decision, TaskId } from "@core/engine/types";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { whyNowLabel } from "../lib/whyNow";

type CardDecision = Extract<Decision, { kind: "card" | "new-greeting" }>;

function formatDeadline(deadline: number): string {
  return new Date(deadline).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

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
  const [expanded, setExpanded] = useState(false);
  const task = decision.task;
  const label =
    decision.kind === "new-greeting"
      ? "오늘 새로 담았어요"
      : whyNowLabel(decision.rule, task, now);
  const hasDetails =
    task.deadline !== undefined ||
    task.estimateMin !== undefined ||
    task.important;

  return (
    <div className="flex min-h-screen flex-col px-7 pt-16">
      <div className="flex items-center justify-between">
        <span className="font-body text-[15px] tracking-wide text-ink-faint">
          지금 할 일
        </span>
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
        <h1 className="font-display text-[34px] leading-snug text-ink">
          {task.title}
        </h1>
        <div className="overflow-hidden rounded-md bg-accent-soft">
          <button
            type="button"
            disabled={!hasDetails}
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
          >
            <span className="inline-flex items-center gap-2 font-body text-sm text-accent-text">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
              왜 지금? · {label}
            </span>
            {hasDetails && (
              <span className="shrink-0 font-body text-xs text-accent-text/70">
                {expanded ? "접기 ▴" : "자세히 ▾"}
              </span>
            )}
          </button>
          {hasDetails && (
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-2 border-t border-accent/15 px-3 py-3">
                  {task.deadline !== undefined && (
                    <div className="flex items-center justify-between font-body text-sm">
                      <span className="text-accent-text/70">마감</span>
                      <span className="text-ink-soft">
                        {formatDeadline(task.deadline)}
                      </span>
                    </div>
                  )}
                  {task.estimateMin !== undefined && (
                    <div className="flex items-center justify-between font-body text-sm">
                      <span className="text-accent-text/70">예상 시간</span>
                      <span className="text-ink-soft">
                        {task.estimateMin}분
                      </span>
                    </div>
                  )}
                  {task.important && (
                    <div className="flex items-center justify-between font-body text-sm">
                      <span className="text-accent-text/70">중요</span>
                      <span className="text-ink-soft">★ 표시함</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 pb-24">
        <PrimaryButton onClick={() => onStart(task.id)}>
          지금 시작
        </PrimaryButton>
        <div className="flex gap-3">
          <SecondaryButton onClick={() => onDefer(task.id)}>
            이따 다시
          </SecondaryButton>
          {/* 쪼개기 카드(자식, parentId 있음)엔 '쪼갤래요' 없음 — 재귀 방지(plan §2.4) */}
          {!task.parentId && (
            <SecondaryButton onClick={() => onSplit(task.id)}>
              쪼갤래요
            </SecondaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
