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
            <LuxuryReveal className="mt-8" delay={50}>
              <h2 className="text-[26px] leading-8 font-bold tracking-[-0.04em]">{passport.productInfo.name}</h2>
              <p className="mt-2 text-[13px] text-[#777780]">등록할 때 입력한 구매 기록이에요</p>
            </LuxuryReveal>

            <LuxuryReveal className="mt-8" delay={100}>
              <section className="overflow-hidden rounded-[24px] border border-[#dedee2] bg-[#f7f7f8] shadow-[0_16px_38px_rgba(20,18,15,0.07)]">
                <div className="bg-[#15151a] px-5 py-5 text-white">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-white/55">PURCHASE RECORD</p>
                  <p className="mt-3 text-[22px] leading-7 font-bold">{formatPrice(passport.purchaseInfo.purchasePrice)}</p>
                  <p className="mt-1 text-[11px] text-white/55">{formatDate(passport.purchaseInfo.purchaseDate)} 구매</p>
                </div>
                <dl className="px-5">
                  <PurchaseRow label="주문 번호" value={valueOrEmpty(passport.purchaseInfo.purchaseOrderNumber)} />
                  <PurchaseRow label="구매처" value={valueOrEmpty(passport.purchaseInfo.purchasePlace)} last />
                </dl>
              </section>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <PurchaseFact label="구매일" value={formatDate(passport.purchaseInfo.purchaseDate)} />
                <PurchaseFact label="구매 금액" value={formatPrice(passport.purchaseInfo.purchasePrice)} />
              </div>
            </LuxuryReveal>
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}

function PurchaseRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`py-5 ${last ? "" : "border-b border-[#dfdfe3]"}`}>
      <dt className="text-[10px] font-medium text-[#8a8a93]">{label}</dt>
      <dd className="mt-2 break-words text-[14px] leading-5 font-bold text-[#202026]">{value}</dd>
    </div>
  );
}

function PurchaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[92px] rounded-[18px] border border-[#e1e1e5] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(20,18,15,0.04)]">
      <p className="text-[10px] text-[#8a8a93]">{label}</p>
      <p className="mt-3 break-words text-[13px] leading-5 font-bold text-[#202026]">{value}</p>
    </div>
  );
}
