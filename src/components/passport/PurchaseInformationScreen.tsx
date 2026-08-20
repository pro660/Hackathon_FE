"use client";

import { useEffect, useState } from "react";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { PassportLoadingState } from "@/components/passport/PassportLoadingState";
import { formatDate, formatPrice, valueOrEmpty } from "@/components/passport/passportPresentation";
import { backendApi } from "@/services/api";
import type { ProductPassport } from "@/types/api";

type PurchaseInformationScreenProps = { itemId: string };

export function PurchaseInformationScreen({ itemId }: PurchaseInformationScreenProps) {
  const [passport, setPassport] = useState<ProductPassport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void backendApi.closet
      .getProductPassport(itemId, controller.signal)
      .then((response) => setPassport(response.data.data))
      .catch(() => {
        if (!controller.signal.aborted) setError("구매 정보를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [itemId]);

  const purchaseRows = passport
    ? [
        ["주문 번호", valueOrEmpty(passport.purchaseInfo.purchaseOrderNumber)],
        ["구매일", formatDate(passport.purchaseInfo.purchaseDate)],
        ["구매 금액", formatPrice(passport.purchaseInfo.purchasePrice)],
        ["구매처", valueOrEmpty(passport.purchaseInfo.purchasePlace)],
      ]
    : [];

  return (
    <MobileScreenLayout
      figmaNodeId="119:1174"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] font-bold">구매 정보</h1>
        </LuxuryReveal>

        {!passport && !error ? <PassportLoadingState /> : null}
        {error ? <p role="alert" className="mt-8 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}

        {passport ? (
          <>
            <LuxuryReveal className="mt-9" delay={50}>
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#9b8057]">PURCHASE RECORD</p>
              <h2 className="mt-3 text-[27px] leading-8 font-bold tracking-[-0.04em]">{passport.productInfo.name}</h2>
              <p className="mt-2 text-[13px] text-[#777780]">등록할 때 입력한 구매 기록이에요</p>
            </LuxuryReveal>

            <LuxuryReveal className="mt-8 space-y-3" delay={100}>
              {purchaseRows.map(([label, value], index) => (
                <div key={label} className="flex min-h-[78px] items-center rounded-[17px] border border-[#e1ddd7] bg-[linear-gradient(145deg,#faf9f7,#f3f1ed)] px-4 shadow-[0_8px_22px_rgba(35,30,25,0.045)]">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#eae4da] text-[11px] font-bold text-[#8b7355]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="ml-4 min-w-0 flex-1">
                    <span className="block text-[11px] text-[#85858e]">{label}</span>
                    <span className="mt-1 block break-words text-[14px] font-bold text-[#202026]">{value}</span>
                  </span>
                </div>
              ))}
            </LuxuryReveal>
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}
