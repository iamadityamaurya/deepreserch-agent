import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ResearchState, CalculationItem } from "./state";
import {
  ToolResult,
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
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1:8b";
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  if (process.env.USE_OLLAMA !== "false") {
    return new ChatOllama({
      model: ollamaModel,
      baseUrl: ollamaBaseUrl,
      temperature: 0.2,
    });
  }

  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (googleApiKey) {
    return new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: googleApiKey,
      temperature: 0.2,
    });
  }

  return null;
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
 * NODE 1: Plan Research & Tool Selection
 * Identifies prompt intent and determines which tools (ArXiv, GitHub, Reddit, Finance, Population, Domain, Math, Web Search) to invoke.
 */
export async function planResearchNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const currentCount = state.iterationCount || 0;
  const newIteration = currentCount + 1;
  const topicLower = state.topic.toLowerCase();

  const selectedTools: string[] = [];

  // Intent-based tool selection heuristics
  if (topicLower.includes("arxiv") || topicLower.includes("paper") || topicLower.includes("research paper") || topicLower.includes("academic") || topicLower.includes("quantum")) {
    selectedTools.push("arxiv");
  }
  if (topicLower.includes("github") || topicLower.includes("repo") || topicLower.includes("repository") || topicLower.includes(".com/")) {
    selectedTools.push("github");
  }
  if (topicLower.includes("reddit") || topicLower.includes("discussion") || topicLower.includes("opinion") || topicLower.includes("sentiment")) {
    selectedTools.push("reddit");
  }
  if (topicLower.includes("population") || topicLower.includes("census") || topicLower.includes("demographic") || topicLower.includes("india") || topicLower.includes("china") || topicLower.includes("usa") || topicLower.includes("germany")) {
    selectedTools.push("population");
  }
  if (topicLower.includes("price") || topicLower.includes("stock") || topicLower.includes("crypto") || topicLower.includes("btc") || topicLower.includes("eth") || topicLower.includes("finance") || topicLower.includes("market")) {
    selectedTools.push("finance");
  }
  if (topicLower.includes("domain") || topicLower.includes("whois") || topicLower.includes("dns") || topicLower.includes("website")) {
    selectedTools.push("domain");
  }

  // Math expression check
  const directMath = extractDirectMathExpressions(state.topic);
  if (directMath.length > 0 || topicLower.includes("calculate") || topicLower.includes("+") || topicLower.includes("*") || topicLower.includes("/")) {
    selectedTools.push("math");
  }

  // General web search fallback if no specialized tool matched
  if (selectedTools.length === 0) {
    selectedTools.push("web_search");
  }

  return {
    subtopics: selectedTools.map((t) => `${t.toUpperCase()} Tool Analysis`),
    iterationCount: newIteration,
    statusMessage: `Iteration ${newIteration}: Selected tool(s): ${selectedTools.join(", ").toUpperCase()}`,
  };
}

/**
 * NODE 2: Execute Selected Tools
 * Asynchronously runs all chosen tools and records ToolResult items.
 */
