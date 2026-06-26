// Phase 2 — 캡처(07) 등에서 쓰는 하단 시트. 배경 클릭 시 닫힘.

export function BottomSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full rounded-t-3xl bg-surface p-6 pb-8 shadow-card">
        <div className="mx-auto mb-5 h-[5px] w-[42px] rounded-full bg-border" />
        {children}
      </div>
    </div>
  );
}
