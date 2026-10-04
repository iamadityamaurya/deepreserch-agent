"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Cpu } from "lucide-react";

const MODELS = [
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B", hint: "Most capable" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B", hint: "Fastest" },
  { value: "qwen/qwen3.8-27b", label: "Qwen 27B", hint: "Balanced" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Google" },
];

interface ModelPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = MODELS.find((m) => m.value === value) ?? MODELS[0];

  // Close on outside click / Escape while open
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger chip */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Model: ${selected.label}`}
        className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Cpu className="h-3.5 w-3.5 flex-shrink-0 text-teal-600 dark:text-teal-400" />
        <span className="max-w-[160px] truncate">{selected.label}</span>
        <ChevronDown
          className={`h-3 w-3 flex-shrink-0 text-stone-400 transition-transform dark:text-zinc-500 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu (opens upward from the dock) */}
      {open && (
        <div
          role="listbox"
          aria-label="Choose a model"
          className="absolute bottom-full left-0 z-50 mb-2 w-64 origin-bottom-left overflow-hidden rounded-xl border border-stone-200 bg-white p-1 shadow-xl shadow-stone-300/40 animate-pop-in dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500">
            Model
          </p>
          {MODELS.map((model) => {
            const isSelected = model.value === selected.value;
            return (
              <button
                key={model.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(model.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  isSelected
                    ? "bg-teal-50 dark:bg-teal-500/10"
                    : "hover:bg-stone-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="min-w-0">
                  <span
                    className={`block truncate text-xs font-medium ${
                      isSelected
                        ? "text-teal-700 dark:text-teal-300"
                        : "text-stone-700 dark:text-zinc-200"
                    }`}
                  >
                    {model.label}
                  </span>
                  <span className="block text-[11px] text-stone-400 dark:text-zinc-500">
                    {model.hint}
                  </span>
                </span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-teal-600 dark:text-teal-400" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}