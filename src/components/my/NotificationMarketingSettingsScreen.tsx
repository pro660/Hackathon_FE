"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { getApiErrorMessage } from "@/lib/apiError";
import { backendApi } from "@/services/api";
import type { UserNotificationSettings } from "@/types/api";

const defaultSettings: UserNotificationSettings = {
  careReminderEnabled: true,
  recommendationUpdateEnabled: true,
  marketingPushEnabled: false,
  emailMarketingEnabled: false,
};

type SettingToggleProps = {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

function SettingToggle({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: SettingToggleProps) {
  return (
    <label className="flex min-h-[82px] cursor-pointer items-center gap-4 border-b border-[#ececef] py-4 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-[#15151a]">{title}</span>
        <span className="mt-1 block text-[11px] leading-4 text-[#888890]">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only disabled:cursor-wait"
      />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-[#d8d8dc] transition-colors peer-checked:bg-[#15151a] peer-disabled:opacity-45 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#15151a] after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function NotificationMarketingSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSettings = async () => {
      try {
        const response = await backendApi.profile.getNotificationSettings(
          controller.signal,
        );
        setSettings(response.data.data);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          getApiErrorMessage(
            loadError,
            "알림 설정을 불러오지 못했습니다. 다시 시도해 주세요.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();
    return () => controller.abort();
  }, []);

  const updateSetting = (
    key: keyof UserNotificationSettings,
    value: boolean,
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await backendApi.profile.updateNotificationSettings({
        ...settings,
      });
      setSettings(response.data.data);

      router.back();
      router.refresh();
    } catch (saveError) {
      setError(
        getApiErrorMessage(
          saveError,
          "알림 설정을 저장하지 못했습니다. 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileScreenLayout contentClassName="flex min-h-full flex-col bg-white px-6 pt-4 pb-8 text-[#121217]">
      <div className="flex min-h-full flex-col">
      <LuxuryReveal>
        <BackButton variant="plain" />
        <h1 className="mt-1 text-[28px] leading-[34px] font-bold tracking-[-0.04em]">
          알림·마케팅 설정
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-[#777780]">
          받고 싶은 소식만 선택할 수 있어요.
        </p>
      </LuxuryReveal>

      <LuxuryReveal className="mt-10" delay={60}>
        <section
          aria-label="알림 수신 설정"
          className="rounded-[18px] border border-[#dedee2] bg-[#f8f8f9] px-4"
        >
          <SettingToggle
            title="관리 일정 알림"
            description="아이템 관리 일정과 관련된 알림을 받아요."
            checked={settings.careReminderEnabled}
            disabled={isLoading || isSaving}
            onChange={(checked) => updateSetting("careReminderEnabled", checked)}
          />
          <SettingToggle
            title="추천 업데이트 알림"
            description="새로운 맞춤 추천 소식을 받아요."
            checked={settings.recommendationUpdateEnabled}
            disabled={isLoading || isSaving}
            onChange={(checked) =>
              updateSetting("recommendationUpdateEnabled", checked)
            }
          />
          <SettingToggle
            title="마케팅 PUSH 수신"
            description="앱 이벤트와 혜택 알림을 선택적으로 받아요."
            checked={settings.marketingPushEnabled}
            disabled={isLoading || isSaving}
            onChange={(checked) => updateSetting("marketingPushEnabled", checked)}
          />
          <SettingToggle
            title="이메일 마케팅 수신"
            description="이메일로 이벤트와 혜택 정보를 받아요."
            checked={settings.emailMarketingEnabled}
            disabled={isLoading || isSaving}
            onChange={(checked) => updateSetting("emailMarketingEnabled", checked)}
          />
        </section>
      </LuxuryReveal>

      {error ? (
        <p role="alert" className="mt-4 rounded-[14px] bg-[#fff1f1] px-4 py-3 text-[12px] leading-5 text-[#c72e2e]">
          {error}
        </p>
      ) : null}

      <LuxuryReveal className="mt-auto pt-10" delay={110}>
        <button
          type="button"
          disabled={isLoading || isSaving}
          onClick={handleSave}
          className="h-[52px] w-full rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white transition-colors hover:bg-[#26262c] disabled:cursor-wait disabled:opacity-55"
        >
          {isLoading ? "불러오는 중" : isSaving ? "저장 중" : "설정 저장"}
        </button>
      </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
