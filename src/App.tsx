// 캡처→지금카드→집중→완료 핵심 루프(Phase 2) + 쪼개기/빈 상태/보관함/···메뉴(Phase 3)
// + 온보딩/일일 체크인 게이트/일시정지·재개/설정·다크모드(Phase 4).
// 콘텐츠는 항상 엔진(core/engine)이 결정, 내비게이션만 로컬 view state.

import { useEffect, useState } from "react";
import { pickNextCard } from "@core/engine/pickNextCard";
import { DEFAULT_CONFIG } from "@core/engine/config";
import type { Task, TaskId } from "@core/engine/types";
import { Archive } from "./screens/Archive";
import { AutoSplitSuggestion } from "./screens/AutoSplitSuggestion";
import { Capture } from "./screens/Capture";
import { CheckIn } from "./screens/CheckIn";
import { CheckInSkipped } from "./screens/CheckInSkipped";
import { CompletedInterstitial } from "./screens/CompletedInterstitial";
import { EmptyAllDone } from "./screens/EmptyAllDone";
import { EmptyDormant } from "./screens/EmptyDormant";
import { Focus } from "./screens/Focus";
import { NowCard } from "./screens/NowCard";
import { Onboarding } from "./screens/Onboarding";
import { Paused } from "./screens/Paused";
import { Settings } from "./screens/Settings";
import { SplitFirstStep } from "./screens/SplitFirstStep";
import { TaskActionMenu } from "./screens/TaskActionMenu";
import { useEngineDecision } from "./hooks/useEngineDecision";
import { useSettings } from "./hooks/useSettings";
import { useTasks } from "./hooks/useTasks";
import {
  isDismissedToday,
  needsCheckin,
  todayUtcDateString,
} from "./lib/checkin";

type View =
  | { kind: "engine" }
  | { kind: "focus"; taskId: TaskId }
  | { kind: "completed" }
  | { kind: "split"; taskId: TaskId };

