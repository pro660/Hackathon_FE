"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { SignupTermsDialog } from "@/components/auth/SignupTermsDialog";
import type { SignupTermId } from "@/content/signupTerms";
import { getApiErrorMessage } from "@/lib/apiError";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Gender } from "@/types/api";

const TERMS_VERSION = "2026-08-01";

function TextField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? label}
        className="h-[54px] w-full rounded-[16px] border border-[#d8d6dd] bg-white px-4 text-[13px] leading-4 text-[#15151a] outline-none transition placeholder:text-[#9999a1] focus:border-[#15151a]"
      />
    </label>
  );
}

function EmailFieldWithAction({
  value,
  onChange,
  onSendCode,
  isSending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSendCode: () => Promise<void>;
  isSending: boolean;
}) {
  return (
    <label className="block">
      <span className="sr-only">이메일</span>
      <div className="flex h-[54px] items-center gap-3 rounded-[16px] border border-[#d8d6dd] bg-white px-4 focus-within:border-[#15151a]">
        <input
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="이메일"
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-4 text-[#15151a] outline-none placeholder:text-[#9999a1]"
        />
        <button
          type="button"
          onClick={() => void onSendCode()}
          disabled={isSending}
          className="ml-3 shrink-0 rounded-full border border-[#d8d6dd] px-3 py-1.5 text-[12px] font-bold text-[#15151a] transition hover:bg-[#f7f6f8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSending ? "발송 중" : "인증번호 받기"}
        </button>
      </div>
    </label>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-[13px] font-bold tracking-[-0.02em] text-[#15151a]">
      {children}
    </h2>
  );
}

function CheckboxRow({
  label,
  required,
  checked,
  onChange,
  onOpenDetails,
}: {
  label: string;
  required?: boolean;
  checked: boolean;
  onChange: (value: boolean) => void;
  onOpenDetails: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-[#d8d6dd] bg-white px-4 py-4 text-[13px] leading-5 text-[#55555d]">
      <input
        type="checkbox"
        aria-label={`${label} ${required ? "필수" : "선택"} 동의`}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-[#c8c8d0] text-[#15151a]"
      />
      <button type="button" onClick={onOpenDetails} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
        <span>{label}{required ? " (필수)" : " (선택)"}</span>
        <span className="shrink-0 text-[11px] font-bold text-[#8b7355]">보기 ›</span>
      </button>
    </div>
  );
}

function GenderChoice({
  value,
  onChange,
}: {
  value: Gender | "";
  onChange: (value: Gender) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <label className="cursor-pointer">
        <input
          type="radio"
          name="gender"
          value="FEMALE"
          checked={value === "FEMALE"}
          onChange={() => onChange("FEMALE")}
          className="peer sr-only"
        />
        <div className="flex h-[54px] items-center justify-center rounded-[16px] border border-[#d8d6dd] bg-white text-[13px] font-bold text-[#15151a] transition peer-checked:border-[#15151a] peer-checked:bg-[#15151a] peer-checked:text-white">
          여성
        </div>
      </label>
      <label className="cursor-pointer">
        <input
          type="radio"
          name="gender"
          value="MALE"
          checked={value === "MALE"}
          onChange={() => onChange("MALE")}
          className="peer sr-only"
        />
        <div className="flex h-[54px] items-center justify-center rounded-[16px] border border-[#d8d6dd] bg-white text-[13px] font-bold text-[#15151a] transition peer-checked:border-[#15151a] peer-checked:bg-[#15151a] peer-checked:text-white">
          남성
        </div>
      </label>
      <label className="cursor-pointer">
        <input
          type="radio"
          name="gender"
          value="NOT_SPECIFIED"
          checked={value === "NOT_SPECIFIED"}
          onChange={() => onChange("NOT_SPECIFIED")}
          className="peer sr-only"
        />
        <div className="flex h-[54px] items-center justify-center rounded-[16px] border border-[#d8d6dd] bg-white text-[13px] font-bold text-[#15151a] transition peer-checked:border-[#15151a] peer-checked:bg-[#15151a] peer-checked:text-white">
          미선택
        </div>
      </label>
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
}: {
  children: string;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex h-[54px] w-full items-center justify-center rounded-[18px] bg-[#15151a] text-[15px] font-bold text-white transition hover:bg-[#202028] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function SignUpScreen() {
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [serviceConsent, setServiceConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTermId, setActiveTermId] = useState<SignupTermId | null>(null);
  const closeTerms = useCallback(() => setActiveTermId(null), []);

  const handleSendCode = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("이메일을 입력해 주세요.");
      return;
    }

    setEmailCodeSent(true);
    setIsSendingCode(true);
    setError("");
    setNotice("");

    try {
      await authApi.sendEmailVerification(normalizedEmail);
      setNotice("인증번호를 발송했습니다. 만료되기 전에 입력해 주세요.");
    } catch (sendError) {
      setError(
        getApiErrorMessage(sendError, "인증번호를 발송하지 못했습니다."),
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }

    if (!id.trim()) {
      setError("아이디를 입력해 주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    if (!passwordConfirm) {
      setError("비밀번호 확인을 입력해 주세요.");
      return;
    }

    if (!nickname.trim()) {
      setError("닉네임을 입력해 주세요.");
      return;
    }

    if (!gender) {
      setError("성별을 선택해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(password)) {
      setError("비밀번호는 영문과 숫자를 포함한 8~64자여야 합니다.");
      return;
    }

    if (!emailCodeSent || !/^\d{6}$/.test(emailCode)) {
      setError("이메일로 받은 6자리 인증번호를 입력해 주세요.");
      return;
    }

    if (!serviceConsent || !privacyConsent) {
      setError("서비스 이용약관과 개인정보 처리방침에 동의해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const normalizedEmail = email.trim();
      const loginId = id.trim();
      const verification = await authApi.confirmEmailVerification(
        normalizedEmail,
        emailCode,
      );
      const availability = await authApi.checkLoginIdAvailability(loginId);

      if (!availability.data.data.available) {
        setError("이미 사용 중인 아이디입니다.");
        return;
      }

      const response = await authApi.signup({
        signupToken: verification.data.data.signupToken,
        loginId,
        password,
        passwordConfirm,
        nickname: nickname.trim(),
        gender,
        termsAgreements: [
          {
            termsType: "SERVICE_TERMS",
            termsVersion: TERMS_VERSION,
            agreed: serviceConsent,
          },
          {
            termsType: "PRIVACY_POLICY",
            termsVersion: TERMS_VERSION,
            agreed: privacyConsent,
          },
          {
            termsType: "EMAIL_MARKETING",
            termsVersion: TERMS_VERSION,
            agreed: marketingConsent,
          },
        ],
      });

      setSession(response.data.data);
      router.replace("/signup/preferences");
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "회원가입에 실패했습니다. 입력 내용을 확인해 주세요.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileScreenLayout contentClassName="bg-white px-6 pt-12 pb-[32px] text-[#17181d]">
      <section className="flex min-h-full flex-col">
        <div>
          <p className="text-[11px] font-bold tracking-[0.01em] text-[#8b7355]">
            MEMBERSHIP
          </p>
          <h1 className="mt-2 text-[28px] leading-[1.2] font-bold tracking-[-0.035em] text-[#15151a]">
            회원가입
          </h1>
          <p className="mt-2 text-[13px] leading-4 text-[#777780]">
            자체 서비스 가입 또는 간편 로그인 가입을 선택하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="space-y-6">
            <div className="space-y-4">
              <SectionTitle>자체 서비스 회원가입</SectionTitle>
              <div className="space-y-5">
                <EmailFieldWithAction
                  value={email}
                  onChange={setEmail}
                  onSendCode={handleSendCode}
                  isSending={isSendingCode}
                />
                {emailCodeSent ? (
                  <div className="pt-1">
                    <TextField
                      label="인증번호"
                      placeholder="인증번호"
                      value={emailCode}
                      onChange={setEmailCode}
                    />
                  </div>
                ) : null}
                <TextField
                  label="아이디"
                  placeholder="아이디"
                  value={id}
                  onChange={setId}
                />
                <TextField
                  label="비밀번호"
                  placeholder="비밀번호"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
                <TextField
                  label="비밀번호 확인"
                  placeholder="비밀번호 확인"
                  type="password"
                  value={passwordConfirm}
                  onChange={setPasswordConfirm}
                />
                <TextField
                  label="닉네임"
                  placeholder="닉네임"
                  value={nickname}
                  onChange={setNickname}
                />
                <GenderChoice value={gender} onChange={setGender} />
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>동의 사항</SectionTitle>
              <div className="space-y-3">
                <CheckboxRow
                  label="서비스 이용약관 동의"
                  required
                  checked={serviceConsent}
                  onChange={setServiceConsent}
                  onOpenDetails={() => setActiveTermId("service")}
                />
                <CheckboxRow
                  label="개인정보 수집·이용 동의"
                  required
                  checked={privacyConsent}
                  onChange={setPrivacyConsent}
                  onOpenDetails={() => setActiveTermId("privacy")}
                />
                <CheckboxRow
                  label="마케팅 수신동의"
                  checked={marketingConsent}
                  onChange={setMarketingConsent}
                  onOpenDetails={() => setActiveTermId("marketing")}
                />
              </div>
            </div>

            {error ? (
              <p className="text-[12px] font-medium text-[#c23535]">{error}</p>
            ) : null}
            {notice ? (
              <p className="text-[12px] font-medium text-[#4b7357]">{notice}</p>
            ) : null}

            <div className="space-y-4">
              <PrimaryButton disabled={isSubmitting}>
                {isSubmitting ? "가입 처리 중..." : "가입하기"}
              </PrimaryButton>
            </div>
          </div>
        </form>
      </section>
      <SignupTermsDialog activeTermId={activeTermId} onClose={closeTerms} />
    </MobileScreenLayout>
  );
}
