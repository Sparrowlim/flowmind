# 엔진 구현 스펙: core/engine (빌드 1단계)

> 상태: FINAL v1.0 — 구현 스펙 확정. 코드의 타입 시그니처 + 골든 테스트 입력 명세. (구현 미착수)
> 확정이력:
> - v1.0 — 타입(§1·§2)·절차(§3)·타이브레이크(§4)·불변식(§5)·골든 케이스(§7) 잠금. 미명시 빈칸 3건 확정(§6 S1·S2·S3). 잔여: T-O1만 PENDING(도그푸딩에서 확정, G-30).
> 출처: plan.md §4·§4.5 / ADR-0001 (D7~D14) / ADR-0002 (§3 순수코어, §4 데이터모델, §6-1 빌드순서) / engine-flow.md ①②③
> 범위: `pickNextCard` 순수 함수의 입력 타입·출력 타입·결정 절차·불변식·골든 테스트 케이스 목록.
> 비범위: React·Dexie·Capacitor·D6 영속화(이건 빌드 2~4단계). 여기선 **헤드리스 순수 TS만.**

---

## 0. 설계 계약 (왜 이렇게 격리하나)

ADR-0002 §3 A1: **core는 아무것도 import 하지 않는다.** 이 스펙의 모든 함수는:

- **순수** — 같은 입력 → 같은 출력. 부작용 0.
- **전역시간 금지** — `Date.now()` 호출 금지. `now`를 인자로 주입(테스트가 시간을 고정).
- **IO 금지** — 저장소·네트워크·랜덤 접근 0. 랜덤 타이브레이크 금지(→ `created_at` 고정, D13).
- **시간 단위** — 엔진 내부는 **epoch milliseconds(number)**. ISO 문자열 변환은 edge(ui/data)에서. "나이=달력 일수"(D14)는 ms를 일수로 환산해 비교하되 환산 함수도 순수.

효과(ADR-0002 §3): ⒜ 골든 테스트로 D13(결정 재현성) 증명=면접 자산 ⒝ v2 학습 엔진 교체점 ⒞ 플랫폼·저장소 교체 시 코어 무손상.

---

## 1. 입력 타입

### 1.1 Task (엔진이 보는 형태)

> ADR-0002 §4 데이터 모델의 부분집합. 엔진은 아래 필드만 읽는다(영속화 전체 스키마는 data 계층 책임).

```ts
type TaskId = string; // UUID (E1: 자동증가 정수 금지)

type TaskState =
  | 'active'   // 풀에서 후보가 될 수 있음
  | 'focus'    // 집중 중(진행). focusPausedAt 유무로 일시정지 구분
  | 'done';    // 완료. 후보 제외
  // 'dormant'는 상태가 아니라 dormantUntil 시각으로 표현(재우기 해제 = 시각 비교)

interface Task {
  // 식별
  id: TaskId;
  title: string;                 // 유일 필수. 제목만으로도 굴러가야 함(바닥 동작)
  parentId?: TaskId;             // 쪼개기 자식이면 부모 id

  // 부스터 신호(사용자·선택 — 없으면 중립)
  deadline?: number;             // epoch ms. 마감
  important: boolean;            // 중요 표시(동률 타이브레이커, D9 — 점수 가산 아님)
  estimateMin?: number;          // 예상 소요 분

  // 바닥 신호(시스템·항상 존재)
  createdAt: number;             // epoch ms. 나이 기준점 fallback
  lastServedAt?: number;         // epoch ms. "지금 카드" 서빙 시각(D7). 노출 시 갱신→나이 리셋
  deferCount: number;            // 이따다시/넘어갈래 누적(O4)
  splitRefuseCount: number;      // 자동쪼개기 '넘어갈래' 누적(루프 차단)

  // 상태/스케줄
  state: TaskState;
  dormantUntil?: number;         // epoch ms. 이 시각 전까지 후보 제외(재우기)
  focusPausedAt?: number;        // 있으면 일시정지 상태(이어하기 대상)
  accumulatedSec?: number;       // 누적 경과시간(일시정지 이어받기 — 엔진 선택엔 무관, UI용)
}
```

> **엔진이 읽지 않는 필드**(완결성 위해 명시): `completedAt`, `updatedAt`, `deletedAt`, `schemaVersion`. 이들은 data/ui 계층 책임 → 엔진 타입에서 제외해 코어를 좁게 유지.

