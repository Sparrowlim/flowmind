// data/README.md — Dexie(IndexedDB) 스키마. core 타입(Task)만 참조, UI 의존 0.
// E1(ADR-0002 §5): 동기화 친화 — updatedAt 전체, deletedAt?(soft delete), schemaVersion.

import Dexie, { type EntityTable } from "dexie";
import type { Task, TaskId } from "@core/engine/types";

export interface StoredTask extends Task {
  updatedAt: number;
  deletedAt?: number;
  schemaVersion: 1;
}

export type SettingsId = "singleton";

export interface StoredSettings {
  id: SettingsId;
  checkinTime: string; // "HH:MM", 24h
  theme: "light" | "dark";
  onboarded: boolean;
  oneAtATime: boolean;
  lastCheckinDate?: string; // UTC YYYY-MM-DD
  dismissedToday?: string; // UTC YYYY-MM-DD — "오늘은 쉬어갈래요"/"쉬어가기" dismissal
  updatedAt: number;
  schemaVersion: 1;
}

export const DEFAULT_SETTINGS: StoredSettings = {
  id: "singleton",
  checkinTime: "09:00",
  theme: "light",
  onboarded: false,
  // v1.6 - archive is now a core safety valve; default must not hide its entry point.
  // "one at a time" stays available in Settings as an opt-in extreme-minimal mode.
  oneAtATime: false,
  updatedAt: 0,
  schemaVersion: 1,
};

class FlowmindDB extends Dexie {
  tasks!: EntityTable<StoredTask, "id">;
  settings!: EntityTable<StoredSettings, "id">;

  constructor() {
    super("flowmind");
    this.version(1).stores({
      tasks: "id, state, dormantUntil, deletedAt, parentId",
      settings: "id",
    });
  }
}

export const db = new FlowmindDB();
export type { Task, TaskId };
