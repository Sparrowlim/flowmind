// Phase 2 — 화면 07(빠른 캡처). 제목만 필수, 마감·중요·예상시간은 선택(plan §2.2).
// 브레인덤프 모드(v1.7): 저장해도 시트를 닫지 않고 입력칸만 비워 연속 캡처를 받는다 —
// "담았으니 잊어도 된다"는 확인 문구가 작업기억을 비우는 신호 역할(닫기 버튼 누를 때까지 유지).

import { useEffect, useRef, useState } from "react";
import type { NewTaskInput } from "@data/local/taskRepository";
import { BottomSheet } from "../components/BottomSheet";
import { PrimaryButton, TextLinkButton } from "../components/Button";

const SAVED_FLASH_MS = 1500;

export function Capture({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: NewTaskInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [important, setImportant] = useState(false);
  const [estimateMin, setEstimateMin] = useState("");
  const [deadline, setDeadline] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!savedFlash) return;
    const id = setTimeout(() => setSavedFlash(false), SAVED_FLASH_MS);
    return () => clearTimeout(id);
  }, [savedFlash]);

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      important,
      estimateMin: estimateMin ? Number(estimateMin) : undefined,
      deadline: deadline ? new Date(deadline).getTime() : undefined,
    });
    setTitle("");
    setImportant(false);
    setEstimateMin("");
    setDeadline("");
    setSavedFlash(true);
    titleInputRef.current?.focus();
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-body text-[15px] font-bold tracking-wide text-accent-text">
          무엇이 떠올랐나요?
        </div>
        <span
          aria-live="polite"
          className={`font-body text-[13px] text-calm-text transition-opacity duration-500 ${
            savedFlash ? "opacity-100" : "opacity-0"
          }`}
        >
          담았어요 — 이제 잊어도 돼요
        </span>
      </div>
      <input
        ref={titleInputRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="할 일을 적어주세요"
        className="mt-3 w-full rounded-lg border border-border bg-bg px-4 py-4 font-display text-xl text-ink outline-none"
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setImportant((v) => !v)}
          className={`rounded-md px-3 py-2 font-body text-sm ${
            important
              ? "bg-accent-soft text-accent-text"
              : "border border-border bg-surface text-ink-soft"
          }`}
        >
          ＋ 중요
        </button>
        <input
          type="number"
          min={0}
          placeholder="예상 분"
          value={estimateMin}
          onChange={(e) => setEstimateMin(e.target.value)}
          className="w-24 rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink-soft outline-none"
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink-soft outline-none"
        />
      </div>
      <PrimaryButton className="mt-5" onClick={submit}>
        담아두기
      </PrimaryButton>
      <TextLinkButton className="mt-3" onClick={onClose}>
        됐어요
      </TextLinkButton>
    </BottomSheet>
  );
}
