"use client";

import { useEffect, useState } from "react";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { ProductCollectionEmptyState } from "@/components/products/ProductCollectionEmptyState";
import { getApiErrorMessage } from "@/lib/apiError";
import { backendApi } from "@/services/api";
import type { CartItem } from "@/types/api";

const priceFormatter = new Intl.NumberFormat("ko-KR");

export function CartScreen() {
  const [products, setProducts] = useState<CartItem[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void backendApi.catalog
      .getCartItems({ page: 0, size: 50 }, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setProducts(response.data.data.items);
        }
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            getApiErrorMessage(loadError, "담은 제품을 불러오지 못했습니다."),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const removeProduct = async (productId: string) => {
    if (pendingIds.includes(productId)) return;

    setError(null);
    setPendingIds((current) => [...current, productId]);

    try {
      await backendApi.catalog.removeFromCart(productId);
      setProducts((current) =>
        current.filter((product) => product.productId !== productId),
      );
    } catch (removeError: unknown) {
      setError(
        getApiErrorMessage(removeError, "담은 제품에서 제거하지 못했습니다."),
      );
    } finally {
      setPendingIds((current) =>
        current.filter((pendingId) => pendingId !== productId),
      );
    }
  };

  const isEmpty = !isLoading && !error && products.length === 0;

  return (
    <MobileScreenLayout
      figmaNodeId="119:674"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="my" />}
    >
      <LuxuryReveal>
        <BackButton />
        <h1 className="mt-1 text-[17px] leading-6 font-bold">MCM 제품 확인</h1>
        <p className="mt-5 text-[13px] leading-5 text-[#6e707a]">
          최신 가격과 재고는 MCM 공식 제품 페이지에서 확인
        </p>
      </LuxuryReveal>

      <section className="mt-8" aria-label="담은 제품 목록">
        {isLoading ? (
          <div className="space-y-4" role="status" aria-label="담은 제품을 불러오는 중">
            {[0, 1].map((item) => (
              <div key={item} className="h-[74px] animate-pulse rounded-[15px] bg-[#f3f3f5]" />
            ))}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mb-4 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">
            {error}
          </p>
        ) : null}

        {isEmpty ? (
          <ProductCollectionEmptyState
            title="담아둔 제품이 없어요"
            description="관심 있는 MCM 제품을 담아 다시 확인할 수 있어요."
          />
        ) : null}

        <ul className="space-y-4">
          {products.map((product, index) => (
            <li key={product.cartItemId}>
              <LuxuryReveal delay={60 + index * 40}>
                <article className="relative h-[74px] overflow-hidden rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8]">
                {product.productUrl ? (
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${product.name} MCM 공식 제품 페이지에서 보기`}
                    className="flex h-full items-center pr-[76px] pl-3 transition-colors hover:bg-[#f1f1f3] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#15151a]"
                  >
                    <ProductSummary item={product} />
                  </a>
                ) : (
                  <div className="flex h-full items-center pr-[76px] pl-3">
                    <ProductSummary item={product} />
                  </div>
                )}

                <button
                  type="button"
                  disabled={pendingIds.includes(product.productId)}
                  onClick={() => void removeProduct(product.productId)}
                  className="absolute top-1/2 right-3 h-8 -translate-y-1/2 rounded-full border border-[#e6c7c0] bg-[#fff5f3] px-4 text-[10px] text-[#4b4741] transition-colors hover:bg-[#fceae6] disabled:opacity-45"
                >
                  제거
                </button>
                </article>
              </LuxuryReveal>
            </li>
          ))}
        </ul>
      </section>

      {!isEmpty && !isLoading ? <LuxuryReveal className="mt-11" delay={160}>
        <aside className="rounded-[14px] bg-[#f3eee6] px-[18px] py-[18px] text-[#806b4d]">
          <h2 className="text-[14px] font-bold text-[#725e40]">
            앱에서는 결제가 진행되지 않아요
          </h2>
          <p className="mt-3 text-[12px] leading-[15px]">
            실제 판매 가격과 재고는 MCM 공식 제품 페이지에서
            <br />
            확인한 뒤 구매할 수 있어요.
          </p>
        </aside>
      </LuxuryReveal> : null}
    </MobileScreenLayout>
  );
}

function ProductSummary({ item }: { item: CartItem }) {
  return (
    <>
      <span
        role="img"
        aria-label={`${item.name} 제품 이미지`}
        className="flex size-[46px] shrink-0 items-center justify-center rounded-[11px] bg-[#e8e3d9] bg-contain bg-center bg-no-repeat"
        style={
          item.primaryImageUrl
            ? { backgroundImage: `url("${item.primaryImageUrl}")` }
            : undefined
        }
      >
        {!item.primaryImageUrl ? (
          <span className="text-[8px] font-bold text-[#a29684]">MCM</span>
        ) : null}
      </span>
      <span className="ml-4 min-w-0">
        <span className="block truncate text-[14px] font-bold">{item.name}</span>
        <span className="mt-1.5 block text-[11px] text-[#6e707a]">
          {priceFormatter.format(item.price)}원
        </span>
      </span>
    </>
  );
}
