"use client";

import { create } from "zustand";

import type {
  ColorGroup,
  ItemCategory,
  MaterialGroup,
} from "@/types/api";

export type ItemAnalysisValues = {
  name?: string;
  brandName?: string;
  category: ItemCategory;
  primaryColor: ColorGroup;
  material: MaterialGroup;
};

export type ItemRegistrationDraft = {
  name: string;
  brandName: string;
  category: ItemCategory | "";
  primaryColor: ColorGroup | "";
  material: MaterialGroup | "";
  purchaseDate: string;
  purchasePrice: string;
  purchasePlace: string;
  memo: string;
};

export type PendingItemImageUpload = {
  myItemId: string;
  itemName: string;
  file: File | null;
  previewUrl: string | null;
  fileName: string | null;
};

type AnalysisStatus = "IDLE" | "PROCESSING" | "SUCCEEDED" | "FAILED";

type AnalyzedImageAsset = {
  imageAssetId: string;
  url: string;
};

type ItemRegistrationState = {
  draft: ItemRegistrationDraft;
  photoFile: File | null;
  photoPreviewUrl: string | null;
  photoName: string | null;
  analysisStatus: AnalysisStatus;
  analysisMessage: string | null;
  aiJobId: string | null;
  analysisImage: AnalyzedImageAsset | null;
  materialSource: "USER_CONFIRMED" | "AI_ESTIMATED";
  createdItemId: string | null;
  pendingImageUpload: PendingItemImageUpload | null;
  updateDraft: (patch: Partial<ItemRegistrationDraft>) => void;
  updateMaterial: (material: MaterialGroup) => void;
  setPhoto: (file: File, previewUrl: string) => void;
  clearPhoto: () => void;
  startAnalysis: () => void;
  applyAnalysis: (
    values: ItemAnalysisValues,
    aiJobId: string,
    image: AnalyzedImageAsset,
  ) => void;
  failAnalysis: (message: string, image?: AnalyzedImageAsset | null) => void;
  markItemCreated: (myItemId: string) => void;
  markImageUploadPending: (myItemId: string) => void;
  setPendingImageFile: (file: File, previewUrl: string) => void;
  loadPendingImageUpload: () => void;
  clearPendingImageUpload: () => void;
  resetDraft: () => void;
};

const emptyDraft: ItemRegistrationDraft = {
  name: "",
  brandName: "",
  category: "",
  primaryColor: "",
  material: "",
  purchaseDate: "",
  purchasePrice: "",
  purchasePlace: "",
  memo: "",
};

const pendingImageStorageKey = "pending-item-image-upload";

function savePendingImageUpload(pending: PendingItemImageUpload | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!pending) {
    window.sessionStorage.removeItem(pendingImageStorageKey);
    return;
  }

  window.sessionStorage.setItem(
    pendingImageStorageKey,
    JSON.stringify({ myItemId: pending.myItemId, itemName: pending.itemName }),
  );
}

export const useItemRegistrationStore = create<ItemRegistrationState>((set) => ({
  draft: { ...emptyDraft },
  photoFile: null,
  photoPreviewUrl: null,
  photoName: null,
  analysisStatus: "IDLE",
  analysisMessage: null,
  aiJobId: null,
  analysisImage: null,
  materialSource: "USER_CONFIRMED",
  createdItemId: null,
  pendingImageUpload: null,

  updateDraft: (patch) =>
    set((state) => ({ draft: { ...state.draft, ...patch } })),

  updateMaterial: (material) =>
    set((state) => ({
      draft: { ...state.draft, material },
      materialSource:
        state.analysisStatus === "SUCCEEDED"
          ? "USER_CONFIRMED"
          : state.materialSource,
    })),

  setPhoto: (file, previewUrl) =>
    set((state) => ({
      draft:
        state.analysisStatus === "SUCCEEDED"
          ? {
              ...state.draft,
              name: "",
              brandName: "",
              category: "",
              primaryColor: "",
              material: "",
            }
          : state.draft,
      photoFile: file,
      photoPreviewUrl: previewUrl,
      photoName: file.name,
      analysisStatus: "IDLE",
      analysisMessage: null,
      aiJobId: null,
      analysisImage: null,
      materialSource: "USER_CONFIRMED",
    })),

  clearPhoto: () =>
    set({
      photoFile: null,
      photoPreviewUrl: null,
      photoName: null,
      analysisStatus: "IDLE",
      analysisMessage: null,
      aiJobId: null,
      analysisImage: null,
      materialSource: "USER_CONFIRMED",
    }),

  startAnalysis: () =>
    set({ analysisStatus: "PROCESSING", analysisMessage: null }),

  applyAnalysis: (values, aiJobId, image) =>
    set((state) => ({
      draft: { ...state.draft, ...values },
      analysisStatus: "SUCCEEDED",
      analysisMessage:
        "AI가 카테고리·대표 색상·소재를 채웠어요. 모든 값은 수정할 수 있어요.",
      aiJobId,
      analysisImage: image,
      materialSource: "AI_ESTIMATED",
    })),

  failAnalysis: (message, image = null) =>
    set({
      analysisStatus: "FAILED",
      analysisMessage: message,
      aiJobId: null,
      analysisImage: image,
      materialSource: "USER_CONFIRMED",
    }),

  markItemCreated: (myItemId) => set({ createdItemId: myItemId }),

  markImageUploadPending: (myItemId) =>
    set((state) => {
      const pendingImageUpload = {
        myItemId,
        itemName: state.draft.name,
        file: state.photoFile,
        previewUrl: state.photoPreviewUrl,
        fileName: state.photoName,
      };

      savePendingImageUpload(pendingImageUpload);
      return { pendingImageUpload };
    }),

  setPendingImageFile: (file, previewUrl) =>
    set((state) =>
      state.pendingImageUpload
        ? {
            pendingImageUpload: {
              ...state.pendingImageUpload,
              file,
              previewUrl,
              fileName: file.name,
            },
          }
        : {},
    ),

  loadPendingImageUpload: () => {
    if (typeof window === "undefined") {
      return;
    }

    const storedPending = window.sessionStorage.getItem(pendingImageStorageKey);
    if (!storedPending) {
      return;
    }

    try {
      const parsed: unknown = JSON.parse(storedPending);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof (parsed as { myItemId?: unknown }).myItemId === "string" &&
        typeof (parsed as { itemName?: unknown }).itemName === "string"
      ) {
        set((state) => ({
          pendingImageUpload:
            state.pendingImageUpload ?? {
              myItemId: (parsed as { myItemId: string }).myItemId,
              itemName: (parsed as { itemName: string }).itemName,
              file: null,
              previewUrl: null,
              fileName: null,
            },
        }));
      }
    } catch {
      window.sessionStorage.removeItem(pendingImageStorageKey);
    }
  },

  clearPendingImageUpload: () => {
    savePendingImageUpload(null);
    set({ pendingImageUpload: null });
  },

  resetDraft: () =>
    set({
      draft: { ...emptyDraft },
      photoFile: null,
      photoPreviewUrl: null,
      photoName: null,
      analysisStatus: "IDLE",
      analysisMessage: null,
      aiJobId: null,
      analysisImage: null,
      materialSource: "USER_CONFIRMED",
      createdItemId: null,
    }),
}));
