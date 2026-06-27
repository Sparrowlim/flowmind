// data/README.md — Settings Repository. 단일 행("singleton") 설정 read/update.

import { db, DEFAULT_SETTINGS, type StoredSettings } from "./db";

// liveQuery(() => get())의 querier로 쓰이므로 순수 읽기여야 한다 — Dexie는 liveQuery
// querier를 readonly 트랜잭션으로 실행해서, 안에서 쓰기(add/put)를 하면 add든 put이든
// ReadOnlyError("Readwrite transaction in liveQuery context")로 던져지고 구독이
// next 없이 끊긴다(settingsLoading이 영원히 true로 남는 버그). 시드는 ensureSeeded로 분리.
export async function get(): Promise<StoredSettings> {
  const existing = await db.settings.get("singleton");
  return existing ?? DEFAULT_SETTINGS;
}

// liveQuery 바깥(일반 readwrite 트랜잭션)에서 한 번만 호출하는 시드 함수.
// put(upsert)이라 동시에 여러 번 불려도 안전.
export async function ensureSeeded(): Promise<void> {
  const existing = await db.settings.get("singleton");
  if (!existing) await db.settings.put(DEFAULT_SETTINGS);
}

export async function update(
  patch: Partial<StoredSettings>,
  now: number,
): Promise<void> {
  await db.settings.update("singleton", { ...patch, updatedAt: now });
}