export async function executeToolsNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const topic = state.topic;
  const topicLower = topic.toLowerCase();
  const toolResults: ToolResult[] = [];
  const calculations: CalculationItem[] = [];

  const tasks: Promise<void>[] = [];

  // 1. Math Calculation Tool
  const directMath = extractDirectMathExpressions(topic);
  if (directMath.length > 0) {
    for (const expr of directMath) {
      const res = calculateExpression(expr);
      toolResults.push(res);
      if (res.result && !res.result.startsWith("Error:")) {
        calculations.push({ expression: expr, result: res.result });
      }
    }
  } else if (topicLower.includes("calculate") || topicLower.includes("+") || topicLower.includes("*")) {
    const res = calculateExpression(topic.replace(/[^0-9\+\-\*\/\.\(\)\^%]/g, ""));
    if (res.result && !res.result.startsWith("Error:")) {
      toolResults.push(res);
      calculations.push({ expression: res.input, result: res.result });
    }
  }

  // 2. ArXiv Academic Paper Search
  if (topicLower.includes("arxiv") || topicLower.includes("paper") || topicLower.includes("academic") || topicLower.includes("quantum") || topicLower.includes("ai")) {
    tasks.push(
      searchArXiv(topic).then((res) => {
        toolResults.push(res);
      })
    );
  }

  // 3. GitHub Repository Analysis
  if (topicLower.includes("github") || topicLower.includes("repo") || topicLower.includes("code")) {
    tasks.push(
      analyzeGithubRepo(topic).then((res) => {
        toolResults.push(res);
      })
    );
  }

  // 4. Reddit Discussion Search
  if (topicLower.includes("reddit") || topicLower.includes("discussion") || topicLower.includes("community")) {
    tasks.push(
      searchReddit(topic).then((res) => {
        toolResults.push(res);
      })
    );
  }

  // 5. Demographics & Population Stats
  if (topicLower.includes("population") || topicLower.includes("demographic") || topicLower.includes("india") || topicLower.includes("china") || topicLower.includes("usa") || topicLower.includes("germany")) {
    tasks.push(
      getPopulationStats(topic).then((res) => {
        toolResults.push(res);
      })
    );
  }

  // 6. Financial & Crypto Price
  if (topicLower.includes("price") || topicLower.includes("stock") || topicLower.includes("crypto") || topicLower.includes("btc") || topicLower.includes("eth") || topicLower.includes("finance")) {
    tasks.push(
      getFinancialData(topic).then((res) => {
        toolResults.push(res);
      })
    );
  }

  // 7. Domain WHOIS & DNS
  if (topicLower.includes("domain") || topicLower.includes("whois") || topicLower.includes("dns")) {
    tasks.push(
      analyzeDomain(topic).then((res) => {
        toolResults.push(res);
      })
    );
  }

  // 8. General Web Search Fallback
  if (toolResults.length === 0 && tasks.length === 0) {
    tasks.push(
      performWebSearch(topic).then((res) => {
        toolResults.push(res);
      })
    );
  }

  await Promise.all(tasks);

  return {
    toolOutputs: toolResults,
    calculations,
    statusMessage: `Executed ${toolResults.length} specialized research tool(s)`,
  };
}

/**
 * NODE 3: Synthesize Notes
 * Synthesizes multi-tool outputs into coherent takeaways.
 */
export async function synthesizeNotesNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const outputs = state.toolOutputs || [];

  if (outputs.length > 0) {
    const summaryList = outputs.map((o) => `[Tool: ${o.tool.toUpperCase()}] Input: "${o.input}"\nResult:\n${o.result}`).join("\n\n---\n\n");

    if (llm) {
      try {
        const prompt = `Topic: "${state.topic}"
Tool Execution Outputs:
${summaryList}

Synthesize these tool outputs into 3 concise, high-value analytical bullet points.`;

        const response = await llm.invoke(prompt);
        const text = typeof response.content === "string" ? response.content : "";
        if (text) {
          return {
            notes: [text],
            statusMessage: "Synthesized multi-tool execution insights",
          };
        }
      } catch (err) {
        console.warn("LLM synthesis error:", err);
      }
    }

    return {
      notes: [summaryList],
      statusMessage: "Synthesized multi-tool outputs",
    };
  }

  return {
    notes: [`Executed analysis for prompt: ${state.topic}`],
    statusMessage: "Synthesized analytical notes",
  };
}

/**
 * NODE 4: Generate Final Report
 * Compiles LLM reasoning and multi-tool outputs into a formatted Markdown report.
 */
export async function generateReportNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const outputs = state.toolOutputs || [];
  const notesText = state.notes.join("\n\n");

  const toolsSummarySection = outputs.length > 0
    ? "\n\n### Executed Tools & Data Summary\n" +
      outputs
        .map((o) => `#### Tool: \`${o.tool.toUpperCase()}\` (Query: "${o.input}")\n${o.result}`)
        .join("\n\n")
    : "";

  if (llm) {
    try {
      const prompt = `You are a Lead AI Research Specialist.
User Prompt: "${state.topic}"

Synthesized Notes:
${notesText}

${toolsSummarySection}

Requirements:
- Answer the user's prompt directly, thoroughly, and accurately based on the tool outputs.
- Include structured Markdown headings, key metrics/findings, and actionable conclusion.`;

      const response = await llm.invoke(prompt);
      const report = typeof response.content === "string" ? response.content : "";
      if (report) {
        return {
          finalReport: report,
          statusMessage: "Multi-Tool Research Report Completed!",
        };
      }
    } catch (err) {
      console.warn("LLM report generation error:", err);
    }
  }

  // Fallback Markdown report
  let fallbackReport = `# Multi-Tool Research Report: ${state.topic}\n\n`;
  fallbackReport += `## Executive Summary\n${notesText}\n\n`;
  if (toolsSummarySection) {
    fallbackReport += `${toolsSummarySection}\n\n`;
  }

  return {
    finalReport: fallbackReport,
    statusMessage: "Multi-Tool Research Report Completed!",
  };
}
