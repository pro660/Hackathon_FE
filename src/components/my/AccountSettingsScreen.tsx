"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PiBellBold, PiLockKeyBold, PiUserCircleBold } from "react-icons/pi";

import { DetailActionCard } from "@/components/common/card/DetailActionCard";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { backendApi } from "@/services/api";

const accountMenus = [
  {
    title: "프로필 수정",
    description: "닉네임과 취향 변경",
    href: "/my/settings/profile",
    requiresLocalPassword: false,
    leading: <PiUserCircleBold aria-hidden="true" className="size-6" />,
  },
  {
    title: "비밀번호 변경",
    description: "보안을 위해 주기적으로 변경",
    href: "/my/settings/password",
    requiresLocalPassword: true,
    leading: <PiLockKeyBold aria-hidden="true" className="size-6" />,
  },
  {
    title: "알림·마케팅 설정",
    description: "수신 항목 선택",
    href: "/my/settings/notifications",
    requiresLocalPassword: false,
    leading: <PiBellBold aria-hidden="true" className="size-6" />,
  },
];

export function AccountSettingsScreen() {
  const [supportsLocalPassword, setSupportsLocalPassword] = useState(false);

  useEffect(() => {
    let active = true;
    void backendApi.profile
      .getMe()
      .then(({ data }) => {
        if (active) {
          setSupportsLocalPassword(
            data.data.authenticationMethods.includes("LOCAL"),
          );
        }
      })
      .catch(() => {
        if (active) {
          setSupportsLocalPassword(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleMenus = accountMenus.filter(
    (menu) => !menu.requiresLocalPassword || supportsLocalPassword,
  );

  return (
    <MobileScreenLayout
      figmaNodeId="390:280"
      contentClassName="flex min-h-full flex-col bg-white px-6 pt-4 pb-8 text-[#121217]"
    >
      <div className="flex min-h-full flex-col">
      <LuxuryReveal>
        <BackButton variant="plain" />
        <h1 className="mt-1 text-[28px] leading-[34px] font-bold tracking-[-0.04em]">
          계정 설정
        </h1>
      </LuxuryReveal>

      <section className="mt-9 space-y-4" aria-label="계정 설정 메뉴">
        {visibleMenus.map((menu, index) => (
          <LuxuryReveal key={menu.title} delay={60 + index * 50}>
            <DetailActionCard
              title={menu.title}
              description={menu.description}
              href={menu.href}
              leading={menu.leading}
            />
          </LuxuryReveal>
        ))}
      </section>

      <LuxuryReveal className="mt-auto pt-10" delay={240}>
        <Link
          href="/my/settings/logout"
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#dedee2] bg-white text-[14px] font-bold text-[#15151a] transition-colors hover:bg-[#f8f8f9] disabled:cursor-wait disabled:opacity-60"
        >
          로그아웃
        </Link>
        <Link
          href="/my/account-deletion"
          className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#e6b8b8] bg-white text-[14px] font-bold text-[#c72e2e] transition-colors hover:bg-[#fff8f8]"
        >
          회원 탈퇴
        </Link>
      </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
