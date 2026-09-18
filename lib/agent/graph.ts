import { StateGraph, START, END } from "@langchain/langgraph";
import { ResearchAnnotation, ResearchState } from "./state";
import {
  planResearchNode,
  executeToolsNode,
  synthesizeNotesNode,
  generateReportNode,
} from "./nodes";

/**
 * Conditional router after initial consultation / planning.
 */
function afterPlan(state: ResearchState): "execute_tools" | "generate_report" {
  if (state.isEnough || (state.plannedToolCalls || []).length === 0) {
    return "generate_report";
  }
  return "execute_tools";
}

/**
 * Conditional router after re-evaluating all tool outputs with LLM.
 */
function afterEvaluation(state: ResearchState): "execute_tools" | "generate_report" {
  if (state.isEnough || state.isComplete || (state.plannedToolCalls || []).length === 0) {
    return "generate_report";
  }
  const maxIterations = state.maxIterations || 3;
  if ((state.iterationCount || 0) <= maxIterations) {
    return "execute_tools";
  }
  return "generate_report";
}

// Build the LangGraph StateGraph workflow
const workflow = new StateGraph(ResearchAnnotation)
  .addNode("plan_research", planResearchNode)
  .addNode("execute_tools", executeToolsNode)
  .addNode("synthesize_notes", synthesizeNotesNode)
  .addNode("generate_report", generateReportNode)
  .addEdge(START, "plan_research")
  .addConditionalEdges("plan_research", afterPlan, {
    execute_tools: "execute_tools",
    generate_report: "generate_report",
  })
  .addEdge("execute_tools", "synthesize_notes")
  .addConditionalEdges("synthesize_notes", afterEvaluation, {
    execute_tools: "execute_tools",
    generate_report: "generate_report",
  })
  .addEdge("generate_report", END);

export const researchAgentGraph = workflow.compile();
