import { Annotation } from "@langchain/langgraph";
import { ToolResult, CitationSource } from "./tools";

export interface CalculationItem {
  expression: string;
  result: string;
}

export interface PlannedToolCall {
  tool: string;
  input: string;
  reason: string;
}

export const ResearchAnnotation = Annotation.Root({
  topic: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
  searchDepth: Annotation<"standard" | "deep">({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "standard",
  }),
  preferredModel: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
  modelUsed: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
  initialAnswer: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
  planReasoning: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
  plannedToolCalls: Annotation<PlannedToolCall[]>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => [],
  }),
  subtopics: Annotation<string[]>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => [],
  }),
  calculations: Annotation<CalculationItem[]>({
    reducer: (x, y) => x.concat(y ?? []),
    default: () => [],
  }),
  toolOutputs: Annotation<ToolResult[]>({
    reducer: (x, y) => x.concat(y ?? []),
    default: () => [],
  }),
  sources: Annotation<CitationSource[]>({
    reducer: (x, y) => {
      const combined = [...x, ...(y ?? [])];
      // Deduplicate sources by URL
      const uniqueMap = new Map<string, CitationSource>();
      for (const s of combined) {
        if (s.url && !uniqueMap.has(s.url)) {
          uniqueMap.set(s.url, s);
        }
      }
      return Array.from(uniqueMap.values());
    },
    default: () => [],
  }),
  notes: Annotation<string[]>({
    reducer: (x, y) => x.concat(y ?? []),
    default: () => [],
  }),
  iterationCount: Annotation<number>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 2,
  }),
  isEnough: Annotation<boolean>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => false,
  }),
  isComplete: Annotation<boolean>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => false,
  }),
  statusMessage: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "Initializing research graph...",
  }),
  finalReport: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
});

export type ResearchState = typeof ResearchAnnotation.State;
