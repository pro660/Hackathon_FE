"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { AnimatedCounter } from "@/components/common/motion/AnimatedCounter";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/apiError";
import { AiJobPollingTimeoutError } from "@/services/aiJobPolling";
import {
  PurchaseUtilityJobFailedError,
  PurchaseUtilityInsufficientDataError,
  requestPurchaseUtilityAnalysis,
} from "@/services/purchaseUtilityWorkflow";
import type { PurchaseUtilityAnalysis } from "@/types/api";

type ProductValueCheckScreenProps = { productId?: string };

export function ProductValueCheckScreen({ productId }: ProductValueCheckScreenProps) {
  const [analysis, setAnalysis] = useState<PurchaseUtilityAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!productId) return;

    const controller = new AbortController();
    void requestPurchaseUtilityAnalysis(productId, controller.signal)
      .then(setAnalysis)
      .catch((analysisError: unknown) => {
        if (controller.signal.aborted) return;
        if (process.env.NODE_ENV !== "production") {
          console.error("구매 활용성 분석 실패", analysisError);
        }
        setError(getAnalysisErrorMessage(analysisError));
      });

    return () => controller.abort();
  }, [attempt, productId]);

  return (
    <MobileScreenLayout
      figmaNodeId="119:584"
      contentClassName="bg-white px-6 pt-6 pb-7 text-[#161513]"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <p className="text-[11px] leading-4 font-semibold text-[#b28b55]">
            VALUE CHECK
          </p>
          <h1 className="mt-3 text-[27px] leading-[34px] font-bold tracking-[-0.04em]">
            구매 전 활용 가능성
          </h1>
          <p className="mt-1 text-[13px] leading-[22px] text-[#79756f]">
            취향과 보유 아이템 기준의 분석 결과예요
          </p>
        </LuxuryReveal>

        {!productId ? (
          <StateMessage message="제품 상세에서 확인할 제품을 먼저 선택해 주세요." />
        ) : !analysis && !error ? (
          <StateMessage message="활용 가능성을 분석하고 있어요." />
        ) : null}

        {error ? (
          <div className="mt-8 rounded-[16px] bg-[#f8eeee] px-4 py-4 text-center">
            <p role="alert" className="text-[12px] leading-5 text-[#9a4545]">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAttempt((current) => current + 1);
              }}
              className="mt-3 rounded-full border border-[#d9bcbc] px-4 py-2 text-[11px] font-semibold text-[#824242]"
            >
              다시 확인
            </button>
          </div>
        ) : null}

        {analysis ? (
          <>
            <LuxuryReveal className="mt-6" delay={50}>
              <section className="h-[238px] rounded-[24px] bg-[#f6f3ed] px-[18px] pt-[18px]">
                <p className="text-[12px] font-semibold text-[#8a6840]">활용 점수</p>
                <ScoreRing score={Math.round(analysis.utilityScore)} />
                <p className="mt-2 text-center text-[13px] font-semibold text-[#4b4741]">
                  {getScoreMessage(analysis.utilityScore)}
                </p>
              </section>
            </LuxuryReveal>

            <div className="mt-[22px] space-y-[14px]">
              <LuxuryReveal delay={100}>
                <InsightCard
                  badge={String(analysis.compatibleItemCount)}
                  title={`보유 아이템 ${analysis.compatibleItemCount}개와 조합 가능`}
                  description="보유 아이템과의 조합 가능성을 분석했어요"
                />
              </LuxuryReveal>
              <LuxuryReveal delay={150}>
                <InsightCard
                  badge={getSeasonBadge(analysis.factors.seasonUsabilityScore)}
                  title={`계절 활용도 ${getSeasonLevel(analysis.factors.seasonUsabilityScore)}`}
                  description={getSeasonDescription(analysis.factors.seasonUsabilityScore)}
                />
              </LuxuryReveal>
              <LuxuryReveal delay={200}>
                <InsightCard
                  badge={getCareBadge(analysis.careDifficulty)}
                  title={`관리 난이도 ${getCareDifficultyLabel(analysis.careDifficulty)}`}
                  description={getCareDescription(analysis.careDifficulty)}
                />
              </LuxuryReveal>
            </div>

            <LuxuryReveal className="mt-auto pt-8" delay={250}>
              <Link
                href={`/recommendations/${productId}/value-check/report?analysisId=${encodeURIComponent(analysis.analysisId)}`}
                className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#151412] text-[14px] font-semibold text-white"
              >
                상세 리포트 보기
              </Link>
            </LuxuryReveal>
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}

function getAnalysisErrorMessage(error: unknown) {
  if (error instanceof PurchaseUtilityInsufficientDataError) {
    return error.message;
  }

  if (error instanceof PurchaseUtilityJobFailedError) {
    return error.message;
  }

  if (error instanceof AiJobPollingTimeoutError) {
    return error.message;
  }

  const errorCode = getApiErrorCode(error);
  if (errorCode === "AI_JOB_ALREADY_RUNNING") {
    return "다른 AI 분석이 진행 중입니다. 완료된 후 다시 확인해 주세요.";
  }
  if (errorCode === "AI_DAILY_LIMIT_EXCEEDED") {
    return "오늘 사용할 수 있는 AI 분석 횟수를 모두 사용했습니다.";
  }

  return getApiErrorMessage(
    error,
    "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
  );
}

function ScoreRing({ score }: { score: number }) {
  const prefersReducedMotion = useReducedMotion();
  const normalizedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div
      role="img"
      aria-label={`활용 점수 ${normalizedScore}점`}
      className="relative mx-auto mt-1 flex size-[154px] items-center justify-center"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-[19px] rounded-full bg-[#b28b55]/15 blur-xl"
        animate={prefersReducedMotion ? undefined : { scale: [0.94, 1.08, 0.94], opacity: [0.3, 0.65, 0.3] }}
        transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
      />
      <svg aria-hidden="true" className="absolute inset-0 size-full -rotate-90" viewBox="0 0 154 154">
        <circle cx="77" cy="77" r="61" fill="none" stroke="#e2ddd5" strokeWidth="13" />
        <motion.circle
          cx="77"
          cy="77"
          r="61"
          fill="none"
          stroke="#a67a42"
          strokeLinecap="round"
          strokeWidth="13"
          pathLength={1}
          initial={prefersReducedMotion ? { pathLength: normalizedScore / 100 } : { pathLength: 0 }}
          animate={{ pathLength: normalizedScore / 100 }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <AnimatedCounter
          value={normalizedScore}
          duration={1_700}
          className="text-[42px] leading-[46px] font-bold tracking-[-0.05em] tabular-nums"
        />
        <span className="text-[10px] font-semibold text-[#7d766c]">VALUE SCORE</span>
      </div>
    </div>
  );
}

function InsightCard({ badge, title, description }: { badge: string; title: string; description: string }) {
  return (
    <article className="flex h-[62px] items-center rounded-[18px] border border-[#e4e1dc] bg-[#f8f8f7] px-3">
      <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[14px] bg-[#eee9e0] text-[13px] font-semibold text-[#88663f]">
        {badge}
      </span>
      <span className="ml-4 min-w-0">
        <span className="block truncate text-[14px] leading-5 font-semibold">{title}</span>
        <span className="block truncate text-[11px] leading-4 text-[#88837c]">{description}</span>
      </span>
    </article>
  );
}

function StateMessage({ message }: { message: string }) {
  return <p className="mt-12 text-center text-[12px] text-[#79756f]">{message}</p>;
}

function getScoreMessage(score: number) {
  if (score >= 70) return "활용도가 높은 선택이에요";
  if (score >= 40) return "충분히 활용할 수 있는 선택이에요";
  return "활용 조건을 조금 더 확인해 보세요";
}

function getSeasonLevel(score: number) {
  if (score <= 10) return "낮음";
  if (score <= 20) return "보통";
  return "높음";
}

function getSeasonBadge(score: number) {
  if (score <= 10) return "↓";
  if (score <= 20) return "―";
  return "↑";
}

function getSeasonDescription(score: number) {
  const level = getSeasonLevel(score);
  if (level === "높음") return "여러 계절에 활용하기 좋은 제품이에요";
  if (level === "보통") return "선택한 계절을 중심으로 활용하기 좋아요";
  return "활용 가능한 계절이 비교적 한정적이에요";
}

function getCareDifficultyLabel(value: PurchaseUtilityAnalysis["careDifficulty"]) {
  return { EASY: "쉬움", MODERATE: "보통", HARD: "어려움", UNKNOWN: "확인 불가" }[value];
}

function getCareBadge(value: PurchaseUtilityAnalysis["careDifficulty"]) {
  return { EASY: "E", MODERATE: "M", HARD: "H", UNKNOWN: "?" }[value];
}

function getCareDescription(value: PurchaseUtilityAnalysis["careDifficulty"]) {
  return {
    EASY: "비교적 간단하게 관리할 수 있어요",
    MODERATE: "정기적인 제품 관리가 필요해요",
    HARD: "소재에 맞는 세심한 관리가 필요해요",
    UNKNOWN: "제품 관리 정보를 확인하지 못했어요",
  }[value];
}
