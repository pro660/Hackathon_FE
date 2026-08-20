"use client";

import { create } from "zustand";

import { getApiErrorCode } from "@/lib/apiError";
import { backendApi } from "@/services/api";
import type { ApiPlace } from "@/types/api";
import type { PlaceDetail, PlaceRecommendation } from "@/types/place";

function mapApiPlace(place: ApiPlace): PlaceDetail {
  return {
    id: place.placeId,
    name: place.name,
    description: place.categoryName,
    category: place.categoryName,
    area: place.roadAddress ?? place.address ?? "주소 정보 없음",
    coordinates: {
      latitude: place.latitude,
      longitude: place.longitude,
    },
    summary: null,
    businessHours: null,
    address: place.roadAddress ?? place.address ?? "주소 정보 없음",
    walkingMinutes: null,
    thumbnailColor: "#e8e3d9",
  };
}

function mergePlaces(current: PlaceDetail[], incoming: PlaceDetail[]) {
  const merged = new Map(current.map((place) => [place.id, place]));
  incoming.forEach((place) => merged.set(place.id, place));
  return Array.from(merged.values());
}

type PlaceState = {
  places: PlaceDetail[];
  lastRecommendedPlaces: PlaceRecommendation[];
  lastRecommendationStylePlanId: string | null;
  savedPlaceIds: string[];
  pendingPlaceIds: string[];
  isLoadingSavedPlaces: boolean;
  loadingPlaceIds: string[];
  loadedPlaceIds: string[];
  placeDetailError: string | null;
  error: string | null;
  registerPlaces: (
    places: PlaceRecommendation[],
    stylePlanId?: string,
  ) => void;
  loadPlace: (placeId: string, signal?: AbortSignal) => Promise<PlaceDetail | null>;
  loadSavedPlaces: () => Promise<void>;
  toggleSavedPlace: (placeId: string) => Promise<boolean>;
};

export const usePlaceStore = create<PlaceState>((set, get) => ({
  places: [],
  lastRecommendedPlaces: [],
  lastRecommendationStylePlanId: null,
  savedPlaceIds: [],
  pendingPlaceIds: [],
  isLoadingSavedPlaces: false,
  loadingPlaceIds: [],
  loadedPlaceIds: [],
  placeDetailError: null,
  error: null,

  registerPlaces: (recommendations, stylePlanId) =>
    set((state) => {
      const details = recommendations.map((place) => {
        const existing = state.places.find((candidate) => candidate.id === place.id);
        return {
          ...existing,
          ...place,
          name: existing?.name ?? place.name,
          summary: existing?.summary ?? null,
          businessHours: existing?.businessHours ?? null,
          address: existing?.address ?? place.area,
          walkingMinutes: existing?.walkingMinutes ?? null,
          thumbnailColor: existing?.thumbnailColor ?? "#e8e3d9",
        } satisfies PlaceDetail;
      });

      return {
        places: mergePlaces(state.places, details),
        ...(stylePlanId
          ? {
              lastRecommendedPlaces: recommendations,
              lastRecommendationStylePlanId: stylePlanId,
            }
          : {}),
      };
    }),

  loadPlace: async (placeId, signal) => {
    set((state) => ({
      loadingPlaceIds: [...new Set([...state.loadingPlaceIds, placeId])],
      placeDetailError: null,
    }));

    try {
      const response = await backendApi.intelligence.getPlace(placeId, signal);
      const apiPlace = response.data.data;
      const place = mapApiPlace(apiPlace);

      set((state) => ({
        places: mergePlaces(state.places, [place]),
        savedPlaceIds: apiPlace.saved
          ? [...new Set([...state.savedPlaceIds, placeId])]
          : state.savedPlaceIds.filter((id) => id !== placeId),
      }));
      return place;
    } catch (loadError) {
      if (signal?.aborted) {
        return null;
      }

      set({
        placeDetailError:
          getApiErrorCode(loadError) === "PLACE_NOT_FOUND"
            ? "장소를 찾을 수 없어요."
            : "장소 상세 정보를 불러오지 못했습니다.",
      });
      return null;
    } finally {
      set((state) => ({
        loadingPlaceIds: state.loadingPlaceIds.filter((id) => id !== placeId),
        loadedPlaceIds: signal?.aborted
          ? state.loadedPlaceIds
          : [...new Set([...state.loadedPlaceIds, placeId])],
      }));
    }
  },

  loadSavedPlaces: async () => {
    set({ isLoadingSavedPlaces: true, error: null });
    try {
      const response = await backendApi.intelligence.getSavedPlaces({
        page: 0,
        size: 50,
      });
      const savedPlaces = response.data.data.items.map(mapApiPlace);
      set((state) => ({
        places: mergePlaces(state.places, savedPlaces),
        savedPlaceIds: savedPlaces.map((place) => place.id),
      }));
    } catch {
      set({ error: "저장한 장소를 불러오지 못했습니다." });
    } finally {
      set({ isLoadingSavedPlaces: false });
    }
  },

  toggleSavedPlace: async (placeId) => {
    const state = get();
    const isSaved = state.savedPlaceIds.includes(placeId);

    if (state.pendingPlaceIds.includes(placeId)) {
      return isSaved;
    }

    set((current) => ({
      pendingPlaceIds: [...current.pendingPlaceIds, placeId],
      error: null,
    }));

    try {
      if (isSaved) {
        await backendApi.intelligence.removeSavedPlace(placeId);
      } else {
        await backendApi.intelligence.savePlace(placeId);
      }

      set((current) => ({
        savedPlaceIds: isSaved
          ? current.savedPlaceIds.filter((id) => id !== placeId)
          : [...new Set([...current.savedPlaceIds, placeId])],
      }));
      return !isSaved;
    } catch (error) {
      set({ error: "장소 저장 상태를 변경하지 못했습니다." });
      throw error;
    } finally {
      set((current) => ({
        pendingPlaceIds: current.pendingPlaceIds.filter((id) => id !== placeId),
      }));
    }
  },
}));
