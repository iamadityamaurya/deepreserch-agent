"use client";

import { useState } from "react";
import {
  Search,
  ArrowRight,
  Loader2,
  BookOpen,
  FileText,
  Code2,
  Share2,
  Globe,
  TrendingUp,
  ShieldCheck,
  Calculator,
  Sparkles,
} from "lucide-react";

interface HeroProps {
  onSearchSubmit: (query: string) => void;
  isLoading: boolean;
  topic: string;
  setTopic: (t: string) => void;
}

export default function Hero({ onSearchSubmit, isLoading, topic, setTopic }: HeroProps) {
  const samplePrompts = [
    { label: "ArXiv Quantum Transformers", query: "ArXiv papers on quantum transformer architectures and attention" },
    { label: "Canada vs Japan Demographics", query: "Compare population, capital, and languages of Canada vs Japan" },
    { label: "BTC Market Sentiment", query: "BTC and ETH price trends and cryptocurrency market sentiment" },
    { label: "LangGraph GitHub Repo", query: "Analyze github.com/langchain-ai/langgraphjs repository statistics" },
    { label: "Compound Growth Math AST", query: "Calculate compound growth for $10,000 at 8.5% annual return for 15 years" },
  ];

  const toolsList = [
    { icon: <BookOpen className="w-3.5 h-3.5 text-sky-400" />, label: "Wikipedia" },
    { icon: <FileText className="w-3.5 h-3.5 text-blue-400" />, label: "ArXiv Papers" },
    { icon: <Code2 className="w-3.5 h-3.5 text-purple-400" />, label: "GitHub Repos" },
    { icon: <Share2 className="w-3.5 h-3.5 text-orange-400" />, label: "Hacker News" },
    { icon: <Globe className="w-3.5 h-3.5 text-emerald-400" />, label: "Demographics" },
    { icon: <TrendingUp className="w-3.5 h-3.5 text-amber-400" />, label: "Markets" },
    { icon: <Calculator className="w-3.5 h-3.5 text-pink-400" />, label: "AST Math" },
    { icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />, label: "DNS" },
  ];

  const handleSubmit = (overrideQuery?: string) => {
    const q = overrideQuery || topic;
    if (!q.trim() || isLoading || q.length > 500) return;
    onSearchSubmit(q);
  };

  const isTooLong = topic.length > 500;
  const isTooShort = topic.length > 0 && topic.trim().length < 2;

  return (
    <section className="relative pt-16 pb-12 md:pt-20 md:pb-16 max-w-4xl mx-auto px-4 text-center space-y-8">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Badge & Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Autonomous LangGraph Agent</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          What do you want to research?
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-normal">
          Multi-source empirical research across academic preprints, code repositories, live web, and AST math.
        </p>
      </div>

      {/* Main Search Bar */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="relative flex items-center p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xl transition-all">
          <Search className="w-5 h-5 text-indigo-500 dark:text-indigo-400 ml-3.5 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ask any research question, query ArXiv, inspect repos, calculate formulas..."
            disabled={isLoading}
            maxLength={500}
            aria-describedby="topic-counter"
            className="w-full py-3 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-sm sm:text-base"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !topic.trim() || isTooLong}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <span>Research</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Input validation & character counter */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className={isTooLong || isTooShort ? "text-red-500 font-medium" : "text-slate-400 dark:text-slate-500"}>
            {isTooLong
              ? "Query must be under 500 characters"
              : isTooShort
              ? "Query must be at least 2 characters"
              : "\u00A0"}
          </span>
          <span id="topic-counter" className={`font-mono ${isTooLong ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}>
            {topic.length}/500
          </span>
        </div>

        {/* Preset Prompt Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTopic(p.query);
                handleSubmit(p.query);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-200 transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color-Coded Supported Sources Strip */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center justify-center gap-4 text-xs">
        <span className="font-medium text-slate-500">Integrated Sources:</span>
        {toolsList.map((t, idx) => (
          <div key={idx} className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-medium">
            {t.icon}
            <span>{t.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
