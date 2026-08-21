"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { getApiErrorMessage } from "@/lib/apiError";
import { backendApi } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";

const nicknamePattern = /^[가-힣A-Za-z0-9_]{2,20}$/;

export function ProfileEditScreen() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const currentUser = useAuthStore((state) => state.user);
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void backendApi.profile
      .getMe()
      .then(({ data }) => {
        if (!active) {
          return;
        }
        const loadedNickname = data.data.nickname.trim();
        setNickname(loadedNickname);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            getApiErrorMessage(loadError, "프로필을 불러오지 못했습니다."),
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    const normalizedNickname = nickname.trim();

    if (isSaving) {
      return;
    }

    if (!nicknamePattern.test(normalizedNickname)) {
      setError("닉네임은 한글, 영문, 숫자, 밑줄로 2~20자까지 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await backendApi.profile.updateMe({
        nickname: normalizedNickname,
      });
      setUser({
        ...response.data.data,
        profileImageUrl: currentUser?.profileImageUrl ?? null,
      });

      router.back();
      router.refresh();
    } catch (saveError) {
      setError(
        getApiErrorMessage(
          saveError,
          "프로필을 저장하지 못했습니다. 다시 시도해 주세요.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileScreenLayout
      figmaNodeId="311:163"
      contentClassName="flex min-h-full flex-col bg-white px-6 pt-4 pb-8 text-[#121217]"
    >
      <div className="flex min-h-full flex-col">
      <LuxuryReveal>
        <div className="flex items-center">
          <BackButton variant="plain" />
        </div>
        <h1 className="mt-1 text-[28px] leading-[34px] font-bold tracking-[-0.04em]">
          프로필 수정
        </h1>
        <p className="mt-[6px] text-[13px] leading-5 text-[#7a7a85]">
          닉네임과 저장된 취향을 변경할 수 있어요.
        </p>
      </LuxuryReveal>

      <LuxuryReveal className="mt-8 flex flex-col items-center" delay={50}>
        <div
          aria-label="현재 프로필 사진"
          className="relative flex size-[76px] items-center justify-center overflow-hidden rounded-full bg-[#e9e5df] text-[24px] font-bold text-[#4a433a]"
        >
          {currentUser?.profileImageUrl ? (
            <Image
              src={currentUser.profileImageUrl}
              alt="프로필 사진"
              fill
              sizes="76px"
              unoptimized
              className="object-cover"
            />
          ) : (
            (nickname[0] ?? "?").toUpperCase()
          )}
        </div>
      </LuxuryReveal>

      <LuxuryReveal className="mt-8" delay={90}>
        <label htmlFor="profile-nickname" className="text-[13px] font-bold">
          닉네임
        </label>
        <div className="mt-2 flex h-[54px] items-center rounded-[14px] border border-[#dbdbe0] bg-white px-4 focus-within:border-[#121217]">
          <input
            id="profile-nickname"
            value={nickname}
            disabled={isLoading}
            maxLength={20}
            onChange={(event) => {
              setNickname(event.target.value);
              setError(null);
            }}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#121217] outline-none"
          />
        </div>
      </LuxuryReveal>

      <LuxuryReveal className="mt-6" delay={120}>
        <Link
          href="/personalize?mode=edit"
          className="flex h-[72px] items-center rounded-[16px] border border-[#dedee2] bg-[#f8f8f9] px-4 transition-colors hover:border-[#c8c2b9] hover:bg-[#f5f3f0]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-[#15151a]">
              취향 프로필
            </span>
            <span className="mt-[7px] block text-[11px] text-[#888890]">
              색상 · 카테고리 · 스타일 변경
            </span>
          </span>
          <span aria-hidden="true" className="ml-3 text-[22px] text-[#777780]">
            ›
          </span>
        </Link>
      </LuxuryReveal>

      {error ? (
        <p className="mt-4 text-[12px] font-medium text-[#c23535]" role="alert">
          {error}
        </p>
      ) : null}

      <LuxuryReveal className="mt-auto pt-10" delay={160}>
        <button
          type="button"
          disabled={isLoading || isSaving}
          onClick={handleSave}
          className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#121217] text-[14px] font-bold text-white transition-colors hover:bg-[#26262c] disabled:cursor-wait disabled:opacity-50"
        >
          {isSaving ? "저장 중" : "변경사항 저장"}
        </button>
      </LuxuryReveal>
      </div>
    </MobileScreenLayout>
  );
}