function App() {
  const {
    tasks,
    loading: tasksLoading,
    now,
    capture,
    startFocus,
    pauseFocus,
    resumeFocus,
    completeFocus,
    deferTask,
    refuseSplit,
    acceptSplit,
    acceptSplitAndStart,
    editTitle,
    manualArchive,
    softDelete,
    wakeNow,
    wakeAndStart,
  } = useTasks();
  const {
    settings,
    loading: settingsLoading,
    update: updateSettings,
  } = useSettings();
  const [view, setView] = useState<View>({ kind: "engine" });
  const [captureOpen, setCaptureOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  // 쪼개기 부모(자식 완료까지 차단, core/engine/pickNextCard와 동일 조건) — 보관함에서 진행도로 보여줄 대상.
  const splittingParents = tasks
    .filter((t) => t.state !== "done" && !t.parentId)
    .map((parent) => ({
      parent,
      children: tasks.filter((c) => c.parentId === parent.id),
    }))
    .filter(({ children }) => children.some((c) => c.state !== "done"));

  const theme = settings?.theme;
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (tasksLoading || settingsLoading || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center font-body text-ink-faint">
        불러오는 중…
      </div>
    );
  }

  if (!settings.onboarded) {
    return (
      <div className="relative mx-auto min-h-screen max-w-[480px] bg-bg">
        <Onboarding
          onComplete={async ({ title, checkinTime }) => {
            if (title) await capture({ title });
            await updateSettings({
              onboarded: true,
              checkinTime,
              lastCheckinDate: todayUtcDateString(Date.now()),
            });
          }}
        />
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

  // 쪼개기 "만들어두고 나중에" — 자식만 생성, 즉시 시작은 사용자 선택이 아니므로 강제하지 않음.
  const handleSplitLater = async (parentId: TaskId, stepTitles: string[]) => {
    await acceptSplit(parentId, stepTitles);
    setView({ kind: "engine" });
  };

  const handleWakeAndStart = async (id: TaskId) => {
    await wakeAndStart(id);
    setArchiveOpen(false);
    setView({ kind: "focus", taskId: id });
  };

  const handleWakeToEngine = async (id: TaskId) => {
    await wakeNow(id);
    setArchiveOpen(false);
  };

  const handlePause = async (id: TaskId, sessionElapsedSec: number) => {
    await pauseFocus(id, sessionElapsedSec);
    setView({ kind: "engine" });
  };

  const handleResume = async (id: TaskId) => {
    await resumeFocus(id);
    setView({ kind: "focus", taskId: id });
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
        return <Paused task={decision.task} onResume={handleResume} />;
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

  const checkinNeeded = needsCheckin(settings, now);
  const todaySkipped = isDismissedToday(settings, now);
  const gated = checkinNeeded || todaySkipped;
  const checkedInToday = () =>
    updateSettings({ lastCheckinDate: todayUtcDateString(Date.now()) });
  // 캡처는 "지금 카드/빈 상태/체크인 게이트"에서 항상 닿아야 한다(빠른 캡처가 MVP 심장 — 체크인이
  // 막아선 안 됨). 집중 중·쪼개기 제안 중·일시정지 중에만 숨겨 몰입과 회피 개입을 보호한다.
  const captureVisible =
    view.kind === "engine" &&
    (gated || (decision.kind !== "auto-split" && decision.kind !== "resume"));

  return (
    <div className="relative mx-auto min-h-screen max-w-[480px] bg-bg">
      {view.kind === "engine" && checkinNeeded && (
        <CheckIn
          decision={decision}
          onCheckIn={checkedInToday}
          onSkipToday={() =>
            updateSettings({ dismissedToday: todayUtcDateString(Date.now()) })
          }
        />
      )}
      {view.kind === "engine" && !checkinNeeded && todaySkipped && (
        <CheckInSkipped onOverride={checkedInToday} />
      )}
      {view.kind === "engine" && !gated && renderEngine()}
      {view.kind === "split" &&
        (() => {
          const task = tasks.find((t) => t.id === view.taskId);
          return task ? (
            <SplitFirstStep
              task={task}
              onCancel={() => setView({ kind: "engine" })}
              onStartNow={handleSplitSubmit}
              onSaveForLater={handleSplitLater}
            />
          ) : null;
        })()}
      {view.kind === "focus" &&
        (() => {
          const task = tasks.find((t) => t.id === view.taskId);
          return task ? (
            <Focus
              task={task}
              onComplete={handleComplete}
              onPause={handlePause}
            />
          ) : null;
        })()}
      {view.kind === "completed" && (
        <CompletedInterstitial
          nextTask={completedNext}
          onContinue={() => setView({ kind: "engine" })}
          onStop={() => setView({ kind: "engine" })}
        />
      )}
      {view.kind === "engine" && !gated && (
        // top-right는 NowCard 자체의 "···" 메뉴 자리라 비워둠(겹침 방지).
        <div className="fixed top-6 left-6 z-40 flex items-center gap-3 font-body text-sm text-ink-faint">
          {!settings.oneAtATime && (
            <button type="button" onClick={() => setArchiveOpen(true)}>
              보관함
              {dormantTasks.length > 0 ? ` (${dormantTasks.length})` : ""}
            </button>
          )}
          <button
            type="button"
            aria-label="설정"
            onClick={() => setSettingsOpen(true)}
          >
            설정
          </button>
        </div>
      )}
      {captureVisible && (
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          aria-label="할 일 담기"
          className="fixed right-6 bottom-8 z-40 flex items-center gap-2 rounded-full border border-accent-soft bg-surface px-5 py-3 font-body text-base font-bold text-accent-text shadow-card"
        >
          <span aria-hidden className="font-display text-lg leading-none">
            ＋
          </span>
          담아두기
        </button>
      )}
      {captureOpen && (
        <Capture onClose={() => setCaptureOpen(false)} onSubmit={capture} />
      )}
      {archiveOpen && (
        <Archive
          dormantTasks={dormantTasks}
          splittingParents={splittingParents}
          now={now}
          onClose={() => setArchiveOpen(false)}
          onWakeAndStart={handleWakeAndStart}
          onWakeToEngine={handleWakeToEngine}
        />
      )}
      {settingsOpen && (
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {taskMenuTask && (
        <TaskActionMenu
          task={taskMenuTask}
          onClose={() => setTaskMenuTaskId(null)}
          onEditTitle={editTitle}
          onArchive={manualArchive}
          onDelete={softDelete}
        />
      )}
    </div>
  );
}

export default App;
