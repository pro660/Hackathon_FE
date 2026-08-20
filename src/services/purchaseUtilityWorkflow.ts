import { backendApi } from "@/services/api";
import { pollAiJob } from "@/services/aiJobPolling";
import type {
  PurchaseUtilityAnalysis,
  PurchaseUtilityJobResult,
} from "@/types/api";

export class PurchaseUtilityInsufficientDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PurchaseUtilityInsufficientDataError";
  }
}

export class PurchaseUtilityJobFailedError extends Error {
  constructor(
    message: string,
    public readonly code: string | null,
  ) {
    super(message);
    this.name = "PurchaseUtilityJobFailedError";
  }
}

type PendingPurchaseUtilityJob = {
  idempotencyKey: string;
  jobId: string | null;
};

function getStorageKey(productId: string) {
  return `purchase-utility:${productId}:pending-job`;
}

function writePendingJob(
  productId: string,
  pending: PendingPurchaseUtilityJob,
) {
  try {
    globalThis.sessionStorage?.setItem(
      getStorageKey(productId),
      JSON.stringify(pending),
    );
  } catch {
    // 저장소 차단은 요청 자체를 막지 않습니다.
  }
}

function readPendingJob(productId: string): PendingPurchaseUtilityJob {
  try {
    const serialized = globalThis.sessionStorage?.getItem(
      getStorageKey(productId),
    );
    if (serialized) {
      const value = JSON.parse(
        serialized,
      ) as Partial<PendingPurchaseUtilityJob>;
      if (
        typeof value.idempotencyKey === "string" &&
        (typeof value.jobId === "string" || value.jobId === null)
      ) {
        return {
          idempotencyKey: value.idempotencyKey,
          jobId: value.jobId,
        };
      }
    }
  } catch {
    // 손상된 저장값은 새 요청 정보로 교체합니다.
  }

  const pending = {
    idempotencyKey:
      globalThis.crypto?.randomUUID?.() ??
      `purchase-utility-${productId}-${Date.now()}`,
    jobId: null,
  };
  writePendingJob(productId, pending);
  return pending;
}

function clearPendingJob(productId: string) {
  try {
    globalThis.sessionStorage?.removeItem(getStorageKey(productId));
  } catch {
    // 저장소 차단은 결과 처리를 막지 않습니다.
  }
}

function parsePurchaseUtilityJobResult(
  value: unknown,
): PurchaseUtilityJobResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const result = value as {
    status?: unknown;
    analysisId?: unknown;
    message?: unknown;
  };

  if (result.status === "READY" && typeof result.analysisId === "string") {
    return { status: "READY", analysisId: result.analysisId };
  }

  if (
    result.status === "INSUFFICIENT_DATA" &&
    result.analysisId === null &&
    typeof result.message === "string"
  ) {
    return {
      status: "INSUFFICIENT_DATA",
      analysisId: null,
      message: result.message,
    };
  }

  return null;
}

export async function requestPurchaseUtilityAnalysis(
  productId: string,
  signal?: AbortSignal,
): Promise<PurchaseUtilityAnalysis> {
  const pending = readPendingJob(productId);

  if (!pending.jobId) {
    const accepted = await backendApi.intelligence.createAiJob(
      { type: "PURCHASE_UTILITY", context: { productId } },
      pending.idempotencyKey,
      signal,
    );
    pending.jobId = accepted.data.data.jobId;
    writePendingJob(productId, pending);
  }

  const job = await pollAiJob(pending.jobId, signal);

  if (job.status === "FAILED") {
    clearPendingJob(productId);
    throw new PurchaseUtilityJobFailedError(
      job.error?.message ?? "구매 전 활용 가능성 분석에 실패했습니다.",
      job.error?.code ?? null,
    );
  }

  const result = parsePurchaseUtilityJobResult(job.result);
  if (!result) {
    clearPendingJob(productId);
    throw new Error("구매 전 활용 가능성 분석 결과를 확인하지 못했습니다.");
  }

  if (result.status === "INSUFFICIENT_DATA") {
    clearPendingJob(productId);
    throw new PurchaseUtilityInsufficientDataError(result.message);
  }

  const response = await backendApi.utility.getPurchaseUtilityAnalysis(
    result.analysisId,
    signal,
  );
  clearPendingJob(productId);
  return response.data.data;
}
