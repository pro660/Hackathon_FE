"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PiBellRingingDuotone } from "react-icons/pi";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import type { ServiceNotification } from "@/types/api";

function formatRelativeDate(date: string) {
  const today = new Date();
  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayDifference = Math.round(
    (todayStart.getTime() - target.getTime()) / (24 * 60 * 60 * 1_000),
  );

  if (dayDifference === 0) return "오늘";
  if (dayDifference === 1) return "어제";
  if (dayDifference > 1 && dayDifference < 7) return `${dayDifference}일 전`;
  return date.slice(0, 10).replaceAll("-", ".");
}

export function NotificationListScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ServiceNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void backendApi.notifications
      .getNotifications(
        { page: 0, size: 20, sort: "createdAt,desc" },
        controller.signal,
      )
      .then((response) => setNotifications(response.data.data.items))
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("알림을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const openNotification = (notification: ServiceNotification) => {
    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) =>
          item.notificationId === notification.notificationId
            ? { ...item, read: true }
            : item,
        ),
      );
      void backendApi.notifications
        .setNotificationRead(notification.notificationId, true)
        .catch(() => undefined);
    }

    router.push(`/care/calendar?itemId=${encodeURIComponent(notification.myItemId)}`);
  };

  return (
    <MobileScreenLayout
      figmaNodeId="119:451"
      contentClassName="bg-white px-6 pt-6 pb-10 text-[#0e0e12]"
      bottomNavigation={<BottomNavigation activeItem="home" />}
    >
      <LuxuryReveal>
        <p className="text-[17px] leading-6 font-bold">알림</p>
        <h1 className="mt-9 text-[27px] leading-8 font-bold tracking-[-0.04em]">
          새로운 소식
        </h1>
      </LuxuryReveal>

      <LuxuryReveal className="mt-6" delay={80}>
        {isLoading ? (
          <div className="space-y-4" aria-label="알림을 불러오는 중">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-[74px] animate-pulse rounded-[15px] bg-[#f1f1f3]" />
            ))}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-[15px] bg-[#f8eeee] px-5 py-6 text-center text-[12px] text-[#9a4545]">
            {error}
          </p>
        ) : null}

        {!isLoading && !error && notifications.length === 0 ? (
          <div className="rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-5 py-10 text-center">
            <PiBellRingingDuotone aria-hidden="true" className="mx-auto size-8 text-[#9b896f]" />
            <p className="mt-4 text-[13px] font-bold">새로운 알림이 없어요</p>
            <p className="mt-2 text-[11px] leading-4 text-[#6e707a]">아이템 관리 시기가 되면 알려드릴게요.</p>
          </div>
        ) : null}

        {!isLoading && !error ? (
          <ul className="space-y-4">
            {notifications.map((notification) => (
              <li key={notification.notificationId}>
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className="flex h-[74px] w-full items-center rounded-[15px] border border-[#dbdee3] bg-[#f6f6f8] px-3 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[11px] bg-[#e5e0d6] text-[#75644f]">
                    <PiBellRingingDuotone aria-hidden="true" className="size-6" />
                  </span>
                  <span className="ml-4 min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14px] leading-[18px] font-bold">{notification.title}</span>
                      {!notification.read ? <span aria-label="읽지 않음" className="size-1.5 shrink-0 rounded-full bg-[#b89666]" /> : null}
                    </span>
                    <span className="mt-1.5 block truncate text-[11px] leading-4 text-[#6e707a]">
                      {formatRelativeDate(notification.scheduledDate)} · {notification.itemName}
                    </span>
                  </span>
                  <span aria-hidden="true" className="ml-3 text-[18px] text-[#6e707a]">›</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </LuxuryReveal>
    </MobileScreenLayout>
  );
}
