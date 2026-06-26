// data/README.md — Settings Repository. 단일 행("singleton") 설정 read/update.

import { db, DEFAULT_SETTINGS, type StoredSettings } from './db';

export async function get(): Promise<StoredSettings> {
  const existing = await db.settings.get('singleton');
  if (existing) return existing;
  await db.settings.add(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function update(patch: Partial<StoredSettings>, now: number): Promise<void> {
  await db.settings.update('singleton', { ...patch, updatedAt: now });
}
