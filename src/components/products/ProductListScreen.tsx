"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { useProductRecommendationStore } from "@/store/useProductRecommendationStore";
import {
  type CurrentSeasonTag,
  type FeatureTag,
  type ItemCategory,
  type OccasionTag,
} from "@/types/api";
import type { RecommendationCriteria } from "@/types/product";

const occasionOptions: Array<{ value: OccasionTag; label: string }> = [
  { value: "DAILY", label: "일상" },
  { value: "DATE", label: "데이트" },
  { value: "TRAVEL", label: "여행" },
  { value: "GATHERING", label: "모임" },
  { value: "CEREMONY", label: "격식 있는 자리" },
  { value: "OUTDOOR", label: "야외 활동" },
];

const seasonOptions: Array<{ value: CurrentSeasonTag; label: string }> = [
  { value: "SPRING", label: "봄" },
  { value: "SUMMER", label: "여름" },
  { value: "AUTUMN", label: "가을" },
  { value: "WINTER", label: "겨울" },
];

const featureOptions: Array<{ value: FeatureTag; label: string }> = [
  { value: "COMPACT", label: "컴팩트함" },
  { value: "SPACIOUS", label: "넉넉한 수납" },
  { value: "MULTIWAY", label: "다양한 연출" },
];

const categoryOptions: Array<{
  value: ItemCategory | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "전체" },
  { value: "BAG", label: "가방" },
  { value: "LEATHER_GOODS", label: "가죽 소품" },
  { value: "FASHION_ACCESSORY", label: "액세서리" },
  { value: "CLOTHING", label: "의류" },
  { value: "SHOES", label: "신발" },
];

const initialCriteria: RecommendationCriteria = {
  occasion: "",
  season: "",
  preferredFeatures: [],
  category: "ALL",
};

export function ProductListScreen() {
  const router = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [criteria, setCriteria] =
    useState<RecommendationCriteria>(initialCriteria);
  const status = useProductRecommendationStore((state) => state.status);
  const error = useProductRecommendationStore((state) => state.error);
  const hasRecommendationResult = useProductRecommendationStore(
    (state) => state.hasRecommendationResult,
  );
  const loadRecommendations = useProductRecommendationStore(
    (state) => state.loadRecommendations,
  );

  const canSubmit = Boolean(
    criteria.occasion &&
      criteria.season &&
      criteria.preferredFeatures.length >= 1 &&
      criteria.preferredFeatures.length <= 3,
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  useEffect(() => {
    if (hasRequested && status === "success" && hasRecommendationResult) {
      router.push("/recommendations/result");
    }
  }, [hasRecommendationResult, hasRequested, router, status]);

  const submit = () => {
    if (!canSubmit || status === "loading") return;

    setHasRequested(true);
    cleanupRef.current?.();
    cleanupRef.current = loadRecommendations(criteria);
  };

  const toggleFeature = (feature: FeatureTag) => {
    setCriteria((current) => {
      if (current.preferredFeatures.includes(feature)) {
        return {
          ...current,
          preferredFeatures: current.preferredFeatures.filter(
            (item) => item !== feature,
          ),
        };
      }

      if (current.preferredFeatures.length >= 3) return current;

      return {
        ...current,
        preferredFeatures: [...current.preferredFeatures, feature],
      };
    });
  };

  const selectionSummary = [
    findLabel(occasionOptions, criteria.occasion),
    findLabel(seasonOptions, criteria.season),
    ...criteria.preferredFeatures.map(
      (feature) => findLabel(featureOptions, feature) ?? feature,
    ),
    criteria.category === "ALL"
      ? null
      : findLabel(categoryOptions, criteria.category),
  ].filter(Boolean);

  return (
    <MobileScreenLayout
      figmaNodeId="157:511"
      contentClassName="px-6 pt-6 pb-7"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
    >
      <LuxuryReveal>
        <p className="text-[11px] leading-4 font-bold text-[#9b8057]">
          맞춤 추천
        </p>
        <h1 className="mt-4 text-[27px] leading-[34px] font-bold tracking-[-0.04em] text-[#15151a]">
          어떤 제품을 찾고 있나요?
        </h1>
        <p className="mt-2 text-[14px] leading-5 text-[#777780]">
          저장한 스타일 취향과 선택 조건을 반영해요.
        </p>
      </LuxuryReveal>

      <div className="mt-8 space-y-5">
        <LuxuryReveal delay={50}>
          <ChoiceGroup
            title="상황 · 1개 선택"
            options={occasionOptions}
            selectedValues={criteria.occasion ? [criteria.occasion] : []}
            onSelect={(occasion) =>
              setCriteria((current) => ({
                ...current,
                occasion: occasion as OccasionTag,
              }))
            }
          />
        </LuxuryReveal>

        <LuxuryReveal delay={90}>
          <ChoiceGroup
            title="계절 · 1개 선택"
            options={seasonOptions}
            selectedValues={criteria.season ? [criteria.season] : []}
            onSelect={(season) =>
              setCriteria((current) => ({
                ...current,
                season: season as CurrentSeasonTag,
              }))
            }
          />
        </LuxuryReveal>

        <LuxuryReveal delay={130}>
          <ChoiceGroup
            title="특징 · 1~3개 선택"
            options={featureOptions}
            selectedValues={criteria.preferredFeatures}
            onSelect={(feature) => toggleFeature(feature as FeatureTag)}
          />
        </LuxuryReveal>

        <LuxuryReveal delay={170}>
          <ChoiceGroup
            title="카테고리 · 1개 선택"
            options={categoryOptions}
            selectedValues={[criteria.category]}
            onSelect={(category) =>
              setCriteria((current) => ({
                ...current,
                category: category as ItemCategory | "ALL",
              }))
            }
          />
        </LuxuryReveal>
      </div>

      <LuxuryReveal className="mt-7" delay={210}>
        <div className="min-h-[72px] rounded-[14px] bg-[#f5f5f6] px-4 py-3">
          <p className="text-[11px] font-bold text-[#777780]">선택한 조건</p>
          <p className="mt-2 text-[12px] leading-[18px] font-semibold text-[#15151a]">
            {selectionSummary.length > 0
              ? selectionSummary.join(" · ")
              : "상황, 계절, 특징을 선택해 주세요."}
          </p>
        </div>

        {hasRequested && error ? (
          <p role="alert" className="mt-3 text-[12px] text-[#a04646]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!canSubmit || status === "loading"}
          onClick={submit}
          className="mt-7 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#15151a] text-[14px] font-bold text-white transition-opacity disabled:opacity-35"
        >
          {status === "loading" ? "추천을 찾는 중..." : "맞춤 추천 보기"}
        </button>
      </LuxuryReveal>
    </MobileScreenLayout>
  );
}

type ChoiceOption = {
  value: string;
  label: string;
};

function ChoiceGroup({
  title,
  options,
  selectedValues,
  onSelect,
}: {
  title: string;
  options: readonly ChoiceOption[];
  selectedValues: readonly string[];
  onSelect: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-[12px] leading-4 font-bold text-[#15151a]">
        {title}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option.value)}
              className={`min-h-9 rounded-full border px-[15px] py-2 text-[12px] leading-4 font-semibold transition-colors ${
                isSelected
                  ? "border-[#15151a] bg-[#15151a] text-white"
                  : "border-[#d8d8dc] bg-white text-[#606068]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function findLabel(
  options: readonly ChoiceOption[],
  value: string,
): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}
