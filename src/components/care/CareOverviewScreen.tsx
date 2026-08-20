"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DetailActionCard } from "@/components/common/card/DetailActionCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { findDateText, getGuideEntries } from "@/components/care/carePresentation";
import { backendApi } from "@/services/api";
import type { CareGuide } from "@/types/api";

type CareOverviewScreenProps = { itemId?: string };

export function CareOverviewScreen({ itemId }: CareOverviewScreenProps) {
  const [guide, setGuide] = useState<CareGuide | null>(null);
  const [itemMaterial, setItemMaterial] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    void backendApi.closet
      .getCareGuide(itemId, controller.signal)
      .then((guideResponse) => {
        setGuide(guideResponse.data.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("관리 가이드를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [itemId]);

  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    void backendApi.closet
      .getItem(itemId, controller.signal)
      .then((response) => setItemMaterial(response.data.data.material))
      .catch(() => undefined);
    return () => controller.abort();
  }, [itemId]);

  const entries = guide ? getGuideEntries(guide) : [];
  const primaryEntry = entries.find((entry) => !/\d{4}[-.]\d{2}[-.]\d{2}/.test(entry.value)) ?? entries[0];
  const secondaryEntries = entries.filter((entry) => entry.key !== primaryEntry?.key);
  const nextDate = findDateText(entries);
  const canUseGuide = Boolean(
    guide &&
      (guide.available !== false || guide.material || itemMaterial || entries.length),
  );

  return (
    <MobileScreenLayout
      figmaNodeId="119:1219"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#17171c]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] leading-6 font-bold">맞춤 관리 가이드</h1>
          <p className="mt-5 text-[13px] leading-5 text-[#7a7a83]">소재에 맞춘 관리 가이드</p>
        </LuxuryReveal>

        {!itemId ? (
          <EmptyCareState
            title="관리할 아이템을 선택해 주세요"
            description="내 아이템 상세에서 맞춤 관리 가이드를 확인할 수 있어요."
            href="/items"
            buttonLabel="내 아이템 보기"
          />
        ) : null}

        {itemId && !guide && !error ? (
          <div className="mt-8 space-y-4" role="status" aria-label="관리 가이드를 불러오는 중">
            <div className="h-[142px] animate-pulse rounded-[18px] bg-[#f3eee6]" />
            <div className="h-[74px] animate-pulse rounded-[14px] bg-[#f3f3f5]" />
            <div className="h-[74px] animate-pulse rounded-[14px] bg-[#f3f3f5]" />
          </div>
        ) : null}

        {error ? <p role="alert" className="mt-8 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}

        {guide && !canUseGuide && itemId ? (
          <EmptyCareState
            title="관리 정보를 더 입력해 주세요"
            description="소재를 등록하면 맞춤 관리·보관법을 확인할 수 있고, 구매일까지 등록하면 관리 일정과 알림도 받을 수 있어요."
            href={`/items/${encodeURIComponent(itemId)}/edit`}
            buttonLabel="제품 정보 수정"
          />
        ) : null}

        {guide && canUseGuide && itemId ? (
          <>
            <LuxuryReveal className="mt-8" delay={60}>
              <section className="min-h-[142px] rounded-[18px] bg-[#f3eee6] px-[18px] py-[22px]">
                <p className="text-[11px] font-bold text-[#777780]">다음 권장 관리</p>
                <p className="mt-4 whitespace-pre-line text-[18px] leading-6 font-bold text-[#24242a]">
                  {primaryEntry?.value ?? "제품의 관리 안내를 확인해 주세요."}
                </p>
              </section>
            </LuxuryReveal>

            <LuxuryReveal className="mt-7 space-y-4" delay={110}>
              <DetailActionCard
                title="권장 주기 · 제품 소재 기준"
                description={nextDate ? `다음 권장일 · ${nextDate}` : "관리 일정을 확인해 보세요"}
                href={`/care/calendar?itemId=${encodeURIComponent(itemId)}`}
              />
              <DetailActionCard
                title="환경·습도 및 보관법"
                description="환경과 소재에 맞는 보관 방법"
                href={`/care/storage?itemId=${encodeURIComponent(itemId)}`}
              />
            </LuxuryReveal>

            {secondaryEntries.length ? (
              <LuxuryReveal className="mt-6 space-y-3" delay={150}>
                {secondaryEntries.map((entry) => (
                  <div key={entry.key} className="rounded-[15px] border border-[#e4e4e8] bg-[#f7f7f8] px-4 py-4">
                    <p className="text-[11px] font-bold text-[#777780]">{entry.label}</p>
                    <p className="mt-2 whitespace-pre-line text-[13px] leading-5 text-[#35353b]">{entry.value}</p>
                  </div>
                ))}
              </LuxuryReveal>
            ) : null}

            <p className="mt-auto pt-10 text-[9px] leading-4 text-[#a0a0a6]">
              서비스 권장 관리 주기이며 제조사 공식 주기와 다를 수 있어요.
            </p>
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}

type EmptyCareStateProps = {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
};

function EmptyCareState({ title, description, href, buttonLabel }: EmptyCareStateProps) {
  return (
    <LuxuryReveal className="my-auto py-14 text-center" delay={70}>
      <h2 className="text-[23px] leading-8 font-bold tracking-[-0.035em]">{title}</h2>
      <p className="mx-auto mt-4 max-w-[294px] text-[13px] leading-5 text-[#75706b]">{description}</p>
      <Link href={href} className="mx-auto mt-8 flex h-[52px] max-w-[294px] items-center justify-center rounded-[16px] bg-[#14120f] text-[14px] font-bold text-white">
        {buttonLabel}
      </Link>
    </LuxuryReveal>
  );
}
