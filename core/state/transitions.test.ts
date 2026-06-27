// Phase 1 — core/state/transitions 유닛 테스트. IO 없는 순수 함수라 node 환경에서 즉시 검증 가능.

import { describe, expect, it } from "vitest";
import { startOfNextUtcDay } from "../engine/age";
import { DEFAULT_CONFIG } from "../engine/config";
import type { Task } from "../engine/types";
import {
  acceptSplit,
  completeFocus,
  deferTask,
  editTitle,
  manualArchive,
  pauseFocus,
  refuseSplit,
  resumeFocus,
  startFocus,
} from "./transitions";

const NOW = Date.UTC(2026, 5, 27, 10, 0, 0); // 2026-06-27 10:00 UTC

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "보고서 초안 1페이지 쓰기",
    important: false,
    createdAt: NOW - 1000,
    deferCount: 0,
    splitRefuseCount: 0,
    state: "active",
    ...overrides,
  };
}

describe("startFocus", () => {
  it("진입 시 focus 상태로 전환하고 lastServedAt을 now로 갱신", () => {
    expect(startFocus(NOW)).toEqual({
      state: "focus",
      focusPausedAt: undefined,
      lastServedAt: NOW,
    });
  });
});

describe("pauseFocus / resumeFocus", () => {
  it("pause는 세션 경과초를 accumulatedSec에 누적", () => {
    const task = makeTask({ accumulatedSec: 60 });
    expect(pauseFocus(task, NOW, 30)).toEqual({
      focusPausedAt: NOW,
      accumulatedSec: 90,
    });
  });

  it("accumulatedSec이 없으면 0부터 누적", () => {
    expect(pauseFocus(makeTask(), NOW, 12)).toEqual({
      focusPausedAt: NOW,
      accumulatedSec: 12,
    });
  });

  it("resume은 focusPausedAt만 해제", () => {
    expect(resumeFocus()).toEqual({ focusPausedAt: undefined });
  });
});

describe("completeFocus", () => {
  it("done 전환 + 누적시간 합산 + 미룸횟수 리셋", () => {
    const task = makeTask({ accumulatedSec: 100, deferCount: 2 });
    expect(completeFocus(task, NOW, 20)).toEqual({
      state: "done",
      focusPausedAt: undefined,
      accumulatedSec: 120,
      deferCount: 0,
    });
  });
});

describe("deferTask", () => {
  it("미룸 횟수 +1, 나이 리셋(lastServedAt=now), 다음 체크인까지 재우기", () => {
    const task = makeTask({ deferCount: 1 });
    expect(deferTask(task, NOW)).toEqual({
      deferCount: 2,
      lastServedAt: NOW,
      dormantUntil: startOfNextUtcDay(NOW),
    });
  });
});

describe("refuseSplit", () => {
  it("splitRefuseMax 미달이면 다음 체크인까지만 재우기", () => {
    const task = makeTask({ deferCount: 3, splitRefuseCount: 0 });
    expect(refuseSplit(task, NOW, DEFAULT_CONFIG)).toEqual({
      deferCount: 4,
      splitRefuseCount: 1,
      lastServedAt: NOW,
      dormantUntil: startOfNextUtcDay(NOW),
    });
  });

  it("splitRefuseMax 도달 시 장기 재우기(7일) + 카운터 리셋(루프 종결)", () => {
    const task = makeTask({
      deferCount: 5,
      splitRefuseCount: DEFAULT_CONFIG.splitRefuseMax - 1,
    });
    const patch = refuseSplit(task, NOW, DEFAULT_CONFIG);
    expect(patch.deferCount).toBe(0);
    expect(patch.splitRefuseCount).toBe(0);
    expect(patch.dormantUntil).toBe(NOW + 7 * 24 * 60 * 60 * 1000);
  });
});

describe("acceptSplit", () => {
  it("부모 회피 카운터 리셋 + 다음 체크인까지 보류 + 자식 1개 생성", () => {
    const parent = makeTask({ deferCount: 3, splitRefuseCount: 1 });
    const { parentPatch, children } = acceptSplit(
      parent,
      ["자료 폴더 하나만 열기"],
      ["child-1"],
      NOW,
    );
    expect(parentPatch).toEqual({
      deferCount: 0,
      splitRefuseCount: 0,
      dormantUntil: startOfNextUtcDay(NOW),
    });
    expect(children).toEqual([
      {
        id: "child-1",
        title: "자료 폴더 하나만 열기",
        parentId: "task-1",
        important: false,
        createdAt: NOW,
        deferCount: 0,
        splitRefuseCount: 0,
        state: "active",
      },
    ]);
  });

  it("평평한 리스트로 최대 3개까지 동시 생성", () => {
    const parent = makeTask();
    const { children } = acceptSplit(
      parent,
      ["제목 줄 쓰기", "개요 한 줄 잡기", "참고자료 1개 찾기"],
      ["c1", "c2", "c3"],
      NOW,
    );
    expect(children.map((c) => c.title)).toEqual([
      "제목 줄 쓰기",
      "개요 한 줄 잡기",
      "참고자료 1개 찾기",
    ]);
    expect(children.every((c) => c.parentId === "task-1")).toBe(true);
  });
});

describe("manualArchive", () => {
  it("30일 후로 재우기", () => {
    expect(manualArchive(NOW)).toEqual({
      dormantUntil: NOW + 30 * 24 * 60 * 60 * 1000,
    });
  });
});

describe("editTitle", () => {
  it("제목만 교체", () => {
    expect(editTitle("치과 예약 전화하기")).toEqual({
      title: "치과 예약 전화하기",
    });
  });
});
