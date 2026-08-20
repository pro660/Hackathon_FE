"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { ItemListCard } from "@/components/items/ItemListCard";
import { useItemRegistrationStore } from "@/store/useItemRegistrationStore";
import { useMenuDataStore } from "@/store/useMenuDataStore";

const categoryFilters = [
  "전체",
  "가방",
  "가죽 소품",
  "패션 액세서리",
  "의류",
  "신발",
] as const;

type CategoryFilter = (typeof categoryFilters)[number];

export function ItemsScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("전체");
  const [hasLoaded, setHasLoaded] = useState(false);
  const items = useMenuDataStore((state) => state.items);
  const isLoading = useMenuDataStore((state) => state.isLoading);
  const error = useMenuDataStore((state) => state.error);
  const loadItems = useMenuDataStore((state) => state.loadItems);
  const pendingImageUpload = useItemRegistrationStore(
    (state) => state.pendingImageUpload,
  );
  const loadPendingImageUpload = useItemRegistrationStore(
    (state) => state.loadPendingImageUpload,
  );

  useEffect(() => {
    loadPendingImageUpload();
    void loadItems().finally(() => setHasLoaded(true));
  }, [loadItems, loadPendingImageUpload]);

  const filteredItems = useMemo(
    () =>
      selectedCategory === "전체"
        ? items
        : items.filter((item) => item.category === selectedCategory),
    [items, selectedCategory],
  );

  const isInitialLoading = !hasLoaded || (isLoading && items.length === 0);

  return (
    <MobileScreenLayout
      figmaNodeId="390:301"
      contentClassName="bg-white px-6 pt-6 pb-2 text-[#15151a]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <h1 className="text-[17px] leading-5 font-bold tracking-[-0.02em]">
            내 아이템
          </h1>
          <p className="mt-8 text-[13px] leading-4 text-[#85858f]">
            등록한 제품을 선택해 자세히 확인해요
          </p>
        </LuxuryReveal>

        <LuxuryReveal delay={60}>
          <div
            aria-label="내 아이템 카테고리"
            className="-mx-6 mt-8 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categoryFilters.map((category) => {
              const isSelected = category === selectedCategory;

              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isSelected}
                  className={`h-[38px] shrink-0 rounded-full border px-5 text-[12px] font-bold transition-colors ${
                    isSelected
                      ? "border-[#15151a] bg-[#15151a] text-white"
                      : "border-[#d1d1d8] bg-white text-[#55555d] hover:border-[#a8a8af]"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </LuxuryReveal>

        <section className="mt-6" aria-live="polite">
        {pendingImageUpload ? (
          <LuxuryReveal delay={90}>
            <Link
              href="/items/image-retry"
              className="mb-4 flex h-[74px] items-center rounded-[15px] border border-[#ddcfbc] bg-[#fbf7f1] px-3"
            >
              <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[11px] bg-[#ece3d7] text-[18px] text-[#8b7355]">
                +
              </span>
              <span className="ml-4 min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-[#3b332a]">
                  {pendingImageUpload.itemName} 사진 업로드 보류
                </span>
                <span className="mt-1 block text-[10px] text-[#887865]">
                  제품 정보는 저장됐어요 · 사진만 다시 업로드
                </span>
              </span>
              <span aria-hidden="true" className="ml-2 text-[22px] text-[#8b7355]">
                ›
              </span>
            </Link>
          </LuxuryReveal>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-[16px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]"
          >
            {error}
          </div>
        ) : null}

        {isInitialLoading ? (
          <div
            className="space-y-4"
            role="status"
            aria-label="내 아이템을 불러오는 중"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex h-[74px] animate-pulse items-center rounded-[15px] border border-[#e4e4e8] bg-[#f6f6f8] px-3"
              >
                <span className="size-[46px] rounded-[11px] bg-[#e4e4e8]" />
                <span className="ml-4 flex-1">
                  <span className="block h-4 w-28 rounded bg-[#e4e4e8]" />
                  <span className="mt-2 block h-3 w-20 rounded bg-[#e9e9ec]" />
                </span>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="rounded-[15px] border border-[#dedee2] bg-[#f6f6f8] px-5 py-10 text-center text-[13px] text-[#777780]">
            {selectedCategory === "전체"
              ? "등록한 아이템이 없습니다."
              : "이 카테고리에 등록한 아이템이 없습니다."}
          </p>
        ) : (
          <ul
            aria-label="내가 등록한 아이템 목록"
            className="space-y-4"
          >
            {filteredItems.map((item, index) => (
              <li key={item.id}>
                <LuxuryReveal delay={120 + index * 45}>
                  <ItemListCard
                    title={item.name}
                    subtitle={`${item.brandName || "브랜드 미입력"} · ${item.category}`}
                    imageAlt={`${item.name} 아이템 이미지`}
                    imageUrl={item.imageUrl}
                    fallbackColor={item.colorHex}
                    href={`/items/${encodeURIComponent(item.id)}`}
                  />
                </LuxuryReveal>
              </li>
            ))}
          </ul>
        )}
        </section>

        <LuxuryReveal className="mt-auto pt-8" delay={300}>
          <Link
            href="/items/new"
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#15151a] text-[14px] font-bold text-white transition-colors hover:bg-[#2a2a30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15151a]"
          >
            새 제품 등록
          </Link>
        </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
