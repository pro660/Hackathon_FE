"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PiHeart, PiHeartFill } from "react-icons/pi";

import {
  StatusToast,
  type StatusToastMessage,
} from "@/components/common/feedback/StatusToast";
import { FilterMenu } from "@/components/common/filter/FilterMenu";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import {
  colorGroups,
  type ColorGroup,
  type ItemCategory,
  type ProductSummary,
} from "@/types/api";

type LoadStatus = "loading" | "success" | "error";
type PriceFilter = "ALL" | "UNDER_500000" | "500000_TO_1000000" | "OVER_1000000";
type SortFilter = "LATEST" | "PRICE_ASC" | "PRICE_DESC";
type OpenFilter = "category" | "color" | "price" | "sort" | null;

export function ProductCatalogScreen() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [category, setCategory] = useState<ItemCategory | "ALL">("ALL");
  const [color, setColor] = useState<ColorGroup | "ALL">("ALL");
  const [price, setPrice] = useState<PriceFilter>("ALL");
  const [sort, setSort] = useState<SortFilter>("LATEST");
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[]>([]);
  const [toast, setToast] = useState<StatusToastMessage | null>(null);
  const toastSequence = useRef(0);
  const pageSize = 12;

  const dismissToast = useCallback(() => setToast(null), []);
  const showToast = useCallback((message: string) => {
    setToast({ id: ++toastSequence.current, message });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const priceRange = getPriceRange(price);

    void backendApi.catalog
      .getProducts(
        {
          page,
          size: pageSize,
          category: category === "ALL" ? undefined : category,
          color: color === "ALL" ? undefined : color,
          minPrice: priceRange.minPrice,
          maxPrice: priceRange.maxPrice,
          sort:
            sort === "LATEST"
              ? undefined
              : sort === "PRICE_ASC"
                ? "price,asc"
                : "price,desc",
        },
        controller.signal,
      )
      .then((response) => {
        if (controller.signal.aborted) return;

        setProducts(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setStatus("success");
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setStatus("error");
        setError("제품 목록을 불러오지 못했습니다.");
      });

    return () => controller.abort();
  }, [category, color, page, price, sort]);

  const resetPage = () => {
    setStatus("loading");
    setError(null);
    setPage(0);
  };

  const toggleFavorite = async (product: ProductSummary) => {
    if (pendingFavoriteIds.includes(product.productId)) return;

    const nextFavorited = !product.favorited;
    setPendingFavoriteIds((current) => [...current, product.productId]);
    setProducts((current) =>
      current.map((item) =>
        item.productId === product.productId
          ? { ...item, favorited: nextFavorited }
          : item,
      ),
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
      setProducts((current) =>
        current.map((item) =>
          item.productId === product.productId
            ? { ...item, favorited: product.favorited }
            : item,
        ),
      );
      showToast("찜 상태를 변경하지 못했어요.");
    } finally {
      setPendingFavoriteIds((current) =>
        current.filter((productId) => productId !== product.productId),
      );
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="119:495"
      contentClassName="bg-white px-6 pt-6 pb-8"
      bottomNavigation={<BottomNavigation activeItem="recommendation" />}
      overlay={<StatusToast toast={toast} onDismiss={dismissToast} />}
      scrollKey={`${category}-${color}-${price}-${sort}-${page}`}
    >
      <LuxuryReveal>
        <h1 className="text-[17px] leading-6 font-bold text-[#0e0e12]">
          MCM 제품
        </h1>
        <p className="mt-8 text-[13px] leading-5 text-[#6e707a]">
          공식 제품을 조건별로 찾아보세요
        </p>
      </LuxuryReveal>

      <LuxuryReveal className="relative z-40 mt-5" delay={50}>
        <div className="grid grid-cols-[78px_64px_70px_1fr] gap-1.5">
          <FilterMenu
            label="카테고리"
            value={category}
            open={openFilter === "category"}
            onToggle={() =>
              setOpenFilter((current) => current === "category" ? null : "category")
            }
            onChange={(value) => {
              resetPage();
              setCategory(value as ItemCategory | "ALL");
              setOpenFilter(null);
            }}
            options={[
              { value: "ALL", label: "카테고리" },
              ...itemCategoryOptions.map((value) => ({
                value,
                label: categoryLabelMap[value],
              })),
            ]}
          />
          <FilterMenu
            label="색상"
            value={color}
            open={openFilter === "color"}
            onToggle={() =>
              setOpenFilter((current) => current === "color" ? null : "color")
            }
            onChange={(value) => {
              resetPage();
              setColor(value as ColorGroup | "ALL");
              setOpenFilter(null);
            }}
            options={[
              { value: "ALL", label: "색상" },
              ...colorGroups.map((value) => ({
                value,
                label: colorLabelMap[value],
              })),
            ]}
          />
          <FilterMenu
            label="가격대"
            value={price}
            open={openFilter === "price"}
            onToggle={() =>
              setOpenFilter((current) => current === "price" ? null : "price")
            }
            onChange={(value) => {
              resetPage();
              setPrice(value as PriceFilter);
              setOpenFilter(null);
            }}
            options={priceOptions}
          />
          <FilterMenu
            label="정렬"
            value={sort}
            align="right"
            open={openFilter === "sort"}
            onToggle={() =>
              setOpenFilter((current) => current === "sort" ? null : "sort")
            }
            onChange={(value) => {
              resetPage();
              setSort(value as SortFilter);
              setOpenFilter(null);
            }}
            options={sortOptions}
          />
        </div>
      </LuxuryReveal>

      <section className="relative z-0 mt-[34px]" aria-live="polite">
        {status === "loading" && products.length === 0 ? (
          <ProductRowsSkeleton />
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-[15px] bg-[#f8eeee] px-4 py-4 text-[12px] text-[#9a4545]"
          >
            {error}
          </p>
        ) : null}

        {status === "success" && products.length === 0 ? (
          <p className="rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-5 py-10 text-center text-[13px] text-[#6e707a]">
            조건에 맞는 제품이 없습니다.
          </p>
        ) : null}

        <ul className="space-y-4" aria-label="MCM 제품 목록">
          {products.map((product, index) => (
            <li key={product.productId}>
              <LuxuryReveal delay={70 + index * 40}>
                <article className="flex h-[74px] items-center rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-3">
                  <Link
                    href={`/products/${product.productId}`}
                    className="flex min-w-0 flex-1 items-center gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15151a]"
                  >
                    <span
                      role="img"
                      aria-label={`${product.name} 제품 이미지`}
                      className="size-[46px] shrink-0 rounded-[11px] bg-[#e8e3d9] bg-cover bg-center"
                      style={
                        product.primaryImageUrl
                          ? { backgroundImage: `url("${product.primaryImageUrl}")` }
                          : undefined
                      }
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] leading-5 font-bold text-[#0e0e12]">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-[11px] leading-4 text-[#6e707a]">
                        {formatPrice(product.price)}
                      </span>
                    </span>
                  </Link>

                  <button
                    type="button"
                    aria-label={product.favorited ? `${product.name} 찜 해제` : `${product.name} 찜하기`}
                    aria-pressed={product.favorited}
                    disabled={pendingFavoriteIds.includes(product.productId)}
                    onClick={() => void toggleFavorite(product)}
                    className="ml-2 flex size-10 shrink-0 items-center justify-center rounded-full text-[#8d8d96] transition-colors hover:text-[#15151a] disabled:opacity-40"
                  >
                    {product.favorited ? (
                      <PiHeartFill aria-hidden="true" className="size-5 text-[#15151a]" />
                    ) : (
                      <PiHeart aria-hidden="true" className="size-5" />
                    )}
                  </button>
                </article>
              </LuxuryReveal>
            </li>
          ))}
        </ul>

        {status === "success" && totalPages > 1 ? (
          <div className="mt-8 mb-10 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => {
                setStatus("loading");
                setError(null);
                setPage((current) => Math.max(0, current - 1));
              }}
              className="h-9 rounded-full border border-[#ded9d1] px-4 text-[11px] font-bold disabled:opacity-35"
            >
              이전
            </button>
            <span className="text-[11px] text-[#6e707a]">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => {
                setStatus("loading");
                setError(null);
                setPage((current) => Math.min(totalPages - 1, current + 1));
              }}
              className="h-9 rounded-full border border-[#ded9d1] px-4 text-[11px] font-bold disabled:opacity-35"
            >
              다음
            </button>
          </div>
        ) : null}
      </section>
    </MobileScreenLayout>
  );
}

