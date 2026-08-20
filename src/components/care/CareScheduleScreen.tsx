"use client";

import { useEffect, useMemo, useState } from "react";

import { getGuideEntries } from "@/components/care/carePresentation";
import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { BottomNavigation } from "@/components/common/navigation/BottomNavigation";
import { backendApi } from "@/services/api";
import type { CareCalendar, CareReminderSetting } from "@/types/api";

type CareScheduleScreenProps = { itemId?: string };
type CalendarEvent = { date: string; title: string; description?: string };

const dateKeys = ["date", "scheduledDate", "careDate", "dueDate"];
const titleKeys = ["title", "name", "routineType", "type", "label"];

function collectEvents(value: unknown, events: CalendarEvent[] = []): CalendarEvent[] {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectEvents(entry, events));
    return events;
  }
  if (!value || typeof value !== "object") return events;

  const record = value as Record<string, unknown>;
  const date = dateKeys.map((key) => record[key]).find((entry): entry is string => typeof entry === "string" && /^\d{4}-\d{2}-\d{2}/.test(entry));
  if (date) {
    const title = titleKeys.map((key) => record[key]).find((entry): entry is string => typeof entry === "string");
    const description = Object.entries(record)
      .filter(([key, entry]) => !dateKeys.includes(key) && !titleKeys.includes(key) && typeof entry === "string")
      .map(([, entry]) => entry as string)
      .join(" · ");
    events.push({ date: date.slice(0, 10), title: title ?? "관리 예정", ...(description ? { description } : {}) });
  }

  Object.values(record).forEach((entry) => collectEvents(entry, events));
  return events;
}

function createMonthCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const lastDate = new Date(year, monthNumber, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= lastDate ? day : null;
  });
}

export function CareScheduleScreen({ itemId }: CareScheduleScreenProps) {
  const month = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const cells = useMemo(() => createMonthCells(month), [month]);
  const [calendar, setCalendar] = useState<CareCalendar | null>(null);
  const [reminder, setReminder] = useState<CareReminderSetting | null>(null);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    void Promise.all([
      backendApi.closet.getCareCalendar(itemId, month, controller.signal),
      backendApi.closet.getCareReminderSetting(itemId, controller.signal),
    ])
      .then(([calendarResponse, reminderResponse]) => {
        setCalendar(calendarResponse.data.data);
        setReminder(reminderResponse.data.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("관리 캘린더를 불러오지 못했습니다.");
      });
    return () => controller.abort();
  }, [itemId, month]);

  const events = calendar ? collectEvents(calendar) : [];
  const eventDays = new Set(
    events
      .filter((event) => event.date.startsWith(month))
      .map((event) => Number(event.date.slice(8, 10))),
  );
  const fallbackEntries = calendar && events.length === 0 ? getGuideEntries(calendar) : [];
  const monthTitle = new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  const toggleReminder = async () => {
    if (!itemId || !reminder || isUpdatingReminder) return;
    setIsUpdatingReminder(true);
    setError(null);
    try {
      const response = await backendApi.closet.updateCareReminderSetting(itemId, !reminder.enabled);
      setReminder(response.data.data);
    } catch {
      setError("관리 알림 설정을 변경하지 못했습니다.");
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="119:1297"
      contentClassName="bg-white px-6 pt-4 pb-8 text-[#17171c]"
      bottomNavigation={<BottomNavigation activeItem="items" />}
    >
      <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <BackButton />
          <h1 className="mt-1 text-[17px] leading-6 font-bold">관리 캘린더</h1>
          <p className="mt-5 text-[13px] leading-5 text-[#7a7a83]">구매일과 소재별 권장 주기를 기준으로 안내해요</p>
        </LuxuryReveal>

        {!itemId ? <StatusCard text="내 아이템에서 관리 일정을 확인할 제품을 선택해 주세요." /> : null}
        {itemId && !calendar && !error ? <div className="mt-8 h-[300px] animate-pulse rounded-[18px] bg-[#f5f5f7]" role="status" aria-label="관리 캘린더를 불러오는 중" /> : null}
        {error ? <p role="alert" className="mt-5 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">{error}</p> : null}

        {calendar ? (
          <>
            <LuxuryReveal className="mt-8" delay={60}>
              <section className="rounded-[18px] border border-[#e4e4e8] bg-[#f7f7f8] px-4 pt-5 pb-6">
                <h2 className="text-center text-[13px] font-bold text-[#2b2b31]">{monthTitle}</h2>
                <div className="mt-5 grid grid-cols-7 text-center text-[10px] font-medium text-[#8a8a93]">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
                </div>
                <div className="mt-3 grid grid-cols-7 gap-y-3 text-center text-[10px] text-[#5d5d66]">
                  {cells.map((day, index) => (
                    <span key={index} className="flex h-8 items-center justify-center">
                      {day ? <span className={`flex size-6 items-center justify-center rounded-full ${eventDays.has(day) ? "bg-[#17171c] font-bold text-white" : ""}`}>{day}</span> : null}
                    </span>
                  ))}
                </div>
              </section>
            </LuxuryReveal>

            <LuxuryReveal className="mt-7 space-y-4" delay={110}>
              {calendar.available === false ? <StatusCard text="구매일 또는 소재 정보가 없어 관리 일정을 계산할 수 없습니다." /> : null}
              {events.map((event, index) => (
                <article key={`${event.date}-${event.title}-${index}`} className="rounded-[14px] border border-[#e4e4e8] bg-[#f7f7f8] px-4 py-4">
                  <p className="text-[14px] font-bold">{event.date.slice(5).replace("-", "/")} {event.title}</p>
                  {event.description ? <p className="mt-2 text-[11px] leading-4 text-[#777780]">{event.description}</p> : null}
                </article>
              ))}
              {fallbackEntries.map((entry) => (
                <article key={entry.key} className="rounded-[14px] border border-[#e4e4e8] bg-[#f7f7f8] px-4 py-4">
                  <p className="text-[12px] font-bold">{entry.label}</p>
                  <p className="mt-2 whitespace-pre-line text-[11px] leading-4 text-[#777780]">{entry.value}</p>
                </article>
              ))}
            </LuxuryReveal>

            {itemId && reminder ? (
              <LuxuryReveal className="mt-auto pt-8" delay={160}>
                <button type="button" disabled={isUpdatingReminder || calendar.available === false} onClick={() => void toggleReminder()} className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#17171c] text-[14px] font-bold text-white disabled:opacity-45">
                  {isUpdatingReminder ? "알림 설정 중..." : reminder.enabled ? "관리 알림 끄기" : "관리 알림 설정"}
                </button>
              </LuxuryReveal>
            ) : null}
          </>
        ) : null}
      </div>
    </MobileScreenLayout>
  );
}

function StatusCard({ text }: { text: string }) {
  return <p className="rounded-[16px] border border-[#e4e4e8] bg-[#f8f8f9] px-5 py-8 text-center text-[13px] leading-5 text-[#777780]">{text}</p>;
}
