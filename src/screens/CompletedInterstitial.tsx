// Phase 2 — 화면 05A(완료 직후). "오늘 그만"의 본격 동작(체크인 게이트 등)은 Phase 4에서.

import type { Task } from "@core/engine/types";
import { Card } from "../components/Card";
import { PrimaryButton, TextLinkButton } from "../components/Button";

export function CompletedInterstitial({
  nextTask,
  onContinue,
  onStop,
}: {
  nextTask?: Task;
  onContinue: () => void;
  onStop: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-accent-soft shadow-accent">
        <span className="font-display text-4xl text-accent">✓</span>
      </div>
      <h2 className="mt-7 font-display text-3xl text-ink">잘했어요! 🎉</h2>
      <p className="mt-3 font-body text-[17px] leading-relaxed text-ink-soft">
        하나 끝냈어요.
        <br />
        잠깐 숨 돌려도 좋아요.
      </p>
      {nextTask && (
        <Card className="mt-6 w-full text-left">
          <div className="font-body text-[13px] font-bold tracking-wide text-accent-text">다음</div>
          <div className="mt-1 font-display text-lg text-ink">{nextTask.title}</div>
        </Card>
      )}
      <div className="mt-10 w-full">
        <PrimaryButton onClick={onContinue}>한 개 더 할래요</PrimaryButton>
        <TextLinkButton className="mt-4" onClick={onStop}>
          오늘 그만
        </TextLinkButton>
      </div>
    </div>
  );
}
