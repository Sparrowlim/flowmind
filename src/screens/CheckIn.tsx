// Phase 4 — 화면 01(아침 체크인 게이트). Decision은 엔진이 그대로 정함(thesis 일치) —
// 이 화면은 오늘 첫 진입 시 한 번만 그 결정을 미리 보여주는 wrapper.

import type { Decision } from "@core/engine/types";
import { PrimaryButton, TextLinkButton } from "../components/Button";

function previewTitle(decision: Decision): string | undefined {
  switch (decision.kind) {
    case "card":
    case "new-greeting":
    case "auto-split":
    case "resume":
      return decision.task.title;
    default:
      return undefined;
  }
}

export function CheckIn({
  decision,
  onCheckIn,
  onSkipToday,
}: {
  decision: Decision;
  onCheckIn: () => void;
  onSkipToday: () => void;
}) {
  const title = previewTitle(decision);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="text-4xl">☀️</div>
      <div className="mt-4 font-body text-[15px] tracking-wide text-ink-faint">
        오늘의 체크인 · 하루 한 번
      </div>
      <h1 className="mt-3 font-display text-[28px] leading-snug text-ink">
        {title ? "하나만 볼까요?" : "좋은 아침이에요."}
      </h1>
      {title ? (
        <div className="mt-6 w-full rounded-xl border border-border bg-surface p-6 text-left shadow-card">
          <div className="font-body text-[13px] font-bold text-accent-text">
            오늘의 첫 일
          </div>
          <div className="mt-2 font-display text-xl text-ink">{title}</div>
        </div>
      ) : (
        <p className="mt-4 font-body text-[17px] leading-relaxed text-ink-soft">
          밀린 알림은 없어요.
        </p>
      )}
      <PrimaryButton className="mt-10" onClick={onCheckIn}>
        체크인하고 시작
      </PrimaryButton>
      <TextLinkButton className="mt-4" onClick={onSkipToday}>
        오늘은 쉬어갈래요
      </TextLinkButton>
    </div>
  );
}
