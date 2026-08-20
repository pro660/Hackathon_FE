"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getGuideEntries } from "@/components/care/carePresentation";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import type { StorageGuide } from "@/types/api";

type StorageGuideScreenProps = { itemId?: string };

export function StorageGuideScreen({ itemId }: StorageGuideScreenProps) {
  const [guide, setGuide] = useState<StorageGuide | null>(null);
  const [itemName, setItemName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    void backendApi.closet
      .getStorageGuide(itemId, controller.signal)
      .then((guideResponse) => {
        setGuide(guideResponse.data.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("보관법을 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [itemId]);

  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    void backendApi.closet
      .getItem(itemId, controller.signal)
      .then((response) => setItemName(response.data.data.name))
      .catch(() => undefined);
    return () => controller.abort();
  }, [itemId]);

  const entries = guide ? getGuideEntries(guide) : [];
  const canUseGuide = Boolean(
    guide && (guide.available !== false || guide.material || entries.length),
  );

  return (
    <MobileScreenLayout
      figmaNodeId="119:1258"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#17171c]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] leading-6 font-bold">{itemName ? `${itemName} 보관법` : "추천 보관법"}</h1>
          <p className="mt-5 text-[13px] leading-5 text-[#7a7a83]">등록된 소재에 맞는 보관 방법을 안내해요.</p>
        </LuxuryReveal>

        {!itemId ? <GuideMessage text="내 아이템에서 보관법을 확인할 제품을 선택해 주세요." /> : null}
        {itemId && !guide && !error ? (
          <div className="mt-8 space-y-4" role="status" aria-label="보관법을 불러오는 중">
            <div className="h-[106px] animate-pulse rounded-[16px] bg-[#202026]" />
            <div className="h-[132px] animate-pulse rounded-[16px] bg-[#f7f2ef]" />
            <div className="h-[132px] animate-pulse rounded-[16px] bg-[#f1f5f7]" />
          </div>
        ) : null}
        {error ? <p role="alert" className="mt-8 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}
        {guide && !canUseGuide ? <GuideMessage text="소재 정보를 등록하면 맞춤 보관법을 확인할 수 있어요." /> : null}

        {guide && canUseGuide ? (
          <>
            <LuxuryReveal className="mt-8 space-y-5" delay={60}>
              {entries.length ? entries.map((entry, index) => (
                <article
                  key={entry.key}
                  className={
                    index === 0
                      ? "rounded-[16px] bg-[#17171c] px-[18px] py-5 text-white"
                      : index % 2
                        ? "rounded-[16px] border border-[#e4e4e8] bg-[#fff7f3] px-[17px] py-[17px]"
                        : "rounded-[16px] border border-[#e4e4e8] bg-[#f3f7fa] px-[17px] py-[17px]"
                  }
                >
                  <h2 className={`text-[16px] font-bold ${index === 0 ? "text-white" : "text-[#17171c]"}`}>{entry.label}</h2>
                  <p className={`mt-3 whitespace-pre-line text-[13px] leading-5 ${index === 0 ? "text-[#c9c9cf]" : "text-[#65656e]"}`}>
                    {entry.value}
                  </p>
                </article>
              )) : <GuideMessage text="서버에서 제공된 보관 안내가 없습니다." />}
            </LuxuryReveal>

            {itemId ? (
              <LuxuryReveal className="mt-auto pt-8" delay={160}>
                <Link href={`/care/calendar?itemId=${encodeURIComponent(itemId)}`} className="flex h-[52px] items-center justify-center rounded-[14px] bg-[#17171c] text-[14px] font-bold text-white">
                  관리 캘린더 보기
                </Link>
              </LuxuryReveal>
            ) : null}
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}

function GuideMessage({ text }: { text: string }) {
  return <p className="my-auto rounded-[16px] border border-[#e4e4e8] bg-[#f8f8f9] px-5 py-10 text-center text-[13px] leading-5 text-[#777780]">{text}</p>;
}
