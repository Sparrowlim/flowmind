// Phase 4 — "오늘은 쉬어갈래요"를 누른 뒤 보여주는 화면. 01 체크인 게이트의 결과 상태이며
// EmptyDormant(05C)와 톤은 같지만 "전부 재움"이 아니라 "오늘 스스로 쉬기로 함"이라 카피가 다름.

import { TextLinkButton } from "../components/Button";

export function CheckInSkipped({ onOverride }: { onOverride: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-calm-soft text-4xl shadow-card">
        🌙
      </div>
      <h2 className="mt-7 font-display text-3xl text-ink">
        오늘은
        <br />
        쉬어가기로 했어요.
      </h2>
      <p className="mt-4 font-body text-[17px] leading-relaxed text-ink-soft">
        내일 체크인 때 다시 만나요.
      </p>
      <TextLinkButton className="mt-8" onClick={onOverride}>
        그래도 지금 볼래요
      </TextLinkButton>
    </div>
  );
}
