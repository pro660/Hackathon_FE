"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isPending?: boolean;
  pendingLabel?: string;
  layout?: "inline" | "stacked";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "취소",
  isPending = false,
  pendingLabel = "처리 중...",
  layout = "inline",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    confirmButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onCancel, open]);

  if (!open) {
    return null;
  }

  const isStacked = layout === "stacked";

  const cancelButton = (
    <button
      type="button"
      disabled={isPending}
      className={
        isStacked
          ? "h-[43px] text-[13px] font-bold text-[#777780] disabled:opacity-45"
          : "h-[48px] rounded-[14px] border border-[#d8d8dc] bg-white text-[13px] font-bold text-[#55555d] disabled:opacity-45"
      }
      onClick={onCancel}
    >
      {cancelLabel}
    </button>
  );

  const confirmButton = (
    <button
      ref={confirmButtonRef}
      type="button"
      disabled={isPending}
      className={
        isStacked
          ? "h-[43px] rounded-[14px] bg-[#0e0e12] text-[15px] font-bold text-white disabled:opacity-55"
          : "h-[48px] rounded-[14px] bg-[#0e0e12] text-[13px] font-bold text-white disabled:opacity-55"
      }
      onClick={onConfirm}
    >
      {isPending ? pendingLabel : confirmLabel}
    </button>
  );

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] ${
        isStacked ? "px-9" : "px-6"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        className={`w-full rounded-[24px] bg-white shadow-[0_24px_70px_rgba(14,14,18,0.24)] ${
          isStacked ? "px-3 pt-7 pb-4 text-center" : "px-6 pt-7 pb-6"
        }`}
      >
        <p
          id={titleId}
          className={`${
            isStacked ? "text-[22px]" : "text-[20px]"
          } leading-[1.35] font-bold tracking-[-0.025em] text-[#15151a]`}
        >
          {title}
        </p>
        <p
          id={descriptionId}
          className="mt-2 text-[13px] leading-5 text-[#777780]"
        >
          {description}
        </p>
        <div
          className={isStacked ? "mt-12 flex flex-col gap-2" : "mt-7 grid grid-cols-2 gap-3"}
        >
          {isStacked ? (
            <>
              {confirmButton}
              {cancelButton}
            </>
          ) : (
            <>
              {cancelButton}
              {confirmButton}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
