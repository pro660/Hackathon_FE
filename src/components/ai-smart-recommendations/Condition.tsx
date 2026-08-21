"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import {
  createMoodConditionDefaults,
  createStylePlanSliderContext,
  clearPreparedStylePlanPreview,
  readSelectedSmartMoods,
  stylePlanContextStorageKey,
} from "@/lib/stylePlanDraft";
import type { StylePlanWeatherCondition } from "@/types/api";

const CONDITION_ITEMS = [
  {
    leftLabel: "캐주얼",
    rightLabel: "포멀",
    defaultValue: 5,
  },
  {
    leftLabel: "깔끔하게",
    rightLabel: "화려하게",
    defaultValue: 5,
  },
] as const;

const WEATHER_OPTIONS: Array<{
  value: StylePlanWeatherCondition;
  label: string;
}> = [
  { value: "SUNNY", label: "맑음" },
  { value: "CLOUDY", label: "흐림" },
  { value: "RAINY", label: "비" },
  { value: "SNOWY", label: "눈" },
  { value: "HOT", label: "더움" },
  { value: "COLD", label: "추움" },
  { value: "WINDY", label: "바람" },
  { value: "INDOOR", label: "실내" },
];

function ConditionSlider({
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-4 text-[14px] font-bold leading-none text-[#15151a]">
        <p>{leftLabel}</p>
        <p>{rightLabel}</p>
      </div>
      <div className="mt-[13px]">
        <div className="relative h-[22px]">
          <div
            aria-hidden="true"
            className="condition-range-track absolute top-1/2 right-[11px] left-[11px] h-1 -translate-y-1/2 overflow-hidden rounded-full bg-[#d1d3da]"
          >
            <span
              className="condition-range-fill block h-full rounded-full bg-[#17181d]"
              style={
                {
                  "--condition-fill": `${((value - 1) / 9) * 100}%`,
                } as CSSProperties
              }
            />
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 right-[11px] bottom-0 left-[11px]"
          >
            <span
              className="condition-range-thumb absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#17181d]"
              style={
                {
                  "--condition-fill": `${((value - 1) / 9) * 100}%`,
                } as CSSProperties
              }
            />
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={value}
            className="condition-range absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

export default function ConditionPage() {
  const router = useRouter();
  const [values, setValues] = useState<number[]>(
    CONDITION_ITEMS.map((item) => item.defaultValue),
  );
  const [selectedWeather, setSelectedWeather] =
    useState<StylePlanWeatherCondition>("SUNNY");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) {
        return;
      }

      const defaults = createMoodConditionDefaults(readSelectedSmartMoods());
      setValues([
        defaults.casualFormalLevel,
        defaults.neatGlamorousLevel,
      ]);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleComplete = () => {
    const selectedTags = readSelectedSmartMoods();

    const context = createStylePlanSliderContext(
      selectedTags,
      values[0],
      values[1],
      selectedWeather,
      true,
    );

    window.localStorage.setItem(
      stylePlanContextStorageKey,
      JSON.stringify(context),
    );

    clearPreparedStylePlanPreview();

    router.push("/smart-recommendations/loading");
  };

  return (
    <MobileScreenLayout
      figmaNodeId="158:597"
      contentClassName="bg-white px-6 pt-4 pb-12 text-[#0e0e12]"
    >
      <div className="flex min-h-full flex-col">
      <LuxuryReveal>
        <BackButton />
        <p className="mt-1 text-[17px] leading-5 font-bold">
          스타일 조건 설정
        </p>
        <h1 className="mt-9 text-[27px] leading-8 font-bold tracking-[-0.04em]">
          원하는 분위기를 조절해 보세요
        </h1>
        <p className="mt-2 text-[13px] leading-[18px] text-[#6e707a]">
          두 개의 조절 바로 원하는 느낌을 맞춰보세요
        </p>
      </LuxuryReveal>

      <LuxuryReveal className="mt-[51px]" delay={70}>
        <section className="space-y-[62px]">
          {CONDITION_ITEMS.map((item, index) => (
            <ConditionSlider
              key={item.leftLabel}
              leftLabel={item.leftLabel}
              rightLabel={item.rightLabel}
              value={values[index]}
              onChange={(nextValue) => {
                setValues((current) =>
                  current.map((value, valueIndex) =>
                    valueIndex === index ? nextValue : value,
                  ),
                );
              }}
            />
          ))}
        </section>
      </LuxuryReveal>

      <LuxuryReveal className="mt-[88px]" delay={140}>
        <fieldset>
          <legend className="text-[14px] leading-5 font-bold">
            오늘의 날씨 · 하나만 선택
          </legend>
          <div className="mt-[10px] grid grid-cols-4 gap-x-[10px] gap-y-2">
            {WEATHER_OPTIONS.map((option) => {
              const selected = selectedWeather === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedWeather(option.value)}
                  className={`h-[38px] rounded-[12px] border text-[14px] font-bold transition-colors ${
                    selected
                      ? "border-[#e81a61] bg-[#e81a61] text-white"
                      : "border-[#dbdee3] bg-[#f6f6f8] text-[#0e0e12] hover:border-[#aeb0b6]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </LuxuryReveal>

      <LuxuryReveal className="mt-auto pt-8" delay={210}>
        <button
          type="button"
          onClick={handleComplete}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white transition-colors hover:bg-[#26262c]"
        >
          추천 결과 보기
        </button>
      </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
