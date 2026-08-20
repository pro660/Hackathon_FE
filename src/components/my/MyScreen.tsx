"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  PiHandbagSimpleBold,
  PiHeartBold,
  PiIdentificationCardBold,
  PiMapPinBold,
  PiShoppingBagOpenBold,
} from "react-icons/pi";

import { DetailActionCard } from "@/components/common/card/DetailActionCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useMenuDataStore } from "@/store/useMenuDataStore";

export function MyScreen() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const profile = useMenuDataStore((state) => state.profile);
  const items = useMenuDataStore((state) => state.items);
  const isLoading = useMenuDataStore((state) => state.isLoading);
  const error = useMenuDataStore((state) => state.error);
  const loadProfile = useMenuDataStore((state) => state.loadProfile);
  const loadItems = useMenuDataStore((state) => state.loadItems);

  useEffect(() => {
    if (hasHydrated) {
      void Promise.all([loadProfile(), loadItems()]);
    }
  }, [hasHydrated, loadItems, loadProfile]);

  const nickname = profile?.nickname?.trim() || "사용자";
  const myMenuItems = [
    {
      title: "내 아이템",
      description: `등록한 제품 ${items.length}개`,
      href: "/items",
      leading: <PiHandbagSimpleBold aria-hidden="true" className="size-6" />,
    },
    {
      title: "제품 패스포트",
      description: "내 아이템에서 패스포트 확인",
      href: "/items",
      leading: <PiIdentificationCardBold aria-hidden="true" className="size-6" />,
    },
    {
      title: "저장한 장소",
      description: "장소 추천 다시 보기",
      href: "/place/saved",
      leading: <PiMapPinBold aria-hidden="true" className="size-6" />,
    },
    {
      title: "찜한 제품",
      description: "저장한 제품 보기",
      href: "/wishlist",
      leading: <PiHeartBold aria-hidden="true" className="size-6" />,
    },
    {
      title: "담은 제품",
      description: "구매 후보로 담은 제품 확인",
      href: "/cart",
      leading: <PiShoppingBagOpenBold aria-hidden="true" className="size-6" />,
    },
  ];

  return (
    <MobileScreenLayout
      figmaNodeId="390:246"
      contentClassName="bg-white px-6 pt-[47px] pb-8 text-[#121217]"
      bottomNavigation={<BottomNavigation activeItem="my" />}
    >
      <LuxuryReveal>
        <h1 className="text-[28px] leading-[34px] font-bold tracking-[-0.04em]">
          MY
        </h1>
        <p className="mt-[6px] text-[13px] leading-4 text-[#7a7a85]">
          {nickname}님의 라이프스타일
        </p>
      </LuxuryReveal>

      <LuxuryReveal className="mt-[28px]" delay={60}>
        <section className="flex h-28 items-start justify-between rounded-[18px] bg-[#121217] px-6 py-7">
          <div className="min-w-0">
            <h2 className="truncate text-[20px] leading-6 font-bold text-white">
              {nickname.toUpperCase()}
            </h2>
            <p className="mt-[7px] truncate text-[12px] leading-[15px] text-[#c7c7cc]">등록한 아이템 {items.length}개</p>
          </div>

          <Link
            href="/my/settings"
            className="flex h-[34px] w-[50px] shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#121217] transition-colors hover:bg-[#f0eee9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            설정
          </Link>
        </section>
      </LuxuryReveal>

      <section className="mt-[34px] space-y-4" aria-label="마이페이지 메뉴">
        {myMenuItems.map((item, index) => (
          <LuxuryReveal key={item.title} delay={100 + index * 50}>
            <DetailActionCard {...item} />
          </LuxuryReveal>
        ))}
      </section>

      {(!hasHydrated || isLoading) && !profile ? (
        <p className="mt-5 text-center text-[11px] text-[#7a7a85]" role="status">
          사용자 정보를 준비하고 있습니다.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-center text-[11px] text-[#9a4545]" role="alert">
          {error}
        </p>
      ) : null}
    </MobileScreenLayout>
  );
}
