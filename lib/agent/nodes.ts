import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ResearchState, CalculationItem, PlannedToolCall } from "./state";
import {
  ToolResult,
  AVAILABLE_TOOLS_CATALOG,
  calculateExpression,
  searchArXiv,
  analyzeGithubRepo,
  searchReddit,
  getPopulationStats,
  getFinancialData,
  analyzeDomain,
  performWebSearch,
} from "./tools";

function getLLM() {
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (groqApiKey) {
    return new ChatGroq({
      model: groqModel,
      apiKey: groqApiKey,
      temperature: 0.2,
    });
  }

  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (googleApiKey) {
    return new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      apiKey: googleApiKey,
      temperature: 0.2,
    });
  }

  try {
    return new ChatGroq({
      model: groqModel,
      temperature: 0.2,
    });
  } catch {
    return null;
  }
}

/**
 * Extracts math expression candidates directly from text (e.g. "What is 2+2?" -> "2+2").
 */
function extractDirectMathExpressions(text: string): string[] {
  const expressions: string[] = [];
  const mathRegex = /(?:\(?\d+(?:\.\d+)?\)?\s*[\+\-\*\/\^%]\s*)+\(?\d+(?:\.\d+)?\)?/g;
  const matches = text.match(mathRegex);

  if (matches) {
    for (const match of matches) {
      const clean = match.trim();
      if (clean && !expressions.includes(clean)) {
        expressions.push(clean);
      }
    }
  }

  return expressions;
}

/**
 * Helper to safely parse JSON from LLM output (stripping markdown codeblocks if present).
 */
function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const substr = raw.substring(firstBrace, lastBrace + 1);
        return JSON.parse(substr) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

/**
 * Formats the tool catalog for inclusion in LLM prompts.
 */
function getFormattedToolsCatalog(): string {
  return AVAILABLE_TOOLS_CATALOG.map(
    (t, i) => `${i + 1}. Tool: "${t.name}"\n   Description: ${t.description}\n   Input format: ${t.inputFormat}`
  ).join("\n\n");
}

/**
 * NODE 1: Initial LLM Consultation & Tool Call Planning
 * Sends the user question along with all tool descriptions to the LLM.
 * Takes the LLM's initial answer and its requested tool calls with exact inputs.
 */
