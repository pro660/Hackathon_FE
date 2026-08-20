"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ImageGridCard, ImageGridSkeleton } from "@/components/common/card/ImageGridCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { ProductCollectionEmptyState } from "@/components/products/ProductCollectionEmptyState";
import { backendApi } from "@/services/api";
import type { ProductSummary } from "@/types/api";

export function WishlistScreen() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void backendApi.catalog.getWishlist({ page: 0, size: 50 })
      .then((response) => setProducts(response.data.data.items))
      .catch(() => setError("찜한 제품을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const isEmpty = !isLoading && !error && products.length === 0;

  return (
    <MobileScreenLayout
      figmaNodeId={isEmpty ? "119:1699" : undefined}
      contentClassName="bg-white px-6 pt-4 pb-8"
      bottomNavigation={<BottomNavigation activeItem="my" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] leading-6 font-bold text-[#0e0e12]">
            찜한 제품
          </h1>
          <p className="mt-5 text-[13px] leading-5 text-[#6e707a]">
            나중에 다시 볼 제품을 모았어요
          </p>
        </LuxuryReveal>

        {isEmpty ? (
          <ProductCollectionEmptyState
            title="찜한 제품이 아직 없어요"
            description="마음에 드는 MCM 제품을 저장해 보세요."
          />
        ) : (
          <section className="mt-8">
            {isLoading ? <ImageGridSkeleton label="찜한 제품을 불러오는 중" /> : null}
            {error ? <p role="alert" className="rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}
            <ul className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <li key={product.productId}>
                  <Link href={`/products/${product.productId}`}>
                    <ImageGridCard title={product.name} subtitle={product.brand} imageAlt={`${product.name} 제품 이미지`} imageUrl={product.primaryImageUrl ?? undefined} fallbackLabel="PRODUCT" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </MobileScreenLayout>
  );
}
