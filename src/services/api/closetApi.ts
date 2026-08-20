import { api } from "@/lib/axios";
import type {
  ApiPage,
  ApiSuccessResponse,
  CareCalendar,
  CareGuide,
  CareReminderSetting,
  ColorGroup,
  ImageAsset,
  ItemCategory,
  MaterialGroup,
  MaterialSource,
  MyItemDetail,
  MyItemImage,
  MyItemSummary,
  PageQuery,
  ProductPassport,
  StorageGuide,
} from "@/types/api";

type MyItemListQuery = PageQuery & {
  keyword?: string;
  category?: ItemCategory;
  color?: ColorGroup;
};

export type CreateMyItemRequest = {
  productId: number | null;
  brandName: string | null;
  name: string;
  category: ItemCategory;
  primaryColor: ColorGroup | null;
  material: MaterialGroup | null;
  materialSource: MaterialSource | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  purchaseOrderNumber: string | null;
  purchasePlace: string | null;
  memo: string | null;
  aiJobId: number | null;
  nextCareDate: string | null;
};

export type UpdateMyItemRequest = Partial<
  Omit<CreateMyItemRequest, "name" | "category">
> & {
  name?: string;
  category?: ItemCategory;
  version: number;
};

export const closetApi = {
  getItems: (params: MyItemListQuery = {}) =>
    api.get<ApiSuccessResponse<ApiPage<MyItemSummary>>>("/my-items", {
      params,
    }),

  getItem: (myItemId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<MyItemDetail>>(`/my-items/${myItemId}`, {
      signal,
    }),

  createItem: (body: CreateMyItemRequest) =>
    api.post<ApiSuccessResponse<{ myItemId: string }>>("/my-items", body),

  updateItem: (myItemId: string, body: UpdateMyItemRequest) =>
    api.patch<ApiSuccessResponse<MyItemDetail>>(`/my-items/${myItemId}`, body),

  deleteItem: (myItemId: string) => api.delete<void>(`/my-items/${myItemId}`),

  getProductPassport: (myItemId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<ProductPassport>>(
      `/my-items/${myItemId}/passport`,
      { signal },
    ),

  uploadImageAsset: (file: File, signal?: AbortSignal) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<ApiSuccessResponse<ImageAsset>>("/image-assets", formData, {
      signal,
    });
  },

  deleteImageAsset: (imageAssetId: string) =>
    api.delete<void>(`/image-assets/${imageAssetId}`),

  attachImage: (myItemId: string, imageAssetId: string) =>
    api.put<ApiSuccessResponse<MyItemImage>>(
      `/my-items/${myItemId}/images/${imageAssetId}`,
    ),

  removeImage: (myItemId: string, imageAssetId: string) =>
    api.delete<void>(`/my-items/${myItemId}/images/${imageAssetId}`),

  getCareGuide: (myItemId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<CareGuide>>(`/my-items/${myItemId}/care-guide`, {
      signal,
    }),

  getStorageGuide: (myItemId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<StorageGuide>>(
      `/my-items/${myItemId}/storage-guide`,
      { signal },
    ),

  getCareCalendar: (myItemId: string, month: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<CareCalendar>>(
      `/my-items/${myItemId}/care-calendar`,
      { params: { month }, signal },
    ),

  getCareReminderSetting: (myItemId: string, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<CareReminderSetting>>(
      `/my-items/${myItemId}/care-reminder-setting`,
      { signal },
    ),

  updateCareReminderSetting: (myItemId: string, enabled: boolean) =>
    api.put<ApiSuccessResponse<CareReminderSetting>>(
      `/my-items/${myItemId}/care-reminder-setting`,
      { enabled },
    ),
};
