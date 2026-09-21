"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BrainCircuit,
  FileText,
  Loader2,
  Copy,
  Download,
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
  Database,
  Share2,
  Check,
  Calculator,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ToolsGrid from "@/components/ToolsGrid";
import Architecture from "@/components/Architecture";
import Footer from "@/components/Footer";

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

  const handleStartResearch = async (overrideTopic?: string) => {
    const query = overrideTopic || topic;
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setTopic(query);

    setStatusMessage("Initializing LangGraph Agent...");
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
                setStatusMessage("Research completed");
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
      const errMessage = err instanceof Error ? err.message : "Failed to execute agent";
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
      return "border-indigo-500 bg-indigo-950/40 text-indigo-200 shadow-sm animate-pulse";
    }
    if (finalReport || (iterationCount > 0 && currentNode !== nodeName)) {
      return "border-slate-800 bg-slate-900/80 text-slate-300";
    }
    return "border-slate-800/60 bg-slate-950 text-slate-500";
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case "wikipedia":
        return <BookOpen className="w-3.5 h-3.5 text-sky-400" />;
      case "arxiv":
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case "github":
        return <Code2 className="w-3.5 h-3.5 text-purple-400" />;
      case "tech_discussions":
      case "reddit":
        return <Share2 className="w-3.5 h-3.5 text-orange-400" />;
      case "demographics":
      case "population":
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case "finance":
        return <TrendingUp className="w-3.5 h-3.5 text-amber-400" />;
      case "dns_domain":
      case "domain":
        return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
      case "math":
        return <Calculator className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        modelUsed={modelUsed}
        searchDepth={searchDepth}
        setSearchDepth={setSearchDepth}
        preferredModel={preferredModel}
        setPreferredModel={setPreferredModel}
        isLoading={isLoading}
      />

      {/* Hero Search */}
      <Hero
        topic={topic}
        setTopic={setTopic}
        onSearchSubmit={(q) => handleStartResearch(q)}
        isLoading={isLoading}
      />

      {/* Active Research Workbench / Output Area */}
      {(isLoading || finalReport || toolOutputs.length > 0) && (
        <section className="py-8 max-w-4xl mx-auto px-4 space-y-6">
          {/* Status Pipeline Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-3 rounded-lg border transition-all ${getNodeClass("plan_research")}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-purple-300">1. Plan</span>
                {currentNode === "plan_research" && isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                ) : iterationCount > 0 ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 truncate">Deconstructing topic</p>
            </div>

            <div className={`p-3 rounded-lg border transition-all ${getNodeClass("execute_tools")}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sky-300">2. Tools ({toolOutputs.length})</span>
                {currentNode === "execute_tools" && isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                ) : toolOutputs.length > 0 ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 truncate">Executing APIs</p>
            </div>

            <div className={`p-3 rounded-lg border transition-all ${getNodeClass("synthesize_notes")}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-amber-300">3. Synthesize</span>
                {currentNode === "synthesize_notes" && isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                ) : notes.length > 0 || finalReport ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 truncate">Cross-referencing</p>
            </div>

            <div className={`p-3 rounded-lg border transition-all ${getNodeClass("generate_report")}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-emerald-300">4. Report</span>
                {currentNode === "generate_report" && isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                ) : finalReport ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : null}
              </div>
              <p className="text-[11px] text-slate-400 truncate">Formatting Markdown</p>
            </div>
          </div>

          {/* Status Message Line */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isLoading ? "bg-indigo-500 animate-ping" : "bg-emerald-400"}`} />
              <span className="font-mono text-slate-300">{statusMessage}</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-400 font-mono">
              <span>Tools: <strong className="text-sky-400">{toolOutputs.length}</strong></span>
              <span>Sources: <strong className="text-indigo-400">{sources.length}</strong></span>
            </div>
          </div>

          {/* AST Math Calculations Strip */}
          {calculations.length > 0 && (
            <div className="p-3 rounded-lg bg-pink-950/20 border border-pink-500/30 space-y-1.5 text-xs">
              <span className="text-pink-300 font-medium">AST Math Calculations:</span>
              <div className="flex flex-wrap gap-2">
                {calculations.map((c, i) => (
                  <div key={i} className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono">
                    <span className="text-slate-400">{c.expression}</span> ={" "}
                    <span className="text-pink-300 font-semibold">{c.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Tab Navigation & Reader Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5 text-xs">
                <button
                  onClick={() => setActiveTab("report")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === "report"
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Report
                </button>
                <button
                  onClick={() => setActiveTab("tools")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === "tools"
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tool Findings ({toolOutputs.length})
                </button>
                <button
                  onClick={() => setActiveTab("sources")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === "sources"
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sources ({sources.length})
                </button>
                <button
                  onClick={() => setActiveTab("synthesis")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === "synthesis"
                      ? "bg-indigo-600 text-white shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Agent Strategy
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  disabled={!finalReport}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={downloadMarkdown}
                  disabled={!finalReport}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>.md</span>
                </button>
                <button
                  onClick={downloadJSON}
                  disabled={!finalReport && toolOutputs.length === 0}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-amber-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* TAB 1: REPORT READER VIEW */}
            {activeTab === "report" && (
              <div
                ref={reportRef}
                className="p-6 sm:p-8 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-lg"
              >
                {finalReport ? (
                  <article className="prose prose-invert max-w-none prose-indigo prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-1.5 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalReport}</ReactMarkdown>
                  </article>
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                    <p className="text-slate-300 text-sm font-medium">Synthesizing research report...</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TOOL FINDINGS */}
            {activeTab === "tools" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {toolOutputs.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveModalTool(item)}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getToolIcon(item.tool)}
                        <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                          {item.tool}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">"{item.input}"</p>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-24 overflow-hidden relative">
                      <pre className="whitespace-pre-wrap">{item.result}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: SOURCES */}
            {activeTab === "sources" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sources.length > 0 ? (
                  sources.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-1.5 group block text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px]">
                          {s.tool}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-slate-200 group-hover:text-indigo-200 transition-colors truncate">
                        {s.title}
                      </h4>
                      {s.snippet && <p className="text-slate-400 line-clamp-2">{s.snippet}</p>}
                    </a>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-500 text-xs">
                    No citation links gathered yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STRATEGY & NOTES */}
            {activeTab === "synthesis" && (
              <div className="space-y-3 text-xs">
                {initialAnswer && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h3 className="font-semibold text-purple-300 uppercase tracking-wider text-[11px]">
                      Initial Baseline & Knowledge
                    </h3>
                    <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{initialAnswer}</p>
                  </div>
                )}

                {planReasoning && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <h3 className="font-semibold text-indigo-300 uppercase tracking-wider text-[11px]">
                      Tool Selection Strategy
                    </h3>
                    <p className="text-slate-400 leading-relaxed">{planReasoning}</p>
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h3 className="font-semibold text-emerald-300 uppercase tracking-wider text-[11px]">
                      Synthesis Notes ({notes.length})
                    </h3>
                    <div className="space-y-2">
                      {notes.map((note, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tool Output Inspector Modal */}
      {activeModalTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 shadow-2xl relative max-h-[80vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                {getToolIcon(activeModalTool.tool)}
                <h3 className="font-semibold text-slate-200 uppercase tracking-wider">
                  {activeModalTool.tool} Execution Inspector
                </h3>
              </div>
              <button
                onClick={() => setActiveModalTool(null)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Input Query:</span>
              <div className="mt-1 p-2 bg-slate-950 rounded font-mono text-indigo-300 border border-slate-800">
                {activeModalTool.input}
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded bg-slate-950 p-3 border border-slate-800">
              <pre className="font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {activeModalTool.result}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Integrated Tools Catalog */}
      <ToolsGrid
        onSelectToolSample={(sampleQuery) => {
          setTopic(sampleQuery);
          handleStartResearch(sampleQuery);
        }}
      />

      {/* Subtle Graph Architecture Summary */}
      <Architecture />

      {/* Minimal Footer */}
      <Footer />
    </div>
  );
}
