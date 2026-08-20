import { pollAiJob } from "@/services/aiJobPolling";
import { backendApi } from "@/services/api";
import type { AiJob, StylePlanSliderContext } from "@/types/api";

export async function requestStylePlanPreview(
  context: StylePlanSliderContext,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<AiJob> {
  const accepted = await backendApi.intelligence.createAiJob(
    { type: "STYLE_PLAN", context },
    idempotencyKey,
    signal,
  );

  return pollAiJob(accepted.data.data.jobId, signal);
}
