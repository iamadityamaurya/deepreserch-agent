"use client";

import Link from "next/link";
import { BrainCircuit, Plus, Trash2, X, Clock } from "lucide-react";
import type { HistoryItem } from "@/lib/history";

interface HistorySidebarProps {
  items: HistoryItem[];
  activeTopic: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNewResearch: () => void;
}

export default function HistorySidebar({
  items,
  activeTopic,
  isOpen,
  onClose,
  onRestore,
  onDelete,
  onClearAll,
  onNewResearch,
}: HistorySidebarProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-stone-950/30 backdrop-blur-sm md:hidden dark:bg-zinc-950/60"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-stone-200/70 bg-white transition-all duration-200 dark:border-zinc-800/70 dark:bg-zinc-950 ${
          isOpen
            ? "translate-x-0 md:w-72"
            : "-translate-x-full md:translate-x-0 md:w-0 md:flex-shrink-0 md:overflow-hidden md:border-r-0"
        }`}
      >
        {/* Brand */}
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-stone-200/70 px-3 dark:border-zinc-800/70">
          <Link href="/" className="group flex items-center gap-2 px-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-teal-600 shadow-sm transition-colors group-hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-teal-400 dark:group-hover:border-teal-500/40">
              <BrainCircuit className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-stone-900 dark:text-zinc-100">
              DeepQuery
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="cursor-pointer rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New research */}
        <div className="flex-shrink-0 p-3">
          <button
            onClick={onNewResearch}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-teal-600/30 bg-teal-600/5 px-3 py-2.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-600/10 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20"
          >
            <Plus className="h-4 w-4" />
            New research
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto px-3 pb-2">
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-600">
            Recent
          </p>
          {items.length === 0 ? (
            <p className="px-1 text-xs leading-relaxed text-stone-400 dark:text-zinc-600">
              Completed research sessions will appear here.
            </p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = item.topic === activeTopic;
                return (
                  <div key={item.id} className="group relative">
                    <button
                      onClick={() => onRestore(item)}
                      className={`w-full cursor-pointer rounded-lg px-2.5 py-2 pr-8 text-left transition-colors ${
                        isActive
                          ? "bg-teal-50 dark:bg-teal-500/10"
                          : "hover:bg-stone-100 dark:hover:bg-zinc-800/70"
                      }`}
                    >
                      <span
                        className={`block truncate text-[13px] font-medium ${
                          isActive
                            ? "text-teal-700 dark:text-teal-300"
                            : "text-stone-700 dark:text-zinc-200"
                        }`}
                      >
                        {item.topic || "Untitled research"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-zinc-500">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(item.timestamp)}</span>
                        <span className="h-1 w-1 flex-shrink-0 rounded-full bg-stone-300 dark:bg-zinc-700" />
                        <span className="capitalize">{item.searchDepth}</span>
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      title="Delete from history"
                      aria-label={`Delete "${item.topic}"`}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-stone-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:text-zinc-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-stone-200/70 p-3 dark:border-zinc-800/70">
            <button
              onClick={onClearAll}
              className="w-full cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            >
              Clear all history
            </button>
          </div>
        )}
      </aside>
    </>
  );
}