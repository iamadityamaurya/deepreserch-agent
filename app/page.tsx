import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Calculator,
  Code2,
  FileText,
  Globe,
  Loader2,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import Architecture from "@/components/Architecture";
import ToolsGrid from "@/components/ToolsGrid";
import Footer from "@/components/Footer";

const sources = [
  { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Wikipedia" },
  { icon: <FileText className="h-3.5 w-3.5" />, label: "ArXiv" },
  { icon: <Code2 className="h-3.5 w-3.5" />, label: "GitHub" },
  { icon: <Share2 className="h-3.5 w-3.5" />, label: "Hacker News" },
  { icon: <Globe className="h-3.5 w-3.5" />, label: "Demographics" },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Markets" },
  { icon: <Calculator className="h-3.5 w-3.5" />, label: "AST Math" },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "DNS" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-teal-600 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_30%,black,transparent)]"
        />

        <div className="relative mx-auto max-w-5xl px-4 pt-20 text-center sm:px-6 md:pt-28">
          <div className="animate-rise-in mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-xs font-medium text-stone-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Autonomous research agent
            </span>
          </div>

          <h1 className="animate-rise-in text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-stone-900 sm:text-6xl dark:text-white">
            Ask anything.
            <br />
            Get answers with sources.
          </h1>
          <p className="animate-rise-in mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-stone-500 sm:text-lg dark:text-zinc-400">
            DeepQuery plans a research strategy, runs real tools across the web, papers, and code,
            then writes you a cited report — in a single chat.
          </p>

          <div className="animate-rise-in mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              Start researching
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              See how it works
            </a>
          </div>

          {/* Supported sources */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs">
            <span className="font-medium uppercase tracking-wider text-stone-400 dark:text-zinc-500">
              Integrated sources
            </span>
            {sources.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 font-medium text-stone-600 dark:text-zinc-300"
              >
                <span className="text-teal-600 dark:text-teal-400">{s.icon}</span>
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Product preview (decorative) ─────────────────────── */}
        <div className="animate-rise-in relative mx-auto mt-14 max-w-3xl px-4 pb-20 sm:px-6">
          <div
            aria-hidden
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-xl shadow-stone-300/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
          >
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-stone-100 px-4 py-3 dark:border-zinc-800">
              <span className="h-2.5 w-2.5 rounded-full bg-stone-200 dark:bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-stone-200 dark:bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-stone-200 dark:bg-zinc-700" />
              <span className="ml-3 text-xs text-stone-400 dark:text-zinc-500">
                deepquery — research session
              </span>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              {/* User turn */}
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-3xl rounded-br-md bg-teal-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                  How does linear attention compare to standard attention in 2025 models?
                </p>
              </div>

              {/* Agent trace */}
              <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600 dark:text-teal-400" />
                <span>Planning · Running 6 tools · Reading 14 sources</span>
              </div>

              {/* Answer */}
              <div className="space-y-2.5 text-sm leading-relaxed text-stone-600 dark:text-zinc-300">
                <p>
                  Linear attention reduces sequence complexity from O(n²) to O(n), and on
                  long-context benchmarks retrieval quality now lands within{" "}
                  <span className="font-medium text-stone-900 dark:text-white">2–4%</span> of full
                  attention. <sup className="font-medium text-teal-600 dark:text-teal-400">[1]</sup>
                </p>
                <p>
                  Trade-offs persist on exact-recall tasks, where hybrid architectures recover most
                  of the gap. <sup className="font-medium text-teal-600 dark:text-teal-400">[2]</sup>
                </p>
              </div>

              {/* Source chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {["arxiv.org", "github.com", "wikipedia.org"].map((host) => (
                  <span
                    key={host}
                    className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 font-mono text-[11px] text-stone-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                  >
                    {host}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Capabilities ─────────────────────────────────────── */}
      <Features />

      {/* ── Pipeline ─────────────────────────────────────────── */}
      <Architecture />

      {/* ── Tools ────────────────────────────────────────────── */}
      <ToolsGrid />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="border-t border-stone-200/70 py-20 dark:border-zinc-800/70">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-teal-600/20 bg-teal-50 p-10 text-center dark:border-teal-500/20 dark:bg-teal-500/10">
            <BrainCircuit className="mx-auto mb-4 h-8 w-8 text-teal-600 dark:text-teal-400" />
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
              Ready to run your first deep research?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-stone-600 dark:text-zinc-300">
              Pick a model, choose your depth, and watch the agent work — free, in your browser.
            </p>
            <Link
              href="/chat"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              Launch DeepQuery
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}