function ProductRowsSkeleton() {
  return (
    <div aria-label="MCM 제품을 불러오는 중" className="space-y-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex h-[74px] animate-pulse items-center rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-3"
        >
          <div className="size-[46px] rounded-[11px] bg-[#e8e3d9]" />
          <div className="ml-4 flex-1">
            <div className="h-4 w-28 rounded bg-[#e1ded9]" />
            <div className="mt-2 h-3 w-16 rounded bg-[#e8e5e1]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getPriceRange(value: PriceFilter) {
  switch (value) {
    case "UNDER_500000":
      return { maxPrice: 500_000 };
    case "500000_TO_1000000":
      return { minPrice: 500_000, maxPrice: 1_000_000 };
    case "OVER_1000000":
      return { minPrice: 1_000_000 };
    default:
      return {};
  }
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}

const itemCategoryOptions: ItemCategory[] = [
  "BAG",
  "LEATHER_GOODS",
  "FASHION_ACCESSORY",
  "CLOTHING",
  "SHOES",
];

export const categoryLabelMap: Record<ItemCategory, string> = {
  BAG: "가방",
  LEATHER_GOODS: "가죽 소품",
  FASHION_ACCESSORY: "액세서리",
  CLOTHING: "의류",
  SHOES: "신발",
};

const colorLabelMap: Record<ColorGroup, string> = {
  BLACK: "블랙",
  WHITE: "화이트",
  GRAY: "그레이",
  BROWN: "브라운",
  BEIGE: "베이지",
  RED: "레드",
  ORANGE: "오렌지",
  YELLOW: "옐로우",
  GREEN: "그린",
  BLUE: "블루",
  PURPLE: "퍼플",
  PINK: "핑크",
  METALLIC: "메탈릭",
  MULTI: "멀티",
  OTHER: "기타",
};

const priceOptions: Array<{ value: PriceFilter; label: string }> = [
  { value: "ALL", label: "가격대" },
  { value: "UNDER_500000", label: "50만원 이하" },
  { value: "500000_TO_1000000", label: "50~100만원" },
  { value: "OVER_1000000", label: "100만원 이상" },
];

const sortOptions: Array<{ value: SortFilter; label: string }> = [
  { value: "LATEST", label: "최신순 ▾" },
  { value: "PRICE_ASC", label: "낮은 가격순" },
  { value: "PRICE_DESC", label: "높은 가격순" },
];
