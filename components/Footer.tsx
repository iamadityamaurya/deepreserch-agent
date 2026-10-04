"use client";

import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200/70 bg-stone-50 py-10 dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-zinc-400">
          <BrainCircuit className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <span className="font-semibold text-stone-700 dark:text-zinc-200">DeepQuery</span>
          <span className="text-stone-300 dark:text-zinc-700">·</span>
          <span>Powered by LangGraph &amp; Groq / Gemini</span>
        </div>

        <nav className="flex items-center gap-5 text-xs font-medium text-stone-500 dark:text-zinc-400">
          <Link href="/#features" className="transition-colors hover:text-stone-900 dark:hover:text-zinc-100">
            Features
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-stone-900 dark:hover:text-zinc-100">
            How it works
          </Link>
          <Link href="/chat" className="transition-colors hover:text-teal-600 dark:hover:text-teal-400">
            Launch app
          </Link>
        </nav>

        <p className="text-xs text-stone-400 dark:text-zinc-500">
          © {new Date().getFullYear()} Autonomous Multi-Source Agent.
        </p>
      </div>
    </footer>
  );
}