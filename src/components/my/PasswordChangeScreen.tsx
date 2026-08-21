"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PiCheckCircleFill, PiEyeBold, PiEyeSlashBold } from "react-icons/pi";

import { MobileScreenLayout } from "@/components/common/layout/MobileScreenLayout";
import { LuxuryReveal } from "@/components/common/motion/LuxuryReveal";
import { BackButton } from "@/components/common/navigation/BackButton";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/lib/apiError";
import { backendApi } from "@/services/api";

type PasswordStep = "FORM" | "CONFIRM" | "COMPLETE";
type PasswordField = "current" | "next" | "confirm";

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const passwordErrorFieldByCode: Record<string, PasswordField> = {
  CURRENT_PASSWORD_MISMATCH: "current",
  NEW_PASSWORD_SAME_AS_CURRENT: "next",
  PASSWORD_CONFIRM_MISMATCH: "confirm",
};
const passwordRequestFieldMap: Record<string, PasswordField | undefined> = {
  currentPassword: "current",
  newPassword: "next",
  newPasswordConfirm: "confirm",
};

type PasswordFieldProps = {
  id: PasswordField;
  label: string;
  value: string;
  autoComplete: string;
  visible: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

function PasswordFieldInput({
  id,
  label,
  value,
  autoComplete,
  visible,
  error,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  const inputId = `password-${id}`;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="text-[13px] font-bold text-[#2b2b31]">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`h-[54px] w-full rounded-[14px] border bg-white px-4 pr-12 text-[14px] text-[#121217] outline-none transition-colors placeholder:text-[#aaaab1] ${
            error
              ? "border-[#d94a4a] focus:border-[#c72e2e]"
              : "border-[#dbdbe0] focus:border-[#121217]"
          }`}
        />
        <button
          type="button"
          aria-label={visible ? `${label} 숨기기` : `${label} 보기`}
          onClick={onToggleVisibility}
          className="absolute top-1/2 right-4 -translate-y-1/2 text-[#777780]"
        >
          {visible ? (
            <PiEyeSlashBold aria-hidden="true" className="size-5" />
          ) : (
            <PiEyeBold aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-[12px] font-medium text-[#c72e2e]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordChangeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<PasswordStep>("FORM");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [visibleFields, setVisibleFields] = useState<PasswordField[]>([]);
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleVisibility = (field: PasswordField) => {
    setVisibleFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
  };

  const validate = () => {
    const nextErrors: Partial<Record<PasswordField, string>> = {};

    if (!currentPassword) {
      nextErrors.current = "현재 비밀번호를 입력해 주세요.";
    }

    if (!passwordPattern.test(newPassword)) {
      nextErrors.next = "영문과 숫자를 포함한 8~64자로 입력해 주세요.";
    } else if (newPassword === currentPassword) {
      nextErrors.next = "현재 비밀번호와 다른 비밀번호를 입력해 주세요.";
    }

    if (!passwordConfirm) {
      nextErrors.confirm = "새 비밀번호를 한 번 더 입력해 주세요.";
    } else if (newPassword !== passwordConfirm) {
      nextErrors.confirm = "새 비밀번호가 일치하지 않습니다.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    if (validate()) {
      setStep("CONFIRM");
    }
  };

  const handlePasswordChange = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await backendApi.auth.changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirm: passwordConfirm,
      });

      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirm("");
      setStep("COMPLETE");
    } catch (error) {
      setStep("FORM");
      const errorCode = getApiErrorCode(error);
      const errorField = errorCode
        ? passwordErrorFieldByCode[errorCode]
        : undefined;

      if (errorField) {
        setErrors({
          [errorField]: getApiErrorMessage(
            error,
            "입력한 비밀번호를 다시 확인해 주세요.",
          ),
        });
      } else if (errorCode === "VALIDATION_ERROR") {
        const fieldErrors = getApiFieldErrors(error).reduce<
          Partial<Record<PasswordField, string>>
        >((result, fieldError) => {
          const field = passwordRequestFieldMap[fieldError.field];
          if (field) {
            result[field] = fieldError.reason;
          }
          return result;
        }, {});

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setSubmitError("입력한 비밀번호 형식을 다시 확인해 주세요.");
        }
      } else if (errorCode === "PASSWORD_CHANGE_NOT_AVAILABLE") {
        setSubmitError("소셜 전용 계정은 비밀번호를 변경할 수 없어요.");
      } else {
        setSubmitError(
          getApiErrorMessage(
            error,
            "비밀번호를 변경하지 못했습니다. 다시 시도해 주세요.",
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "CONFIRM") {
    return (
      <MobileScreenLayout contentClassName="flex min-h-full flex-col bg-white px-6 pt-6 pb-8 text-[#0e0e12]">
        <div className="flex min-h-full flex-col">
        <LuxuryReveal>
          <p className="text-[17px] font-bold">비밀번호 변경</p>
          <h1 className="mt-[58px] text-[28px] leading-[36px] font-bold tracking-[-0.04em]">
            비밀번호를 변경할까요?
          </h1>
          <p className="mt-2 text-[13px] leading-5 text-[#6e707a]">
            변경 후에도 현재 로그인 상태는 그대로 유지돼요.
          </p>
        </LuxuryReveal>

        <LuxuryReveal className="mt-auto space-y-4" delay={90}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handlePasswordChange}
            className="h-[52px] w-full rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white disabled:cursor-wait disabled:opacity-55"
          >
            {isSubmitting ? "변경 중" : "비밀번호 변경"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setStep("FORM")}
            className="h-[52px] w-full rounded-[14px] border border-[#d8d8dc] bg-white text-[14px] font-bold text-[#0e0e12] disabled:opacity-55"
          >
            다시 입력하기
          </button>
        </LuxuryReveal>
        </div>
      </MobileScreenLayout>
    );
  }

  if (step === "COMPLETE") {
    return (
      <MobileScreenLayout contentClassName="flex min-h-full flex-col bg-white px-6 pt-6 pb-8 text-[#0e0e12]">
        <div className="flex min-h-full flex-col">
        <LuxuryReveal className="flex flex-1 flex-col items-center justify-center text-center">
          <PiCheckCircleFill aria-hidden="true" className="size-14 text-[#0e0e12]" />
          <h1 className="mt-6 text-[28px] leading-[36px] font-bold tracking-[-0.04em]">
            비밀번호 변경 완료
          </h1>
          <p className="mt-2 text-[13px] leading-5 text-[#6e707a]">
            현재 로그인 상태는 유지되며 다음 로그인부터 새 비밀번호를 사용해 주세요.
          </p>
        </LuxuryReveal>
        <button
          type="button"
          onClick={() => router.replace("/my/settings")}
          className="h-[52px] w-full rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white"
        >
          계정 설정으로 돌아가기
        </button>
        </div>
      </MobileScreenLayout>
    );
  }

  return (
    <MobileScreenLayout contentClassName="flex min-h-full flex-col bg-white px-6 pt-4 pb-8 text-[#121217]">
      <div className="flex min-h-full flex-col">
      <LuxuryReveal>
        <BackButton variant="plain" />
        <h1 className="mt-1 text-[28px] leading-[34px] font-bold tracking-[-0.04em]">
          비밀번호 변경
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-[#777780]">
          현재 비밀번호를 확인한 뒤 새 비밀번호를 설정해 주세요.
        </p>
      </LuxuryReveal>

      <form onSubmit={handleFormSubmit} className="mt-10 flex flex-1 flex-col">
        <LuxuryReveal className="space-y-6" delay={50}>
          <PasswordFieldInput
            id="current"
            label="현재 비밀번호"
            value={currentPassword}
            autoComplete="current-password"
            visible={visibleFields.includes("current")}
            error={errors.current}
            onChange={(value) => {
              setCurrentPassword(value);
              setErrors((current) => ({ ...current, current: undefined }));
            }}
            onToggleVisibility={() => toggleVisibility("current")}
          />
          <PasswordFieldInput
            id="next"
            label="새 비밀번호"
            value={newPassword}
            autoComplete="new-password"
            visible={visibleFields.includes("next")}
            error={errors.next}
            onChange={(value) => {
              setNewPassword(value);
              setErrors((current) => ({ ...current, next: undefined }));
            }}
            onToggleVisibility={() => toggleVisibility("next")}
          />
          <PasswordFieldInput
            id="confirm"
            label="새 비밀번호 확인"
            value={passwordConfirm}
            autoComplete="new-password"
            visible={visibleFields.includes("confirm")}
            error={errors.confirm}
            onChange={(value) => {
              setPasswordConfirm(value);
              setErrors((current) => ({ ...current, confirm: undefined }));
            }}
            onToggleVisibility={() => toggleVisibility("confirm")}
          />
        </LuxuryReveal>

        {submitError ? (
          <p role="alert" className="mt-5 rounded-[14px] bg-[#fff1f1] px-4 py-3 text-[12px] leading-5 text-[#c72e2e]">
            {submitError}
          </p>
        ) : null}

        <LuxuryReveal className="mt-auto pt-10" delay={110}>
          <button
            type="submit"
            className="h-[52px] w-full rounded-[14px] bg-[#0e0e12] text-[14px] font-bold text-white transition-colors hover:bg-[#26262c]"
          >
            비밀번호 변경
          </button>
        </LuxuryReveal>
      </form>
      </div>
    </MobileScreenLayout>
  );
}
