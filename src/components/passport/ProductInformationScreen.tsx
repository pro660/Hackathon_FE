"use client";

import { useEffect, useState } from "react";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { PassportLoadingState } from "@/components/passport/PassportLoadingState";
import {
  categoryLabels,
  colorLabels,
  materialLabels,
  valueOrEmpty,
} from "@/components/passport/passportPresentation";
import { backendApi } from "@/services/api";
import type { ProductPassport } from "@/types/api";

type ProductInformationScreenProps = { itemId: string };

export function ProductInformationScreen({ itemId }: ProductInformationScreenProps) {
  const [passport, setPassport] = useState<ProductPassport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void backendApi.closet
      .getProductPassport(itemId, controller.signal)
      .then((response) => setPassport(response.data.data))
      .catch(() => {
        if (!controller.signal.aborted) setError("제품 정보를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [itemId]);

  const details = passport
    ? [
        ["제품명", passport.productInfo.name],
        ["브랜드", valueOrEmpty(passport.productInfo.brandName)],
        ["카테고리", categoryLabels[passport.productInfo.category]],
        ["대표 색상", passport.productInfo.primaryColor ? colorLabels[passport.productInfo.primaryColor] : "정보 없음"],
        ["소재", passport.productInfo.material ? materialLabels[passport.productInfo.material] : "정보 없음"],
        ["MCM SKU", valueOrEmpty(passport.productInfo.sku)],
      ]
    : [];

  return (
    <MobileScreenLayout
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] font-bold">제품 정보</h1>
        </LuxuryReveal>

        {!passport && !error ? <PassportLoadingState /> : null}
        {error ? <p role="alert" className="mt-8 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}

        {passport ? (
          <>
            <LuxuryReveal className="mt-8" delay={60}>
              <div
                role="img"
                aria-label={`${passport.productInfo.name} 이미지`}
                className="h-[260px] rounded-[20px] border border-[#e6e2dc] bg-[#f3f0eb] bg-contain bg-center bg-no-repeat"
                style={passport.productInfo.imageUrl ? { backgroundImage: `url("${passport.productInfo.imageUrl}")` } : undefined}
              />
            </LuxuryReveal>
            <LuxuryReveal className="mt-6" delay={110}>
              <dl className="overflow-hidden rounded-[18px] border border-[#e1e1e5] bg-[#f8f8f9] px-5">
                {details.map(([label, value], index) => (
                  <div key={label} className={`flex items-start justify-between gap-5 py-4 ${index < details.length - 1 ? "border-b border-[#e5e5e8]" : ""}`}>
                    <dt className="text-[11px] text-[#85858e]">{label}</dt>
                    <dd className="max-w-[210px] text-right text-[12px] font-bold text-[#24242a]">{value}</dd>
                  </div>
                ))}
              </dl>
            </LuxuryReveal>
            {passport.productInfo.productUrl ? (
              <LuxuryReveal className="mt-auto pt-8" delay={160}>
                <a href={passport.productInfo.productUrl} target="_blank" rel="noreferrer" className="flex h-[52px] items-center justify-center rounded-[16px] bg-[#151412] text-[14px] font-bold text-white">
                  MCM 공식 제품 보기
                </a>
              </LuxuryReveal>
            ) : null}
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}
