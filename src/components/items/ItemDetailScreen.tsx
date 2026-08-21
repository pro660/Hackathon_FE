"use client";

import { useEffect } from "react";
import Link from "next/link";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { useMenuDataStore } from "@/store/useMenuDataStore";

type ItemDetailScreenProps = {
  itemId: string;
};

function formatRegisteredDate(value?: string | null) {
  if (!value) {
    return "등록일 미입력";
  }

  return `등록일 ${value.slice(0, 10).replaceAll("-", ".")}`;
}

export function ItemDetailScreen({ itemId }: ItemDetailScreenProps) {
  const item = useMenuDataStore((state) =>
    state.items.find((candidate) => candidate.id === itemId),
  );
  const isLoading = useMenuDataStore((state) => state.isLoading);
  const error = useMenuDataStore((state) => state.error);
  const loadItem = useMenuDataStore((state) => state.loadItem);

  useEffect(() => {
    void loadItem(itemId);
  }, [itemId, loadItem]);

  if (!item && isLoading) {
    return (
      <MobileScreenLayout contentClassName="bg-white px-6 pt-4 pb-8">
        <div className="flex min-h-full flex-col">
          <BackButton variant="plain" />
          <div className="mt-1 h-5 w-36 animate-pulse rounded bg-[#e9e5df]" />
          <div className="mt-4 h-4 w-40 animate-pulse rounded bg-[#efede9]" />
          <div className="mt-8 h-[260px] animate-pulse rounded-[18px] bg-[#e9e5df]" />
          <div className="mt-auto space-y-4 pt-8">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-[52px] animate-pulse rounded-[14px] bg-[#efede9]"
              />
            ))}
          </div>
        </div>
      </MobileScreenLayout>
    );
  }

  if (!item) {
    return (
      <MobileScreenLayout contentClassName="flex min-h-full flex-col px-6 pt-4 pb-8">
        <BackButton variant="plain" />
        <div className="my-auto text-center">
          <h1 className="text-[22px] font-bold text-[#15151a]">
            아이템을 찾을 수 없어요
          </h1>
          <p className="mt-3 text-[12px] text-[#777780]">
            {error ?? "목록으로 돌아가 다른 제품을 선택해 주세요."}
          </p>
          <Link
            href="/items"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[14px] bg-[#15151a] px-6 text-[13px] font-bold text-white"
          >
            내 아이템으로 돌아가기
          </Link>
        </div>
      </MobileScreenLayout>
    );
  }

  const imageStyle = item.imageUrl
    ? { backgroundImage: `url("${item.imageUrl}")` }
    : {
        backgroundColor: item.colorHex,
        backgroundImage:
          "linear-gradient(145deg, rgba(255,255,255,0.5), transparent 50%, rgba(21,21,26,0.1))",
      };

  return (
    <MobileScreenLayout
      figmaNodeId="390:327"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#121217]"
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton variant="plain" />
          <h1 className="mt-1 min-w-0 truncate text-[17px] leading-5 font-bold tracking-[-0.02em]">
            {item.name}
          </h1>
          <p className="mt-4 text-[13px] leading-4 text-[#85858f]">
            {item.brandName || "브랜드 미입력"} · {formatRegisteredDate(item.createdAt)}
          </p>
        </LuxuryReveal>

        <LuxuryReveal className="mt-8" delay={70}>
          <div
            role="img"
            aria-label={`${item.name} 제품 이미지`}
            className="flex h-[260px] w-full items-center justify-center rounded-[18px] bg-cover bg-center shadow-[inset_0_0_0_1px_rgba(21,21,26,0.04)]"
            style={imageStyle}
          >
            {!item.imageUrl ? (
              <span className="text-[11px] font-bold tracking-[0.12em] text-black/35">
                MY ITEM
              </span>
            ) : null}
          </div>
        </LuxuryReveal>

        <LuxuryReveal className="mt-auto space-y-4 pt-8" delay={140}>
          <Link
            href={`/items/${encodeURIComponent(item.id)}/edit`}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#dedee2] bg-white text-[14px] font-bold text-[#15151a] transition-colors hover:bg-[#f8f8f9]"
          >
            제품 정보 수정
          </Link>
          <Link
            href={`/care/guide?itemId=${encodeURIComponent(item.id)}`}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#dedee2] bg-white text-[14px] font-bold text-[#15151a] transition-colors hover:bg-[#f8f8f9]"
          >
            맞춤 관리 가이드
          </Link>
          <Link
            href={`/items/${encodeURIComponent(item.id)}/passport`}
            className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#15151a] text-[14px] font-bold text-white transition-colors hover:bg-[#2a2a30]"
          >
            제품 패스포트 보기
          </Link>
        </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
