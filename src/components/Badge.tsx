// Phase 2 — "왜 지금?" / "n번째 미룸" 등 점 + 텍스트 배지. accent(주황)·calm(녹색) 2가지.

export function Badge({
  variant = "accent",
  children,
}: {
  variant?: "accent" | "calm";
  children: React.ReactNode;
}) {
  const bg = variant === "accent" ? "bg-accent-soft" : "bg-calm-soft";
  const dot = variant === "accent" ? "bg-accent" : "bg-calm";
  const text = variant === "accent" ? "text-accent-text" : "text-calm-text";

  return (
    <div className={`inline-flex items-center gap-2 rounded-md px-3 py-2 ${bg}`}>
      <span className={`h-[7px] w-[7px] rounded-full ${dot}`} />
      <span className={`font-body text-sm ${text}`}>{children}</span>
    </div>
  );
}