export async function planResearchNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const maxIterations = state.maxIterations || 3;
  const toolsDoc = getFormattedToolsCatalog();

  let initialAnswer = "";
  let planReasoning = `Analyzing question "${state.topic}" with LLM and tool suite...`;
  let plannedTools: PlannedToolCall[] = [];
  let isEnough = false;

  if (llm) {
    const prompt = `You are a Principal AI Research Agent.
A user asked the following research question:
"${state.topic}"

Below is the list of all available research tools and their descriptions:
${toolsDoc}

Your Task:
1. Provide what you already know regarding this question from your own parametric knowledge ("initialAnswer").
2. Determine what external tools are required to verify, calculate, gather up-to-date data, papers, code stats, or community insights.
3. For EACH tool needed, provide the tool name and the EXACT input parameter (search query, repo name, math expression, or ticker) you want the system to pass to that tool.
4. Decide if your initial answer is already 100% complete and self-contained ("isEnough": true), or if tools should be executed ("isEnough": false).

Respond ONLY in valid JSON matching this schema:
{
  "initialAnswer": "Detailed explanation of what you already know about this topic",
  "reasoning": "Why these specific tools and inputs are needed to fully answer and verify the user's question",
  "toolCalls": [
    {
      "tool": "tool_name",
      "input": "exact query string or parameter to pass to the tool",
      "reason": "why this tool and query are needed"
    }
  ],
  "isEnough": false
}`;

    try {
      const response = await llm.invoke(prompt);
      const content = typeof response.content === "string" ? response.content : "";

      interface InitialPlanResponse {
        initialAnswer?: string;
        reasoning?: string;
        toolCalls?: PlannedToolCall[];
        isEnough?: boolean;
      }

      const parsed = safeParseJson<InitialPlanResponse>(content, {});
      if (parsed.initialAnswer) {
        initialAnswer = parsed.initialAnswer;
      }
      if (parsed.reasoning) {
        planReasoning = parsed.reasoning;
      }
      if (Array.isArray(parsed.toolCalls) && parsed.toolCalls.length > 0) {
        plannedTools = parsed.toolCalls.filter((t) => t.tool && t.input);
      }
      if (parsed.isEnough === true && plannedTools.length === 0) {
        isEnough = true;
      }
    } catch (err) {
      console.warn("LLM initial consultation error, using fallback:", err);
    }
  }

  // Fallback if LLM did not return tools and initial answer is empty
  if (plannedTools.length === 0 && !isEnough) {
    const topicLower = state.topic.toLowerCase();
    const directMath = extractDirectMathExpressions(state.topic);

    if (directMath.length > 0) {
      for (const expr of directMath) {
        plannedTools.push({ tool: "math", input: expr, reason: `Direct calculation of math expression ${expr}` });
      }
    }
    if (topicLower.includes("arxiv") || topicLower.includes("paper") || topicLower.includes("quantum") || topicLower.includes("transformer")) {
      plannedTools.push({ tool: "arxiv", input: state.topic, reason: "Search academic research literature on ArXiv" });
    }
    if (topicLower.includes("github") || topicLower.includes("repo") || topicLower.includes(".com/")) {
      plannedTools.push({ tool: "github", input: state.topic, reason: "Analyze repository metrics and code on GitHub" });
    }
    if (topicLower.includes("reddit") || topicLower.includes("sentiment") || topicLower.includes("discussion")) {
      plannedTools.push({ tool: "reddit", input: state.topic, reason: "Search community discussions and sentiment on Reddit" });
    }
    if (topicLower.includes("population") || topicLower.includes("demographic") || topicLower.includes("india") || topicLower.includes("china")) {
      plannedTools.push({ tool: "population", input: state.topic, reason: "Fetch demographic population statistics" });
    }
    if (topicLower.includes("price") || topicLower.includes("crypto") || topicLower.includes("btc") || topicLower.includes("eth") || topicLower.includes("finance")) {
      plannedTools.push({ tool: "finance", input: state.topic, reason: "Query live financial metrics and price data" });
    }
    if (topicLower.includes("domain") || topicLower.includes("whois") || topicLower.includes("dns")) {
      plannedTools.push({ tool: "domain", input: state.topic, reason: "Analyze domain DNS and WHOIS registration" });
    }

    if (plannedTools.length === 0) {
      plannedTools.push({ tool: "web_search", input: state.topic, reason: "Search the web for up-to-date information" });
    }
  }

  const subtopics = plannedTools.map((t) => `${t.tool.toUpperCase()}: "${t.input}"`);

  return {
    iterationCount: 1,
    initialAnswer: initialAnswer || `Initial inquiry into "${state.topic}".`,
    planReasoning,
    plannedToolCalls: plannedTools,
    subtopics,
    isEnough,
    isComplete: isEnough,
    statusMessage: isEnough
      ? "LLM provided complete initial answer; proceeding to report."
      : `Cycle 1/${maxIterations}: LLM provided initial answer and requested ${plannedTools.length} tool execution(s).`,
  };
}

/**
 * NODE 2: Execute Selected Tools
 * Calls each tool with the exact input asked for by the LLM and gathers outputs.
 */
