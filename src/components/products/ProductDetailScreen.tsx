"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { ScreenHeader } from "@/components/common/section/ScreenHeader";
import { ProductAttributes } from "@/components/products/ProductAttributes";
import { backendApi } from "@/services/api";
import { useProductRecommendationStore } from "@/store/useProductRecommendationStore";
import type { ProductDetail } from "@/types/api";

type ProductDetailScreenProps = { productId: string };
const priceFormatter = new Intl.NumberFormat("ko-KR");

export function ProductDetailScreen({ productId }: ProductDetailScreenProps) {
  const recommendation = useProductRecommendationStore((state) => state.products.find((item) => item.id === productId));
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void backendApi.catalog
      .getProduct(productId, controller.signal)
      .then((response) => setProduct(response.data.data))
      .catch(() => {
        if (!controller.signal.aborted) setError("제품 정보를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [productId]);

  const primaryImageUrl = product
    ? product.primaryImageUrl ??
      product.images.find((image) => image.isPrimary)?.url ??
      [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url
    : undefined;

  const toggleFavorite = async () => {
    if (!product || isUpdating) return;
    setIsUpdating(true); setError(null);
    try {
      if (product.favorited) await backendApi.catalog.removeFavorite(product.productId);
      else await backendApi.catalog.addFavorite(product.productId);
      setProduct({ ...product, favorited: !product.favorited });
    } catch { setError("찜 상태를 변경하지 못했습니다."); }
    finally { setIsUpdating(false); }
  };

  const toggleCart = async () => {
    if (!product || isUpdating) return;
    setIsUpdating(true); setError(null);
    try {
      if (product.inCart) await backendApi.catalog.removeFromCart(product.productId);
      else await backendApi.catalog.addToCart(product.productId);
      setProduct({ ...product, inCart: !product.inCart });
    } catch { setError("구매 후보 상태를 변경하지 못했습니다."); }
    finally { setIsUpdating(false); }
  };

  return (
    <MobileScreenLayout figmaNodeId="1:441" contentClassName="pt-4 pb-9">
      <div className="px-6">
        <LuxuryReveal><BackButton /></LuxuryReveal>
        <LuxuryReveal className="mt-1" delay={40}>
          <ScreenHeader
            eyebrow={product?.brand ?? "PRODUCT"}
            title={product?.name ?? (error ? "제품을 찾을 수 없어요" : "제품 정보를 불러오는 중")}
            description={product?.description ?? undefined}
          />
        </LuxuryReveal>
      </div>

      {error ? <p role="alert" className="mx-6 mt-8 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}

      {product ? (
        <>
          <LuxuryReveal className="mt-4" delay={70}>
            <div
              role="img"
              aria-label={`${product.name} 제품 이미지`}
              className="flex h-[390px] w-full items-center justify-center bg-[#f0ece7] bg-contain bg-center bg-no-repeat"
              style={primaryImageUrl ? { backgroundImage: `url("${primaryImageUrl}")` } : undefined}
            >
              {!primaryImageUrl ? <span className="text-[15px] font-bold text-[#a89b8a]">PRODUCT IMAGE</span> : null}
            </div>
          </LuxuryReveal>
          <div className="px-6 pt-5">
            <LuxuryReveal delay={130}>
              <h2 className="text-[20px] leading-6 font-bold tracking-[-0.025em] text-[#15151a]">{product.name}</h2>
              <p className="mt-2 text-[15px] leading-[18px] font-bold text-[#55555d]">₩ {priceFormatter.format(product.price)}</p>
              <ProductAttributes product={product} />
              {recommendation?.recommendationScoreBreakdown ? (
                <section className="mt-4 rounded-[18px] bg-[#f8f6f3] p-4">
                  <p className="text-[13px] font-bold text-[#15151a]">추천 점수 {recommendation.recommendationScore}점</p>
                  {recommendation.recommendationReason ? <p className="mt-2 text-[11px] leading-5 text-[#66666f]">{recommendation.recommendationReason}</p> : null}
                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px]">
                    {Object.entries(recommendation.recommendationScoreBreakdown).map(([key, value]) => <div key={key}><dt className="uppercase text-[#8b7355]">{key}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}
                  </dl>
                </section>
              ) : null}
            </LuxuryReveal>
            <LuxuryReveal className="mt-5" delay={200}>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <button type="button" disabled={isUpdating} onClick={() => void toggleFavorite()} className="h-[48px] rounded-[14px] border border-[#dedee2] text-[13px] font-bold disabled:opacity-50">{product.favorited ? "찜 해제" : "찜하기"}</button>
                <button type="button" disabled={isUpdating} onClick={() => void toggleCart()} className="h-[48px] rounded-[14px] border border-[#dedee2] text-[13px] font-bold disabled:opacity-50">{product.inCart ? "구매 후보 해제" : "구매 후보 담기"}</button>
              </div>
              <Link href={`/recommendations/${product.productId}/value-check`} className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#15151a] text-[15px] font-bold text-white">
                내 아이템과 활용 가능성 확인
              </Link>
            </LuxuryReveal>
          </div>
        </>
      ) : null}
    </MobileScreenLayout>
  );
}
