// Phase 4 — 화면 10(설정). 와이어프레임의 "강조색 테마/손그림"은 디자인 툴 전용 prop이라 제외하고,
// 실제 앱 토큰인 다크모드 토글로 대체. "알림"은 plan §2(범위 결정)에 따라 실제 푸시 없이 안내 텍스트만.

import type { StoredSettings } from "@data/local/db";
import { Switch } from "../components/Switch";

export function Settings({
  settings,
  onUpdate,
  onClose,
}: {
  settings: StoredSettings;
  onUpdate: (patch: Partial<StoredSettings>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg px-7 pt-7">
      <button
        type="button"
        onClick={onClose}
        className="self-start font-body text-base text-ink-soft"
      >
        ← 닫기
      </button>
      <h1 className="mt-4 font-display text-[28px] text-ink">설정</h1>

      <div className="mt-5 flex flex-col gap-3">
        <label className="flex items-center justify-between rounded-lg border border-border px-4 py-4">
          <div>
            <div className="font-body text-base font-bold text-ink">
              체크인 시간
            </div>
            <div className="font-body text-[13px] text-ink-faint">
              하루 한 번 봐드릴 시각
            </div>
          </div>
          <input
            type="time"
            value={settings.checkinTime}
            onChange={(e) => onUpdate({ checkinTime: e.target.value })}
            className="font-display text-lg text-accent-text outline-none"
          />
        </label>

        <div className="rounded-lg border border-border px-4 py-4">
          <div className="font-body text-base font-bold text-ink">알림</div>
          <div className="mt-1 font-body text-[13px] text-ink-faint">
            하루 1회, 체크인 시간에만 조용히 — 이 화면에서 끄거나 켤 수는
            없어요.
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-4">
          <div>
            <div className="font-body text-base font-bold text-ink">
              다크모드
            </div>
            <div className="font-body text-[13px] text-ink-faint">
              눈이 편한 어두운 화면
            </div>
          </div>
          <Switch
            label="다크모드"
            checked={settings.theme === "dark"}
            onChange={(next) => onUpdate({ theme: next ? "dark" : "light" })}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-4">
          <div>
            <div className="font-body text-base font-bold text-ink">
              한 번에 한 가지만 보기
            </div>
            <div className="font-body text-[13px] text-ink-faint">
              보관함 진입 버튼을 숨겨요
            </div>
          </div>
          <Switch
            label="한 번에 한 가지만 보기"
            checked={settings.oneAtATime}
            onChange={(next) => onUpdate({ oneAtATime: next })}
          />
        </div>
      </div>

      <div className="flex-1" />
      <div className="mb-8 text-center font-body text-[13px] text-ink-faint">
        계정·동기화 같은 무거운 설정은 여기 없어요
      </div>
    </div>
  );
}
