import { backendApi } from "@/services/api";
import { pollAiJob } from "@/services/aiJobPolling";
import type { ItemAnalysisValues } from "@/store/useItemRegistrationStore";
import {
  colorGroups,
  itemCategories,
  materialGroups,
  type ImageAsset,
} from "@/types/api";

const maxImageBytes = 10 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png"]);

export type UploadedImage = {
  imageAssetId: string;
  url: string;
};

export type ItemAnalysisOutcome =
  | {
      status: "SUCCEEDED";
      jobId: string;
      image: UploadedImage;
      values: ItemAnalysisValues;
    }
  | {
      status: "FAILED";
      jobId: string | null;
      image: UploadedImage | null;
      message: string;
    };

function createIdempotencyKey() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `item-analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function validateImage(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("JPEG 또는 PNG 이미지만 업로드할 수 있습니다.");
  }

  if (file.size > maxImageBytes) {
    throw new Error("이미지는 10MB 이하만 업로드할 수 있습니다.");
  }
}

function toUploadedImage(image: ImageAsset): UploadedImage {
  return { imageAssetId: image.imageAssetId, url: image.imageUrl };
}

function parseItemAnalysisResult(value: unknown): ItemAnalysisValues | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Record<keyof ItemAnalysisValues, unknown>>;
  if (
    typeof candidate.category !== "string" ||
    !itemCategories.includes(
      candidate.category as (typeof itemCategories)[number],
    ) ||
    typeof candidate.primaryColor !== "string" ||
    !colorGroups.includes(candidate.primaryColor as (typeof colorGroups)[number]) ||
    typeof candidate.material !== "string" ||
    !materialGroups.includes(candidate.material as (typeof materialGroups)[number])
  ) {
    return null;
  }

  const name =
    typeof candidate.name === "string" ? candidate.name.trim() : "";
  const brandName =
    typeof candidate.brandName === "string"
      ? candidate.brandName.trim()
      : "";

  return {
    ...(name ? { name } : {}),
    ...(brandName ? { brandName } : {}),
    category: candidate.category as ItemAnalysisValues["category"],
    primaryColor: candidate.primaryColor as ItemAnalysisValues["primaryColor"],
    material: candidate.material as ItemAnalysisValues["material"],
  };
}

export async function uploadImageAsset(
  file: File,
  signal?: AbortSignal,
): Promise<UploadedImage> {
  validateImage(file);
  const response = await backendApi.closet.uploadImageAsset(file, signal);
  return toUploadedImage(response.data.data);
}

export async function analyzeItemPhoto(
  file: File,
  signal?: AbortSignal,
): Promise<ItemAnalysisOutcome> {
  let jobId: string | null = null;
  let image: UploadedImage | null = null;

  try {
    image = await uploadImageAsset(file, signal);
    const acceptedResponse = await backendApi.intelligence.createAiJob(
      {
        type: "ITEM_ANALYSIS",
        context: { imageAssetId: image.imageAssetId },
      },
      createIdempotencyKey(),
      signal,
    );

    jobId = acceptedResponse.data.data.jobId;
    const job = await pollAiJob(jobId, signal);

    if (job.status === "FAILED") {
      return {
        status: "FAILED",
        jobId,
        image,
        message:
          job.error?.message ??
          "AI 분석에 실패했어요. 정보를 직접 입력해 주세요.",
      };
    }

    const values = parseItemAnalysisResult(job.result);
    if (!values) {
      return {
        status: "FAILED",
        jobId,
        image,
        message:
          "일부 분석값을 확정하지 못했어요. 정보를 직접 입력해 주세요.",
      };
    }

    return { status: "SUCCEEDED", jobId, image, values };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    return {
      status: "FAILED",
      jobId,
      image,
      message:
        error instanceof Error
          ? error.message
          : "AI 분석을 진행하지 못했어요. 직접 입력해 주세요.",
    };
  }
}

export async function attachUploadedItemImage(
  image: UploadedImage,
  myItemId: string,
) {
  await backendApi.closet.attachImage(myItemId, image.imageAssetId);
  return image;
}

export async function uploadItemImage(
  file: File,
  myItemId: string,
  signal?: AbortSignal,
) {
  const image = await uploadImageAsset(file, signal);
  return attachUploadedItemImage(image, myItemId);
}
