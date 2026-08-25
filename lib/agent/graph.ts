import { StateGraph, START, END } from "@langchain/langgraph";
import { ResearchAnnotation, ResearchState } from "./state";
import {
  planResearchNode,
  executeToolsNode,
  synthesizeNotesNode,
  generateReportNode,
} from "./nodes";

/**
 * Conditional router edge to evaluate research depth.
 */
function shouldContinue(state: ResearchState): "plan_research" | "generate_report" {
  // Perform exactly 1 cycle before generating the final report
  if ((state.iterationCount || 0) < 1) {
    return "plan_research";
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
  .addEdge("plan_research", "execute_tools")
  .addEdge("execute_tools", "synthesize_notes")
  .addConditionalEdges("synthesize_notes", shouldContinue, {
    plan_research: "plan_research",
    generate_report: "generate_report",
  })
  .addEdge("generate_report", END);

export const researchAgentGraph = workflow.compile();
