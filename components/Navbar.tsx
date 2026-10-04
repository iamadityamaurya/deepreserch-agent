"use client";

import Link from "next/link";
import { BrainCircuit, Moon, Sun, ArrowRight } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#tools", label: "Tools" },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-teal-600 shadow-sm transition-colors group-hover:border-teal-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-teal-400 dark:group-hover:border-teal-500/40">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-zinc-100">
            DeepQuery
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex dark:text-zinc-400">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-stone-900 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-200/60 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            Launch app
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}