export async function executeToolsNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const plannedTools = state.plannedToolCalls || [];
  const toolResults: ToolResult[] = [];
  const calculations: CalculationItem[] = [];

  if (plannedTools.length === 0) {
    return {
      statusMessage: "No additional tool executions required in this cycle.",
    };
  }

  const tasks = plannedTools.map(async (call) => {
    const toolName = call.tool.toLowerCase();
    const query = call.input;
    let res: ToolResult;

    try {
      switch (toolName) {
        case "math": {
          res = calculateExpression(query);
          if (res.result && !res.result.startsWith("Error:")) {
            calculations.push({ expression: query, result: res.result });
          }
          break;
        }
        case "arxiv": {
          res = await searchArXiv(query);
          break;
        }
        case "github": {
          res = await analyzeGithubRepo(query);
          break;
        }
        case "reddit": {
          res = await searchReddit(query);
          break;
        }
        case "population": {
          res = await getPopulationStats(query);
          break;
        }
        case "finance": {
          res = await getFinancialData(query);
          break;
        }
        case "domain": {
          res = await analyzeDomain(query);
          break;
        }
        case "web_search":
        default: {
          res = await performWebSearch(query);
          break;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      res = { tool: call.tool, input: query, result: `Tool error: ${msg}` };
    }

    res.reason = call.reason;
    toolResults.push(res);
  });

  await Promise.all(tasks);

  return {
    toolOutputs: toolResults,
    calculations,
    plannedToolCalls: [], // Reset after execution
    statusMessage: `Cycle ${state.iterationCount}: Executed ${toolResults.length} tool(s). Sending all tool outputs to LLM for evaluation.`,
  };
}

/**
 * NODE 3: Re-Analyze All Data with LLM & Check if Response is Enough
 * Sends all collected data back to LLM to evaluate if the response is sufficient
 * or if further follow-up tool calls with specific inputs are required.
 */
export async function synthesizeNotesNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const currentIteration = state.iterationCount || 1;
  const maxIterations = state.maxIterations || 3;
  const allOutputs = state.toolOutputs || [];
  const toolsDoc = getFormattedToolsCatalog();

  const toolOutputsFormatted = allOutputs
    .map(
      (o, i) =>
        `[Tool Output ${i + 1}] Tool: ${o.tool.toUpperCase()}\nInput Asked: "${o.input}"\nPurpose: ${o.reason || "Verification"}\nResult Data:\n${o.result}`
    )
    .join("\n\n---\n\n");

  let synthesisNote = `Evaluated ${allOutputs.length} tool results against topic "${state.topic}".`;
  let isEnough = currentIteration >= maxIterations;
  let nextPlannedTools: PlannedToolCall[] = [];
  let nextReasoning = "";

  if (llm) {
    const evalPrompt = `You are the Lead Evaluator and Synthesizer in a Deep Research Agent system.
User Research Question: "${state.topic}"

Your Initial Answer/Knowledge:
${state.initialAnswer || "None"}

All Accumulated Tool Outputs and Empirical Data:
${toolOutputsFormatted || "No tool data collected yet."}

Prior Synthesis Notes:
${state.notes?.join("\n\n") || "None yet."}

Available Tools (if more data is needed):
${toolsDoc}

Current Cycle: ${currentIteration} of ${maxIterations}

Your Task:
1. Synthesize all tool data with your initial knowledge, highlighting key metrics, facts, papers, repo details, or calculations.
2. CRITICAL EVALUATION: Is this combined information ENOUGH to provide a comprehensive, fully verified, and definitive research report to the user?
3. If NOT enough and current cycle < ${maxIterations}:
   - Set "isEnough": false
   - Provide 1 to 3 "followUpTools" with exact "tool" names, "input" queries/expressions, and "reason" why they are needed.
4. If ENOUGH (or if we have all key answers):
   - Set "isEnough": true
   - Set "followUpTools": []

Respond ONLY in valid JSON matching this schema:
{
  "analysis": "Comprehensive analytical synthesis of what was learned from the tool executions",
  "isEnough": true,
  "reasoning": "Detailed justification on why the current data is or is not enough to answer the question",
  "followUpTools": [
    {
      "tool": "tool_name",
      "input": "exact query string or parameter to pass to the tool",
      "reason": "why this tool and query are needed"
    }
  ]
}`;

    try {
      const response = await llm.invoke(evalPrompt);
      const content = typeof response.content === "string" ? response.content : "";

      interface EvalResponse {
        analysis?: string;
        isEnough?: boolean;
        reasoning?: string;
        followUpTools?: PlannedToolCall[];
      }

      const parsed = safeParseJson<EvalResponse>(content, {});
      if (parsed.analysis) {
        synthesisNote = parsed.analysis;
      }
      if (parsed.reasoning) {
        nextReasoning = parsed.reasoning;
      }
      if (typeof parsed.isEnough === "boolean") {
        isEnough = parsed.isEnough || currentIteration >= maxIterations;
      }
      if (!isEnough && Array.isArray(parsed.followUpTools) && parsed.followUpTools.length > 0) {
        nextPlannedTools = parsed.followUpTools.filter((t) => t.tool && t.input);
      }
    } catch (err) {
      console.warn("LLM evaluation error, defaulting to complete:", err);
      isEnough = true;
    }
  }

  // Force completion if max iterations reached
  if (currentIteration >= maxIterations) {
    isEnough = true;
    nextPlannedTools = [];
  }

  const nextIteration = isEnough ? currentIteration : currentIteration + 1;

  return {
    iterationCount: nextIteration,
    notes: [synthesisNote],
    planReasoning: nextReasoning || state.planReasoning,
    plannedToolCalls: nextPlannedTools,
    isEnough,
    isComplete: isEnough,
    statusMessage: isEnough
      ? `Cycle ${currentIteration}: LLM evaluated data as ENOUGH. Preparing final report.`
      : `Cycle ${currentIteration}: LLM evaluated data as incomplete. Requesting ${nextPlannedTools.length} follow-up tool call(s) for Cycle ${nextIteration}/${maxIterations}.`,
  };
}

