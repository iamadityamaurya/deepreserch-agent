import { Annotation } from "@langchain/langgraph";
import { ToolResult } from "./tools";

export interface CalculationItem {
  expression: string;
  result: string;
}

export const ResearchAnnotation = Annotation.Root({
  topic: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
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
  notes: Annotation<string[]>({
    reducer: (x, y) => x.concat(y ?? []),
    default: () => [],
  }),
  iterationCount: Annotation<number>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),
  statusMessage: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "Initializing research...",
  }),
  finalReport: Annotation<string>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => "",
  }),
});

export type ResearchState = typeof ResearchAnnotation.State;
