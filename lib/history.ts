import type { CitationSource } from "@/lib/agent/tools";

export interface CalculationItem {
  expression: string;
  result: string;
}

export interface ToolResultItem {
  tool: string;
  input: string;
  result: string;
  reason?: string;
  sources?: CitationSource[];
  details?: unknown;
}

export interface HistoryItem {
  id: string;
  topic: string;
  finalReport: string;
  sources: CitationSource[];
  toolOutputs: ToolResultItem[];
  calculations: CalculationItem[];
  modelUsed: string;
  searchDepth: "standard" | "deep";
  planReasoning: string;
  initialAnswer: string;
  notes: string[];
  timestamp: string;
}

const STORAGE_KEY = "deepquery-history";
const MAX_ITEMS = 50;

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToHistory(item: Omit<HistoryItem, "id" | "timestamp">): HistoryItem {
  const history = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  const updated = [newItem, ...history].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newItem;
}

export function deleteHistoryItem(id: string): void {
  const history = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
