# `src/` — React 화면 계층 (= ADR-0002 §3 "ui" 계층)

> 의존 방향: `ui → core ← data`, `platform → ui` (ADR-0002 §3). Vite 기본 엔트리가 `src/`이므로 별도 `ui/` 디렉터리를 만들지 않고 **`src/`를 그대로 ui 계층으로 사용**.

## 역할
와이어프레임을 구현하는 React 화면·컴포넌트·훅. core가 반환한 `Decision`을 받아 카드/집중/쪼개기/빈 상태 화면을 렌더. UI는 로직을 갖지 않고 core·data를 사용만 한다.

## 의존 규칙
- core(엔진 결정)·data(저장소) 사용 가능.
- "왜 지금?" 카피는 `Decision.rule` → 카피 매핑만 보유(투명성 = 위임 신뢰 핵심).
- **카드 전환 시 컴포넌트 강제 리마운트**(작업 id를 key로) — 펼침/입력 상태 누수 방지(troubleshooting/0001 버그 2).

## 하위 구조
| 폴더 | 내용 |
|---|---|
| `screens/` | 와이어프레임 화면 단위 — `Capture`·`NowCard`·`AutoSplitSuggestion`·`SplitFirstStep`·`Focus`·`CompletedInterstitial`·`EmptyAllDone`·`EmptyDormant`·`Archive`·`TaskActionMenu` |
| `components/` | 화면이 공유하는 UI 프리미티브 — `Button`·`Card`·`Badge`·`BottomSheet`·`ProgressRing` |
| `hooks/` | `useTasks`(영속화 + 상태 전이 묶음) · `useEngineDecision`(`pickNextCard` 래퍼) |
| `lib/` | `whyNow.ts` — `Decision.rule` → "왜 지금?" 카피 매핑 |

## 구현 현황 (2026-06-27)
캡처-지금카드-집중-완료 핵심 루프(2단계) + 쪼개기/빈 상태/보관함/작업메뉴(3단계)가 `App.tsx`에서 엔진(`core`)·저장소(`data`)와 실제로 연결되어 동작. 온보딩·체크인 게이트·설정 화면은 아직 없음(4단계 예정, `App.tsx` 상단 주석 참고). 상세 진행 체크표 → `docs/plan.md` Part 0.

## 관련 문서
- 화면 목록: `docs/plan.md` §2.6 / UX 흐름: §2.2
- 디자인 방향(손그림 톤·강조색): `docs/plan.md` §2.5
