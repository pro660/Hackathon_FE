"use client";

import type { PlaceRecommendation } from "@/types/place";

type PlaceCardProps = {
  place: PlaceRecommendation;
  index: number;
  selected?: boolean;
  detailReady?: boolean;
  onSelect?: (place: PlaceRecommendation) => void;
};

export function PlaceCard({
  place,
  index,
  selected = false,
  detailReady = false,
  onSelect,
}: PlaceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={
        detailReady
          ? `${place.name}, 한 번 더 누르면 상세 페이지로 이동`
          : `${place.name}, 지도에서 위치 확인`
      }
      onClick={() => onSelect?.(place)}
      className={`flex h-[72px] w-full items-center rounded-[16px] border px-[13px] text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15151a] ${
        detailReady
          ? "border-[#9f896b] bg-[#f4f0e9] shadow-[0_0_0_3px_rgba(159,137,107,0.14)]"
          : selected
            ? "border-[#b9ab98] bg-[#f8f8f9]"
            : "border-[#dedee2] bg-[#f8f8f9] hover:border-[#c8c2b9] hover:bg-[#f5f3f0]"
      }`}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#e9e5df] text-[11px] font-bold text-[#8b7355]">
        {String(index + 1).padStart(2, "0")}
      </span>

      <span className="ml-4 min-w-0 flex-1">
        <span className="block truncate text-[14px] leading-[17px] font-bold text-[#15151a]">
          {place.name}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`ml-3 flex size-9 shrink-0 items-center justify-center rounded-full text-[22px] leading-none transition-all duration-300 ${
          detailReady
            ? "translate-x-1 animate-pulse pb-0.5 text-[#8b7355]"
            : "text-[#777780]"
        }`}
      >
        ›
      </span>
    </button>
  );
}
