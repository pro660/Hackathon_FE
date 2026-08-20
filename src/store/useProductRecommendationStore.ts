"use client";

import { create } from "zustand";

import { backendApi } from "@/services/api";
import type { ProductCategoryFilter, RecommendationCriteria, RecommendedProduct } from "@/types/product";

type LoadStatus = "idle" | "loading" | "success" | "error";

type ProductRecommendationState = {
  products: RecommendedProduct[];
  status: LoadStatus;
  error: string | null;
  hasRecommendationResult: boolean;
  loadProducts: (category?: ProductCategoryFilter) => () => void;
  loadRecommendations: (criteria: RecommendationCriteria) => () => void;
  setProductFavorited: (productId: string, favorited: boolean) => void;
};

type ActiveRequest = {
  id: number;
  controller: AbortController;
};

let requestSequence = 0;
let activeRequest: ActiveRequest | null = null;

export const useProductRecommendationStore =
  create<ProductRecommendationState>((set, get) => ({
    products: [],
    status: "idle",
    error: null,
    hasRecommendationResult: false,

    loadProducts: (category = "ALL") => {
      activeRequest?.controller.abort();

      const request: ActiveRequest = {
        id: ++requestSequence,
        controller: new AbortController(),
      };
      activeRequest = request;
      set({ status: "loading", error: null, hasRecommendationResult: false });

      void (async () => {
        try {
          const response = await backendApi.catalog.getProducts(
            {
              page: 0,
              size: 50,
              category: category === "ALL" ? undefined : category,
            },
            request.controller.signal,
          );
          const nextProducts: RecommendedProduct[] = response.data.data.items.map(
            (product) => ({
              id: product.productId,
              name: product.name,
              brand: product.brand,
              modelName: product.name,
              displayName: product.name,
              category: product.category,
              price: product.price,
              imageUrl: product.primaryImageUrl ?? undefined,
              favorited: product.favorited,
            }),
          );

          if (
            request.controller.signal.aborted ||
            activeRequest?.id !== request.id
          ) {
            return;
          }

          set({ products: nextProducts, status: "success", error: null });
        } catch {
          if (
            request.controller.signal.aborted ||
            activeRequest?.id !== request.id
          ) {
            return;
          }

          set({
            status: "error",
            error: "추천 제품을 불러오지 못했습니다.",
          });
        } finally {
          if (activeRequest?.id === request.id) {
            activeRequest = null;
          }
        }
      })();

      return () => {
        if (activeRequest?.id !== request.id) {
          return;
        }

        request.controller.abort();
        activeRequest = null;

        if (get().status === "loading") {
          set({ status: "idle" });
        }
      };
    },

    loadRecommendations: (criteria) => {
      activeRequest?.controller.abort();
      const request = { id: ++requestSequence, controller: new AbortController() };
      activeRequest = request;
      set({
        status: "loading",
        error: null,
        products: [],
        hasRecommendationResult: false,
      });

      void backendApi.catalog.createRecommendation(
        {
          occasion: criteria.occasion as Exclude<typeof criteria.occasion, "">,
          season: criteria.season as Exclude<typeof criteria.season, "">,
          preferredFeatures: criteria.preferredFeatures as [typeof criteria.preferredFeatures[number], ...typeof criteria.preferredFeatures],
          category: criteria.category === "ALL" ? undefined : criteria.category,
        },
        request.controller.signal,
      ).then((response) => {
        if (request.controller.signal.aborted || activeRequest?.id !== request.id) return;
        const products = response.data.data.products.map((product) => ({
          id: product.productId,
          name: product.name,
          brand: "MCM",
          modelName: product.name,
          displayName: product.name,
          category: product.category,
          price: product.price,
          imageUrl: product.primaryImageUrl ?? undefined,
          recommendationScore: product.score,
          recommendationScoreBreakdown: product.scoreBreakdown,
          recommendationReason: product.reason,
          favorited: product.favorited,
        }));
        set({ products, status: "success", error: null, hasRecommendationResult: true });
      }).catch(() => {
        if (!request.controller.signal.aborted && activeRequest?.id === request.id) {
          set({ status: "error", error: "추천 제품을 불러오지 못했습니다.", hasRecommendationResult: false });
        }
      }).finally(() => { if (activeRequest?.id === request.id) activeRequest = null; });

      return () => {
        if (activeRequest?.id === request.id) {
          request.controller.abort();
          activeRequest = null;
        }
      };
    },

    setProductFavorited: (productId, favorited) => {
      set((state) => ({
        products: state.products.map((product) =>
          product.id === productId ? { ...product, favorited } : product,
        ),
      }));
    },
  }));
