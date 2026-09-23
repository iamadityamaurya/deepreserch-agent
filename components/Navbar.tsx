"use client";

import { BrainCircuit, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  modelUsed?: string;
  searchDepth: "standard" | "deep";
  setSearchDepth: (depth: "standard" | "deep") => void;
  preferredModel: string;
  setPreferredModel: (model: string) => void;
  isLoading: boolean;
}

export default function Navbar({
  modelUsed,
  searchDepth,
  setSearchDepth,
  preferredModel,
  setPreferredModel,
  isLoading,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/30 rounded-xl text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-base tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
            DeepQuery
          </span>
        </div>

        {/* Right Configuration Controls */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {/* Search Depth Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setSearchDepth("standard")}
              disabled={isLoading}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                searchDepth === "standard"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setSearchDepth("deep")}
              disabled={isLoading}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                searchDepth === "deep"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Deep Dive
            </button>
          </div>

          {/* Model Selector */}
          <div className="relative">
            <select
              value={preferredModel}
              onChange={(e) => setPreferredModel(e.target.value)}
              disabled={isLoading}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 outline-none focus:border-indigo-500/50 text-xs font-medium cursor-pointer transition-colors"
            >
              <option value="openai/gpt-oss-120b">GPT-OSS 120B</option>
              <option value="openai/gpt-oss-20b">GPT-OSS 20B</option>
              <option value="qwen/qwen3.8-27b">Qwen 27B</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
