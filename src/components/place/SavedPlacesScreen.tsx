"use client";

import { useEffect, useMemo } from "react";
import {
  PiBuildingsBold,
  PiCoffeeBold,
  PiForkKnifeBold,
  PiMapPinBold,
  PiPaletteBold,
  PiStorefrontBold,
  PiTreeBold,
} from "react-icons/pi";

import { DetailActionCard } from "@/components/common/card/DetailActionCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { ScreenHeader } from "@/components/common/section/ScreenHeader";
import { usePlaceStore } from "@/store/usePlaceStore";

export function SavedPlacesScreen() {
  const places = usePlaceStore((state) => state.places);
  const savedPlaceIds = usePlaceStore((state) => state.savedPlaceIds);
  const isLoading = usePlaceStore((state) => state.isLoadingSavedPlaces);
  const error = usePlaceStore((state) => state.error);
  const loadSavedPlaces = usePlaceStore((state) => state.loadSavedPlaces);

  useEffect(() => {
    void loadSavedPlaces();
  }, [loadSavedPlaces]);

  const savedPlaces = useMemo(
    () => places.filter((place) => savedPlaceIds.includes(place.id)),
    [places, savedPlaceIds],
  );

  return (
    <MobileScreenLayout
      figmaNodeId="390:195"
      contentClassName="bg-white px-6 pt-4 pb-8"
      bottomNavigation={<BottomNavigation activeItem="my" />}
    >
      <LuxuryReveal>
        <BackButton />
      </LuxuryReveal>

      <LuxuryReveal className="mt-1" delay={40}>
        <ScreenHeader
          eyebrow="SAVED PLACES"
          title="저장한 장소"
          description="저장한 곳과 추천을 다시 확인해요"
        />
      </LuxuryReveal>

      <section className="mt-9 space-y-4" aria-live="polite">
        {isLoading ? (
          <p className="text-[12px] text-[#6e707a]">저장한 장소를 불러오고 있어요.</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-[12px] text-[#914b4b]">
            {error}
          </p>
        ) : null}
        {!isLoading && savedPlaces.length === 0 ? (
          <div className="rounded-[16px] border border-[#dbdee3] bg-[#f6f6f8] px-5 py-10 text-center">
            <p className="text-[13px] font-bold text-[#0e0e12]">
              저장한 장소가 없어요
            </p>
            <p className="mt-2 text-[11px] text-[#6e707a]">
              장소 상세에서 마음에 드는 곳을 저장해 보세요
            </p>
          </div>
        ) : null}

        {savedPlaces.map((place, index) => (
          <LuxuryReveal key={place.id} delay={60 + index * 50}>
            <DetailActionCard
              title={place.name}
              description={`저장됨 · ${place.category} · ${place.area}`}
              href={`/place/${encodeURIComponent(place.id)}`}
              leading={
                <span className="flex size-full items-center justify-center bg-[#e9e5df] text-[#7d684a]">
                  {getPlaceCategoryIcon(place.category)}
                </span>
              }
            />
          </LuxuryReveal>
        ))}
      </section>
    </MobileScreenLayout>
  );
}

function getPlaceCategoryIcon(category: string) {
  const normalized = category.toLocaleLowerCase("ko-KR");
  const iconClassName = "size-[22px]";

  if (includesAny(normalized, ["카페", "커피", "cafe", "coffee", "베이커리"])) {
    return <PiCoffeeBold aria-label="카페" className={iconClassName} />;
  }

  if (includesAny(normalized, ["음식", "맛집", "식당", "레스토랑", "food", "restaurant"])) {
    return <PiForkKnifeBold aria-label="음식점" className={iconClassName} />;
  }

  if (includesAny(normalized, ["전시", "미술", "갤러리", "박물관", "museum", "gallery"])) {
    return <PiPaletteBold aria-label="전시 공간" className={iconClassName} />;
  }

  if (includesAny(normalized, ["공원", "자연", "산", "정원", "park", "outdoor"])) {
    return <PiTreeBold aria-label="야외 공간" className={iconClassName} />;
  }

  if (includesAny(normalized, ["쇼핑", "상점", "스토어", "백화점", "shop", "store"])) {
    return <PiStorefrontBold aria-label="쇼핑 공간" className={iconClassName} />;
  }

  if (includesAny(normalized, ["호텔", "숙박", "hotel", "stay"])) {
    return <PiBuildingsBold aria-label="숙박 시설" className={iconClassName} />;
  }

  return <PiMapPinBold aria-label="장소" className={iconClassName} />;
}

function includesAny(value: string, keywords: readonly string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}
