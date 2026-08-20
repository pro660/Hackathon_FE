"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PiHeart, PiHeartFill } from "react-icons/pi";

import {
  StatusToast,
  type StatusToastMessage,
} from "@/components/common/feedback/StatusToast";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import type { ItemCategory, ProductDetail } from "@/types/api";

export function OfficialProductDetailScreen({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"favorite" | "cart" | null>(null);
  const [toast, setToast] = useState<StatusToastMessage | null>(null);
  const toastSequence = useRef(0);

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((message: string) => {
    setToast({ id: ++toastSequence.current, message });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void backendApi.catalog
      .getProduct(productId, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setProduct(response.data.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("제품 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [productId]);

  const toggleFavorite = async () => {
    if (!product || pendingAction) return;

    const previousFavorited = product.favorited;
    const nextFavorited = !previousFavorited;
    setPendingAction("favorite");
    setProduct((current) =>
      current ? { ...current, favorited: nextFavorited } : current,
    );

    try {
      if (nextFavorited) {
        await backendApi.catalog.addFavorite(product.productId);
        showToast("찜 목록에 등록되었어요.");
      } else {
        await backendApi.catalog.removeFavorite(product.productId);
        showToast("찜 목록에서 삭제했어요.");
      }
    } catch {
      setProduct((current) =>
        current ? { ...current, favorited: previousFavorited } : current,
      );
      showToast("찜 상태를 변경하지 못했어요.");
    } finally {
      setPendingAction(null);
    }
  };

  const toggleCart = async () => {
    if (!product || pendingAction) return;

    const previousInCart = product.inCart;
    const nextInCart = !previousInCart;
    setPendingAction("cart");
    setProduct((current) =>
      current ? { ...current, inCart: nextInCart } : current,
    );

    try {
      if (nextInCart) {
        await backendApi.catalog.addToCart(product.productId);
        showToast("구매 후보에 담았어요.");
      } else {
        await backendApi.catalog.removeFromCart(product.productId);
        showToast("구매 후보에서 제외했어요.");
      }
    } catch {
      setProduct((current) =>
        current ? { ...current, inCart: previousInCart } : current,
      );
      showToast("구매 후보 상태를 변경하지 못했어요.");
    } finally {
      setPendingAction(null);
    }
  };

  const primaryImageUrl = product
    ? product.primaryImageUrl ??
      product.images.find((image) => image.isPrimary)?.url ??
      [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url
    : undefined;

  return (
    <MobileScreenLayout
      figmaNodeId="119:547"
      contentClassName="bg-white px-6 pt-6 pb-7 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
      overlay={<StatusToast toast={toast} onDismiss={dismissToast} />}
    >
      {isLoading ? <ProductDetailSkeleton /> : null}

      {error ? (
        <div className="flex min-h-full flex-col items-center justify-center text-center">
          <h1 className="text-[20px] font-bold">제품을 불러오지 못했어요</h1>
          <p role="alert" className="mt-3 text-[13px] text-[#6e707a]">
            {error}
          </p>
          <Link
            href="/products"
            className="mt-8 flex h-[48px] w-full items-center justify-center rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white"
          >
            제품 목록으로 돌아가기
          </Link>
        </div>
      ) : null}

      {product ? (
        <div className="flex min-h-full flex-col">
          <LuxuryReveal>
            <h1 className="truncate text-[17px] leading-6 font-bold">
              {product.name}
            </h1>
            <p className="mt-8 text-[13px] leading-5 text-[#6e707a]">
              {product.brand} · {categoryLabelMap[product.category]}
            </p>
          </LuxuryReveal>

          <LuxuryReveal className="mt-8" delay={50}>
            <div
              role="img"
              aria-label={`${product.name} 제품 이미지`}
              className="flex h-[294px] w-full items-center justify-center rounded-[18px] bg-[#e8e3d9] bg-contain bg-center bg-no-repeat"
              style={
                primaryImageUrl
                  ? { backgroundImage: `url("${primaryImageUrl}")` }
                  : undefined
              }
            >
              {!primaryImageUrl ? (
                <span className="text-[11px] font-bold tracking-[0.12em] text-[#a29684]">
                  MCM PRODUCT
                </span>
              ) : null}
            </div>
          </LuxuryReveal>

          <LuxuryReveal className="mt-6" delay={100}>
            <p className="text-[24px] leading-8 font-bold tracking-[-0.03em]">
              {formatPrice(product.price)}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#6e707a]">
              최신 가격과 재고는 MCM 공식 페이지에서 확인
            </p>

            <h2 className="mt-6 text-[14px] leading-5 font-bold">
              {product.description || "제품의 소재와 특징을 확인해 보세요"}
            </h2>
            <p className="mt-3 text-[13px] leading-5 text-[#6e707a]">
              소재 · 대표 색상 · 특징 태그를 확인할 수 있어요.
            </p>
          </LuxuryReveal>

          <LuxuryReveal className="mt-auto pt-8" delay={160}>
            <Link
              href={`/recommendations/${product.productId}/value-check`}
              className="flex h-11 w-full items-center justify-center rounded-[14px] bg-[#151412] text-[12px] font-bold text-white"
            >
              내 아이템과 활용 가능성 확인
            </Link>

            <div className="mt-1 grid grid-cols-[104px_104px_1fr] gap-3">
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={() => void toggleFavorite()}
                className="flex h-[52px] items-center justify-center gap-1 rounded-[14px] border border-[#dbdee3] bg-white text-[14px] font-bold disabled:opacity-45"
              >
                {product.favorited ? (
                  <PiHeartFill aria-hidden="true" className="size-[17px]" />
                ) : (
                  <PiHeart aria-hidden="true" className="size-[17px]" />
                )}
                찜
              </button>
              <button
                type="button"
                disabled={pendingAction !== null}
                onClick={() => void toggleCart()}
                className="h-[52px] rounded-[14px] border border-[#dbdee3] bg-white text-[14px] font-bold disabled:opacity-45"
              >
                {product.inCart ? "담김" : "담기"}
              </button>
              {product.productUrl ? (
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[52px] items-center justify-center rounded-[14px] bg-[#0e0e12] text-[13px] font-bold text-white"
                >
                  MCM 보기
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  className="flex h-[52px] items-center justify-center rounded-[14px] bg-[#0e0e12] text-[13px] font-bold text-white opacity-40"
                >
                  MCM 보기
                </span>
              )}
            </div>
          </LuxuryReveal>
        </div>
      ) : null}
    </MobileScreenLayout>
  );
}

function ProductDetailSkeleton() {
  return (
    <div aria-label="제품 상세 정보를 불러오는 중" className="animate-pulse">
      <div className="h-6 w-36 rounded bg-[#e5e2dd]" />
      <div className="mt-8 h-5 w-24 rounded bg-[#eeece8]" />
      <div className="mt-8 h-[294px] rounded-[18px] bg-[#e8e3d9]" />
      <div className="mt-6 h-8 w-32 rounded bg-[#e5e2dd]" />
      <div className="mt-3 h-4 w-56 rounded bg-[#eeece8]" />
    </div>
  );
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}

const categoryLabelMap: Record<ItemCategory, string> = {
  BAG: "가방",
  LEATHER_GOODS: "가죽 소품",
  FASHION_ACCESSORY: "액세서리",
  CLOTHING: "의류",
  SHOES: "신발",
};
