// data/README.md — Task Repository. core 타입(Task)만 참조, UI 의존 0.

import type { Task, TaskId } from "@core/engine/types";
import { db, type StoredTask } from "./db";

function toTask(stored: StoredTask): Task {
  const {
    id,
    title,
    parentId,
    deadline,
    important,
    estimateMin,
    createdAt,
    lastServedAt,
    deferCount,
    splitRefuseCount,
    state,
    dormantUntil,
    dormantReason,
    focusPausedAt,
    accumulatedSec,
  } = stored;
  return {
    id,
    title,
    parentId,
    deadline,
    important,
    estimateMin,
    createdAt,
    lastServedAt,
    deferCount,
    splitRefuseCount,
    state,
    dormantUntil,
    dormantReason,
    focusPausedAt,
    accumulatedSec,
  };
}

export async function listActive(): Promise<Task[]> {
  const rows = await db.tasks
    .filter((t) => t.deletedAt === undefined)
    .toArray();
  return rows.map(toTask);
}

export async function get(id: TaskId): Promise<Task | undefined> {
  const row = await db.tasks.get(id);
  return row && row.deletedAt === undefined ? toTask(row) : undefined;
}

export interface NewTaskInput {
  title: string;
  deadline?: number;
  important?: boolean;
  estimateMin?: number;
}

export async function create(input: NewTaskInput, now: number): Promise<Task> {
  const task: StoredTask = {
    id: crypto.randomUUID(),
    title: input.title,
    deadline: input.deadline,
    important: input.important ?? false,
    estimateMin: input.estimateMin,
    createdAt: now,
    deferCount: 0,
    splitRefuseCount: 0,
    state: "active",
    updatedAt: now,
    schemaVersion: 1,
  };
  await db.tasks.add(task);
  return toTask(task);
}

// 쪼개기 자식처럼 core/state가 이미 완성된 Task를 만든 경우 그대로 저장.
export async function insert(task: Task, now: number): Promise<void> {
  await db.tasks.add({ ...task, updatedAt: now, schemaVersion: 1 });
}

export async function update(
  id: TaskId,
  patch: Partial<Task>,
  now: number,
): Promise<void> {
  await db.tasks.update(id, { ...patch, updatedAt: now });
}

export async function softDelete(id: TaskId, now: number): Promise<void> {
  await db.tasks.update(id, { deletedAt: now, updatedAt: now });
}

// 보관함(06) 목록용 — 활성 상태이며 재우기 중인 task(dormantUntil > now).
export async function listDormant(now: number): Promise<Task[]> {
  const rows = await db.tasks
    .filter(
      (t) =>
        t.deletedAt === undefined &&
        t.dormantUntil !== undefined &&
        t.dormantUntil > now,
    )
    .toArray();
  return rows.map(toTask);
}

// 완료 통계(05 비움 화면)용 — done 전환 시점 ≈ 마지막 updatedAt(완료 후 더 변경 안 됨).
export async function countCompletedSince(since: number): Promise<number> {
  return db.tasks
    .filter((t) => t.state === "done" && t.updatedAt >= since)
    .count();
}
