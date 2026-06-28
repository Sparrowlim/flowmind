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
    const subscription = liveQuery(() => taskRepository.listActive()).subscribe(
      {
        next: (result) => {
          setTasks(result);
          setNow(Date.now());
        },
        error: console.error,
      },
    );
    return () => subscription.unsubscribe();
  }, []);

  const capture = async (input: taskRepository.NewTaskInput) => {
    await taskRepository.create(input, Date.now());
  };

  const startFocus = async (id: TaskId) => {
    const now = Date.now();
    await taskRepository.update(id, transitions.startFocus(now), now);
  };

  const pauseFocus = async (id: TaskId, sessionElapsedSec: number) => {
    const task = await taskRepository.get(id);
    if (!task) return;
    const now = Date.now();
    await taskRepository.update(
      id,
      transitions.pauseFocus(task, now, sessionElapsedSec),
      now,
    );
  };

  const resumeFocus = async (id: TaskId) => {
    await taskRepository.update(id, transitions.resumeFocus(), Date.now());
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

  // 쪼개기 수락(02-1·04 공용) — 부모 회피카운터 리셋 + 1~3개 자식 생성(풀에 추가).
  // 부모는 active 자식이 남아있는 동안 엔진이 자동으로 후보 제외(core/engine/pickNextCard).
  // 첫 자식 즉시 시작 여부는 호출부 선택(쪼개기 화면의 "시작"/"나중에" 두 갈래, plan §2.4 주도권 원칙).
  const acceptSplit = async (parentId: TaskId, stepTitles: string[]) => {
    const parent = await taskRepository.get(parentId);
    if (!parent || stepTitles.length === 0) return undefined;
    const now = Date.now();
    const childIds = stepTitles.map(() => crypto.randomUUID());
    const { parentPatch, children } = transitions.acceptSplit(
      parent,
      stepTitles,
      childIds,
      now,
    );
    await taskRepository.update(parentId, parentPatch, now);
    for (const child of children) await taskRepository.insert(child, now);
    return childIds[0]!;
  };

  const acceptSplitAndStart = async (
    parentId: TaskId,
    stepTitles: string[],
  ) => {
    const firstChildId = await acceptSplit(parentId, stepTitles);
    if (!firstChildId) return undefined;
    await taskRepository.update(
      firstChildId,
      transitions.startFocus(Date.now()),
      Date.now(),
    );
    return firstChildId;
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
    const now = Date.now();
    await taskRepository.update(
      id,
      { dormantUntil: now, dormantReason: undefined },
      now,
    );
  };

  // 보관함 "지금 이거 할래" — 깨우기 + 즉시 집중 시작을 한 동작으로(싼 되돌리기 원칙).
  const wakeAndStart = async (id: TaskId) => {
    await wakeNow(id);
    await startFocus(id);
  };

  return {
    tasks: tasks ?? [],
    loading: tasks === undefined,
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
  };
}
