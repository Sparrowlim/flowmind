// engine-flow.md ②③ — 상태 전이(시작/일시정지/완료/미룸/쪼개기/보관/수정).
// core 규칙: 아무것도 import 안 함(타입+age 헬퍼만 제외), now는 인자로 주입, 순수 함수만.

import { startOfNextUtcDay } from "../engine/age";
import type { EngineConfig, Task, TaskId } from "../engine/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const LONG_DORMANT_MS = 7 * DAY_MS; // 자동쪼개기 2회 거부 → 장기 재우기(plan §2.4)
const ARCHIVE_DORMANT_MS = 30 * DAY_MS; // 수동 "보관함으로 보내기"

export function startFocus(
  now: number,
): Pick<Task, "state" | "focusPausedAt" | "lastServedAt"> {
  return { state: "focus", focusPausedAt: undefined, lastServedAt: now };
}

// sessionElapsedSec: 이번 집중 세션에서 흐른 시간(UI가 now - 세션시작 으로 계산해 전달).
export function pauseFocus(
  task: Task,
  now: number,
  sessionElapsedSec: number,
): Pick<Task, "focusPausedAt" | "accumulatedSec"> {
  return {
    focusPausedAt: now,
    accumulatedSec: (task.accumulatedSec ?? 0) + sessionElapsedSec,
  };
}

export function resumeFocus(): Pick<Task, "focusPausedAt"> {
  return { focusPausedAt: undefined };
}

export function completeFocus(
  task: Task,
  _now: number,
  sessionElapsedSec: number,
): Pick<Task, "state" | "focusPausedAt" | "accumulatedSec" | "deferCount"> {
  return {
    state: "done",
    focusPausedAt: undefined,
    accumulatedSec: (task.accumulatedSec ?? 0) + sessionElapsedSec,
    deferCount: 0,
  };
}

// "이따 다시" / 일반 거부. 나이 리셋 + 미룸 횟수 +1. 스누즈는 다음 체크인까지(plan §2.2·age.ts startOfNextUtcDay).
export function deferTask(
  task: Task,
  now: number,
): Pick<Task, "deferCount" | "lastServedAt" | "dormantUntil"> {
  return {
    deferCount: task.deferCount + 1,
    lastServedAt: now,
    dormantUntil: startOfNextUtcDay(now),
  };
}

// 자동쪼개기 화면의 "지금은 넘어갈래". splitRefuseMax 도달 시 장기 재우기 + 카운터 리셋(= 루프 종결, plan §2.4).
export function refuseSplit(
  task: Task,
  now: number,
  cfg: EngineConfig,
): Pick<
  Task,
  "deferCount" | "splitRefuseCount" | "lastServedAt" | "dormantUntil"
> {
  const nextRefuseCount = task.splitRefuseCount + 1;
  if (nextRefuseCount >= cfg.splitRefuseMax) {
    return {
      deferCount: 0,
      splitRefuseCount: 0,
      lastServedAt: now,
      dormantUntil: now + LONG_DORMANT_MS,
    };
  }
  return {
    deferCount: task.deferCount + 1,
    splitRefuseCount: nextRefuseCount,
    lastServedAt: now,
    dormantUntil: startOfNextUtcDay(now),
  };
}

// 쪼개기 수락 = 의미 있는 관여 → 부모의 회피 카운터 리셋(plan §2.4) + 다음 체크인까지 보류
// (와이어프레임 04: "부모는 사라지지 않고 진행중 보관"). 평평한 리스트로 1~3개 스텝.
// 첫 스텝은 호출부가 즉시 startFocus, 나머지는 풀에 그대로 추가(확인 화면 없음).
export function acceptSplit(
  parent: Task,
  stepTitles: string[],
  childIds: TaskId[],
  now: number,
): {
  parentPatch: Pick<Task, "deferCount" | "splitRefuseCount" | "dormantUntil">;
  children: Task[];
} {
  return {
    parentPatch: {
      deferCount: 0,
      splitRefuseCount: 0,
      dormantUntil: startOfNextUtcDay(now),
    },
    children: stepTitles.map((title, i) => ({
      id: childIds[i]!,
      title,
      parentId: parent.id,
      important: false,
      createdAt: now,
      deferCount: 0,
      splitRefuseCount: 0,
      state: "active",
    })),
  };
}

export function manualArchive(now: number): Pick<Task, "dormantUntil"> {
  return { dormantUntil: now + ARCHIVE_DORMANT_MS };
}

export function editTitle(title: string): Pick<Task, "title"> {
  return { title };
}
