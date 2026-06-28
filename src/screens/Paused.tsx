// Phase 4 — 화면 08(잠깐 멈춤 → 재개). engine-spec GATE-RESUME(S1)은 일시정지된 task를 항상
// 최우선으로 다시 서빙하므로, "이어서 하기"를 직접 누르기 전까진 절대 타이머가 자동 재생되지 않게
// 이 화면이 'resume' Decision의 단독 렌더 대상이 된다(Focus를 바로 마운트하지 않음).
// 와이어프레임의 "나중에 이어서(풀에 보관)" 버튼은 의도적으로 생략 — GATE-RESUME이 항상 최우선이라
// 다른 화면으로 갈 곳이 없고, 눌러도 이 화면이 그대로 다시 보일 뿐이라 의미가 없음.

import type { Task, TaskId } from "@core/engine/types";
import { PrimaryButton } from "../components/Button";

function formatElapsed(totalSec: number): string {
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function Paused({
  task,
  onResume,
}: {
  task: Task;
  onResume: (id: TaskId) => void;
}) {
  const totalSec = task.accumulatedSec ?? 0;

  return (
    <div className="flex min-h-screen flex-col items-center px-8 pt-16">
      <div className="inline-flex items-center gap-2 rounded-md border border-dashed border-ink-faint px-3 py-1 font-body text-sm text-ink-faint">
        ⏸ 멈춤
      </div>
      <h2 className="mt-4 text-center font-display text-xl leading-snug text-ink-soft">
        {task.title}
      </h2>
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <div className="font-display text-5xl tracking-wide text-ink-faint">
          {formatElapsed(totalSec)}
        </div>
        <div className="font-body text-sm text-ink-faint">
          여기서부터 이어서 할 수 있어요
        </div>
      </div>
      <PrimaryButton className="mb-24" onClick={() => onResume(task.id)}>
        ▶ 이어서 하기
      </PrimaryButton>
    </div>
  );
}
