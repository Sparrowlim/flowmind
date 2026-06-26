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

  useEffect(() => {
    const subscription = liveQuery(() => taskRepository.listActive()).subscribe({
      next: setTasks,
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
    await taskRepository.update(id, transitions.completeFocus(task, now, sessionElapsedSec), now);
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
    await taskRepository.update(id, transitions.refuseSplit(task, now, DEFAULT_CONFIG), now);
  };

  return {
    tasks: tasks ?? [],
    loading: tasks === undefined,
    capture,
    startFocus,
    completeFocus,
    deferTask,
    refuseSplit,
  };
}
