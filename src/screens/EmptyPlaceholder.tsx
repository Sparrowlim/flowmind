// Phase 2 — empty-all-done/empty-dormant의 임시 화면. 정식 05/05C(통계·재우기 안내 등)는 Phase 3.

import { TextLinkButton } from "../components/Button";

export function EmptyPlaceholder({
  message,
  onCapture,
}: {
  message: string;
  onCapture: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
      <p className="font-display text-2xl text-ink">{message}</p>
      <TextLinkButton className="mt-6" onClick={onCapture}>
        새로 담을래요
      </TextLinkButton>
    </div>
  );
}
