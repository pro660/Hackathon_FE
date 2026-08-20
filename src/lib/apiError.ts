import axios from "axios";

import type { ApiErrorResponse, ApiFieldError } from "@/types/api";

export function getApiErrorCode(error: unknown) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return null;
  }

  return error.response?.data?.error?.code ?? null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.error?.message ?? fallback;
}

export function getApiFieldErrors(error: unknown): ApiFieldError[] {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return [];
  }

  return error.response?.data?.error?.fields ?? [];
}