### 1.2 Config (상수 — plan §4.5 시드값)

> 도그푸딩 튜닝 노브(D14). 엔진은 **하드코딩 금지**, 전부 cfg 주입 → 테스트가 경계값을 흔든다.

```ts
interface EngineConfig {
  deferThreshold: number;     // 3   규칙② 트리거
  splitRefuseMax: number;     // 2   자동쪼개기 거부→장기재우기 (상태머신용, pick엔 미사용)
  quickWinMin: number;        // 2   분. 빠른 승리
  deadlineSoonMs: number;     // 24h 마감 임박 (= 24*60*60*1000)
  staleSoftDays: number;      // 7   규칙⑤ 자격(달력 일수)
  staleHardDays: number;      // 14  마감급 승격 aging boost(달력 일수)
}

const DEFAULT_CONFIG: EngineConfig = {
  deferThreshold: 3,
  splitRefuseMax: 2,
  quickWinMin: 2,
  deadlineSoonMs: 24 * 60 * 60 * 1000,
  staleSoftDays: 7,
  staleHardDays: 14,
};
```

---

## 2. 출력 타입 (Decision)

엔진은 화면을 그리지 않는다 → "무엇을 보여줄지"를 **판별 가능한 결정 객체**로만 반환. UI가 이걸 받아 렌더.

```ts
type WhyNowRule =
  | 'punctuality'      // ① 오늘 마감 + 중요
  | 'deadline-soon'    // ③ 마감 ≤ 24h
  | 'aging-promoted'   // ③′ 나이 ≥ STALE_HARD (승격) — 같은 티어, 다른 카피
  | 'quick-win'        // ④ 예상 ≤ 2분
  | 'stale'            // ⑤ 나이 ≥ STALE_SOFT
  | 'important'        // ⑥ 중요 표시
  | 'floor';           // 바닥 — 가장 오래된 것(불변식 ⒜)

type Decision =
  | { kind: 'empty-all-done' }                       // 풀 0개 → 🎉
  | { kind: 'empty-dormant' }                         // 일은 있으나 전부 재우기 → 🌙
  | { kind: 'resume'; task: Task }                    // 일시정지 이어하기
  | { kind: 'new-greeting'; task: Task }              // 신규 첫인사(담은 당일 1회)
  | { kind: 'auto-split'; task: Task }                // 규칙② 전용 화면 직행
  | { kind: 'card'; task: Task; rule: WhyNowRule };   // 일반 지금 카드

// 최상위 진입점
function pickNextCard(pool: Task[], now: number, cfg: EngineConfig): Decision;
```

> `card`의 `rule`이 곧 "왜 지금?" 카피 키(plan §4.3). UI는 rule→카피 매핑만 가짐(투명성=위임 신뢰 핵심). DecisionEvent.ruleFired(D6)도 이 값.

---

## 3. 결정 절차 (pickNextCard 계약)

engine-flow ① + plan §4.5를 순서대로. **위에서 첫 매칭에 즉시 반환.**

```
0. candidates = pool 중 (state ≠ 'done')
              AND (dormantUntil 없음 OR dormantUntil ≤ now)
              AND NOT (쪼개기 부모이며 active(non-done) 자식이 하나라도 있음)  -- v1.6, derive, 저장값 아님
   - candidates 비었으면:
       pool에 'done' 아닌 일이 0개  → empty-all-done
       있으나 전부 dormant/차단     → empty-dormant

1. [GATE-RESUME] candidates 중 focusPausedAt 있는 일 → resume   (※ T-O1, §6 참조)
2. [GATE-GREETING] candidates 중 신규 첫인사 대상 → new-greeting
3. [GATE-SPLIT] candidates 중 deferCount ≥ deferThreshold 인 일 → auto-split
4. [CASCADE] 나머지 → 각 후보를 티어 분류 후 최우선 티어에서 타이브레이크 → card
```

각 게이트가 복수 후보를 만족하면 **§4 타이브레이크**로 1개 선정.

### 3.1 나이 계산 (D7)
```ts
function ageMs(task: Task, now: number): number {
  return now - (task.lastServedAt ?? task.createdAt);
}
function ageDays(task: Task, now: number): number; // 달력 일수(D14). floor(ageMs / 1일)
```

