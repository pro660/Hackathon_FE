"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import type { PurchaseUtilityAnalysis } from "@/types/api";

export function PurchaseUtilityReportScreen({ analysisId }: { analysisId?: string }) {
  const [analysis, setAnalysis] = useState<PurchaseUtilityAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    const controller = new AbortController();
    void backendApi.utility
      .getPurchaseUtilityAnalysis(analysisId, controller.signal)
      .then((response) => setAnalysis(response.data.data))
      .catch(() => {
        if (!controller.signal.aborted) setError("상세 리포트를 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, [analysisId]);

  return (
    <MobileScreenLayout
      figmaNodeId="156:161"
      contentClassName="bg-white px-6 pt-[162px] pb-8 text-[#161412]"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
    >
      <LuxuryReveal>
        <h1 className="text-[20px] leading-7 font-bold">활용 가능성 상세 리포트</h1>
        <p className="mt-2 text-[11px] leading-4 text-[#7a7570]">
          분석 결과에 따라 점수와 설명이 달라져요.
        </p>
      </LuxuryReveal>

      {!analysisId ? <StateMessage message="분석 결과 식별자가 없습니다." /> : null}
      {analysisId && !analysis && !error ? <StateMessage message="상세 점수를 불러오고 있어요." /> : null}
      {error ? <p role="alert" className="mt-8 rounded-[16px] bg-[#f8eeee] px-4 py-4 text-[12px] text-[#9a4545]">{error}</p> : null}

      {analysis ? (
        <>
          <div className="mt-6 space-y-[14px]">
            <LuxuryReveal delay={50}>
              <ScoreFactorCard label="취향 적합도" score={analysis.factors.preferenceTagFitScore} max={30} ticks={[0, 10, 20, 30]} />
            </LuxuryReveal>
            <LuxuryReveal delay={90}>
              <ScoreFactorCard label="보유 아이템 궁합" score={analysis.factors.styleCombinationScore} max={25} ticks={[0, 10, 18, 25]} />
            </LuxuryReveal>
            <LuxuryReveal delay={130}>
              <ScoreFactorCard label="계절 활용도" score={analysis.factors.seasonUsabilityScore} max={25} ticks={[0, 10, 15, 20, 25]} />
            </LuxuryReveal>
            <LuxuryReveal delay={170}>
              <ScoreFactorCard label="카테고리 조합성" score={analysis.factors.ownedCategoryCombinationScore} max={20} ticks={[0, 8, 14, 20]} />
            </LuxuryReveal>
          </div>

          <LuxuryReveal className="mt-6" delay={210}>
            <section className="rounded-[18px] border border-[#e3ded6] bg-[#f6f3ed] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[13px] font-bold">AI 분석 설명</h2>
                <span className="rounded-full bg-[#e9e1d5] px-2.5 py-1 text-[9px] font-bold text-[#88663f]">
                  {analysis.explanationGenerationType}
                </span>
              </div>
              <p className="mt-3 text-[12px] leading-5 text-[#625d56]">{analysis.summary}</p>
            </section>
            <p className="mt-4 text-[11px] text-[#7a7570]">
              AI/규칙 기반 분석 요약 · 총점 {formatScore(analysis.utilityScore)}/100
            </p>
          </LuxuryReveal>
        </>
      ) : null}
    </MobileScreenLayout>
  );
}

function ScoreFactorCard({ label, score, max, ticks }: { label: string; score: number; max: number; ticks: readonly number[] }) {
  const prefersReducedMotion = useReducedMotion();
  const normalizedScore = Math.min(Math.max(score, 0), max);

  return (
    <article className="h-[80px] rounded-[16px] border border-[#e3ded6] bg-[#f6f3ed] px-[18px] pt-[10px]">
      <div className="flex items-center justify-between text-[12px] font-semibold">
        <h2>{label} /{max}</h2>
        <span>{formatScore(normalizedScore)}점</span>
      </div>
      <div className="relative mt-3 h-1 rounded-full bg-[#ded8cf]">
        <motion.span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#a67a42]"
          initial={prefersReducedMotion ? { scaleX: normalizedScore / max } : { scaleX: 0 }}
          animate={{ scaleX: normalizedScore / max }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          aria-hidden="true"
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#88663f] shadow-sm"
          initial={prefersReducedMotion ? { left: `${(normalizedScore / max) * 100}%` } : { left: "0%" }}
          animate={{ left: `${(normalizedScore / max) * 100}%` }}
          transition={{ duration: prefersReducedMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="relative mt-2 h-4 text-[10px] text-[#7a7570]">
        {ticks.map((tick) => (
          <span key={tick} className="absolute -translate-x-1/2" style={{ left: `${(tick / max) * 100}%` }}>
            {tick}
          </span>
        ))}
      </div>
    </article>
  );
}

function StateMessage({ message }: { message: string }) {
  return <p className="mt-10 text-center text-[12px] text-[#7a7570]">{message}</p>;
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
