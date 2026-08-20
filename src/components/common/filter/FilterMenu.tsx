"use client";

import { AnimatePresence, motion } from "motion/react";

type FilterMenuProps = {
  label: string;
  buttonLabel?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  align?: "left" | "right";
  open: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
};

export function FilterMenu({
  label,
  buttonLabel,
  value,
  options,
  align = "left",
  open,
  onToggle,
  onChange,
}: FilterMenuProps) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? label;

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={onToggle}
        className="flex h-8 w-full min-w-0 items-center justify-center rounded-full border border-[#ded9d1] bg-[#f4f1ec] px-2 text-[10px] text-[#4b4741] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#15151a]"
      >
        <span className="truncate">{buttonLabel ?? selectedLabel}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label={`${label} 선택`}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-10 z-[9999] max-h-64 min-w-[148px] overflow-y-auto rounded-[15px] border border-[#ded9d1] bg-white p-1.5 shadow-[0_16px_38px_rgba(21,21,26,0.2)] ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={value === option.value}
                onClick={() => onChange(option.value)}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.18,
                  delay: Math.min(index * 0.025, 0.15),
                }}
                className={`flex h-9 w-full items-center rounded-[10px] px-3 text-left text-[12px] ${
                  value === option.value
                    ? "bg-[#f0ece5] font-bold text-[#15151a]"
                    : "text-[#5f5c57] hover:bg-[#f7f5f1]"
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
