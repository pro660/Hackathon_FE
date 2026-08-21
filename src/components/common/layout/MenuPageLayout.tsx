import type { ReactNode } from "react";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import {
  BottomNavigation,
  type BottomNavigationKey,
} from "@/components/common/navigation/BottomNavigation";
import { ScreenHeader } from "@/components/common/section/ScreenHeader";

type MenuPageLayoutProps = {
  activeItem: BottomNavigationKey;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function MenuPageLayout({
  activeItem,
  eyebrow,
  title,
  description,
  children,
}: MenuPageLayoutProps) {
  return (
    <MobileScreenLayout
      contentClassName="px-6 pt-12 pb-8"
      bottomNavigation={<BottomNavigation activeItem={activeItem} />}
    >
      <ScreenHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="mt-9">{children}</div>
    </MobileScreenLayout>
  );
}
