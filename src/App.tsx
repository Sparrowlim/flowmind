// Phase 2 — 캡처→지금카드→집중→완료 핵심 루프. 콘텐츠는 항상 엔진(core/engine)이 결정,
// 내비게이션만 로컬 view state. 온보딩/체크인 게이트/설정/쪼개기/보관함은 Phase 3·4에서 추가.

import { useState } from "react";
import { pickNextCard } from "@core/engine/pickNextCard";
import { DEFAULT_CONFIG } from "@core/engine/config";
import type { Task, TaskId } from "@core/engine/types";
import { Capture } from "./screens/Capture";
import { CompletedInterstitial } from "./screens/CompletedInterstitial";
import { EmptyPlaceholder } from "./screens/EmptyPlaceholder";
import { Focus } from "./screens/Focus";
import { NowCard } from "./screens/NowCard";
import { useEngineDecision } from "./hooks/useEngineDecision";
import { useTasks } from "./hooks/useTasks";

type View = { kind: "engine" } | { kind: "focus"; taskId: TaskId } | { kind: "completed" };

function App() {
  const { tasks, loading, capture, startFocus, completeFocus, deferTask, refuseSplit } = useTasks();
  const [view, setView] = useState<View>({ kind: "engine" });
  const [captureOpen, setCaptureOpen] = useState(false);
  const [completedNext, setCompletedNext] = useState<Task | undefined>(undefined);

  const [now] = useState(() => Date.now());
  const decision = useEngineDecision(tasks, now);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-body text-ink-faint">
        불러오는 중…
      </div>
    );
  }

  const handleStart = async (id: TaskId) => {
    await startFocus(id);
    setView({ kind: "focus", taskId: id });
  };

  const handleComplete = async (id: TaskId, sessionElapsedSec: number) => {
    const remaining = tasks.filter((t) => t.id !== id);
    const nextDecision = pickNextCard(remaining, Date.now(), DEFAULT_CONFIG);
    setCompletedNext(
      nextDecision.kind === "card" ||
        nextDecision.kind === "new-greeting" ||
        nextDecision.kind === "auto-split"
        ? nextDecision.task
        : undefined,
    );
    await completeFocus(id, sessionElapsedSec);
    setView({ kind: "completed" });
  };

  function renderEngine() {
    switch (decision.kind) {
      case "card":
      case "new-greeting":
      case "auto-split":
        return (
          <NowCard
            decision={decision}
            now={now}
            onStart={handleStart}
            onDefer={deferTask}
            onRefuseSplit={refuseSplit}
          />
        );
      case "resume":
        return <Focus task={decision.task} onComplete={handleComplete} />;
      case "empty-all-done":
        return (
          <EmptyPlaceholder
            message="오늘은 여기까지. 다 비웠어요."
            onCapture={() => setCaptureOpen(true)}
          />
        );
      case "empty-dormant":
        return (
          <EmptyPlaceholder message="지금은 쉬어도 돼요." onCapture={() => setCaptureOpen(true)} />
        );
    }
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-[480px] bg-bg">
      {view.kind === "engine" && renderEngine()}
      {view.kind === "focus" &&
        (() => {
          const task = tasks.find((t) => t.id === view.taskId);
          return task ? <Focus task={task} onComplete={handleComplete} /> : null;
        })()}
      {view.kind === "completed" && (
        <CompletedInterstitial
          nextTask={completedNext}
          onContinue={() => setView({ kind: "engine" })}
          onStop={() => setView({ kind: "engine" })}
        />
      )}
      {view.kind === "engine" && (
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          aria-label="할 일 담기"
          className="fixed bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-2xl text-white shadow-accent"
        >
          +
        </button>
      )}
      {captureOpen && (
        <Capture onClose={() => setCaptureOpen(false)} onSubmit={capture} />
      )}
    </div>
  );
}

export default App;
