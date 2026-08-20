"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { ScreenHeader } from "@/components/common/section/ScreenHeader";
import { PlaceMap } from "@/components/place/PlaceMap";
import { usePlaceStore } from "@/store/usePlaceStore";

type PlaceDetailScreenProps = {
  placeId: string;
  stylePlanId?: string;
  latitude?: string;
  longitude?: string;
};

export function PlaceDetailScreen({
  placeId,
  stylePlanId,
  latitude,
  longitude,
}: PlaceDetailScreenProps) {
  const router = useRouter();
  const places = usePlaceStore((state) => state.places);
  const savedPlaceIds = usePlaceStore((state) => state.savedPlaceIds);
  const pendingPlaceIds = usePlaceStore((state) => state.pendingPlaceIds);
  const loadingPlaceIds = usePlaceStore((state) => state.loadingPlaceIds);
  const loadedPlaceIds = usePlaceStore((state) => state.loadedPlaceIds);
  const placeDetailError = usePlaceStore((state) => state.placeDetailError);
  const storeError = usePlaceStore((state) => state.error);
  const loadPlace = usePlaceStore((state) => state.loadPlace);
  const toggleSavedPlace = usePlaceStore((state) => state.toggleSavedPlace);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const place = useMemo(
    () => places.find((candidate) => candidate.id === placeId),
    [placeId, places],
  );
  const placeMatchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (stylePlanId) params.set("stylePlanId", stylePlanId);
    if (latitude) params.set("latitude", latitude);
    if (longitude) params.set("longitude", longitude);
    const query = params.toString();

    return `/place${query ? `?${query}` : ""}`;
  }, [latitude, longitude, stylePlanId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPlace(placeId, controller.signal);
    return () => controller.abort();
  }, [loadPlace, placeId]);

  const isLoadingPlace =
    loadingPlaceIds.includes(placeId) || !loadedPlaceIds.includes(placeId);

  if (!place && isLoadingPlace) {
    return (
      <MobileScreenLayout contentClassName="flex bg-white px-6 pt-[47px] pb-8">
        <div className="flex min-h-full w-full flex-col">
          <BackButton />
          <p className="mt-8 text-[13px] text-[#777780]">장소 정보를 불러오고 있어요.</p>
        </div>
      </MobileScreenLayout>
    );
  }

  if (!place) {
    return (
      <MobileScreenLayout contentClassName="flex bg-white px-6 pt-[47px] pb-8">
        <div className="flex min-h-full w-full flex-col">
          <BackButton />
          <div className="mt-6">
            <ScreenHeader
              eyebrow="PLACE DETAIL"
              title={placeDetailError ?? "장소를 찾을 수 없어요"}
              description="추천 장소 목록에서 다시 선택해 주세요."
            />
          </div>
          <Link
            href={placeMatchHref}
            className="mt-auto flex h-[52px] items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white"
          >
            장소 추천으로 돌아가기
          </Link>
        </div>
      </MobileScreenLayout>
    );
  }

  const isSaved = savedPlaceIds.includes(place.id);
  const isSaving = pendingPlaceIds.includes(place.id);
  const handleSavePlace = async () => {
    setActionMessage(null);

    if (isSaved) {
      router.push("/place/saved");
      return;
    }

    try {
      const nextSaved = await toggleSavedPlace(place.id);
      if (nextSaved) {
        router.push("/place/saved");
        return;
      }

      setActionMessage("장소를 저장하지 못했어요.");
    } catch {
      setActionMessage("장소를 저장하지 못했어요.");
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="156:54"
      contentClassName="flex bg-white px-6 pt-4 pb-2"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
    >
      <div className="flex min-h-full w-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="text-[17px] leading-5 font-bold text-[#0e0e12]">
            {place.name}
          </h1>
        </LuxuryReveal>

        <LuxuryReveal className="mt-8" delay={60}>
          <PlaceMap
            places={[place]}
            areaLabel={place.area}
            heightClassName="h-[360px]"
            selectedPlaceId={place.id}
          />
        </LuxuryReveal>

        <LuxuryReveal className="mt-6" delay={110}>
          <div className="min-h-[82px] rounded-[16px] border border-[#e0e2e5] bg-[#f8f8f9] px-5 py-4">
            <p className="text-[12px] leading-5 font-bold text-[#6b6e78]">
              주소
            </p>
            <p className="mt-1 text-[15px] leading-6 font-bold text-[#0e0e12]">
              {place.address}
            </p>
          </div>
          {actionMessage || storeError ? (
            <p
              role="status"
              className="mt-4 text-[11px] text-[#7a6650]"
            >
              {actionMessage ?? storeError}
            </p>
          ) : null}
        </LuxuryReveal>

        <LuxuryReveal className="mt-auto pt-10" delay={170}>
          <button
            type="button"
            disabled={isSaving}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#dbdee3] bg-white text-[14px] font-bold text-[#0e0e12] disabled:opacity-50"
            onClick={() => void handleSavePlace()}
          >
            {isSaving ? "저장 중..." : isSaved ? "저장한 장소 보기" : "장소 저장"}
          </button>
        </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
