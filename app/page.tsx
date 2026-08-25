"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Search,
  BrainCircuit,
  FileText,
  CheckCircle2,
  Loader2,
  Copy,
  Download,
  Layers,
  Calculator,
} from "lucide-react";

interface CalculationItem {
  expression: string;
  result: string;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentNode, setCurrentNode] = useState("");
  const [notesCount, setNotesCount] = useState(0);
  const [calculationsCount, setCalculationsCount] = useState(0);
  const [iterationCount, setIterationCount] = useState(0);
  const [finalReport, setFinalReport] = useState("");
  const [calculations, setCalculations] = useState<CalculationItem[]>([]);
  const [copied, setCopied] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "Compound interest calculation on $10,000 at 8% annual yield over 5 years",
    "Battery capacity scaling from 250 Wh/kg to 500 Wh/kg percentage increase",
    "Calculate 15% annual growth rate over 4 years for a $5M AI startup",
  ];

  const handleStartResearch = async (searchTopic?: string) => {
    const query = searchTopic || topic;
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setTopic(query);
    setStatusMessage("Initializing LangGraph Agent Workflow...");
    setCurrentNode("plan_research");
    setFinalReport("");
    setNotesCount(0);
    setCalculationsCount(0);
    setIterationCount(0);
    setCalculations([]);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: query }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to agent stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "node_start") {
                setCurrentNode(data.node);
              } else if (data.type === "progress") {
                if (data.statusMessage) setStatusMessage(data.statusMessage);
                if (data.notesCount !== undefined) setNotesCount(data.notesCount);
                if (data.calculationsCount !== undefined) setCalculationsCount(data.calculationsCount);
                if (data.iterationCount !== undefined) setIterationCount(data.iterationCount);
                if (data.finalReport) setFinalReport(data.finalReport);
              } else if (data.type === "complete") {
                setStatusMessage("Analysis Completed!");
                if (data.finalReport) setFinalReport(data.finalReport);
                if (data.calculations) setCalculations(data.calculations);
              } else if (data.type === "error") {
                setStatusMessage(`Error: ${data.message}`);
              }
            } catch (err) {
              console.error("SSE parse error:", err);
            }
          }
        }
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Failed to execute research agent";
      setStatusMessage(`Error: ${errMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!finalReport) return;
    navigator.clipboard.writeText(finalReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!finalReport) return;
    const blob = new Blob([finalReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Analysis_${topic.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getNodeClass = (nodeName: string) => {
    if (currentNode === nodeName && isLoading) {
      return "border-purple-500 bg-purple-950/40 text-purple-200 shadow-lg shadow-purple-500/20 animate-pulse";
    }
    if (finalReport || (iterationCount > 0 && currentNode !== nodeName)) {
      return "border-emerald-500/40 bg-emerald-950/20 text-emerald-300";
    }
    return "border-gray-800 bg-gray-900/50 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Background Glow Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-xl shadow-lg shadow-purple-500/30">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-purple-300 bg-clip-text text-transparent">
                QuantAI Agent
              </h1>
              <p className="text-xs text-slate-400">LangGraph LLM + Math Calculation Tool</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-500/30 text-amber-300">
              <Calculator className="w-3.5 h-3.5 mr-1.5" />
              Math Tool Enabled
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
        {/* Search Input Section */}
        <section className="space-y-4 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Quantitative Reasoning Agent</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            What prompt or calculation analysis would you like to solve?
          </h2>

          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartResearch()}
                placeholder="e.g. Calculate 12% annual compounding on $25,000 for 7 years..."
                disabled={isLoading}
                className="w-full pl-5 pr-36 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-100 placeholder-slate-500 shadow-xl transition-all outline-none"
              />
              <button
                onClick={() => handleStartResearch()}
                disabled={isLoading || !topic.trim()}
                className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-slate-500">Try asking:</span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopic(prompt);
                  handleStartResearch(prompt);
                }}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        {/* Live Execution Pipeline */}
        {(isLoading || finalReport || statusMessage) && (
          <section className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  LangGraph Live Pipeline Status
                </h3>
                <p className="text-base font-medium text-slate-200 mt-1 flex items-center space-x-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{statusMessage || "Agent Ready"}</span>
                </p>
              </div>

              {/* Metrics Pills */}
              <div className="flex items-center space-x-3 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span>Math Tool Executions: {calculationsCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notes: {notesCount}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cycles: {iterationCount}/1</span>
                </div>
              </div>
            </div>

            {/* Nodes Workflow Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("plan_research")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Node 1</span>
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm">Plan Analysis</div>
                <div className="text-xs mt-1 opacity-80">LLM plans math calculation tasks</div>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("execute_tools")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Node 2</span>
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm">Execute Math Tool</div>
                <div className="text-xs mt-1 opacity-80">Evaluates math expressions safely</div>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("synthesize_notes")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Node 3</span>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm">Synthesize Notes</div>
                <div className="text-xs mt-1 opacity-80">LLM analyzes math outputs</div>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("generate_report")}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Node 4</span>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="font-bold text-sm">Generate Report</div>
                <div className="text-xs mt-1 opacity-80">Compiles final Markdown report</div>
              </div>
            </div>
          </section>
        )}

        {/* Final Report View */}
        {finalReport && (
          <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Quantitative Analysis Report</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Generated using LLM reasoning and Math Tool</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-2 transition-colors border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  onClick={downloadMarkdown}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center space-x-2 shadow-lg shadow-purple-600/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Markdown Body */}
            <div
              ref={reportRef}
              className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-purple-400 hover:prose-a:underline prose-li:text-slate-300 prose-code:text-purple-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalReport}</ReactMarkdown>
            </div>

            {/* Calculations Card */}
            {calculations.length > 0 && (
              <div className="border-t border-slate-800 pt-6 mt-8">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Math Tool Calculation Results ({calculations.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {calculations.map((calc, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <span className="text-xs font-mono text-slate-300">{calc.expression}</span>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/30">
                        = {calc.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