### 3.2 신규 첫인사 판정 (D12)
- "담은 당일 체크인에 한해 1회." → `lastServedAt == null` (아직 한 번도 안 서빙됨) AND `createdAt`이 `now`와 **같은 달력 날짜**.
- 1회 제한은 서빙 시 `lastServedAt` 세팅으로 자연 종료(엔진은 판정만, 세팅은 호출측/상태전이 책임 — §5).

### 3.3 캐스케이드 티어 분류 (단일 task → 티어)
위에서 첫 매칭:
```
① punctuality     : deadline 존재 AND deadline이 '오늘'(now와 같은 달력일) AND important
③ deadline-soon   : deadline 존재 AND (deadline − now) ≤ deadlineSoonMs
③ aging-promoted  : ageDays ≥ staleHardDays         ← ③과 같은 티어, rule만 다름
④ quick-win       : estimateMin 존재 AND estimateMin ≤ quickWinMin
⑤ stale           : ageDays ≥ staleSoftDays
⑥ important       : important == true
floor             : 항상 매칭(불변식 ⒜ — 엔진 빈손 불가)
```
- 티어 우선순위(작을수록 우선): `punctuality(0) < deadline-soon/aging-promoted(1) < quick-win(2) < stale(3) < important(4) < floor(5)`.
- ③ 티어 내 rule 라벨: `aging-promoted`로 진입했지만 마감도 임박이면 라벨은 **deadline-soon 우선**(임박이 더 행동가능한 사유). 둘 다면 deadline-soon.

---

## 4. 타이브레이크 (D13 결정 재현성)

같은 게이트/티어에 복수 후보 → 아래 순서로 **전순서(total order)** 결정. 랜덤·동시성 의존 금지.

```
compareWithinTier(a, b):
  1. 나이 내림차순      (ageMs 큰 것 우선 — 오래 묵은 것)
  2. 중요 표시 우선      (important true가 먼저 — D9 무점수 타이브레이커)
  3. createdAt 오름차순  (먼저 만든 것 — 최종 고정, 같은 상황=같은 카드)
```
- GATE-SPLIT 다중 후보: **deferCount 내림차순(가장 많이 미룬 것)** → 그다음 `compareWithinTier`. *(plan 미명시 → 본 스펙에서 확정. 검토 포인트로 §6에 표기.)*
- GATE-RESUME 다중 후보(일시정지 2개+): focusPausedAt 내림차순(가장 최근 멈춘 것) → compareWithinTier. *(엣지: 동시 집중 1개 가정이면 실질 발생 안 함.)*

---

## 5. 불변식 (테스트가 강제)

- **INV-1 빈손 불가(⒜):** candidates ≥ 1 이면 결과는 절대 empty-* 가 아니다. floor가 항상 매칭.
- **INV-2 바닥은 못 꺼진다(⒝):** 부스터(deadline/estimate/important) 전부 비어도 card를 반환한다(rule=stale 또는 floor).
- **INV-3 제목만 동작:** title만 있고 나머지 부스터 null인 풀도 정상 결정.
- **INV-4 결정성:** `pickNextCard(pool, now, cfg)` 두 번 호출 = 동일 결과(깊은 동등). 입력 배열 순서를 섞어도 동일(정렬이 순서 의존 제거).
- **INV-5 순수성:** 호출이 입력 `pool`/`task`를 변형하지 않음(freeze 테스트).
- **INV-6 dormant 제외:** `dormantUntil > now` 인 일은 어떤 게이트/티어에도 등장 불가.

---

## 6. 미명시 빈칸 확정 + 잔여 열린 결정

plan/다이어그램에 명시 없거나 충돌하던 3건을 v1.0에서 확정. 게이트 순서 충돌(T-O1)만 PENDING으로 남김.

