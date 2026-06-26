// Phase 2 — 디자인 목업에서 반복되는 버튼 3종(주/보조/텍스트링크).

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`w-full rounded-lg bg-accent px-5 py-[19px] text-center font-body text-lg font-bold text-white shadow-accent ${className}`}
      {...props}
    />
  );
}

export function SecondaryButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`w-full rounded-md border border-border bg-surface px-4 py-[15px] text-center font-body text-base text-ink-soft ${className}`}
      {...props}
    />
  );
}

export function TextLinkButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`w-full text-center font-body text-[15px] text-ink-faint ${className}`}
      {...props}
    />
  );
}
