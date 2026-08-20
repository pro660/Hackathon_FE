"use client";

import {
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PiReceiptDuotone, PiTagDuotone } from "react-icons/pi";

import { DetailActionCard } from "@/components/common/card/DetailActionCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { PassportLoadingState } from "@/components/passport/PassportLoadingState";
import {
  categoryLabels,
  colorLabels,
  formatDate,
  materialLabels,
} from "@/components/passport/passportPresentation";
import { backendApi } from "@/services/api";
import type { ProductPassport } from "@/types/api";

import styles from "./ProductPassportScreen.module.css";

type ProductPassportScreenProps = { itemId: string };

function ProductPassportCard({ passport }: { passport: ProductPassport }) {
  const prefersReducedMotion = useReducedMotion();
  const [isFlipped, setIsFlipped] = useState(false);
  const [shinePass, setShinePass] = useState(1);

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    event.currentTarget.style.setProperty("--shine-x", `${x}%`);
    event.currentTarget.style.setProperty("--shine-y", `${y}%`);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--shine-x", "32%");
    event.currentTarget.style.setProperty("--shine-y", "18%");
  };

  const product = passport.productInfo;

  return (
    <motion.button
      type="button"
      className={styles.card}
      aria-label={isFlipped ? "제품 패스포트 앞면 보기" : "제품 패스포트 상세 보기"}
      aria-pressed={isFlipped}
      onClick={() => {
        setIsFlipped((current) => !current);
        setShinePass((current) => current + 1);
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
    >
      <motion.span
        className={styles.cardInner}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.72, ease: [0.22, 0.74, 0.18, 1] }}
      >
        <span className={styles.cardFace}>
          <span className={`${styles.cardContent} absolute inset-0 z-10 flex flex-col p-6 text-left`}>
            <span className="flex items-start justify-between">
              <span>
                <span className="block text-[9px] font-bold tracking-[0.24em] text-white/55">DIGITAL PRODUCT</span>
                <span className="mt-1 block text-[13px] font-bold tracking-[0.16em] text-white">PASSPORT</span>
              </span>
              <span className="text-[18px] font-black tracking-[-0.06em] text-white/85">{product.brandName ?? "MY ITEM"}</span>
            </span>
            <span className="mt-auto">
              <span className="block text-[18px] font-semibold tracking-[-0.03em] text-white">{product.name}</span>
              <span className="mt-2 block text-[10px] tracking-[0.08em] text-white/52">
                {product.sku ? `SKU · ${product.sku}` : "등록한 구매 정보를 확인"}
              </span>
            </span>
          </span>
        </span>

        <span className={`${styles.cardFace} ${styles.cardBack}`}>
          <span className={`${styles.cardContent} absolute inset-0 z-10 flex flex-col p-6 text-left`}>
            <span className="border-b border-white/12 pb-4 text-[9px] font-bold tracking-[0.22em] text-white/55">PRODUCT DATA</span>
            <span className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
              <CardDatum label="CATEGORY" value={categoryLabels[product.category]} />
              <CardDatum label="COLOR" value={product.primaryColor ? colorLabels[product.primaryColor] : "정보 없음"} />
              <CardDatum label="MATERIAL" value={product.material ? materialLabels[product.material] : "정보 없음"} />
              <CardDatum label="PURCHASED" value={formatDate(passport.purchaseInfo.purchaseDate)} />
            </span>
            <span className="mt-auto text-[10px] tracking-[0.08em] text-white/48">등록한 구매 정보를 확인</span>
          </span>
        </span>
      </motion.span>

      <span className={styles.shineLayer}>
        <AnimatePresence>
          {!prefersReducedMotion && shinePass > 0 ? (
            <motion.span
              key={shinePass}
              aria-hidden="true"
              className={styles.shineSweep}
              initial={{ x: "-165%", opacity: 0 }}
              animate={{ x: "360%", opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.88, ease: [0.22, 0.72, 0.18, 1] }}
            />
          ) : null}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

function CardDatum({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="block text-[8px] tracking-[0.12em] text-white/38">{label}</span>
      <span className="mt-1 block truncate text-[11px] font-semibold text-white/88">{value}</span>
    </span>
  );
}

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
              <ProductPassportCard passport={passport} />
              <p className="mt-3 text-center text-[10px] text-[#8b8b93]">카드를 눌러 제품 정보를 확인하세요</p>
            </LuxuryReveal>

            <LuxuryReveal className="mt-8 space-y-4" delay={120}>
              <DetailActionCard
                title="제품 정보"
                description={productDescription}
                href={`/items/${encodeURIComponent(itemId)}/passport/product`}
                leading={
                  <PiTagDuotone aria-hidden="true" className="size-6 text-[#75644f]" />
                }
              />
              <DetailActionCard
                title="구매 정보"
                description="등록한 구매 정보를 확인"
                href={`/items/${encodeURIComponent(itemId)}/passport/purchase`}
                leading={<PiReceiptDuotone aria-hidden="true" className="size-6 text-[#75644f]" />}
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
