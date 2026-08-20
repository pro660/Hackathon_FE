"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  label?: string;
  variant?: "default" | "plain";
};

export function BackButton({
  label = "이전 화면으로 이동",
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleBack}
      className="group flex size-9 items-center justify-start bg-transparent text-[#121217] transition-colors hover:text-[#8b7355] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15151a]"
    >
      <span
        aria-hidden="true"
        className="-mt-px pb-1.5 text-[26px] leading-none"
      >
        ‹
      </span>
    </button>
  );
}
