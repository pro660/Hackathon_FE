"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PiHeart, PiHeartFill } from "react-icons/pi";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import { useProductRecommendationStore } from "@/store/useProductRecommendationStore";
import type { RecommendedProduct } from "@/types/product";

export function ProductRecommendationResultScreen() {
  const router = useRouter();
  const products = useProductRecommendationStore((state) => state.products);
  const status = useProductRecommendationStore((state) => state.status);
  const hasRecommendationResult = useProductRecommendationStore(
    (state) => state.hasRecommendationResult,
  );
  const setProductFavorited = useProductRecommendationStore(
    (state) => state.setProductFavorited,
  );
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (status !== "loading" && !hasRecommendationResult) {
      router.replace("/recommendations");
    }
  }, [hasRecommendationResult, router, status]);

  const toggleFavorite = async (product: RecommendedProduct) => {
    if (pendingFavoriteIds.includes(product.id)) return;

    const nextFavorited = !product.favorited;
    setPendingFavoriteIds((current) => [...current, product.id]);
    setProductFavorited(product.id, nextFavorited);

    try {
      if (nextFavorited) {
        await backendApi.catalog.addFavorite(product.id);
      } else {
        await backendApi.catalog.removeFavorite(product.id);
      }
    } catch {
      setProductFavorited(product.id, product.favorited);
    } finally {
      setPendingFavoriteIds((current) =>
        current.filter((productId) => productId !== product.id),
      );
    }
  };

  if (!hasRecommendationResult) return null;

  if (products.length === 0) {
    return <EmptyRecommendationResult />;
  }

  return (
    <MobileScreenLayout
      figmaNodeId="119:353"
      contentClassName="flex flex-col px-6 pt-6 pb-7"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <h1 className="text-[17px] leading-6 font-bold text-[#15151a]">
            맞춤 추천
          </h1>
          <p className="mt-8 text-[13px] leading-5 text-[#777780]">
            저장한 스타일 취향과 선택한 조건을 반영했어요
          </p>
        </LuxuryReveal>

        <ul className="mt-8 space-y-4" aria-label="맞춤 추천 제품 목록">
          {products.map((product, index) => (
            <li key={product.id}>
              <LuxuryReveal delay={60 + index * 45}>
                <article className="flex h-[74px] items-center rounded-[15px] border border-[#e2e2e5] bg-white px-3">
                <Link
                  href={`/recommendations/${product.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15151a]"
                >
                  <span
                    role="img"
                    aria-label={`${product.name} 제품 이미지`}
                    className="size-[46px] shrink-0 rounded-[11px] bg-[#f1efec] bg-cover bg-center"
                    style={
                      product.imageUrl
                        ? { backgroundImage: `url("${product.imageUrl}")` }
                        : undefined
                    }
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] leading-5 font-bold text-[#15151a]">
                      {product.name}
                    </span>
                    <span className="mt-1 block truncate text-[11px] leading-4 text-[#777780]">
                      추천 점수 {product.recommendationScore ?? 0}점 ·{" "}
                      {formatPrice(product.price)}
                    </span>
                  </span>
                </Link>

                <button
                  type="button"
                  aria-label={product.favorited ? "찜 해제" : "찜하기"}
                  aria-pressed={product.favorited}
                  disabled={pendingFavoriteIds.includes(product.id)}
                  onClick={() => void toggleFavorite(product)}
                  className="ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-[#15151a] disabled:opacity-40"
                >
                  {product.favorited ? (
                    <PiHeartFill aria-hidden="true" className="size-5" />
                  ) : (
                    <PiHeart aria-hidden="true" className="size-5" />
                  )}
                </button>
                </article>
              </LuxuryReveal>
            </li>
          ))}
        </ul>

        <LuxuryReveal className="mt-auto pt-8" delay={260}>
          <Link
            href="/products"
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#15151a] text-[14px] font-bold text-white"
          >
            전체 제품 보기
          </Link>
        </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}

function EmptyRecommendationResult() {
  return (
    <MobileScreenLayout
      figmaNodeId="119:1568"
      contentClassName="flex flex-col px-6 pt-6 pb-7"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <h1 className="text-[17px] leading-6 font-bold text-[#15151a]">
            맞춤 추천
          </h1>
          <p className="mt-8 text-[13px] leading-5 text-[#777780]">
            저장한 스타일 취향과 선택한 조건을 반영했어요
          </p>
        </LuxuryReveal>

        <LuxuryReveal
          className="flex flex-1 flex-col justify-center text-center"
          delay={70}
        >
          <h2 className="text-[24px] leading-8 font-bold tracking-[-0.04em] text-[#15151a]">
            조건에 맞는 제품이 없어요
          </h2>
          <p className="mt-4 text-[14px] leading-6 text-[#777780]">
            조건을 바꾸거나 취향 프로필을
            <br />
            먼저 설정해 주세요.
          </p>

          <div className="mt-10 space-y-3">
            <Link
              href="/recommendations"
              className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#15151a] text-[14px] font-bold text-white"
            >
              조건 다시 선택
            </Link>
            <Link
              href="/personalize?mode=edit"
              className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#d8d8dc] bg-white text-[14px] font-bold text-[#15151a]"
            >
              취향 설정
            </Link>
          </div>
        </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}
