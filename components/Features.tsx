"use client";

import {
  BrainCircuit,
  Calculator,
  FileCode2,
  Globe,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Features() {
  const featuresList = [
    {
      icon: <BrainCircuit className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      tint: "bg-teal-50 dark:bg-teal-500/10",
      title: "Autonomous Graph Orchestration",
      description:
        "Built on a LangGraph state machine. The agent dynamically decides which specialized tools to invoke based on question semantics.",
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      tint: "bg-teal-50 dark:bg-teal-500/10",
      title: "Multi-Cycle Iterative Reflection",
      description:
        "Rather than a single prompt-response, the agent inspects intermediate findings, synthesizes notes, and runs follow-up tools if gaps exist.",
    },
    {
      icon: <Calculator className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      tint: "bg-teal-50 dark:bg-teal-500/10",
      title: "Zero-Hallucination AST Math",
      description:
        "Passes mathematical expressions to a mathjs AST engine, guaranteeing exact precision for compound growth, ratios, and formulas.",
    },
    {
      icon: <FileCode2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      tint: "bg-teal-50 dark:bg-teal-500/10",
      title: "ArXiv & GitHub Code Analysis",
      description:
        "Mines research papers from ArXiv preprints and fetches repository statistics, open issues, stars, and README details from GitHub.",
    },
    {
      icon: <Globe className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      tint: "bg-teal-50 dark:bg-teal-500/10",
      title: "Live Demographics & Financial Data",
      description:
        "Retrieves real-time capital, population, currency, and language data for any country alongside live crypto and stock quotes.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      tint: "bg-teal-50 dark:bg-teal-500/10",
      title: "DNS Diagnostics & Web Scraping",
      description:
        "Performs real-time domain name resolution (A records, MX mail servers, TXT records) and live HTML scraping via Cheerio.",
    },
  ];

  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-stone-200/70 bg-white py-20 dark:border-zinc-800/70 dark:bg-zinc-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Zap className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            Core Capabilities
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-white">
            Engineered for uncompromising empirical rigor
          </h2>
          <p className="mt-4 text-pretty text-stone-500 dark:text-zinc-400">
            DeepQuery combines state-graph autonomy, real-time API integrations, and mathematical
            calculation engines to deliver trusted answers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((feature, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-stone-200 bg-stone-50/60 p-6 transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-teal-500/40 dark:hover:bg-zinc-900"
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${feature.tint}`}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-stone-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}