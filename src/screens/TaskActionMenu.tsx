// Phase 3 — 화면 09(수정·삭제·보관 ···메뉴). NowCard 헤더의 "···"에서 진입.

import { useState } from "react";
import type { Task, TaskId } from "@core/engine/types";
import { BottomSheet } from "../components/BottomSheet";
import { PrimaryButton } from "../components/Button";

export function TaskActionMenu({
  task,
  onClose,
  onEditTitle,
  onArchive,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onEditTitle: (id: TaskId, title: string) => void;
  onArchive: (id: TaskId) => void;
  onDelete: (id: TaskId) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  if (editing) {
    return (
      <BottomSheet onClose={onClose}>
        <div className="font-body text-[15px] font-bold tracking-wide text-accent-text">
          제목 수정
        </div>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-3 w-full rounded-lg border border-border bg-bg px-4 py-4 font-display text-xl text-ink outline-none"
        />
        <PrimaryButton
          className="mt-5"
          disabled={!title.trim()}
          onClick={() => {
            onEditTitle(task.id, title.trim());
            onClose();
          }}
        >
          저장
        </PrimaryButton>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet onClose={onClose}>
      <div className="pb-2 text-center font-body text-[13px] text-ink-faint">
        이 일을 어떻게 할까요?
      </div>
      <div className="flex flex-col divide-y divide-border border-t border-border">
        <button
          type="button"
          className="py-4 text-center font-body text-lg text-ink"
          onClick={() => setEditing(true)}
        >
          제목 수정하기
        </button>
        <button
          type="button"
          className="py-4 text-center font-body text-lg text-calm-text"
          onClick={() => {
            onArchive(task.id);
            onClose();
          }}
        >
          보관함으로 보내기
        </button>
        <button
          type="button"
          className="py-4 text-center font-body text-lg text-accent-text"
          onClick={() => {
            onDelete(task.id);
            onClose();
          }}
        >
          삭제하기
        </button>
      </div>
    </BottomSheet>
  );
}
