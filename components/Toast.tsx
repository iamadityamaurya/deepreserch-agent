"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const toastStyles: Record<ToastType, { box: string; icon: ReactNode }> = {
  success: {
    box: "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100",
    icon: <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />,
  },
  error: {
    box: "border-red-200 bg-white text-red-800 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100",
    icon: <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />,
  },
  info: {
    box: "border-stone-200 bg-white text-stone-800 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100",
    icon: <Info className="h-4 w-4 text-teal-500 dark:text-teal-400" />,
  },
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur toast-entry ${toastStyles[toast.type].box}`}
          >
            {toastStyles[toast.type].icon}
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-1 cursor-pointer rounded p-0.5 hover:bg-stone-100 dark:hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}