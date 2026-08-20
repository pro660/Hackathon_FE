"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PiCheckCircleFill } from "react-icons/pi";

export type StatusToastMessage = {
  id: number;
  message: string;
};

export function StatusToast({
  toast,
  onDismiss,
}: {
  toast: StatusToastMessage | null;
  onDismiss: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(onDismiss, 2_400);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast]);

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          role="status"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute right-6 bottom-[102px] left-6 z-50 flex min-h-[48px] items-center justify-center gap-2 rounded-[15px] bg-[#15151a] px-4 text-center text-[12px] font-bold text-white shadow-[0_14px_36px_rgba(21,21,26,0.24)]"
        >
          <PiCheckCircleFill aria-hidden="true" className="size-[18px] shrink-0 text-[#d9c7a8]" />
          <span>{toast.message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
