"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import { ScreenHeader } from "@/components/common/section/ScreenHeader";
import { AccountConfirmationScreen } from "@/components/my/AccountConfirmationScreen";
import { getApiErrorMessage } from "@/lib/apiError";
import { backendApi } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  AuthenticationMethod,
  OAuthProvider,
  UserProfile,
} from "@/types/api";

type ReauthenticationStatus = "IDLE" | "PROCESSING" | "READY";

function toOAuthProvider(
  method: AuthenticationMethod,
): OAuthProvider | null {
  if (method === "KAKAO") {
    return "kakao";
  }

  if (method === "NAVER") {
    return "naver";
  }

  return null;
}

export function AccountDeletionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearSession = useAuthStore((state) => state.clearSession);
  const [hasConfirmedDeletion, setHasConfirmedDeletion] = useState(
    searchParams.get("reauthenticated") === "true",
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<ReauthenticationStatus>(
    searchParams.get("reauthenticated") === "true" ? "READY" : "IDLE",
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get("reauthError")
      ? "소셜 계정 재인증에 실패했습니다. 다시 시도해 주세요."
      : null,
  );

  useEffect(() => {
    if (!hasConfirmedDeletion) {
      return;
    }

    let active = true;

    void backendApi.profile
      .getMe()
      .then(({ data }) => {
        if (active) {
          setProfile(data.data);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getApiErrorMessage(
              loadError,
              "회원 정보를 확인하지 못했습니다. 다시 시도해 주세요.",
            ),
          );
        }
      });

    return () => {
      active = false;
    };
  }, [hasConfirmedDeletion]);

  const handleLocalReauthentication = async (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      setError("현재 비밀번호를 입력해 주세요.");
      return;
    }

    setStatus("PROCESSING");
    setError(null);

    try {
      await backendApi.auth.reauthenticateForAccountDeletion(password);
      setPassword("");
      setStatus("READY");
    } catch (reauthError) {
      setStatus("IDLE");
      setError(
        getApiErrorMessage(
          reauthError,
          "비밀번호 재인증에 실패했습니다.",
        ),
      );
    }
  };

  const handleSocialReauthentication = (provider: OAuthProvider) => {
    setStatus("PROCESSING");
    setError(null);

    try {
      window.location.assign(
        backendApi.auth.getAccountDeletionOAuthReauthUrl(provider),
      );
    } catch (oauthError) {
      setStatus("IDLE");
      setError(
        oauthError instanceof Error
          ? oauthError.message
          : "소셜 재인증을 시작하지 못했습니다.",
      );
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await backendApi.profile.deleteMe();
      clearSession();
      router.replace("/login?accountDeleted=true");
    } catch (deleteError) {
      setError(
        getApiErrorMessage(
          deleteError,
          "회원 탈퇴 요청을 처리하지 못했습니다. 재인증 후 다시 시도해 주세요.",
        ),
      );
      setStatus("IDLE");
    } finally {
      setIsDeleting(false);
    }
  };

  const effectiveProfile = profile;
  const isLocal =
    effectiveProfile?.authenticationMethods.includes("LOCAL") ?? false;
  const socialProviders =
    effectiveProfile?.authenticationMethods
      .map(toOAuthProvider)
      .filter((provider): provider is OAuthProvider => provider !== null) ?? [];

  if (!hasConfirmedDeletion) {
    return (
      <AccountConfirmationScreen
        figmaNodeId="390:444"
        sectionTitle="회원 탈퇴"
        title="정말 탈퇴하시겠어요?"
        description="등록한 아이템과 패스포트 정보가 삭제되며 복구할 수 없어요."
        cancelLabel="계속 이용하기"
        confirmLabel="회원 탈퇴하기"
        danger
        onCancel={() => router.back()}
        onConfirm={() => setHasConfirmedDeletion(true)}
      />
    );
  }

  return (
    <MobileScreenLayout contentClassName="bg-white px-6 pt-4 pb-9">
      <LuxuryReveal>
        <BackButton />
      </LuxuryReveal>

      <LuxuryReveal className="mt-1" delay={40}>
        <ScreenHeader
          eyebrow="ACCOUNT"
          title="회원 탈퇴"
          description="계정을 보호하기 위해 한 번 더 본인 확인을 진행합니다."
        />
      </LuxuryReveal>

      <LuxuryReveal className="mt-8" delay={90}>
        <section className="rounded-[22px] border border-[#e2ded8] bg-[#f8f6f3] p-5">
          {!effectiveProfile && !error ? (
            <p className="text-[13px] text-[#777780]">로그인 방식을 확인하고 있습니다.</p>
          ) : null}

          {effectiveProfile && status !== "READY" && isLocal ? (
            <form onSubmit={handleLocalReauthentication}>
              <label className="block text-[12px] font-bold text-[#35353b]">
                현재 비밀번호
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-3 h-[50px] w-full rounded-[15px] border border-[#dedee2] bg-white px-4 text-[13px] outline-none focus:border-[#8b7355]"
                />
              </label>
              <button
                type="submit"
                disabled={status === "PROCESSING"}
                className="mt-4 flex h-[50px] w-full items-center justify-center rounded-[15px] bg-[#15151a] text-[14px] font-bold text-white disabled:opacity-45"
              >
                {status === "PROCESSING" ? "확인 중" : "비밀번호로 재인증"}
              </button>
            </form>
          ) : null}

          {effectiveProfile && status !== "READY" && socialProviders.length > 0 ? (
            <div className={isLocal ? "mt-6 border-t border-[#dedee2] pt-5" : ""}>
              <p className="text-[13px] leading-5 text-[#55555d]">
                연결된 소셜 계정으로 다시 로그인해 주세요.
              </p>
              <div className="mt-4 space-y-3">
                {socialProviders.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    disabled={status === "PROCESSING"}
                    onClick={() => handleSocialReauthentication(provider)}
                    className="flex h-[50px] w-full items-center justify-center rounded-[15px] bg-[#15151a] text-[14px] font-bold text-white disabled:opacity-45"
                  >
                    {status === "PROCESSING"
                      ? "재인증 준비 중"
                      : `${provider === "kakao" ? "카카오" : "네이버"}로 재인증`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {status === "READY" ? (
            <div>
              <p className="text-[13px] font-bold text-[#4f7154]">본인 확인이 완료되었습니다.</p>
              <p className="mt-2 text-[11px] leading-4 text-[#777780]">
                재인증은 10분 동안 유효하며 한 번만 사용할 수 있습니다.
              </p>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="mt-5 flex h-[50px] w-full items-center justify-center rounded-[15px] bg-[#9a4545] text-[14px] font-bold text-white disabled:opacity-45"
              >
                {isDeleting ? "탈퇴 요청 중" : "회원 탈퇴 요청"}
              </button>
            </div>
          ) : null}
        </section>
      </LuxuryReveal>

      {error ? (
        <p role="alert" className="mt-4 rounded-[14px] bg-[#f8eeee] px-4 py-3 text-[12px] text-[#9a4545]">
          {error}
        </p>
      ) : null}
    </MobileScreenLayout>
  );
}
