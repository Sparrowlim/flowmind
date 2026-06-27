// Phase 2 — 화면 03(집중→완료). 일시정지(08, Paused.tsx)는 Phase 4에서 추가.

import { useEffect, useState } from "react";
import type { Task, TaskId } from "@core/engine/types";
import { SecondaryButton } from "../components/Button";
import { ProgressRing } from "../components/ProgressRing";

function formatElapsed(totalSec: number): string {
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function Focus({
  task,
  onComplete,
  onPause,
}: {
  task: Task;
  onComplete: (id: TaskId, sessionElapsedSec: number) => void;
  onPause: (id: TaskId, sessionElapsedSec: number) => void;
}) {
  const [sessionStart] = useState(() => Date.now());
  const [sessionElapsedSec, setSessionElapsedSec] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionElapsedSec(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);
  const totalSec = (task.accumulatedSec ?? 0) + sessionElapsedSec;
  const fraction = task.estimateMin ? totalSec / (task.estimateMin * 60) : 0.15;

  return (
    <div className="flex min-h-screen flex-col items-center px-8 pt-8">
      <div className="font-body text-[15px] tracking-widest text-ink-faint">
        집중 중
      </div>
      <h2 className="mt-3 text-center font-display text-xl leading-snug text-ink">
        {task.title}
      </h2>
      <div className="flex flex-1 items-center">
        <ProgressRing fraction={fraction}>
          <div className="font-display text-5xl tracking-wide text-ink">
            {formatElapsed(totalSec)}
          </div>
          <div className="mt-1 font-body text-sm text-ink-faint">경과 시간</div>
        </ProgressRing>
      </div>
      <button
        type="button"
        onClick={() => onComplete(task.id, sessionElapsedSec)}
        className="w-full rounded-lg px-5 py-[19px] text-center font-body text-lg font-bold"
        style={{ background: "var(--color-ink)", color: "var(--color-bg)" }}
      >
        다 했어요
      </button>
      <SecondaryButton
        className="mt-3 mb-10"
        onClick={() => onPause(task.id, sessionElapsedSec)}
      >
        잠깐 멈춤
      </SecondaryButton>
    </div>
  );
}
