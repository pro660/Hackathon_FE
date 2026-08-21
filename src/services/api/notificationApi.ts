import { api } from "@/lib/axios";
import type {
  ApiPage,
  ApiSuccessResponse,
  PageQuery,
  ServiceNotification,
} from "@/types/api";

export const notificationApi = {
  getNotifications: (params: PageQuery = {}, signal?: AbortSignal) =>
    api.get<ApiSuccessResponse<ApiPage<ServiceNotification>>>(
      "/notifications",
      { params, signal },
    ),

  setNotificationRead: (notificationId: string, read: boolean) =>
    api.patch<ApiSuccessResponse<ServiceNotification>>(
      `/notifications/${notificationId}`,
      { read },
    ),
};
