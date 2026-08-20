"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { getApiErrorMessage } from "@/lib/apiError";
import { readStylePlanSliderContext, stylePlanIdempotencyStorageKey } from "@/lib/stylePlanDraft";
import { backendApi } from "@/services/api";
import { requestStylePlanPreview } from "@/services/stylePlanWorkflow";
import type { StylePlanSliderContext } from "@/types/api";

type PreviewItem = { myItemId: string; name: string; imageUrl: string | null; role: string; sortOrder: number };
type PreviewProduct = { productId: string; name: string; imageUrl: string | null; rank: number; reason: string };
type StylePlanPreview = { title: string; description: string | null; ownedItems: PreviewItem[]; recommendedProducts: PreviewProduct[]; generationType: "AI" | "RULE_BASED" };

const roleLabels: Record<string, string> = {
  MAIN: "메인",
  TOP: "상의",
  BOTTOM: "하의",
  SHOES: "신발",
  BAG: "가방",
  ACCESSORY: "액세서리",
};

function ResultItemCard({
  imageUrl,
  title,
  description,
  badge,
}: {
  imageUrl: string | null;
  title: string;
  description?: string;
  badge: string;
}) {
  return (
    <article className="flex min-h-[70px] items-center rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-3 py-2">
      <div
        role="img"
        aria-label={`${title} 이미지`}
        className="size-[46px] shrink-0 rounded-[11px] bg-[#e8e3d9] bg-cover bg-center"
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
      />
      <div className="ml-4 min-w-0 flex-1">
        <h3 className="truncate text-[14px] leading-[18px] font-bold text-[#0e0e12]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-[15px] text-[#6e707a]">
            {description}
          </p>
        ) : null}
      </div>
      <span className="ml-3 shrink-0 rounded-full bg-[#ece7df] px-2.5 py-1 text-[10px] font-bold text-[#796950]">
        {badge}
      </span>
    </article>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function parsePreview(value: unknown): StylePlanPreview | null {
  if (!isRecord(value) || typeof value.title !== "string" || !Array.isArray(value.ownedItems) || !Array.isArray(value.recommendedProducts)) return null;
  return value as StylePlanPreview;
}
function getIdempotencyKey() {
  const current = sessionStorage.getItem(stylePlanIdempotencyStorageKey);
  if (current) return current;
  const key = crypto.randomUUID();
  sessionStorage.setItem(stylePlanIdempotencyStorageKey, key);
  return key;
}

