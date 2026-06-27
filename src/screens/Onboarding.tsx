// Phase 4 — 화면 00(첫 실행 온보딩). 와이어프레임 기준 3스텝(환영→첫 캡처→체크인 시간),
// 하이파이 디자인의 단일 환영 화면은 시각만 참고. 마지막 스텝 완료 시 곧장 02 지금 카드로 진입.

import { useState } from "react";
import { PrimaryButton, TextLinkButton } from "../components/Button";

type Step = "welcome" | "capture" | "checkin-time";

export function Onboarding({
  onComplete,
}: {
  onComplete: (input: { title: string; checkinTime: string }) => void;
}) {
  const [step, setStep] = useState<Step>("welcome");
  const [title, setTitle] = useState("");
  const [checkinTime, setCheckinTime] = useState("09:00");

  if (step === "welcome") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <div className="font-body text-[15px] tracking-wide text-ink-faint">
          flowmind
        </div>
        <div className="mt-4 text-4xl">🍃</div>
        <h1 className="mt-5 font-display text-[30px] leading-snug text-ink">
          리스트는 없어요.
          <br />
          지금 할 하나만.
        </h1>
        <p className="mt-4 font-body text-[17px] leading-relaxed text-ink-soft">
          쌓인 목록도, 빨간 배지도 없어요.
          <br />딱 지금 할 하나만 골라드릴게요.
        </p>
        <PrimaryButton className="mt-10" onClick={() => setStep("capture")}>
          시작하기
        </PrimaryButton>
      </div>
    );
  }

  if (step === "capture") {
    return (
      <div className="flex min-h-screen flex-col px-8 pt-8">
        <TextLinkButton
          className="w-auto self-start text-left"
          onClick={() => setStep("welcome")}
        >
          ← 뒤로
        </TextLinkButton>
        <h1 className="mt-9 font-display text-[28px] leading-snug text-ink">
          첫 할 일 하나만
          <br />
          적어볼까요?
        </h1>
        <p className="mt-2 font-body text-[15px] text-ink-soft">
          머릿속에 맴도는 거 아무거나요.
        </p>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && title.trim() && setStep("checkin-time")
          }
          placeholder="예: 보고서 초안 1페이지 쓰기"
          className="mt-5 w-full rounded-lg border border-border bg-surface px-4 py-4 font-display text-xl text-ink outline-none"
        />
        <p className="mt-3 font-body text-sm text-ink-faint">
          분류도, 정리도 필요 없어요. 제목 한 줄이면 충분해요.
        </p>
        <div className="flex-1" />
        <PrimaryButton
          className="mb-10"
          disabled={!title.trim()}
          onClick={() => setStep("checkin-time")}
        >
          담기
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-8 pt-8">
      <TextLinkButton
        className="w-auto self-start text-left"
        onClick={() => setStep("capture")}
      >
        ← 뒤로
      </TextLinkButton>
      <h1 className="mt-9 font-display text-[28px] leading-snug text-ink">
        하루 한 번,
        <br />
        언제 봐드릴까요?
      </h1>
      <p className="mt-2 font-body text-[15px] text-ink-soft">
        그때 딱 하나, 조용히 알려드려요.
      </p>
      <input
        type="time"
        value={checkinTime}
        onChange={(e) => setCheckinTime(e.target.value)}
        className="mt-5 w-full rounded-lg border border-border bg-surface px-4 py-4 font-display text-xl text-ink outline-none"
      />
      <p className="mt-3 font-body text-sm text-ink-faint">
        딱 이 시각에 한 번만 알려드려요. 언제든 설정에서 바꿀 수 있어요.
      </p>
      <div className="flex-1" />
      <PrimaryButton
        className="mb-10"
        onClick={() => onComplete({ title: title.trim(), checkinTime })}
      >
        시작하기
      </PrimaryButton>
    </div>
  );
}
