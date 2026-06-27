// 캡처→지금카드→집중→완료 핵심 루프(Phase 2) + 쪼개기/빈 상태/보관함/···메뉴(Phase 3).
// 콘텐츠는 항상 엔진(core/engine)이 결정, 내비게이션만 로컬 view state.
// 온보딩/체크인 게이트/설정은 Phase 4에서 추가.

import { useState } from "react";
import { pickNextCard } from "@core/engine/pickNextCard";
import { DEFAULT_CONFIG } from "@core/engine/config";
import type { Task, TaskId } from "@core/engine/types";
import { Archive } from "./screens/Archive";
import { AutoSplitSuggestion } from "./screens/AutoSplitSuggestion";
import { Capture } from "./screens/Capture";
import { CompletedInterstitial } from "./screens/CompletedInterstitial";
import { EmptyAllDone } from "./screens/EmptyAllDone";
import { EmptyDormant } from "./screens/EmptyDormant";
import { Focus } from "./screens/Focus";
import { NowCard } from "./screens/NowCard";
import { SplitFirstStep } from "./screens/SplitFirstStep";
import { TaskActionMenu } from "./screens/TaskActionMenu";
import { useEngineDecision } from "./hooks/useEngineDecision";
import { useTasks } from "./hooks/useTasks";

type View =
  | { kind: "engine" }
  | { kind: "focus"; taskId: TaskId }
  | { kind: "completed" }
  | { kind: "split"; taskId: TaskId };

function App() {
  const {
    tasks,
    loading,
    now,
    capture,
    startFocus,
    completeFocus,
    deferTask,
    refuseSplit,
    acceptSplitAndStart,
    editTitle,
    manualArchive,
    softDelete,
    wakeNow,
  } = useTasks();
  const [view, setView] = useState<View>({ kind: "engine" });
  const [captureOpen, setCaptureOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [taskMenuTaskId, setTaskMenuTaskId] = useState<TaskId | null>(null);
  const [completedNext, setCompletedNext] = useState<Task | undefined>(
    undefined,
  );

  const decision = useEngineDecision(tasks, now);
  const dormantTasks = tasks.filter(
    (t) =>
      t.state !== "done" &&
      t.dormantUntil !== undefined &&
      t.dormantUntil > now,
  );

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
      nextDecision.kind === "card" || nextDecision.kind === "new-greeting"
        ? nextDecision.task
        : undefined,
    );
    await completeFocus(id, sessionElapsedSec);
    setView({ kind: "completed" });
  };

  const handleSplitSubmit = async (parentId: TaskId, stepTitles: string[]) => {
    const childId = await acceptSplitAndStart(parentId, stepTitles);
    if (childId) setView({ kind: "focus", taskId: childId });
  };

  const handleWakeOne = async () => {
    const earliest = dormantTasks
      .filter((t) => t.dormantUntil !== undefined)
      .sort((a, b) => a.dormantUntil! - b.dormantUntil!)[0];
    if (earliest) await wakeNow(earliest.id);
  };

  function renderEngine() {
    switch (decision.kind) {
      case "card":
      case "new-greeting":
        return (
          <NowCard
            decision={decision}
            now={now}
            onStart={handleStart}
            onDefer={deferTask}
            onSplit={(id) => setView({ kind: "split", taskId: id })}
            onOpenMenu={setTaskMenuTaskId}
          />
        );
      case "auto-split":
        return (
          <AutoSplitSuggestion
            task={decision.task}
            onAccept={handleSplitSubmit}
            onStartAnyway={handleStart}
            onSkip={refuseSplit}
          />
        );
      case "resume":
        return <Focus task={decision.task} onComplete={handleComplete} />;
      case "empty-all-done":
        return (
          <EmptyAllDone now={now} onCapture={() => setCaptureOpen(true)} />
        );
      case "empty-dormant":
        return <EmptyDormant onWakeOne={handleWakeOne} />;
    }
  }

  const taskMenuTask = taskMenuTaskId
    ? tasks.find((t) => t.id === taskMenuTaskId)
    : undefined;

  return (
    <div className="relative mx-auto min-h-screen max-w-[480px] bg-bg">
      {view.kind === "engine" && renderEngine()}
      {view.kind === "split" &&
        (() => {
          const task = tasks.find((t) => t.id === view.taskId);
          return task ? (
            <SplitFirstStep task={task} onSubmit={handleSplitSubmit} />
          ) : null;
        })()}
      {view.kind === "focus" &&
        (() => {
          const task = tasks.find((t) => t.id === view.taskId);
          return task ? (
            <Focus task={task} onComplete={handleComplete} />
          ) : null;
        })()}
      {view.kind === "completed" && (
        <CompletedInterstitial
          nextTask={completedNext}
          onContinue={() => setView({ kind: "engine" })}
          onStop={() => setView({ kind: "engine" })}
        />
      )}
      {view.kind === "engine" && (
        <>
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="fixed top-6 left-6 z-40 font-body text-sm text-ink-faint"
          >
            보관함{dormantTasks.length > 0 ? ` (${dormantTasks.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setCaptureOpen(true)}
            aria-label="할 일 담기"
            className="fixed right-6 bottom-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent font-display text-2xl text-white shadow-accent"
          >
            +
          </button>
        </>
      )}
      {captureOpen && (
        <Capture onClose={() => setCaptureOpen(false)} onSubmit={capture} />
      )}
      {archiveOpen && (
        <Archive
          tasks={dormantTasks}
          now={now}
          onClose={() => setArchiveOpen(false)}
        />
      )}
      {taskMenuTask && (
        <TaskActionMenu
          task={taskMenuTask}
          onClose={() => setTaskMenuTaskId(null)}
          onEditTitle={editTitle}
          onDefer={deferTask}
          onArchive={manualArchive}
          onDelete={softDelete}
        />
      )}
    </div>
  );
}

export default App;
