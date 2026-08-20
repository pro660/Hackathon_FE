import { api } from "@/lib/axios";
import type {
  ApiPage,
  ApiSuccessResponse,
  CartItem,
  ColorGroup,
  CurrentSeasonTag,
  FeatureTag,
  ItemCategory,
  OccasionTag,
  PageQuery,
  ProductDetail,
  ProductSummary,
  Recommendation,
} from "@/types/api";

type ProductListQuery = PageQuery & {
  keyword?: string;
  category?: ItemCategory;
  color?: ColorGroup;
  minPrice?: number;
  maxPrice?: number;
};

type CreateRecommendationRequest = {
  occasion: OccasionTag;
  season: CurrentSeasonTag;
  preferredFeatures: [FeatureTag, ...FeatureTag[]];
  category?: ItemCategory;
  limit?: 1 | 2 | 3;
};

export const catalogApi = {
  getProducts: (params: ProductListQuery, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<ApiPage<ProductSummary>>>("/products", {
      params,
      signal,
    }),

  getProduct: (productId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<ProductDetail>>(`/products/${productId}`, {
      signal,
    }),

  createRecommendation: (
    body: CreateRecommendationRequest,
    signal?: AbortSignal,
  ) =>
    api.post<ApiSuccessResponse<Recommendation>>("/recommendations", body, {
      signal,
    }),

  getRecommendation: (recommendationId: string) =>
    api.get<ApiSuccessResponse<Recommendation>>(
      `/recommendations/${recommendationId}`,
    ),

  getWishlist: (params: PageQuery = {}) =>
    api.get<ApiSuccessResponse<ApiPage<ProductSummary>>>("/wishlists", {
      params,
    }),

  addFavorite: (productId: string) =>
    api.put<void>(`/products/${productId}/favorite`),

  removeFavorite: (productId: string) =>
    api.delete<void>(`/products/${productId}/favorite`),

  getCartItems: (params: PageQuery = {}, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<ApiPage<CartItem>>>("/cart-items", {
      params,
      signal,
    }),

  addToCart: (productId: string) =>
    api.put<void>(`/products/${productId}/cart`),

  removeFromCart: (productId: string) =>
    api.delete<void>(`/products/${productId}/cart`),
};
