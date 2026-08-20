"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { PageTransition } from "@/components/common/motion/PageTransition";

type MobileScreenLayoutProps = {
  animateContent?: boolean;
  children: ReactNode;
  bottomNavigation?: ReactNode;
  overlay?: ReactNode;
  contentClassName?: string;
  frameClassName?: string;
  figmaNodeId?: string;
  scrollKey?: string | number;
};

export function MobileScreenLayout({
  animateContent = true,
  children,
  bottomNavigation,
  overlay,
  contentClassName = "",
  frameClassName = "",
  figmaNodeId,
  scrollKey,
}: MobileScreenLayoutProps) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, scrollKey]);

  return (
    <main className="min-h-dvh bg-[#efede8] sm:flex sm:items-center sm:justify-center sm:px-6 sm:py-8">
      <div
        data-figma-node-id={figmaNodeId}
        className={`relative mx-auto flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-white sm:h-[844px] sm:max-h-[calc(100dvh-4rem)] sm:rounded-[36px] sm:border sm:border-[#d8d8dc] sm:shadow-[0_22px_70px_rgba(36,31,25,0.12)] ${frameClassName}`}
      >
        <div
          ref={contentRef}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${contentClassName}`}
        >
          {animateContent ? <PageTransition>{children}</PageTransition> : children}
        </div>

        {overlay}
        {bottomNavigation}
      </div>
    </main>
  );
}
