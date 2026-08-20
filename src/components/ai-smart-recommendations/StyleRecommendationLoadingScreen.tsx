"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { PiSparkleFill } from "react-icons/pi";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  getStylePlanIdempotencyKey,
  parseStylePlanPreview,
  readStylePlanSliderContext,
  stylePlanIdempotencyStorageKey,
  writePreparedStylePlanPreview,
} from "@/lib/stylePlanDraft";
import { requestStylePlanPreview } from "@/services/stylePlanWorkflow";

export function StyleRecommendationLoadingScreen() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(() => {
    window.sessionStorage.removeItem(stylePlanIdempotencyStorageKey);
    setError(null);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const context = readStylePlanSliderContext();

    if (!context) {
      void Promise.resolve().then(() => {
        if (!controller.signal.aborted) {
          setError("스타일 조건을 확인하지 못했습니다. 다시 설정해 주세요.");
        }
      });
      return () => controller.abort();
    }

    const minimumDisplay = new Promise((resolve) => window.setTimeout(resolve, 800));

    void Promise.all([
      requestStylePlanPreview(
        context,
        getStylePlanIdempotencyKey(),
        controller.signal,
      ),
      minimumDisplay,
    ])
      .then(([job]) => {
        if (controller.signal.aborted) return;

        const preview = parseStylePlanPreview(job.result ?? job.fallback);
        if (!preview) {
          throw new Error(
            job.error?.message ?? "추천 결과 형식이 올바르지 않습니다.",
          );
        }

        writePreparedStylePlanPreview({
          context,
          jobId: job.jobId,
          preview,
        });
        window.sessionStorage.removeItem(stylePlanIdempotencyStorageKey);
        router.replace("/smart-recommendations/result");
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;

        setError(
          getApiErrorMessage(
            failure,
            "스타일 추천을 준비하지 못했습니다.",
          ),
        );
      });

    return () => controller.abort();
  }, [attempt, router]);

  return (
    <MobileScreenLayout
      animateContent={false}
      contentClassName="bg-white px-6 py-8 text-[#0e0e12]"
    >
      <div className="flex min-h-full flex-col items-center justify-center text-center">
        {error ? (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <p className="text-[20px] leading-7 font-bold">
              추천을 준비하지 못했어요
            </p>
            <p role="alert" className="mt-3 text-[13px] leading-5 text-[#777780]">
              {error}
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-9 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white"
            >
              다시 시도
            </button>
            <Link
              href="/smart-recommendations/condition"
              className="mt-3 flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#dbdee3] text-[14px] font-bold"
            >
              조건 다시 설정
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="relative flex size-[136px] items-center justify-center">
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-[#d8cbb8]"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { rotate: 360, scale: [1, 1.08, 1] }
                }
                transition={{
                  rotate: { duration: 5, ease: "linear", repeat: Infinity },
                  scale: { duration: 2.2, ease: "easeInOut", repeat: Infinity },
                }}
              >
                <span className="absolute top-1/2 -right-1 size-2.5 -translate-y-1/2 rounded-full bg-[#9b8057]" />
              </motion.span>
              <motion.span
                aria-hidden="true"
                className="absolute inset-[17px] rounded-full border border-[#e8e0d5]"
                animate={prefersReducedMotion ? undefined : { rotate: -360 }}
                transition={{ duration: 3.8, ease: "linear", repeat: Infinity }}
              >
                <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#c8b99f]" />
              </motion.span>
              <motion.span
                className="flex size-14 items-center justify-center rounded-full bg-[#15151a] text-white shadow-[0_12px_28px_rgba(21,21,26,0.2)]"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scale: [1, 0.92, 1], opacity: [1, 0.82, 1] }
                }
                transition={{ duration: 1.7, ease: "easeInOut", repeat: Infinity }}
              >
                <PiSparkleFill aria-hidden="true" className="size-6" />
              </motion.span>
            </div>

            <motion.h1
              className="mt-10 text-[24px] leading-8 font-bold tracking-[-0.04em]"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              스타일을 구성하고 있어요
            </motion.h1>
            <motion.p
              role="status"
              className="mt-3 text-[13px] leading-5 text-[#777780]"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            >
              보유 아이템과 선택한 조건을 분석 중이에요
            </motion.p>
          </>
        )}
      </div>
    </MobileScreenLayout>
  );
}
