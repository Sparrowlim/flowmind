// Phase 4 — 설정(10) 화면의 다크모드/한번에하나만 토글. 디자인의 둥근 알약 스위치.

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[58px] flex-none rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-surface shadow-card transition-transform ${
          checked ? "translate-x-[30px]" : "translate-x-1"
        }`}
      />
    </button>
  );
}
