import Link from "next/link";
import type { IconType } from "react-icons";
import {
  PiHandbag,
  PiHouse,
  PiPlus,
  PiSparkle,
  PiUser,
} from "react-icons/pi";

export type BottomNavigationKey =
  | "home"
  | "recommendation"
  | "register"
  | "items"
  | "my";

export type BottomNavigationItem = {
  key: BottomNavigationKey;
  label: string;
  href: string;
  icon: IconType;
};

export const defaultBottomNavigationItems: BottomNavigationItem[] = [
  { key: "home", label: "홈", href: "/dashboard", icon: PiHouse },
  {
    key: "recommendation",
    label: "추천",
    href: "/recommendations",
    icon: PiSparkle,
  },
  { key: "register", label: "등록", href: "/items/new", icon: PiPlus },
  { key: "items", label: "아이템", href: "/items", icon: PiHandbag },
  { key: "my", label: "MY", href: "/my", icon: PiUser },
];

type BottomNavigationProps = {
  activeItem?: BottomNavigationKey;
  items?: BottomNavigationItem[];
};

export function BottomNavigation({
  activeItem = "home",
  items = defaultBottomNavigationItems,
}: BottomNavigationProps) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="z-40 h-[calc(82px+env(safe-area-inset-bottom))] shrink-0 border-t border-[#d8d8dc] bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul
        className="grid h-full"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive = item.key === activeItem;
          const isActiveRegister = item.key === "register" && isActive;
          const Icon = item.icon;

          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "font-bold text-[#15151a]"
                    : "font-normal text-[#9999a1] hover:text-[#5f5f68]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={
                    isActiveRegister
                      ? "nav-register-active flex size-12 items-center justify-center rounded-[17px] border border-white/20 bg-[#161513] text-white shadow-[0_8px_16px_-2px_rgba(23,21,17,0.24)]"
                      : "flex h-6 items-center justify-center transition-transform duration-200 group-active:scale-110"
                  }
                >
                  <Icon className={isActiveRegister ? "size-[22px]" : "size-5"} />
                </span>
                <span className="text-[9px] leading-[14px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