export default function AiRecommendPage() {
  const router = useRouter();
  const [context, setContext] = useState<StylePlanSliderContext | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<StylePlanPreview | null>(null);
  const [status, setStatus] = useState("스타일을 분석하고 있어요.");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const nextContext = readStylePlanSliderContext();
    if (!nextContext) {
      void Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setStatus("");
          setError("스타일 강도 설정을 확인하지 못했습니다. 다시 선택해 주세요.");
        }
      });
      return () => controller.abort();
    }
    void requestStylePlanPreview(nextContext, getIdempotencyKey(), controller.signal)
      .then((job) => {
        const result = parsePreview(job.result ?? job.fallback);
        if (!result) throw new Error(job.error?.message ?? "추천 결과 형식이 올바르지 않습니다.");
        setContext(nextContext);
        setJobId(job.jobId);
        setPreview(result);
        setStatus("");
      })
      .catch((failure) => { if (!controller.signal.aborted) { setStatus(""); setError(getApiErrorMessage(failure, "스타일 추천을 불러오지 못했습니다.")); } })
      .finally(() => sessionStorage.removeItem(stylePlanIdempotencyStorageKey));
    return () => controller.abort();
  }, []);

  const saveStylePlan = async () => {
    if (!preview || !context || !jobId) return;
    setIsSaving(true); setError(null);
    try {
      const roles = new Set(["MAIN", "TOP", "BOTTOM", "SHOES", "BAG", "ACCESSORY"]);
      const response = await backendApi.intelligence.createStylePlan({
        aiJobId: Number(jobId), title: preview.title, occasion: context.occasion,
        plannedAt: null, weatherCondition: context.weatherCondition ?? null,
        description: preview.description, status: "CONFIRMED",
        ownedItems: preview.ownedItems.filter((item) => Number.isFinite(Number(item.myItemId)) && roles.has(item.role)).map((item) => ({ myItemId: Number(item.myItemId), role: item.role as "MAIN" | "TOP" | "BOTTOM" | "SHOES" | "BAG" | "ACCESSORY", sortOrder: item.sortOrder })),
        recommendedProducts: preview.recommendedProducts.filter((item) => Number.isFinite(Number(item.productId))).map((item) => ({ productId: Number(item.productId), rank: item.rank, reason: item.reason })),
      });
      router.replace(`/place?stylePlanId=${encodeURIComponent(response.data.data.stylePlanId)}`);
    } catch (failure) {
      setError(getApiErrorMessage(failure, "스타일 플랜을 저장하지 못했습니다."));
      setIsSaving(false);
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="126:2"
      contentClassName="relative bg-white px-6 pt-4 pb-8 text-[#0e0e12]"
    >
      <LuxuryReveal>
        <BackButton />
        <p className="mt-3 text-[11px] font-bold text-[#8b7355]">
          AI RECOMMEND
        </p>
        <h1 className="mt-2 text-[28px] leading-8 font-bold tracking-[-0.04em]">
          스마트 착용 추천
        </h1>
        <p className="mt-2 text-[13px] text-[#777780]">
          내 아이템을 중심으로 코디해요
        </p>
      </LuxuryReveal>

      {status ? (
        <p role="status" className="mt-5 text-[11px] text-[#777780]">
          {status}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-[12px] bg-[#f8eeee] px-3 py-3 text-[11px] text-[#9a4545]"
        >
          {error}
        </p>
      ) : null}

      {!preview && !error ? (
        <section className="mt-8 flex min-h-[300px] items-center justify-center rounded-[24px] bg-[#ece8e1]">
          <p className="text-[13px] font-bold text-[#9a8d7a]">
            분석 결과를 기다리고 있어요
          </p>
        </section>
      ) : null}

      {preview ? (
        <div className="mt-7 space-y-8">
          <LuxuryReveal delay={60}>
            <section className="rounded-[20px] bg-[#0e0e12] px-5 py-5 text-white">
              <p className="text-[11px] font-bold text-[#b89666]">
                STYLE PLAN
              </p>
              <h2 className="mt-3 text-[21px] leading-7 font-bold tracking-[-0.03em]">
                {preview.title}
              </h2>
              <p className="mt-2 text-[12px] leading-5 text-white/70">
                {preview.description || "선택한 조건과 보유 아이템을 반영한 스타일이에요."}
              </p>
            </section>
          </LuxuryReveal>

          <LuxuryReveal delay={110}>
            <section>
              <div className="flex items-end justify-between">
                <h2 className="text-[16px] font-bold">보유 아이템 역할 배치</h2>
                <span className="text-[11px] text-[#777780]">
                  {preview.ownedItems.length}개 활용
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {preview.ownedItems.map((item) => (
                  <ResultItemCard
                    key={`${item.myItemId}-${item.sortOrder}`}
                    imageUrl={item.imageUrl}
                    title={item.name}
                    badge={roleLabels[item.role] ?? item.role}
                  />
                ))}
                {preview.ownedItems.length === 0 ? (
                  <p className="rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-4 py-7 text-center text-[12px] text-[#777780]">
                    이번 스타일에 배치된 보유 아이템이 없어요.
                  </p>
                ) : null}
              </div>
            </section>
          </LuxuryReveal>

          <LuxuryReveal delay={160}>
            <section>
              <div className="flex items-end justify-between">
                <h2 className="text-[16px] font-bold">MCM 추천 제품</h2>
                <span className="text-[11px] text-[#777780]">
                  {preview.recommendedProducts.length}개 추천
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {preview.recommendedProducts.map((product) => (
                  <ResultItemCard
                    key={`${product.productId}-${product.rank}`}
                    imageUrl={product.imageUrl}
                    title={product.name}
                    description={product.reason}
                    badge={`${product.rank}순위`}
                  />
                ))}
                {preview.recommendedProducts.length === 0 ? (
                  <p className="rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-4 py-7 text-center text-[12px] text-[#777780]">
                    추천된 MCM 제품이 없어요.
                  </p>
                ) : null}
              </div>
            </section>
          </LuxuryReveal>
        </div>
      ) : null}

      <LuxuryReveal className="mt-10" delay={210}>
        <button
          type="button"
          disabled={!preview || isSaving}
          onClick={() => setIsSaveDialogOpen(true)}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[15px] font-bold text-white transition-colors hover:bg-[#26262c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          이 스타일로 결정
        </button>
      </LuxuryReveal>

      <ConfirmDialog
        open={isSaveDialogOpen}
        layout="stacked"
        title="스타일을 저장할까요?"
        description="컬렉션에서 다시 볼 수 있어요"
        confirmLabel="저장하기"
        cancelLabel="취소"
        pendingLabel="저장 중..."
        isPending={isSaving}
        onCancel={() => setIsSaveDialogOpen(false)}
        onConfirm={() => void saveStylePlan()}
      />
    </MobileScreenLayout>
  );
}
