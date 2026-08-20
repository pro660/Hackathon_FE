"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { PlaceList } from "@/components/place/PlaceList";
import { PlaceMap } from "@/components/place/PlaceMap";
import { backendApi } from "@/services/api";
import { usePlaceStore } from "@/store/usePlaceStore";
import type { ApiPlaceRecommendation } from "@/types/api";
import type { PlaceRecommendation } from "@/types/place";

type PlaceResultScreenProps = {
  keywords: string[];
  places: PlaceRecommendation[];
  stylePlanId?: string;
  latitude?: number;
  longitude?: number;
};

function mapBackendPlace(
  recommendation: ApiPlaceRecommendation,
  fallbackArea: string,
): PlaceRecommendation {
  return {
    id: recommendation.place.placeId,
    name: recommendation.place.name,
    description: recommendation.reasonCode,
    category: recommendation.place.categoryName,
    area:
      recommendation.place.roadAddress ??
      recommendation.place.address ??
      fallbackArea,
    coordinates: {
      latitude: recommendation.place.latitude,
      longitude: recommendation.place.longitude,
    },
  };
}

export function PlaceResultScreen({
  keywords,
  places,
  stylePlanId,
  latitude,
  longitude,
}: PlaceResultScreenProps) {
  const router = useRouter();
  const lastRecommendedPlaces = usePlaceStore(
    (state) => state.lastRecommendedPlaces,
  );
  const lastRecommendationStylePlanId = usePlaceStore(
    (state) => state.lastRecommendationStylePlanId,
  );
  const hasBackendRequest = true;
  const [displayPlaces, setDisplayPlaces] = useState(() =>
    places.length > 0
      ? places
      : lastRecommendationStylePlanId === stylePlanId
        ? lastRecommendedPlaces
        : [],
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>();
  const [detailReadyPlaceId, setDetailReadyPlaceId] = useState<string>();
  const [isLoading, setIsLoading] = useState(hasBackendRequest);
  const [error, setError] = useState<string | null>(null);
  const registerPlaces = usePlaceStore((state) => state.registerPlaces);

  useEffect(() => {
    if (displayPlaces.length > 0) {
      registerPlaces(displayPlaces, stylePlanId);
    }
  }, [displayPlaces, registerPlaces, stylePlanId]);

  useEffect(() => {
    const controller = new AbortController();

    if (!stylePlanId) {
      void Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setError("스마트 착용 추천을 저장한 뒤 장소 추천을 확인해 주세요.");
        }
      });
      return () => controller.abort();
    }

    const resolveCoordinates = () => {
      if (latitude !== undefined && longitude !== undefined) {
        return Promise.resolve({ latitude, longitude });
      }
      return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("현재 위치를 사용할 수 없습니다."));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          () => reject(new Error("장소 추천을 위해 위치 권한을 허용해 주세요.")),
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
        );
      });
    };

    const request = resolveCoordinates().then((coordinates) =>
      backendApi.intelligence
        .recommendPlaces(stylePlanId, { query: null, category: null, ...coordinates }, controller.signal)
        .then(({ data }) => data.data.places.map((item) => mapBackendPlace(item, "주소 정보 없음"))),
    );

    void request
      .then((nextPlaces) => {
        registerPlaces(nextPlaces, stylePlanId);
        setDisplayPlaces(nextPlaces);
        setSelectedPlaceId(undefined);
        setDetailReadyPlaceId(undefined);
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error ? failure.message : "장소를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [latitude, longitude, registerPlaces, stylePlanId]);

  const createPlaceDetailHref = (placeId: string) => {
    const params = new URLSearchParams();
    if (stylePlanId) params.set("stylePlanId", stylePlanId);
    if (latitude !== undefined) params.set("latitude", String(latitude));
    if (longitude !== undefined) params.set("longitude", String(longitude));
    const query = params.toString();

    return `/place/${encodeURIComponent(placeId)}${query ? `?${query}` : ""}`;
  };

  const handlePlaceSelect = (place: PlaceRecommendation) => {
    if (detailReadyPlaceId === place.id) {
      router.push(createPlaceDetailHref(place.id));
      return;
    }

    setSelectedPlaceId(place.id);
    setDetailReadyPlaceId(place.id);
  };

  const handleMarkerSelect = (place: PlaceRecommendation) => {
    setSelectedPlaceId(place.id);
    setDetailReadyPlaceId(undefined);
  };

  const displayKeywords = displayPlaces.length > 0
    ? [...new Set(displayPlaces.flatMap((place) => [place.area, place.category]))].slice(0, 3)
    : keywords;

  return (
    <MobileScreenLayout
      figmaNodeId="119:758"
      contentClassName="px-6 pt-6 pb-6"
      bottomNavigation={<BottomNavigation activeItem="home" />}
    >
      <LuxuryReveal>
        <header>
          <h1 className="text-[17px] leading-5 font-bold text-[#0e0e12]">
            장소 매치
          </h1>
          <p className="mt-[35px] text-[13px] leading-5 text-[#6e707a]">
            현재 룩과 어울리는 장소를 찾았어요
          </p>
        </header>
      </LuxuryReveal>

      <LuxuryReveal className="mt-8" delay={70}>
        {isLoading ? (
          <p className="mb-3 text-[11px] text-[#777780]">백엔드에서 추천 장소 좌표를 불러오고 있습니다.</p>
        ) : null}
        {error ? (
          <p role="status" className="mb-3 text-[11px] text-[#9a6d45]">{error}</p>
        ) : null}
        <PlaceList
          places={displayPlaces}
          selectedPlaceId={selectedPlaceId}
          detailReadyPlaceId={detailReadyPlaceId}
          onPlaceSelect={handlePlaceSelect}
        />
      </LuxuryReveal>

      <LuxuryReveal className="mt-[52px]" delay={140}>
        <PlaceMap
          places={displayPlaces}
          areaLabel={displayPlaces[0]?.area ?? displayKeywords[0]}
          selectedPlaceId={selectedPlaceId}
          onMarkerSelect={handleMarkerSelect}
        />
      </LuxuryReveal>
    </MobileScreenLayout>
  );
}
