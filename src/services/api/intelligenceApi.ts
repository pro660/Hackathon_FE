import { api } from "@/lib/axios";
import type {
  AiJob,
  AiJobAccepted,
  ApiPage,
  ApiPlace,
  ApiPlaceRecommendation,
  ApiSuccessResponse,
  OccasionTag,
  PageQuery,
  PlaceCategory,
  StylePlanSliderContext,
  StylePlanSummary,
  StyleTag,
} from "@/types/api";

type AiJobRequest =
  | {
      type: "ITEM_ANALYSIS";
      context: { imageAssetId: string };
    }
  | {
      type: "PURCHASE_UTILITY";
      context: { productId: string };
    }
  | {
      type: "STYLE_PLAN";
      context:
        | StylePlanSliderContext
        | {
            occasion: OccasionTag;
            styleTags: StyleTag[];
            weatherCondition: string | null;
            prioritizeOwnedItems: boolean;
            language: "ko";
          };
    };

type CreateStylePlanRequest = {
  aiJobId: number | null;
  title: string;
  occasion: OccasionTag;
  plannedAt: string | null;
  weatherCondition: string | null;
  description: string | null;
  status: "DRAFT" | "CONFIRMED";
  ownedItems: Array<{
    myItemId: number;
    role: "MAIN" | "TOP" | "BOTTOM" | "SHOES" | "BAG" | "ACCESSORY";
    sortOrder: number;
  }>;
  recommendedProducts: Array<{
    productId: number;
    rank: number;
    reason: string;
  }>;
};

type StylePlanDetail = Pick<
  StylePlanSummary,
  "stylePlanId" | "title" | "occasion" | "plannedAt" | "status" | "createdAt"
> & {
  weatherCondition: string | null;
  description: string | null;
  generationType: "AI" | "RULE_BASED" | "MANUAL";
  ownedItems: Array<{
    myItemId: string;
    name: string;
    imageUrl: string | null;
    role: string;
    sortOrder: number;
  }>;
  recommendedProducts: Array<{
    productId: string;
    name: string;
    imageUrl: string | null;
    rank: number;
    reason: string;
  }>;
  places: ApiPlace[];
  version: number;
  updatedAt: string;
};

type PlaceSearchQuery = {
  query?: string;
  category?: PlaceCategory;
  latitude?: number;
  longitude?: number;
  radius?: number;
};

export const aiJobPollingPolicy = {
  initialIntervalMs: 2_000,
  maximumIntervalMs: 2_000,
  backoffMultiplier: 1,
  timeoutMs: 30_000,
} as const;

function validateStylePlanRequest(body: AiJobRequest) {
  if (body.type !== "STYLE_PLAN") {
    return;
  }

  const context = body.context;

  if ("styleTags" in context) {
    if (context.styleTags.length < 1 || context.styleTags.length > 4) {
      throw new Error("STYLE_PLAN styleTags는 1~4개여야 합니다.");
    }
    return;
  }

  const levels = [context.casualFormalLevel, context.neatGlamorousLevel];
  if (levels.some((level) => !Number.isInteger(level) || level < 1 || level > 10)) {
    throw new Error("STYLE_PLAN 스타일 강도는 두 축 모두 1~10 정수여야 합니다.");
  }
}

export const intelligenceApi = {
  createAiJob: (
    body: AiJobRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ) => {
    validateStylePlanRequest(body);
    return api.post<ApiSuccessResponse<AiJobAccepted>>("/ai-jobs", body, {
      headers: { "Idempotency-Key": idempotencyKey },
      timeout: 20_000,
      signal,
    });
  },

  getAiJob: (jobId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<AiJob>>(`/ai-jobs/${jobId}`, { signal }),

  createStylePlan: (body: CreateStylePlanRequest) =>
    api.post<ApiSuccessResponse<{ stylePlanId: string }>>("/style-plans", body),

  getStylePlans: (params: PageQuery = {}) =>
    api.get<ApiSuccessResponse<ApiPage<StylePlanSummary>>>("/style-plans", {
      params,
    }),

  getStylePlan: (stylePlanId: string) =>
    api.get<ApiSuccessResponse<StylePlanDetail>>(
      `/style-plans/${stylePlanId}`,
    ),

  updateStylePlan: (
    stylePlanId: string,
    body: {
      title?: string;
      plannedAt?: string | null;
      status?: StylePlanSummary["status"];
      version: number;
    },
  ) =>
    api.patch<ApiSuccessResponse<StylePlanDetail>>(
      `/style-plans/${stylePlanId}`,
      body,
    ),

  deleteStylePlan: (stylePlanId: string) =>
    api.delete<void>(`/style-plans/${stylePlanId}`),

  searchPlaces: (params: PlaceSearchQuery) =>
    api.get<ApiSuccessResponse<{ items: ApiPlace[] }>>("/places", { params }),

  getPlace: (placeId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<ApiPlace>>(
      `/places/${encodeURIComponent(placeId)}`,
      { signal },
    ),

  recommendPlaces: (
    stylePlanId: string,
    body: {
      query: string | null;
      category: PlaceCategory | null;
      latitude: number;
      longitude: number;
      radius?: number;
    },
    signal?: AbortSignal,
  ) =>
    api.post<
      ApiSuccessResponse<{
        stylePlanId: string;
        rankingPolicyVersion: string;
        places: ApiPlaceRecommendation[];
      }>
    >(`/style-plans/${stylePlanId}/place-recommendations`, body, { signal }),

  getSavedPlaces: (params: PageQuery = {}) =>
    api.get<ApiSuccessResponse<ApiPage<ApiPlace & { savedAt: string }>>>(
      "/places/saved",
      { params },
    ),

  savePlace: (placeId: string) =>
    api.put<ApiSuccessResponse<ApiPlace>>(`/places/${placeId}/saved`),

  removeSavedPlace: (placeId: string) =>
    api.delete<void>(`/places/${placeId}/saved`),
};
