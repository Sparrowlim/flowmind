// Phase 4 — 설정(단일 행) liveQuery 구독 + 변이 래퍼. useTasks.ts와 같은 패턴.

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import * as settingsRepository from "@data/local/settingsRepository";
import type { StoredSettings } from "@data/local/db";

export function useSettings() {
  const [settings, setSettings] = useState<StoredSettings | undefined>(
    undefined,
  );

  useEffect(() => {
    settingsRepository.ensureSeeded();
    const subscription = liveQuery(() => settingsRepository.get()).subscribe({
      next: setSettings,
      error: console.error,
    });
    return () => subscription.unsubscribe();
  }, []);

  const update = async (patch: Partial<StoredSettings>) => {
    await settingsRepository.update(patch, Date.now());
  };

  return { settings, loading: settings === undefined, update };
}
