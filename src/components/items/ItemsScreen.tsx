"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { FilterMenu } from "@/components/common/filter/FilterMenu";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { ItemListCard } from "@/components/items/ItemListCard";
import { useItemRegistrationStore } from "@/store/useItemRegistrationStore";
import { useMenuDataStore } from "@/store/useMenuDataStore";

const categoryFilters = [
  { value: "전체", label: "카테고리" },
  { value: "가방", label: "가방" },
  { value: "가죽 소품", label: "가죽 소품" },
  { value: "패션 액세서리", label: "패션 액세서리" },
  { value: "의류", label: "의류" },
  { value: "신발", label: "신발" },
] as const;

const colorFilters = [
  { value: "전체", label: "색상" },
  { value: "BLACK", label: "블랙" },
  { value: "WHITE", label: "화이트" },
  { value: "GRAY", label: "그레이" },
  { value: "BROWN", label: "브라운" },
  { value: "BEIGE", label: "베이지" },
  { value: "RED", label: "레드" },
  { value: "ORANGE", label: "오렌지" },
  { value: "YELLOW", label: "옐로우" },
  { value: "GREEN", label: "그린" },
  { value: "BLUE", label: "블루" },
  { value: "PURPLE", label: "퍼플" },
  { value: "PINK", label: "핑크" },
  { value: "METALLIC", label: "메탈릭" },
  { value: "MULTI", label: "멀티" },
  { value: "OTHER", label: "기타" },
] as const;

const colorLabels = Object.fromEntries(
  colorFilters.slice(1).map(({ value, label }) => [value, label]),
) as Record<string, string>;

const materialLabels: Record<string, string> = {
  LEATHER: "가죽",
  SYNTHETIC_LEATHER: "인조 가죽",
  CANVAS: "캔버스",
  FABRIC: "패브릭",
  NYLON: "나일론",
  METAL: "메탈",
  OTHER: "기타 소재",
  UNKNOWN: "",
};

type CategoryFilter = (typeof categoryFilters)[number]["value"];
type ColorFilter = (typeof colorFilters)[number]["value"];
type OpenFilter = "category" | "color" | null;

function getItemSubtitle(
  brandName: string | null,
  category: string,
  color: string,
  material: string,
) {
  return [
    brandName || "브랜드 미입력",
    category,
    colorLabels[color] ?? (color === "미입력" ? "" : color),
    materialLabels[material] ?? (material === "미입력" ? "" : material),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function ItemsScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("전체");
  const [selectedColor, setSelectedColor] = useState<ColorFilter>("전체");
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    () => {
      const normalizedQuery = searchQuery.trim().toLocaleLowerCase("ko-KR");

      return items.filter((item) => {
        const matchesSearch =
          !normalizedQuery ||
          item.name.toLocaleLowerCase("ko-KR").includes(normalizedQuery) ||
          item.brandName
            ?.toLocaleLowerCase("ko-KR")
            .includes(normalizedQuery);
        const matchesCategory =
          selectedCategory === "전체" || item.category === selectedCategory;
        const matchesColor =
          selectedColor === "전체" || item.color === selectedColor;

        return Boolean(matchesSearch && matchesCategory && matchesColor);
      });
    },
    [items, searchQuery, selectedCategory, selectedColor],
  );

  const isInitialLoading = !hasLoaded || (isLoading && items.length === 0);

  return (
    <MobileScreenLayout
      figmaNodeId="119:909"
      contentClassName="bg-white px-6 pt-6 pb-2 text-[#15151a]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <h1 className="text-[17px] leading-5 font-bold tracking-[-0.02em]">
            내 아이템
          </h1>
          <p className="mt-8 text-[13px] leading-4 text-[#85858f]">
            이름·브랜드로 검색하고 조건별로 찾아보세요
          </p>
        </LuxuryReveal>

        <LuxuryReveal className="relative z-40" delay={60}>
          <div
            aria-label="내 아이템 검색 및 필터"
            className="mt-[34px] grid grid-cols-[160px_80px_66px] items-center gap-1.5"
          >
            <input
              type="search"
              value={searchQuery}
              aria-label="이름·브랜드 검색"
              placeholder="이름·브랜드 검색"
              className="h-8 w-40 min-w-0 rounded-2xl border border-[#ded9d1] bg-[#f4f1ec] px-3 text-center text-[10px] text-[#4b4741] outline-none transition-colors placeholder:text-[#4b4741] focus:border-[#8b7355]"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <FilterMenu
              label="카테고리"
              value={selectedCategory}
              options={[...categoryFilters]}
              open={openFilter === "category"}
              onToggle={() =>
                setOpenFilter((current) =>
                  current === "category" ? null : "category",
                )
              }
              onChange={(value) => {
                setSelectedCategory(value as CategoryFilter);
                setOpenFilter(null);
              }}
            />
            <FilterMenu
              label="색상"
              value={selectedColor}
              options={[...colorFilters]}
              align="right"
              open={openFilter === "color"}
              onToggle={() =>
                setOpenFilter((current) =>
                  current === "color" ? null : "color",
                )
              }
              onChange={(value) => {
                setSelectedColor(value as ColorFilter);
                setOpenFilter(null);
              }}
            />
          </div>
        </LuxuryReveal>

        <section className="relative z-0 mt-[34px]" aria-live="polite">
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
            {selectedCategory === "전체" &&
            selectedColor === "전체" &&
            !searchQuery.trim()
              ? "등록한 아이템이 없습니다."
              : "검색 조건에 맞는 아이템이 없습니다."}
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
                    subtitle={getItemSubtitle(
                      item.brandName,
                      item.category,
                      item.color,
                      item.material,
                    )}
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
