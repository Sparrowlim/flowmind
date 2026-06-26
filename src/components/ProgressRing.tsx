// Phase 2 — 집중 화면(03)의 원형 경과시간 표시. conic-gradient는 동적 비율이라 인라인 style 필요.

export function ProgressRing({
  fraction,
  children,
}: {
  fraction: number; // 0~1
  children: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;

  return (
    <div
      className="flex h-[236px] w-[236px] items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--color-accent) 0% ${pct}%, var(--color-border) ${pct}% 100%)`,
      }}
    >
      <div className="flex h-[196px] w-[196px] flex-col items-center justify-center rounded-full bg-bg shadow-[inset_0_2px_8px_rgb(60_45_30_/_0.06)]">
        {children}
      </div>
    </div>
  );
}
