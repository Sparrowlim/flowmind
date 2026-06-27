// Phase 3 — 화면 05C(쉬어가기, Decision 'empty-dormant'). 체크인 시각 표시는 Phase 4(설정)에서.

import { Badge } from "../components/Badge";
import { TextLinkButton } from "../components/Button";

export function EmptyDormant({ onWakeOne }: { onWakeOne: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-calm-soft text-4xl shadow-card">
        🌙
      </div>
      <h2 className="mt-7 font-display text-3xl text-ink">
        지금은
        <br />
        쉬어도 돼요.
      </h2>
      <p className="mt-4 font-body text-[17px] leading-relaxed text-ink-soft">
        남은 일은 모두 재워뒀어요.
        <br />
        다음 체크인 때 다시 보여줄게요.
      </p>
      <Badge variant="calm">다음 체크인 때 다시</Badge>
      <TextLinkButton className="mt-8" onClick={onWakeOne}>
        그래도 하나 볼래요
      </TextLinkButton>
    </div>
  );
}
