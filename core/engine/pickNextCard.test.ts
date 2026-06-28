// 쪼개기 부모 차단(자식 완료까지) — engine-flow.md ③. 저장값이 아니라 매번 derive됨을 검증.

import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./config";
import { pickNextCard } from "./pickNextCard";
import type { Task } from "./types";

const NOW = Date.UTC(2026, 5, 27, 10, 0, 0);

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t-1",
    title: "할 일",
    important: false,
    createdAt: NOW - 1000,
    lastServedAt: NOW - 1000, // GATE-GREETING(신규 첫인사) 회피 — 차단 로직만 단독 검증
    deferCount: 0,
    splitRefuseCount: 0,
    state: "active",
    ...overrides,
  };
}

describe("pickNextCard — 쪼개기 부모 차단", () => {
  it("active 자식이 있으면 부모는 후보에서 빠지고 자식이 뽑힌다", () => {
    const parent = makeTask({ id: "parent" });
    const child = makeTask({ id: "child", parentId: "parent", createdAt: NOW });
    const decision = pickNextCard([parent, child], NOW, DEFAULT_CONFIG);
    expect(decision.kind).toBe("card");
    expect(decision.kind === "card" && decision.task.id).toBe("child");
  });

  it("자식이 전부 done이면 부모가 다시 후보가 된다", () => {
    const parent = makeTask({ id: "parent" });
    const child = makeTask({ id: "child", parentId: "parent", state: "done" });
    const decision = pickNextCard([parent, child], NOW, DEFAULT_CONFIG);
    expect(decision.kind).toBe("card");
    expect(decision.kind === "card" && decision.task.id).toBe("parent");
  });

  it("자식이 여럿이면 하나라도 안 끝났으면 부모는 계속 차단된다", () => {
    const parent = makeTask({ id: "parent" });
    const child1 = makeTask({ id: "c1", parentId: "parent", state: "done" });
    const child2 = makeTask({ id: "c2", parentId: "parent", createdAt: NOW });
    const decision = pickNextCard(
      [parent, child1, child2],
      NOW,
      DEFAULT_CONFIG,
    );
    expect(decision.kind === "card" && decision.task.id).toBe("c2");
  });
});
