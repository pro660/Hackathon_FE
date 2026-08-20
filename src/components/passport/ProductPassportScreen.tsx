"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DetailActionCard } from "@/components/common/card/DetailActionCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { PassportLoadingState } from "@/components/passport/PassportLoadingState";
import {
  categoryLabels,
  colorLabels,
  materialLabels,
} from "@/components/passport/passportPresentation";
import { backendApi } from "@/services/api";
import type { ProductPassport } from "@/types/api";

type ProductPassportScreenProps = { itemId: string };

export function ProductPassportScreen({ itemId }: ProductPassportScreenProps) {
  const [passport, setPassport] = useState<ProductPassport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void backendApi.closet
      .getProductPassport(itemId, controller.signal)
      .then((response) => setPassport(response.data.data))
      .catch(() => {
        if (!controller.signal.aborted) setError("제품 패스포트를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [itemId]);

  const productDescription = passport
    ? [
        categoryLabels[passport.productInfo.category],
        passport.productInfo.primaryColor
          ? colorLabels[passport.productInfo.primaryColor]
          : null,
        passport.productInfo.material
          ? materialLabels[passport.productInfo.material]
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "제품 정보를 확인";

  return (
    <MobileScreenLayout
      figmaNodeId="119:1134"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] leading-6 font-bold">
            {passport?.productInfo.name ?? "제품 패스포트"}
          </h1>
        </LuxuryReveal>

        {!passport && !error ? <PassportLoadingState /> : null}
        {error ? (
          <p role="alert" className="mt-8 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">
            {error}
          </p>
        ) : null}

        {passport ? (
          <>
            <LuxuryReveal className="mt-8" delay={60}>
              <p className="text-[11px] font-bold tracking-[0.04em] text-[#b89666]">
                MY ITEM RECORD
              </p>
              <section className="relative mt-6 overflow-hidden rounded-[18px] bg-[#0e0e12] px-[22px] py-6 text-white shadow-[0_14px_34px_rgba(14,14,18,0.16)]">
                <div aria-hidden="true" className="absolute -top-20 -right-14 size-48 rounded-full bg-white/[0.045]" />
                <div className="relative z-10 flex min-h-[108px] flex-col">
                  <span className="text-[10px] font-bold tracking-[0.08em] text-[#b89666]">
                    MY ITEM RECORD
                  </span>
                  <h2 className="mt-5 text-[20px] leading-6 font-bold">
                    {passport.productInfo.name}
                  </h2>
                  <p className="mt-auto text-[12px] text-[#c7c9d1]">
                    등록한 구매 정보를 확인
                  </p>
                </div>
              </section>
            </LuxuryReveal>

            <LuxuryReveal className="mt-8 space-y-4" delay={120}>
              <DetailActionCard
                title="제품 정보"
                description={productDescription}
                href={`/items/${encodeURIComponent(itemId)}/passport/product`}
                leading={
                  passport.productInfo.imageUrl ? (
                    <span
                      role="img"
                      aria-label={`${passport.productInfo.name} 이미지`}
                      className="size-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${passport.productInfo.imageUrl}")` }}
                    />
                  ) : null
                }
              />
              <DetailActionCard
                title="구매 정보"
                description="등록한 구매 정보를 확인"
                href={`/items/${encodeURIComponent(itemId)}/passport/purchase`}
              />
            </LuxuryReveal>

            <LuxuryReveal className="mt-auto pt-10" delay={180}>
              <Link
                href="/items"
                className="flex h-[52px] items-center justify-center rounded-[16px] bg-[#151412] text-[14px] font-bold text-white"
              >
                제품 패스포트 목록으로 돌아가기
              </Link>
            </LuxuryReveal>
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}