- **S1. 게이트 순서 (CONFIRMED, T-O1은 시나리오만 PENDING):** 다이어그램 ①(`신규첫인사 → 이어하기 → 자동쪼개기`)과 plan §4.5 산문(`이어하기 우선`)이 충돌. → **GATE-RESUME(1) → GATE-GREETING(2) → GATE-SPLIT(3)** = 이어하기 우선(B, 몰입 중단 방지) 확정. 단, "일시정지 중 새 일 캡처 → 무엇을 먼저?"의 사용자 선호는 검증 대상이라 골든 케이스 **G-30만 PENDING(T-O1)**, 도그푸딩(§5②) 후 잠금. (구현은 잠정값 B로 진행 가능 — 게이트 순서를 한 곳에 모아 교체 비용 0으로.)
- **S2. GATE-SPLIT 다중 후보 (CONFIRMED):** plan 미명시. → **deferCount 내림차순(가장 많이 미룬 것)** → 동률 시 `compareWithinTier`(§4). 근거: 가장 오래 회피한 일이 쪼개기 개입 1순위.
- **S3. ③ 티어 라벨 (CONFIRMED):** 마감 임박 AND 나이 ≥ STALE_HARD 동시 충족 시 "왜 지금?" 라벨 = **`deadline-soon` 우선**(더 행동가능한 사유). `aging-promoted`는 마감 없는 방치 케이스 전용(§3.3, G-56).
- (참고) 자동쪼개기 자식의 신규 첫인사 자격: 자식도 `lastServedAt==null`이나 **부모 dormant + 자식 즉시 집중 진입(D10)** 흐름이라 pick 단계에서 실질 미발생 → 별도 규칙 불필요(무관).

---

## 7. 골든 테스트 케이스 목록

> 형식: 고정 `now` + 결정적 풀 → 기대 Decision. 모든 시각은 `now`로부터의 상대 오프셋으로 기술(테스트에서 `now=T0` 고정). `T0 = 2026-06-25T09:00:00Z` 기준 권장.
> 표기: `d-N` = N일 전, `h+N` = N시간 후. 미기재 부스터는 null, `defer=0`, `important=false`, `state=active`.

### A. 빈 상태 / 후보 필터
| ID | 풀 구성 | 기대 |
|---|---|---|
| G-01 | 빈 배열 | `empty-all-done` |
| G-02 | 전부 `state='done'` | `empty-all-done` |
| G-03 | 1개, `dormantUntil = h+5`(미래) | `empty-dormant` |
| G-04 | 2개 다 `dormantUntil` 미래 | `empty-dormant` |
| G-05 | 1개 active + 1개 dormant(미래) | active 1개로 결정(`card`), dormant 미등장(INV-6) |
| G-06 | 1개 `dormantUntil = h-1`(과거=해제됨) | 후보로 복귀 → `card` |

### B. 게이트 (캐스케이드보다 우선)
| ID | 풀 구성 | 기대 |
|---|---|---|
| G-10 | 1개 `focusPausedAt` 있음 | `resume`, 그 task |
| G-11 | 일시정지 1개 + 오늘마감+중요 1개 | `resume`(게이트가 캐스케이드 이김) |
| G-12 | 1개 `deferCount=3` | `auto-split`, 그 task |
| G-13 | `deferCount=3` 1개 + 오늘마감+중요 1개 | `auto-split`(게이트 우선) |
| G-14 | `deferCount=3` 1개 + `deferCount=5` 1개 | `auto-split`, deferCount=5 task(§4 다중규칙) |
| G-15 | `deferCount=2` 1개(임계 미만) | 게이트 미발동 → `card`(경계: ≥3만 발동) |
| G-16 | 일시정지 1개 + deferCount=3 1개 | `resume`(GATE-RESUME가 GATE-SPLIT보다 우선) |

### C. 신규 첫인사 (D12)
| ID | 풀 구성 | 기대 |
|---|---|---|
| G-20 | 1개 `createdAt=오늘`, `lastServedAt=null` | `new-greeting` |
| G-21 | 1개 `createdAt=오늘`, `lastServedAt` 있음(이미 서빙) | 첫인사 아님 → `card` |
| G-22 | 1개 `createdAt=d-1`(어제), `lastServedAt=null` | 첫인사 아님(같은 날 아님) → `card` |
| G-23 | 신규(오늘,첫서빙) 1개 + 오늘마감+중요 1개 | `new-greeting`(GATE-GREETING이 캐스케이드 이김) |

