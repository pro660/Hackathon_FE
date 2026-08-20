"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import {
  clearSelectedSmartMoods,
  readSelectedSmartMoods,
  smartMoodOptions,
  writeSelectedSmartMoods,
  type SmartMood,
} from "@/lib/stylePlanDraft";

export function MoodSelection() {
  const router = useRouter();
  const [selectedMoods, setSelectedMoods] = useState<SmartMood[]>([]);

  useEffect(() => {
    setSelectedMoods(readSelectedSmartMoods());
  }, []);

  const toggleMood = (mood: SmartMood) => {
    setSelectedMoods((current) =>
      current.includes(mood)
        ? current.filter((value) => value !== mood)
        : [...current, mood],
    );
  };

  const moveToConditions = () => {
    router.push("/smart-recommendations/condition");
  };

  const handleSkip = () => {
    clearSelectedSmartMoods();
    moveToConditions();
  };

  const handleComplete = () => {
    writeSelectedSmartMoods(selectedMoods);
    moveToConditions();
  };

  return (
    <MobileScreenLayout
      figmaNodeId="154:2"
      contentClassName="bg-white px-6 pt-[63px] pb-[88px] text-[#0e0e12]"
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <h1 className="text-[27px] leading-8 font-bold tracking-[-0.04em]">
            좋아하는 무드는?
          </h1>
          <p className="mt-[25px] max-w-[330px] text-[13px] leading-[18px] text-[#6e707a]">
            선택한 취향은 추천 정확도를 높여요. 나중에 MY에서 변경할 수
            있어요.
          </p>
        </LuxuryReveal>

        <LuxuryReveal className="mt-10" delay={60}>
          <div className="grid grid-cols-3 gap-x-3 gap-y-4">
            {smartMoodOptions.map((option) => {
              const selected = selectedMoods.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleMood(option.value)}
                  className={`h-10 rounded-[20px] border text-[12px] font-bold transition-colors ${
                    selected
                      ? "border-[#0e0e12] bg-[#0e0e12] text-white"
                      : "border-[#dbdee3] bg-white text-[#0e0e12] hover:border-[#aeb0b6]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </LuxuryReveal>

        <LuxuryReveal className="mt-auto space-y-4" delay={140}>
          <button
            type="button"
            onClick={handleSkip}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#dbdee3] bg-white text-[14px] font-bold text-[#0e0e12] transition-colors hover:bg-[#f7f7f8]"
          >
            나중에 설정하기
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white transition-colors hover:bg-[#26262c]"
          >
            선택 완료
          </button>
        </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
