"use client";

import Link from "next/link";
import { BrainCircuit, Moon, Sun, PanelLeft, ArrowLeft } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface AppHeaderProps {
  searchDepth: "standard" | "deep";
  setSearchDepth: (depth: "standard" | "deep") => void;
  isLoading: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function AppHeader({
  searchDepth,
  setSearchDepth,
  isLoading,
  sidebarOpen,
  onToggleSidebar,
}: AppHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const iconButton =
    "flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer";

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="flex h-14 w-full items-center gap-2 px-4">
        <div className="flex items-center gap-1.5">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              aria-label="Open research history sidebar"
              className={iconButton}
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}

          {/* Brand / back to landing */}
          {!sidebarOpen && (
            <Link href="/" className="group flex flex-shrink-0 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-teal-600 shadow-sm transition-colors group-hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-teal-400 dark:group-hover:border-teal-500/40">
                <BrainCircuit className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-stone-900 dark:text-zinc-100">
                DeepQuery
              </span>
            </Link>
          )}
        </div>

        {/* Session controls */}
        <div className="ml-auto flex items-center gap-1.5 text-xs sm:gap-2">
          <div className="hidden items-center rounded-lg border border-stone-200 bg-white p-0.5 md:flex dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setSearchDepth("standard")}
              disabled={isLoading}
              className={`cursor-pointer rounded-md px-3 py-1 font-medium transition-all disabled:cursor-not-allowed ${
                searchDepth === "standard"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setSearchDepth("deep")}
              disabled={isLoading}
              className={`cursor-pointer rounded-md px-3 py-1 font-medium transition-all disabled:cursor-not-allowed ${
                searchDepth === "deep"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Deep Dive
            </button>
          </div>

          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={iconButton}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            href="/"
            aria-label="Back to landing page"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}