### D. 캐스케이드 단일 매칭 (각 규칙 격리)
| ID | 풀(1개) | 기대 rule |
|---|---|---|
| G-40 | deadline=오늘 + important | `punctuality` |
| G-41 | deadline=`h+10`(24h 이내), important=false | `deadline-soon` |
| G-42 | 마감 없음 + `ageDays=15`(≥14) | `aging-promoted` |
| G-43 | estimateMin=2, 마감 없음, age 작음 | `quick-win` |
| G-44 | estimateMin=1 | `quick-win` |
| G-45 | 마감·예상 없음 + `ageDays=8`(≥7,<14) | `stale` |
| G-46 | 부스터 important만 true, age 작음 | `important` |
| G-47 | 제목만(부스터 전부 null), `ageDays=0` | `floor` (INV-2/3) |

### E. 캐스케이드 우선순위 (티어 경쟁)
| ID | 풀 구성 | 기대 |
|---|---|---|
| G-50 | 오늘마감+중요 1개 + 마감임박 1개 | `punctuality`(① > ③) |
| G-51 | 마감임박 1개 + 2분일 1개 | `deadline-soon`(③ > ④) |
| G-52 | 2분일 1개 + 8일방치 1개 | `quick-win`(④ > ⑤) |
| G-53 | 8일방치 1개 + 중요만 1개 | `stale`(⑤ > ⑥) |
| G-54 | 중요만 1개 + 제목만 1개 | `important`(⑥ > 바닥) |
| G-55 | 마감 없는 15일 방치 1개 + 2분일 1개 | `aging-promoted`(③ 승격 > ④) ← aging boost 핵심 |
| G-56 | 15일방치 AND 마감임박(h+10) 1개 | rule 라벨 = `deadline-soon`(§3.3 라벨 규칙) |

### F. 타이브레이크 (D13)
| ID | 풀 구성 | 기대 |
|---|---|---|
| G-60 | 같은 티어(stale) 2개, age 다름(10일 vs 8일) | 10일짜리(나이 내림차순) |
| G-61 | 같은 티어·같은 나이 2개, 하나만 important | important=true 쪽 |
| G-62 | 같은 티어·같은 나이·같은 important 2개, createdAt 다름 | createdAt 빠른 것 |
| G-63 | 동일 풀을 배열 순서만 뒤집어 입력 | G-62와 동일 결과(INV-4 순서 무관) |

### G. 불변식 직접 검증
| ID | 검증 |
|---|---|
| G-70 | INV-1: candidates≥1 인 임의 풀 → 결과 kind ≠ empty-* (속성 테스트 가능) |
| G-71 | INV-4: 같은 입력 2회 호출 deep-equal |
| G-72 | INV-5: 호출 후 입력 task/pool 미변형(Object.freeze 통과) |
| G-73 | INV-2: 부스터 전부 null 풀 → 항상 card |

### H. 경계값 (off-by-one 방어)
| ID | 풀 | 기대 |
|---|---|---|
| G-80 | deadline 정확히 `now + deadlineSoonMs`(24h 경계) | `deadline-soon` 포함(≤ 이므로 발동) |
| G-81 | deadline = `now + deadlineSoonMs + 1ms` | ③ 미발동(임박 아님) |
| G-82 | estimateMin 정확히 2(=quickWinMin) | `quick-win`(≤ 발동) |
| G-83 | estimateMin = 3 | quick-win 미발동 |
| G-84 | ageDays 정확히 7 | `stale` 발동(≥) |
| G-85 | ageDays = 6 | stale 미발동 |
| G-86 | ageDays 정확히 14 | `aging-promoted` 발동(≥), stale 아님 |

### I. PENDING (T-O1)
| ID | 풀 구성 | 상태 |
|---|---|---|
| G-30 | 일시정지 1개 + 신규첫인사(오늘,첫서빙) 1개 | **PENDING** — 잠정 `resume`(이어하기 우선). 도그푸딩 후 확정 |

---

## 8. 구현 산출물 (이 스펙이 정의하는 파일)

```
core/
  engine/
    types.ts          // §1·§2 타입 (Task, EngineConfig, Decision, WhyNowRule)
    config.ts         // DEFAULT_CONFIG
    age.ts            // ageMs, ageDays (순수)
    classify.ts       // 단일 task → 티어/rule (§3.3)
    tiebreak.ts       // compareWithinTier (§4)
    pickNextCard.ts   // §3 절차 조립
    pickNextCard.golden.test.ts  // §7 G-01~G-86 (G-30 skip+TODO)
```

> 다음 단계: 이 스펙 합의 → 위 파일 골격 + 타입부터 구현(코드 (A) 단계 진입). 합의 전엔 코드 없음.