/**
 * NODE 4: Generate Final Comprehensive Report
 * Combines initial LLM knowledge, all executed tool outputs, math calculations,
 * and iterative synthesis evaluations into a definitive Markdown report.
 */
export async function generateReportNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const outputs = state.toolOutputs || [];
  const notesText = state.notes?.join("\n\n---\n\n") || "No intermediate notes.";
  const calculationsText = state.calculations?.length
    ? state.calculations.map((c) => `- \`${c.expression}\` = **${c.result}**`).join("\n")
    : "No direct arithmetic formulas executed.";

  const toolsSummarySection = outputs.length > 0
    ? "\n\n### Tool Execution Results & Empirical Evidence\n" +
      outputs
        .map(
          (o, idx) =>
            `#### [Source ${idx + 1}] \`${o.tool.toUpperCase()}\`: "${o.input}"\n*Purpose:* ${o.reason || "Lookup"}\n\n\`\`\`\n${o.result}\n\`\`\``
        )
        .join("\n\n")
    : "";

  if (llm) {
    try {
      const finalPrompt = `You are a Principal AI Research Scientist.
Generate a definitive, exhaustive, and structured research report based on the complete autonomous graph execution.

User Research Topic: "${state.topic}"

Your Initial Knowledge:
${state.initialAnswer}

Synthesized Analytical Evaluations across Cycles:
${notesText}

Mathematical Calculations:
${calculationsText}

${toolsSummarySection}

Report Requirements:
1. # Comprehensive Title
2. ## Executive Summary (Direct, thorough answer integrating initial knowledge and verified tool findings)
3. ## In-Depth Analysis & Key Findings (Organized into structured subsections citing specific data, repositories, papers, or market indicators)
4. ## Empirical Verification & Data Table (Highlight specific numbers, calculations, ArXiv authors, GitHub stars, or census data)
5. ## Actionable Insights & Strategic Conclusion
6. Format in clean, beautiful GitHub Flavored Markdown.`;

      const response = await llm.invoke(finalPrompt);
      const report = typeof response.content === "string" ? response.content : "";
      if (report) {
        return {
          finalReport: report,
          statusMessage: "Multi-Tool Deep Research Completed!",
        };
      }
    } catch (err) {
      console.warn("LLM final report generation error:", err);
    }
  }

  // Fallback report
  let fallbackReport = `# Multi-Tool Deep Research Report: ${state.topic}\n\n`;
  fallbackReport += `## Executive Summary\n${state.initialAnswer}\n\n${notesText}\n\n`;
  if (state.calculations?.length) {
    fallbackReport += `## Calculations\n${calculationsText}\n\n`;
  }
  if (toolsSummarySection) {
    fallbackReport += `${toolsSummarySection}\n\n`;
  }
  fallbackReport += `## Conclusion\nAutonomous multi-cycle graph research completed for: "${state.topic}".`;

  return {
    finalReport: fallbackReport,
    statusMessage: "Multi-Tool Deep Research Completed!",
  };
}


