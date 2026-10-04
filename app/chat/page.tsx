"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  ChevronDown,
  Check,
  Database,
  Share2,
  ShieldCheck,
  Calculator,
  Printer,
  RefreshCw,
  Square,
  Sparkles,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import HistorySidebar from "@/components/HistorySidebar";
import ModelPicker from "@/components/ModelPicker";
import { useToast } from "@/components/Toast";
import {
  saveToHistory,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  HistoryItem,
} from "@/lib/history";

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
  details?: unknown;
}

const STEP_ORDER = ["plan_research", "execute_tools", "synthesize_notes", "generate_report"];

const STEP_META: Record<string, { label: string; detail: string }> = {
  plan_research: { label: "Planning approach", detail: "Deconstructing your question" },
  execute_tools: { label: "Running tools", detail: "Querying external sources" },
  synthesize_notes: { label: "Synthesizing findings", detail: "Cross-referencing results" },
  generate_report: { label: "Writing report", detail: "Formatting with citations" },
};

const samplePrompts = [
  "ArXiv papers on quantum transformer architectures and attention",
  "Compare population, capital, and languages of Canada vs Japan",
  "BTC and ETH price trends and cryptocurrency market sentiment",
  "Analyze github.com/langchain-ai/langgraphjs repository statistics",
  "Calculate compound growth for $10,000 at 8.5% annual return for 15 years",
];

