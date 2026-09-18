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
  BookOpen,
  Code2,
  TrendingUp,
  Globe,
  Wrench,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Compass,
  Cpu,
  Database,
  Share2,
  Check,
  ArrowRight,
} from "lucide-react";

interface CalculationItem {
  expression: string;
  result: string;
}

interface CitationSource {
  title: string;
  url: string;
  snippet?: string;
  tool: string;
}

interface ToolResultItem {
  tool: string;
  input: string;
  result: string;
  reason?: string;
  sources?: CitationSource[];
  details?: any;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [searchDepth, setSearchDepth] = useState<"standard" | "deep">("standard");
  const [preferredModel, setPreferredModel] = useState<string>("openai/gpt-oss-120b");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentNode, setCurrentNode] = useState("");
  const [initialAnswer, setInitialAnswer] = useState("");
  const [isEnough, setIsEnough] = useState(false);
  const [planReasoning, setPlanReasoning] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [calculationsCount, setCalculationsCount] = useState(0);
  const [toolOutputsCount, setToolOutputsCount] = useState(0);
  const [iterationCount, setIterationCount] = useState(0);
  const [maxIterations, setMaxIterations] = useState(2);
  const [modelUsed, setModelUsed] = useState("");
  const [finalReport, setFinalReport] = useState("");
  const [calculations, setCalculations] = useState<CalculationItem[]>([]);
  const [toolOutputs, setToolOutputs] = useState<ToolResultItem[]>([]);
  const [sources, setSources] = useState<CitationSource[]>([]);
  const [activeModalTool, setActiveModalTool] = useState<ToolResultItem | null>(null);
  const [activeTab, setActiveTab] = useState<"report" | "tools" | "sources" | "synthesis">("report");
  const [copied, setCopied] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    { label: "ArXiv Quantum Transformers", query: "ArXiv papers on quantum transformer architectures and attention" },
    { label: "Canada vs Japan Demographics", query: "Compare population, capital, and languages of Canada vs Japan" },
    { label: "Bitcoin & Ethereum Markets", query: "BTC and ETH price trends and cryptocurrency market sentiment" },
    { label: "Analyze LangGraph.js Repo", query: "Analyze github.com/langchain-ai/langgraphjs repository statistics" },
    { label: "Compound Growth Math", query: "Calculate compound growth for $10,000 at 8.5% annual return for 15 years" },
    { label: "DNS Diagnostics (vercel.com)", query: "Inspect DNS and mail server records for vercel.com" },
  ];

  const handleStartResearch = async (searchTopic?: string) => {
    const query = searchTopic || topic;
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setTopic(query);
    setStatusMessage("Initializing LangGraph Multi-Tool Agent Workflow...");
    setCurrentNode("plan_research");
    setInitialAnswer("");
    setIsEnough(false);
    setPlanReasoning("");
    setNotes([]);
    setFinalReport("");
    setNotesCount(0);
    setCalculationsCount(0);
    setToolOutputsCount(0);
    setIterationCount(0);
    setModelUsed("");
    setCalculations([]);
    setToolOutputs([]);
    setSources([]);
    setActiveModalTool(null);
    setActiveTab("report");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: query,
          searchDepth,
          preferredModel,
        }),
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
                if (data.initialAnswer) setInitialAnswer(data.initialAnswer);
                if (data.isEnough !== undefined) setIsEnough(data.isEnough);
                if (data.planReasoning) setPlanReasoning(data.planReasoning);
                if (data.notes) setNotes(data.notes);
                if (data.modelUsed) setModelUsed(data.modelUsed);
                if (data.notesCount !== undefined) setNotesCount(data.notesCount);
                if (data.calculationsCount !== undefined) setCalculationsCount(data.calculationsCount);
                if (data.toolOutputsCount !== undefined) setToolOutputsCount(data.toolOutputsCount);
                if (data.iterationCount !== undefined) setIterationCount(data.iterationCount);
                if (data.maxIterations !== undefined) setMaxIterations(data.maxIterations);
                if (data.toolOutputs) setToolOutputs(data.toolOutputs);
                if (data.calculations) setCalculations(data.calculations);
                if (data.sources) setSources(data.sources);
                if (data.finalReport) setFinalReport(data.finalReport);
              } else if (data.type === "complete") {
                setStatusMessage("Multi-Tool Deep Research Completed!");
                if (data.finalReport) setFinalReport(data.finalReport);
                if (data.initialAnswer) setInitialAnswer(data.initialAnswer);
                if (data.isEnough !== undefined) setIsEnough(data.isEnough);
                if (data.modelUsed) setModelUsed(data.modelUsed);
                if (data.calculations) setCalculations(data.calculations);
                if (data.toolOutputs) setToolOutputs(data.toolOutputs);
                if (data.sources) setSources(data.sources);
                if (data.planReasoning) setPlanReasoning(data.planReasoning);
                if (data.notes) setNotes(data.notes);
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
    a.download = `Research_${topic.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const bundle = {
      topic,
      modelUsed,
      iterationCount,
      initialAnswer,
      planReasoning,
      calculations,
      toolOutputs,
      sources,
      synthesisNotes: notes,
      finalReport,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Research_Data_${topic.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getNodeClass = (nodeName: string) => {
    if (currentNode === nodeName && isLoading) {
      return "border-purple-500 bg-purple-950/50 text-purple-200 shadow-lg shadow-purple-500/20 animate-pulse";
    }
    if (finalReport || (iterationCount > 0 && currentNode !== nodeName)) {
      return "border-emerald-500/40 bg-emerald-950/20 text-emerald-300";
    }
    return "border-slate-800 bg-slate-900/50 text-slate-400";
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case "wikipedia":
        return <BookOpen className="w-4 h-4 text-sky-400" />;
      case "arxiv":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "github":
        return <Code2 className="w-4 h-4 text-purple-400" />;
      case "tech_discussions":
      case "reddit":
        return <Share2 className="w-4 h-4 text-orange-400" />;
      case "demographics":
      case "population":
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case "finance":
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case "dns_domain":
      case "domain":
        return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
      case "math":
        return <Calculator className="w-4 h-4 text-pink-400" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Radial Gradient Ambient Background */}
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
                DeepResearch Multi-Tool Agent
              </h1>
              <p className="text-xs text-slate-400">Autonomous LangGraph Orchestrator & Multi-Source Tool Suite</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {modelUsed && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-700 text-slate-300">
                <Cpu className="w-3.5 h-3.5 mr-1 text-purple-400" />
                {modelUsed}
              </span>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-950/60 border border-purple-500/30 text-purple-300">
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              LangGraph Engine v2.0
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
            <span>Autonomous Multi-Cycle Agent</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Empirical Intelligence, Academic Papers, Code & Data
          </h2>

          <div className="relative max-w-3xl mx-auto space-y-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartResearch()}
                placeholder="Ask any question, academic query, country, code repo, crypto, or formula..."
                disabled={isLoading}
                className="w-full pl-5 pr-40 py-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-100 placeholder-slate-500 shadow-xl transition-all outline-none text-base"
              />
              <button
                onClick={() => handleStartResearch()}
                disabled={isLoading || !topic.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Investigating...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Research</span>
                  </>
                )}
              </button>
            </div>

            {/* Config Controls (Model & Search Depth) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">Search Depth:</span>
                <button
                  type="button"
                  onClick={() => setSearchDepth("standard")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    searchDepth === "standard"
                      ? "bg-purple-950 text-purple-300 border border-purple-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  ⚡ Standard (2 Cycles)
                </button>
                <button
                  type="button"
                  onClick={() => setSearchDepth("deep")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    searchDepth === "deep"
                      ? "bg-purple-950 text-purple-300 border border-purple-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  🔬 Deep Dive (4 Cycles)
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">Model:</span>
                <select
                  value={preferredModel}
                  onChange={(e) => setPreferredModel(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-300 outline-none focus:border-purple-500 text-xs"
                >
                  <option value="openai/gpt-oss-120b">Groq GPT-OSS 120B (High Precision)</option>
                  <option value="openai/gpt-oss-20b">Groq GPT-OSS 20B (Fast)</option>
                  <option value="qwen/qwen3.8-27b">Groq Qwen 27B (Ultra Fast)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs text-slate-500">Quick explore:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopic(p.query);
                  handleStartResearch(p.query);
                }}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 transition-all cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Real-time Graph Pipeline Status */}
        {(isLoading || finalReport || iterationCount > 0) && (
          <section className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("plan_research")}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4" />
                    <span className="font-semibold text-xs uppercase tracking-wider">1. Plan Strategy</span>
                  </div>
                  {currentNode === "plan_research" && isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : iterationCount > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">Hypothesis formulation & tool queries</p>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("execute_tools")}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Wrench className="w-4 h-4" />
                    <span className="font-semibold text-xs uppercase tracking-wider">2. Execute Tools</span>
                  </div>
                  {currentNode === "execute_tools" && isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : toolOutputs.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : finalReport ? (
                    <span className="text-[10px] text-slate-500 font-mono">Skipped</span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">
                  {toolOutputs.length > 0 ? `${toolOutputs.length} tool source(s) executed` : "Direct AI knowledge (0 tools)"}
                </p>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("synthesize_notes")}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <BrainCircuit className="w-4 h-4" />
                    <span className="font-semibold text-xs uppercase tracking-wider">3. Synthesize</span>
                  </div>
                  {currentNode === "synthesize_notes" && isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : notes.length > 0 || finalReport ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">
                  {toolOutputs.length > 0
                    ? `Cycle ${iterationCount}/${maxIterations} completed`
                    : "Direct knowledge synthesis"}
                </p>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${getNodeClass("generate_report")}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-semibold text-xs uppercase tracking-wider">4. Response / Report</span>
                  </div>
                  {currentNode === "generate_report" && isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : finalReport ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : null}
                </div>
                <p className="text-xs text-slate-400">Clean Markdown formatting</p>
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-purple-500 animate-ping" : "bg-emerald-500"}`} />
                <span className="text-slate-300 font-mono">{statusMessage}</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-400">
                <span>Tools: <strong className="text-slate-200">{toolOutputs.length}</strong></span>
                <span>Calculations: <strong className="text-slate-200">{calculations.length}</strong></span>
                <span>Sources: <strong className="text-slate-200">{sources.length}</strong></span>
              </div>
            </div>
          </section>
        )}

        {/* Calculations Strip */}
        {calculations.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-pink-400">
              <Calculator className="w-4 h-4" />
              <span>Verified MathAST Evaluations:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {calculations.map((c, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">{c.expression}</span> ={" "}
                  <span className="text-pink-300 font-bold">{c.result}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Results Tabs & Panels */}
        {(finalReport || toolOutputs.length > 0 || sources.length > 0) && (
          <section className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab("report")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === "report"
                      ? "bg-purple-600/20 border border-purple-500/40 text-purple-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Research Report</span>
                </button>
                <button
                  onClick={() => setActiveTab("tools")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === "tools"
                      ? "bg-purple-600/20 border border-purple-500/40 text-purple-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Tool Findings ({toolOutputs.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("sources")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === "sources"
                      ? "bg-purple-600/20 border border-purple-500/40 text-purple-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Verified Sources ({sources.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab("synthesis")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === "synthesis"
                      ? "bg-purple-600/20 border border-purple-500/40 text-purple-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span>Agent Strategy & Notes</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  disabled={!finalReport}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy MD"}</span>
                </button>
                <button
                  onClick={downloadMarkdown}
                  disabled={!finalReport}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
                <button
                  onClick={downloadJSON}
                  disabled={!finalReport && toolOutputs.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* TAB 1: REPORT */}
            {activeTab === "report" && (
              <div
                ref={reportRef}
                className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-sm"
              >
                {finalReport ? (
                  <article className="prose prose-invert prose-purple max-w-none prose-headings:font-bold prose-h1:text-2xl sm:prose-h1:text-3xl prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-h2:mt-6 prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalReport}</ReactMarkdown>
                  </article>
                ) : (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
                    <p className="text-slate-300 font-medium">Agent is researching and compiling the definitive report...</p>
                    <p className="text-xs text-slate-500">Executing empirical tools and synthesizing cross-source evidence.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TOOL FINDINGS */}
            {activeTab === "tools" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {toolOutputs.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveModalTool(item)}
                    className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getToolIcon(item.tool)}
                        <span className="font-semibold text-xs uppercase tracking-wider text-slate-200">
                          {item.tool}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 font-mono line-clamp-1">Query: "{item.input}"</p>
                      {item.reason && <p className="text-xs text-slate-500 line-clamp-1">Purpose: {item.reason}</p>}
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-slate-300 max-h-32 overflow-hidden relative">
                      <pre className="whitespace-pre-wrap">{item.result}</pre>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: SOURCES & CITATIONS */}
            {activeTab === "sources" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.length > 0 ? (
                  sources.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all space-y-2 group block"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-mono">
                          {s.tool}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-sm text-slate-200 group-hover:text-purple-300 transition-colors line-clamp-1">
                        {s.title}
                      </h4>
                      {s.snippet && <p className="text-xs text-slate-400 line-clamp-2">{s.snippet}</p>}
                      <p className="text-[10px] text-slate-500 font-mono truncate">{s.url}</p>
                    </a>
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center text-slate-500 text-sm">
                    No citation links gathered yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: AGENT STRATEGY & NOTES */}
            {activeTab === "synthesis" && (
              <div className="space-y-4">
                {initialAnswer && (
                  <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center space-x-2">
                      <BrainCircuit className="w-4 h-4" />
                      <span>Initial Baseline Knowledge & Hypothesis</span>
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{initialAnswer}</p>
                  </div>
                )}

                {planReasoning && (
                  <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
                      <Compass className="w-4 h-4" />
                      <span>Strategic Tool Selection Rationale</span>
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{planReasoning}</p>
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Iterative Synthesis Notes ({notes.length})</span>
                    </h3>
                    <div className="space-y-3">
                      {notes.map((note, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Tool Output Modal */}
        {activeModalTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  {getToolIcon(activeModalTool.tool)}
                  <h3 className="font-bold text-base text-slate-100 uppercase tracking-wider">
                    {activeModalTool.tool} Execution Inspector
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalTool(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Input Query:</span>
                  <div className="mt-1 px-3 py-1.5 bg-slate-950 rounded-md font-mono text-purple-300 border border-slate-800">
                    {activeModalTool.input}
                  </div>
                </div>
                {activeModalTool.reason && (
                  <div>
                    <span className="text-slate-500 font-medium">Purpose:</span>
                    <p className="text-slate-300 mt-0.5">{activeModalTool.reason}</p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto rounded-xl bg-slate-950 p-4 border border-slate-800">
                <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeModalTool.result}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
