// data/README.md — Settings Repository. 단일 행("singleton") 설정 read/update.

import { db, DEFAULT_SETTINGS, type StoredSettings } from "./db";

export async function get(): Promise<StoredSettings> {
  const existing = await db.settings.get("singleton");
  if (existing) return existing;
  // put(upsert), not add() — StrictMode가 같은 liveQuery 콜백을 거의 동시에 두 번
  // 실행하면 두 호출 모두 "없음"을 보고 동시에 시드를 써넣으려 하는데, add()는
  // 중복 키에서 ConstraintError를 던져 liveQuery 구독이 next 없이 끊겨버린다
  // (settingsLoading이 영원히 true로 남는 버그). put은 같은 값을 덮어써도 안전.
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function update(
  patch: Partial<StoredSettings>,
  now: number,
): Promise<void> {
  await db.settings.update("singleton", { ...patch, updatedAt: now });
}
