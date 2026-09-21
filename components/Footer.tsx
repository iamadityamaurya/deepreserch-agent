"use client";

import { BrainCircuit } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 py-8 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-300">DeepResearch Agent</span>
          <span>• Powered by LangGraph & Groq / Gemini</span>
        </div>
        <p>© {new Date().getFullYear()} Autonomous Multi-Source Agent.</p>
      </div>
    </footer>
  );
}
