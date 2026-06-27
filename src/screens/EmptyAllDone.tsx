// Phase 3 — 화면 05(비움, Decision 'empty-all-done'). 오늘/이번주 완료 통계 표시.

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import * as taskRepository from "@data/local/taskRepository";
import { TextLinkButton } from "../components/Button";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function EmptyAllDone({
  now,
  onCapture,
}: {
  now: number;
  onCapture: () => void;
}) {
  const [todayCount, setTodayCount] = useState<number | undefined>(undefined);
  const [weekCount, setWeekCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const sub = liveQuery(() =>
      taskRepository.countCompletedSince(startOfUtcDay(now)),
    ).subscribe({
      next: setTodayCount,
      error: console.error,
    });
    return () => sub.unsubscribe();
  }, [now]);

  useEffect(() => {
    const sub = liveQuery(() =>
      taskRepository.countCompletedSince(now - 7 * DAY_MS),
    ).subscribe({
      next: setWeekCount,
      error: console.error,
    });
    return () => sub.unsubscribe();
  }, [now]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-accent-soft shadow-accent">
        <span className="font-display text-4xl text-accent">✓</span>
      </div>
      <h2 className="mt-7 font-display text-3xl text-ink">
        오늘은
        <br />
        여기까지.
      </h2>
      <p className="mt-4 font-body text-[17px] leading-relaxed text-ink-soft">
        할 일을 모두 비웠어요.
        <br />
        내일 아침에 다시 만나요.
      </p>
      <div className="mt-6 flex items-center gap-5">
        <div className="text-center">
          <div className="font-display text-2xl text-accent">
            {todayCount ?? "–"}
          </div>
          <div className="font-body text-[13px] text-ink-faint">오늘 완료</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <div className="font-display text-2xl text-calm">
            {weekCount ?? "–"}
          </div>
          <div className="font-body text-[13px] text-ink-faint">이번 주</div>
        </div>
      </div>
      <TextLinkButton className="mt-8" onClick={onCapture}>
        그래도 하나 더 담을래요
      </TextLinkButton>
    </div>
  );
}
