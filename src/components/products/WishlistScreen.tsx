"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ImageGridCard, ImageGridSkeleton } from "@/components/common/card/ImageGridCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { ScreenHeader } from "@/components/common/section/ScreenHeader";
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

  return (
    <MobileScreenLayout
      contentClassName="bg-white px-6 pt-4 pb-8"
      bottomNavigation={<BottomNavigation activeItem="my" />}
    >
      <BackButton />
      <div className="mt-5"><ScreenHeader eyebrow="WISHLIST" title="찜한 제품" description="저장해 둔 제품을 확인해요" /></div>
      <section className="mt-8">
        {isLoading ? <ImageGridSkeleton label="찜한 제품을 불러오는 중" /> : null}
        {error ? <p role="alert" className="rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}
        {!isLoading && !error && products.length === 0 ? <p className="rounded-[18px] border border-[#dedee2] px-5 py-10 text-center text-[13px] text-[#777780]">찜한 제품이 없습니다.</p> : null}
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
    </MobileScreenLayout>
  );
}
