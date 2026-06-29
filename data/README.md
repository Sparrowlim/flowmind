# `data/` — 저장소 추상화 계층

> 의존 방향: `ui → core ← data` (ADR-0002 §3). data는 **core 타입만** 참조하고 ui는 모른다.

## 역할
Repository 패턴으로 영속화를 캡슐화. 로컬 우선(IndexedDB) 저장과 결정 이벤트 로그를 추상화 뒤에 두어, 나중에 클라우드 동기화 구현체를 "두 번째 출구"로 꽂을 수 있게 함.

## 의존 규칙
- core의 타입(`Task` 등)만 import. UI 의존 0.
- 로컬↔클라우드 교체점 — "단일 기기 가정" 코드 금지(ADR-0002 E1).
- 동기화 친화 데이터 모델: UUID · `updatedAt` · `deletedAt?`(soft delete) · `schemaVersion` · append-only 이벤트 로그.

## 하위 구조
| 폴더 | 내용 | 상태 |
|---|---|---|
| `local/` | Dexie(IndexedDB) 구현체 — `taskRepository`(Task CRUD, liveQuery) · `settingsRepository`(체크인 시간·테마 등) | `taskRepository`는 `useTasks`에서, `settingsRepository`는 `useSettings`에서 사용 중. 온보딩(`Onboarding`)·체크인 게이트(`CheckIn`/`CheckInSkipped`)·설정 화면(`Settings`)·다크모드가 전부 이 훅을 통해 읽고 씀 — 둘 다 연결 완료 |
| `events/` | `DecisionEvent` append-only 로그(ADR-0001 D6) — 시작 전환율 지표 + v2 학습 연료 | **미착수** — 폴더 자체가 아직 없음(4단계 작업) |

## 관련 문서
- 데이터 모델 필드: `docs/decisions/0002-기술스택-아키텍처.md` §4
- 로깅 스펙(D6): `docs/decisions/0001-우선순위-엔진-신호-모델.md` §5