function ChatExperience() {
  const [input, setInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searchDepth, setSearchDepth] = useState<"standard" | "deep">("standard");
  const [preferredModel, setPreferredModel] = useState<string>("openai/gpt-oss-120b");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentNode, setCurrentNode] = useState("");
  const [initialAnswer, setInitialAnswer] = useState("");
  const [planReasoning, setPlanReasoning] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [iterationCount, setIterationCount] = useState(0);
  const [modelUsed, setModelUsed] = useState("");
  const [finalReport, setFinalReport] = useState("");
  const [calculations, setCalculations] = useState<CalculationItem[]>([]);
  const [toolOutputs, setToolOutputs] = useState<ToolResultItem[]>([]);
  const [sources, setSources] = useState<CitationSource[]>([]);
  const [activeModalTool, setActiveModalTool] = useState<ToolResultItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const { showToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const autoStartedRef = useRef(false);

  const hasConversation = Boolean(activeQuery) || isLoading;

  const resetConversation = () => {
    setActiveQuery("");
    setInput("");
    setStatusMessage("");
    setCurrentNode("");
    setInitialAnswer("");
    setPlanReasoning("");
    setNotes([]);
    setFinalReport("");
    setIterationCount(0);
    setModelUsed("");
    setCalculations([]);
    setToolOutputs([]);
    setSources([]);
    setActiveModalTool(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      try {
        localStorage.setItem("sidebar-open", String(!prev));
      } catch {}
      return !prev;
    });
  };

  // Load sidebar preference + history after mount (deferred so it runs post-hydration)
  useEffect(() => {
    const timer = setTimeout(() => {
      setHistoryItems(getHistory());
      try {
        if (localStorage.getItem("sidebar-open") === "true") setSidebarOpen(true);
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleStartResearch = async (query: string) => {
    const q = query.trim();
    if (!q || isLoading || q.length > 500) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    resetConversation();
    setActiveQuery(q);
    setStatusMessage("Initializing LangGraph Agent...");
    setCurrentNode("plan_research");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: q,
          searchDepth,
          preferredModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errorData.message || "Too many requests. Please try again in a minute.");
        }
        throw new Error(errorData.error || "Failed to connect to agent stream");
      }

      if (!response.body) {
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
                if (data.planReasoning) setPlanReasoning(data.planReasoning);
                if (data.notes) setNotes(data.notes);
                if (data.modelUsed) setModelUsed(data.modelUsed);
                if (data.iterationCount !== undefined) setIterationCount(data.iterationCount);
                if (data.toolOutputs) setToolOutputs(data.toolOutputs);
                if (data.calculations) setCalculations(data.calculations);
                if (data.sources) setSources(data.sources);
                if (data.finalReport) setFinalReport(data.finalReport);
              } else if (data.type === "complete") {
                setStatusMessage("Research completed");
                if (data.finalReport) setFinalReport(data.finalReport);
                if (data.initialAnswer) setInitialAnswer(data.initialAnswer);
                if (data.modelUsed) setModelUsed(data.modelUsed);
                if (data.calculations) setCalculations(data.calculations);
                if (data.toolOutputs) setToolOutputs(data.toolOutputs);
                if (data.sources) setSources(data.sources);
                if (data.planReasoning) setPlanReasoning(data.planReasoning);
                if (data.notes) setNotes(data.notes);

                // Persist completed research to localStorage history
                saveToHistory({
                  topic: q,
                  finalReport: data.finalReport || "",
                  sources: data.sources || [],
                  toolOutputs: data.toolOutputs || [],
                  calculations: data.calculations || [],
                  modelUsed: data.modelUsed || preferredModel,
                  searchDepth,
                  planReasoning: data.planReasoning || "",
                  initialAnswer: data.initialAnswer || "",
                  notes: data.notes || [],
                });
                setHistoryItems(getHistory());
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
      if (err instanceof Error && err.name === "AbortError") {
        setStatusMessage("Research stopped by user.");
      } else {
        const errMessage = err instanceof Error ? err.message : "Failed to execute agent";
        setStatusMessage(`Error: ${errMessage}`);
        showToast(errMessage, "error");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Auto-start when arriving with ?q=... (e.g. from a tool card on the landing page).
  // Deferred to a macrotask so state updates don't run synchronously inside the effect.
  useEffect(() => {
    if (autoStartedRef.current) return;
    const q = searchParams.get("q");
    if (!q) return;
    autoStartedRef.current = true;
    const timer = setTimeout(() => handleStartResearch(q), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleStopResearch = () => {
    abortControllerRef.current?.abort();
  };

  const copyToClipboard = () => {
    if (!finalReport) return;
    navigator.clipboard.writeText(finalReport);
    setCopied(true);
    showToast("Report copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHTML = () => {
    if (!finalReport) return;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DeepQuery Research Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1c1917; }
    h1, h2, h3 { color: #0f172a; }
    a { color: #0f766e; }
    pre { background: #f5f5f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #e7e5e4; margin: 0; padding-left: 16px; color: #57534e; }
  </style>
</head>
<body>
  <h1>Research Report</h1>
  <p><strong>Topic:</strong> ${activeQuery}</p>
  ${finalReport}
  ${sources.length > 0 ? `<h2>Sources</h2><ul>${sources.map((s) => `<li><a href="${s.url}">${s.title}</a></li>`).join("")}</ul>` : ""}
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Research_${activeQuery.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("HTML report downloaded", "success");
  };

  const printReport = () => {
    if (!finalReport || !reportRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DeepQuery Research Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1c1917; }
            h1, h2, h3 { color: #0f172a; }
            a { color: #0f766e; }
            pre { background: #f5f5f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
          </style>
        </head>
        <body>${reportRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const downloadMarkdown = () => {
    if (!finalReport) return;
    const blob = new Blob([finalReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Research_${activeQuery.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Markdown report downloaded", "success");
  };

  const downloadJSON = () => {
    const bundle = {
      topic: activeQuery,
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
    a.download = `Research_Data_${activeQuery.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Research data downloaded as JSON", "success");
  };

  const handleRetry = () => {
    handleStartResearch(activeQuery);
  };

  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case "wikipedia":
        return <BookOpen className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />;
      case "arxiv":
        return <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
      case "github":
        return <Code2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
      case "tech_discussions":
      case "reddit":
        return <Share2 className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />;
      case "demographics":
      case "population":
        return <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "finance":
        return <TrendingUp className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case "dns_domain":
      case "domain":
        return <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />;
      case "math":
        return <Calculator className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />;
      default:
        return <Wrench className="h-3.5 w-3.5 text-stone-500 dark:text-zinc-400" />;
    }
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setActiveQuery(item.topic);
    setFinalReport(item.finalReport);
    setSources(item.sources);
    setToolOutputs(item.toolOutputs);
    setCalculations(item.calculations);
    setModelUsed(item.modelUsed);
    setSearchDepth(item.searchDepth);
    setPlanReasoning(item.planReasoning);
    setInitialAnswer(item.initialAnswer);
    setNotes(item.notes);
    setStatusMessage("Restored from history");
    setIsLoading(false);
    setSidebarOpen(false);
    showToast("Research restored from history", "success");
  };

  const handleDeleteHistoryItem = (id: string) => {
    deleteHistoryItem(id);
    setHistoryItems(getHistory());
  };

  const handleClearAllHistory = () => {
    clearHistory();
    setHistoryItems([]);
    showToast("History cleared", "success");
  };

  const handleNewResearch = () => {
    abortControllerRef.current?.abort();
    resetConversation();
    setSidebarOpen(false);
    showToast("Ready for a new research session", "info");
  };

  const currentIndex = STEP_ORDER.indexOf(currentNode);
  const getStepState = (key: string): "done" | "active" | "pending" => {
    if (finalReport) return "done";
    const idx = STEP_ORDER.indexOf(key);
    if (isLoading && key === currentNode) return "active";
    if (idx <= currentIndex) return "done";
    return "pending";
  };

  const isInvalid = input.length > 500 || (input.length > 0 && input.trim().length < 2);

  const submit = () => handleStartResearch(input);

  const actionButton =
    "flex cursor-pointer items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white";

  const detailsShell =
    "group rounded-2xl border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60";

  const toolResultCard =
    "cursor-pointer space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 transition-all hover:border-teal-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-teal-500/40";

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-teal-600 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
      {/* Persistent left sidebar (ChatGPT-style) */}
      <HistorySidebar
        items={historyItems}
        activeTopic={activeQuery}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onRestore={restoreHistoryItem}
        onDelete={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
        onNewResearch={handleNewResearch}
      />

      <div
        className={`flex min-h-screen flex-col transition-[margin] duration-200 ${
          sidebarOpen ? "md:ml-72" : "md:ml-0"
        }`}
      >
      <AppHeader
        searchDepth={searchDepth}
        setSearchDepth={setSearchDepth}
        isLoading={isLoading}
        onToggleSidebar={toggleSidebar}
      />

      {/* ── Empty state ─────────────────────────────────────── */}
      {!hasConversation && (
        <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
          <div
            aria-hidden
            className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_55%_45%_at_50%_40%,black,transparent)]"
          />
          <div className="relative flex w-full max-w-2xl flex-col items-center text-center">
            <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white text-teal-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-teal-400">
              <BrainCircuit className="h-7 w-7" />
            </span>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-white">
              What should we research?
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
              The agent will plan a strategy, run real tools, and write a cited report.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleStartResearch(p)}
                  className="cursor-pointer rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs text-stone-600 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-500/40 dark:hover:bg-teal-500/10 dark:hover:text-teal-300"
                >
                  {p}
                </button>
              ))}
            </div>

            <p className="mt-10 text-xs text-stone-400 dark:text-zinc-600">
              New here?{" "}
              <Link href="/" className="font-medium text-teal-600 hover:underline dark:text-teal-400">
                Learn how DeepQuery works
              </Link>
            </p>
          </div>
        </main>
      )}

      {/* ── Conversation ────────────────────────────────────── */}
      {hasConversation && (
        <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-8">
          {/* User turn */}
          <div className="flex justify-end">
            <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md bg-teal-600 px-5 py-3 text-sm leading-relaxed text-white shadow-sm">
              {activeQuery}
            </div>
          </div>

          {/* Agent activity */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-teal-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-teal-400">
                  <BrainCircuit className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                  {isLoading ? "Researching…" : finalReport ? "Research complete" : "Research stopped"}
                </span>
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-teal-600 dark:text-teal-400" />
              ) : (
                finalReport && <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              )}
            </div>

            <ol className="space-y-2.5">
              {STEP_ORDER.map((key) => {
                const state = getStepState(key);
                const meta = STEP_META[key];
                return (
                  <li key={key} className="flex items-center gap-2.5 text-sm">
                    {state === "active" ? (
                      <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-teal-600 dark:text-teal-400" />
                    ) : state === "done" ? (
                      <Check className="h-4 w-4 flex-shrink-0 text-teal-600 dark:text-teal-400" />
                    ) : (
                      <span className="h-4 w-4 flex-shrink-0 rounded-full border border-dashed border-stone-300 dark:border-zinc-700" />
                    )}
                    <span
                      className={
                        state === "pending"
                          ? "text-stone-400 dark:text-zinc-600"
                          : "font-medium text-stone-700 dark:text-zinc-200"
                      }
                    >
                      {meta.label}
                    </span>
                    <span className="truncate text-xs text-stone-400 dark:text-zinc-500">
                      {key === "execute_tools" && toolOutputs.length > 0
                        ? `${toolOutputs.length} tool result${toolOutputs.length === 1 ? "" : "s"}`
                        : meta.detail}
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* Status line */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <div className="flex min-w-0 items-center gap-2 text-xs">
                <span
                  className={`h-2 w-2 flex-shrink-0 rounded-full ${
                    isLoading
                      ? "animate-ping bg-teal-500"
                      : statusMessage.startsWith("Error") || statusMessage.startsWith("Research stopped")
                      ? "bg-amber-500"
                      : "bg-stone-300 dark:bg-zinc-700"
                  }`}
                />
                <span className="truncate font-mono text-stone-500 dark:text-zinc-400">
                  {statusMessage}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <button
                    onClick={handleStopResearch}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
                  >
                    <Square className="h-3 w-3" />
                    Stop
                  </button>
                )}
                {!isLoading &&
                  (statusMessage.startsWith("Error") || statusMessage.startsWith("Research stopped")) && (
                    <button
                      onClick={handleRetry}
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* AST math strip */}
          {calculations.length > 0 && (
            <div className="space-y-1.5 rounded-2xl border border-teal-600/20 bg-teal-50/60 p-3.5 text-xs dark:border-teal-500/25 dark:bg-teal-500/10">
              <span className="font-medium text-teal-700 dark:text-teal-300">
                Computed with the AST math engine
              </span>
              <div className="flex flex-wrap gap-2">
                {calculations.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-teal-600/20 bg-white px-2.5 py-1 font-mono dark:border-teal-500/25 dark:bg-zinc-950"
                  >
                    <span className="text-stone-500 dark:text-zinc-400">{c.expression}</span> ={" "}
                    <span className="font-semibold text-teal-700 dark:text-teal-300">{c.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assistant turn */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-teal-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-teal-400">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                DeepQuery
              </span>
              {modelUsed && (
                <span className="rounded-full border border-stone-200 bg-white px-2 py-0.5 font-mono text-[10px] text-stone-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  {modelUsed}
                </span>
              )}
            </div>

            {finalReport ? (
              <div
                ref={reportRef}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <article className="prose prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg prose-h2:border-b prose-h2:border-stone-200 prose-h2:pb-1.5 prose-a:text-teal-700 hover:prose-a:text-teal-600 prose-pre:bg-stone-100 prose-pre:border prose-pre:border-stone-200 max-w-none text-sm leading-relaxed dark:prose-invert dark:prose-h2:border-zinc-800 dark:prose-a:text-teal-400 dark:hover:prose-a:text-teal-300 dark:prose-pre:bg-zinc-950 dark:prose-pre:border-zinc-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalReport}</ReactMarkdown>
                </article>
              </div>
            ) : isLoading ? (
              <div className="space-y-2.5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                {[90, 75, 85, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 animate-pulse rounded bg-stone-100 dark:bg-zinc-800"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 p-5 text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
                No report was generated. Try running the research again.
              </div>
            )}

            {/* Actions */}
            {finalReport && (
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={copyToClipboard} className={actionButton}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={downloadMarkdown} className={actionButton}>
                  <Download className="h-3.5 w-3.5" />
                  .md
                </button>
                <button
                  onClick={downloadJSON}
                  disabled={toolOutputs.length === 0 && !finalReport}
                  className={actionButton}
                >
                  <Database className="h-3.5 w-3.5" />
                  JSON
                </button>
                <button onClick={downloadHTML} className={actionButton}>
                  <Download className="h-3.5 w-3.5" />
                  HTML
                </button>
                <button onClick={printReport} className={actionButton}>
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
              </div>
            )}

            {/* Collapsible evidence sections */}
            {finalReport && (
              <div className="space-y-2.5">
                {/* Sources */}
                <details className={detailsShell}>
                  <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-medium text-stone-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                    <span>
                      Sources{" "}
                      <span className="font-normal text-stone-400 dark:text-zinc-500">
                        ({sources.length})
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-stone-400 transition-transform group-open:rotate-180 dark:text-zinc-500" />
                  </summary>
                  <div className="border-t border-stone-100 p-4 dark:border-zinc-800">
                    {sources.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block space-y-1.5 rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 text-xs transition-all hover:border-teal-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-teal-500/40"
                          >
                            <div className="flex items-center justify-between">
                              <span className="rounded-full bg-teal-50 px-2 py-0.5 font-mono text-[10px] text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                                {s.tool}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 text-stone-400 transition-colors group-hover:text-teal-600 dark:text-zinc-500 dark:group-hover:text-teal-400" />
                            </div>
                            <h4 className="truncate font-semibold text-stone-800 transition-colors group-hover:text-teal-700 dark:text-zinc-200 dark:group-hover:text-teal-300">
                              {s.title}
                            </h4>
                            {s.snippet && (
                              <p className="line-clamp-2 text-stone-500 dark:text-zinc-400">
                                {s.snippet}
                              </p>
                            )}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-xs text-stone-400 dark:text-zinc-500">
                        No citation links were gathered.
                      </p>
                    )}
                  </div>
                </details>

                {/* Tool findings */}
                {toolOutputs.length > 0 && (
                  <details className={detailsShell}>
                    <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-medium text-stone-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                      <span>
                        Tool findings{" "}
                        <span className="font-normal text-stone-400 dark:text-zinc-500">
                          ({toolOutputs.length})
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-stone-400 transition-transform group-open:rotate-180 dark:text-zinc-500" />
                    </summary>
                    <div className="border-t border-stone-100 p-4 dark:border-zinc-800">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {toolOutputs.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => setActiveModalTool(item)}
                            className={`group ${toolResultCard}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getToolIcon(item.tool)}
                                <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-zinc-200">
                                  {item.tool}
                                </span>
                              </div>
                              <ChevronDown className="h-4 w-4 -rotate-90 text-stone-400 transition-colors group-hover:text-teal-600 dark:text-zinc-500 dark:group-hover:text-teal-400" />
                            </div>
                            <p className="truncate font-mono text-xs text-stone-500 dark:text-zinc-400">
                              &ldquo;{item.input}&rdquo;
                            </p>
                            <div className="relative max-h-20 overflow-hidden rounded-lg border border-stone-200 bg-white p-2.5 font-mono text-[11px] text-stone-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                              <pre className="whitespace-pre-wrap">{item.result}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {/* Strategy */}
                {(initialAnswer || planReasoning || notes.length > 0) && (
                  <details className={detailsShell}>
                    <summary className="flex cursor-pointer select-none items-center justify-between p-4 text-sm font-medium text-stone-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                      <span>Agent strategy</span>
                      <ChevronDown className="h-4 w-4 text-stone-400 transition-transform group-open:rotate-180 dark:text-zinc-500" />
                    </summary>
                    <div className="space-y-3 border-t border-stone-100 p-4 text-xs dark:border-zinc-800">
                      {initialAnswer && (
                        <div>
                          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                            Initial baseline knowledge
                          </h4>
                          <p className="whitespace-pre-wrap leading-relaxed text-stone-600 dark:text-zinc-300">
                            {initialAnswer}
                          </p>
                        </div>
                      )}
                      {planReasoning && (
                        <div>
                          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                            Tool selection strategy
                          </h4>
                          <p className="leading-relaxed text-stone-600 dark:text-zinc-300">
                            {planReasoning}
                          </p>
                        </div>
                      )}
                      {notes.length > 0 && (
                        <div>
                          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                            Synthesis notes ({notes.length})
                          </h4>
                          <div className="space-y-2">
                            {notes.map((note, idx) => (
                              <div
                                key={idx}
                                className="rounded-lg border border-stone-200 bg-stone-50/60 p-2.5 text-stone-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-300"
                              >
                                {note}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── Input dock ──────────────────────────────────────── */}
      <div className="sticky bottom-0 z-30">
        <div
          aria-hidden
          className="pointer-events-none h-6 bg-gradient-to-t from-stone-50 to-transparent dark:from-zinc-950"
        />
        <div className="bg-stone-50 pb-4 dark:bg-zinc-950">
          <div className="mx-auto max-w-3xl px-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-1.5 shadow-lg shadow-stone-300/40 transition-all focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-teal-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30 dark:focus-within:border-teal-500/60">
              <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Ask a research question…"
                disabled={isLoading}
                maxLength={500}
                aria-describedby="topic-counter"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none disabled:opacity-60 sm:text-base dark:text-zinc-100 dark:placeholder-zinc-500"
              />
              {isLoading ? (
                <button
                  onClick={handleStopResearch}
                  className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!input.trim() || isInvalid}
                  className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
                >
                  <span className="hidden sm:inline">Research</span>
                  <BrainCircuit className="h-4 w-4 sm:hidden" />
                </button>
              )}
              </div>

              {/* Form toolbar: model picker + counter */}
              <div className="flex items-center justify-between px-1.5 pb-0.5 pt-1">
                <ModelPicker
                  value={preferredModel}
                  onChange={setPreferredModel}
                  disabled={isLoading}
                />
                <span
                  id="topic-counter"
                  className={`font-mono text-[11px] ${
                    input.length > 500 ? "text-red-500" : "text-stone-400 dark:text-zinc-600"
                  }`}
                >
                  {input.length}/500
                </span>
              </div>
            </div>
            <div className="px-1 pt-2 text-[11px]">
              <span
                className={
                  isInvalid ? "font-medium text-red-500" : "text-stone-400 dark:text-zinc-600"
                }
              >
                {input.length > 500
                  ? "Query must be under 500 characters"
                  : input.length > 0 && input.trim().length < 2
                  ? "Query must be at least 2 characters"
                  : "\u00A0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Output Inspector Modal */}
      {activeModalTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4 backdrop-blur-sm dark:bg-zinc-950/80">
          <div className="relative flex max-h-[80vh] w-full max-w-2xl flex-col space-y-3 rounded-2xl border border-stone-200 bg-white p-5 text-xs shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                {getToolIcon(activeModalTool.tool)}
                <h3 className="font-semibold uppercase tracking-wider text-stone-800 dark:text-zinc-200">
                  {activeModalTool.tool} inspector
                </h3>
              </div>
              <button
                onClick={() => setActiveModalTool(null)}
                className="cursor-pointer rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <span className="font-medium text-stone-500 dark:text-zinc-500">Input query</span>
              <div className="mt-1 rounded-lg border border-stone-200 bg-stone-50 p-2 font-mono text-teal-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-teal-300">
                {activeModalTool.input}
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <pre className="whitespace-pre-wrap font-mono leading-relaxed text-stone-600 dark:text-zinc-300">
                {activeModalTool.result}
              </pre>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatExperience />
    </Suspense>
  );
}