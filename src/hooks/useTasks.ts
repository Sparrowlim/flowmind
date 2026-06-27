// Phase 2 — task 목록 + 변이(core/state 호출 → data/local 영속화)를 한 곳에 모은 훅.
// Dexie liveQuery로 구독 → 변이 후 수동 refresh 불필요(react-hooks 순수성 규칙과도 합치).

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import * as transitions from "@core/state/transitions";
import { DEFAULT_CONFIG } from "@core/engine/config";
import type { Task, TaskId } from "@core/engine/types";
import * as taskRepository from "@data/local/taskRepository";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined);
  // tasks 갱신 시점의 시각. 렌더 중 Date.now()를 직접 부르면 안 되므로(react-hooks 순수성
  // 규칙) liveQuery 콜백(=데이터가 실제로 바뀐 시점)에서만 함께 갱신한다.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const subscription = liveQuery(() => taskRepository.listActive()).subscribe({
      next: (result) => {
        setTasks(result);
        setNow(Date.now());
      },
      error: console.error,
    });
    return () => subscription.unsubscribe();
  }, []);

  const capture = async (input: taskRepository.NewTaskInput) => {
    await taskRepository.create(input, Date.now());
  };

  const startFocus = async (id: TaskId) => {
    const now = Date.now();
    await taskRepository.update(id, transitions.startFocus(now), now);
  };

  const completeFocus = async (id: TaskId, sessionElapsedSec: number) => {
    const task = await taskRepository.get(id);
    if (!task) return;
    const now = Date.now();
    await taskRepository.update(
      id,
      transitions.completeFocus(task, now, sessionElapsedSec),
      now,
    );
  };

  const deferTask = async (id: TaskId) => {
    const task = await taskRepository.get(id);
    if (!task) return;
    const now = Date.now();
    await taskRepository.update(id, transitions.deferTask(task, now), now);
  };

  const refuseSplit = async (id: TaskId) => {
    const task = await taskRepository.get(id);
    if (!task) return;
    const now = Date.now();
    await taskRepository.update(
      id,
      transitions.refuseSplit(task, now, DEFAULT_CONFIG),
      now,
    );
  };

  // 쪼개기 수락(02-1·04 공용) — 부모 회피카운터 리셋 + 자식 생성 + 자식 바로 집중 시작.
  const acceptSplitAndStart = async (parentId: TaskId, firstStepTitle: string) => {
    const parent = await taskRepository.get(parentId);
    if (!parent) return undefined;
    const now = Date.now();
    const childId = crypto.randomUUID();
    const { parentPatch, child } = transitions.acceptSplit(parent, firstStepTitle, childId, now);
    await taskRepository.update(parentId, parentPatch, now);
    await taskRepository.insert(child, now);
    await taskRepository.update(childId, transitions.startFocus(now), now);
    return childId;
  };

  const editTitle = async (id: TaskId, title: string) => {
    await taskRepository.update(id, transitions.editTitle(title), Date.now());
  };

  const manualArchive = async (id: TaskId) => {
    const now = Date.now();
    await taskRepository.update(id, transitions.manualArchive(now), now);
  };

  const softDelete = async (id: TaskId) => {
    await taskRepository.softDelete(id, Date.now());
  };

  // 보관함 "그래도 하나 볼래요" / 비움 "그래도 하나 볼래요" — 재우기를 즉시 해제.
  const wakeNow = async (id: TaskId) => {
    await taskRepository.update(id, { dormantUntil: Date.now() }, Date.now());
  };

  return {
    tasks: tasks ?? [],
    loading: tasks === undefined,
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
  };
}
