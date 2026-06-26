// engine-spec.md §1·§2 — core는 아무것도 import 하지 않는다(ADR-0002 §3 A1).

export type TaskId = string; // UUID (E1: 자동증가 정수 금지)

export type TaskState =
  | 'active' // 풀에서 후보가 될 수 있음
  | 'focus' // 집중 중(진행). focusPausedAt 유무로 일시정지 구분
  | 'done'; // 완료. 후보 제외
// 'dormant'는 상태가 아니라 dormantUntil 시각으로 표현(재우기 해제 = 시각 비교)

export interface Task {
  // 식별
  id: TaskId;
  title: string; // 유일 필수. 제목만으로도 굴러가야 함(바닥 동작)
  parentId?: TaskId; // 쪼개기 자식이면 부모 id

  // 부스터 신호(사용자·선택 — 없으면 중립)
  deadline?: number; // epoch ms. 마감
  important: boolean; // 중요 표시(동률 타이브레이커, D9 — 점수 가산 아님)
  estimateMin?: number; // 예상 소요 분

  // 바닥 신호(시스템·항상 존재)
  createdAt: number; // epoch ms. 나이 기준점 fallback
  lastServedAt?: number; // epoch ms. "지금 카드" 서빙 시각(D7). 노출 시 갱신→나이 리셋
  deferCount: number; // 이따다시/넘어갈래 누적(O4)
  splitRefuseCount: number; // 자동쪼개기 '넘어갈래' 누적(루프 차단)

  // 상태/스케줄
  state: TaskState;
  dormantUntil?: number; // epoch ms. 이 시각 전까지 후보 제외(재우기)
  focusPausedAt?: number; // 있으면 일시정지 상태(이어하기 대상)
  accumulatedSec?: number; // 누적 경과시간(일시정지 이어받기 — 엔진 선택엔 무관, UI용)
}

export interface EngineConfig {
  deferThreshold: number; // 3   규칙② 트리거
  splitRefuseMax: number; // 2   자동쪼개기 거부→장기재우기 (상태머신용, pick엔 미사용)
  quickWinMin: number; // 2   분. 빠른 승리
  deadlineSoonMs: number; // 24h 마감 임박 (= 24*60*60*1000)
  staleSoftDays: number; // 7   규칙⑤ 자격(달력 일수)
  staleHardDays: number; // 14  마감급 승격 aging boost(달력 일수)
}

export type WhyNowRule =
  | 'punctuality' // ① 오늘 마감 + 중요
  | 'deadline-soon' // ③ 마감 ≤ 24h
  | 'aging-promoted' // ③′ 나이 ≥ STALE_HARD (승격) — 같은 티어, 다른 카피
  | 'quick-win' // ④ 예상 ≤ 2분
  | 'stale' // ⑤ 나이 ≥ STALE_SOFT
  | 'important' // ⑥ 중요 표시
  | 'floor'; // 바닥 — 가장 오래된 것(불변식 ⒜)

export type Decision =
  | { kind: 'empty-all-done' } // 풀 0개 → 🎉
  | { kind: 'empty-dormant' } // 일은 있으나 전부 재우기 → 🌙
  | { kind: 'resume'; task: Task } // 일시정지 이어하기
  | { kind: 'new-greeting'; task: Task } // 신규 첫인사(담은 당일 1회)
  | { kind: 'auto-split'; task: Task } // 규칙② 전용 화면 직행
  | { kind: 'card'; task: Task; rule: WhyNowRule }; // 일반 지금 카드
