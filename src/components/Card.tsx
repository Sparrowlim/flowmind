// Phase 2 — 흰 surface 카드(지금 카드 본문, 완료 인터스티셜의 "다음" 미리보기 등 공용).

import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-6 shadow-card ${className}`}
      {...props}
    />
  );
}
