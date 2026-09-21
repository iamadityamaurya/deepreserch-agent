"use client";

import {
  BrainCircuit,
  Calculator,
  FileCode2,
  Globe,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export default function Features() {
  const featuresList = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-purple-400" />,
      title: "Autonomous Graph Orchestration",
      description:
        "Built on LangGraph state machine. The agent dynamically decides which specialized tools to invoke based on question semantics.",
      accent: "from-purple-500/20 to-indigo-500/10 border-purple-500/30",
    },
    {
      icon: <RefreshCw className="w-6 h-6 text-sky-400" />,
      title: "Multi-Cycle Iterative Reflection",
      description:
        "Rather than a single prompt-response, the agent inspects intermediate findings, synthesizes notes, and runs follow-up tools if gaps exist.",
      accent: "from-sky-500/20 to-blue-500/10 border-sky-500/30",
    },
    {
      icon: <Calculator className="w-6 h-6 text-pink-400" />,
      title: "Zero-Hallucination AST Math Engine",
      description:
        "Passes mathematical expressions to a mathjs AST engine, guaranteeing exact precision for compound growth, ratios, and formulas.",
      accent: "from-pink-500/20 to-rose-500/10 border-pink-500/30",
    },
    {
      icon: <FileCode2 className="w-6 h-6 text-indigo-400" />,
      title: "ArXiv & GitHub Code Analysis",
      description:
        "Mines research papers directly from ArXiv preprints and fetches repository statistics, open issues, stars, and README details from GitHub.",
      accent: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30",
    },
    {
      icon: <Globe className="w-6 h-6 text-emerald-400" />,
      title: "Live Demographics & Financial Data",
      description:
        "Retrieves real-time capital, population, currency, and language data for any country alongside live cryptocurrency and stock quotes.",
      accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-cyan-400" />,
      title: "DNS Diagnostics & Web Scraping",
      description:
        "Performs real-time domain name resolution (A records, MX mail servers, TXT security records) and live HTML web scraping via Cheerio.",
      accent: "from-cyan-500/20 to-sky-500/10 border-cyan-500/30",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 relative border-t border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-purple-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Engineered for Uncompromising Empirical Rigor
          </h2>
          <p className="text-slate-400 text-base">
            DeepQuery combines state-graph autonomy, real-time API integrations, and mathematical calculation engines to deliver trusted answers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feature, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-gradient-to-b ${feature.accent} bg-slate-900/60 border backdrop-blur-md hover:scale-[1.02] transition-all duration-300 space-y-4 group`}
            >
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 w-fit group-hover:border-purple-500/50 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
