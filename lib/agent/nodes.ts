import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ResearchState, CalculationItem, PlannedToolCall } from "./state";
import {
  ToolResult,
  CitationSource,
  AVAILABLE_TOOLS_CATALOG,
  calculateExpression,
  searchWikipedia,
  searchArXiv,
  analyzeGithubRepo,
  searchTechDiscussions,
  getDemographics,
  getFinancialData,
  analyzeDomain,
  performWebSearch,
  getWorldBankData,
  getWeatherInfo,
  inspectIpWhois,
  searchRedditCommunity,
} from "./tools";

interface LLMInstanceInfo {
  llm: BaseChatModel;
  modelName: string;
  provider: "groq" | "google";
}

/**
 * Multi-Model LLM Factory with automatic fallback capabilities.
 */
function getLLMInstances(preferredModel?: string): LLMInstanceInfo[] {
  const instances: LLMInstanceInfo[] = [];

  const groqApiKey = process.env.GROQ_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  const targetGroqModel = preferredModel || process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  // 1. Primary Groq Model
  if (groqApiKey) {
    try {
      instances.push({
        llm: new ChatGroq({
          model: targetGroqModel,
          apiKey: groqApiKey,
          temperature: 0.2,
          maxRetries: 2,
        }),
        modelName: targetGroqModel,
        provider: "groq",
      });
    } catch (e) {
      console.warn("Error initializing primary Groq LLM:", e);
    }

    // 2. Fallback Groq Models (gpt-oss-20b, qwen3.8-27b)
    const fallbacks = ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"];
    for (const fb of fallbacks) {
      if (targetGroqModel !== fb) {
        try {
          instances.push({
            llm: new ChatGroq({
              model: fb,
              apiKey: groqApiKey,
              temperature: 0.2,
              maxRetries: 2,
            }),
            modelName: fb,
            provider: "groq",
          });
        } catch (e) {
          console.warn(`Error initializing Groq fallback ${fb}:`, e);
        }
      }
    }
  }

  // 3. Google Gemini Model
  if (googleApiKey) {
    const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    try {
      instances.push({
        llm: new ChatGoogleGenerativeAI({
          model: geminiModel,
          apiKey: googleApiKey,
          temperature: 0.2,
          maxRetries: 2,
        }),
        modelName: geminiModel,
        provider: "google",
      });
    } catch (e) {
      console.warn("Error initializing Gemini fallback:", e);
    }
  }

  return instances;
}

/**
 * Invokes LLMs with multi-provider fallback.
 */
async function invokeWithFallback(
  prompt: string,
  preferredModel?: string
): Promise<{ text: string; modelUsed: string }> {
  const instances = getLLMInstances(preferredModel);

  if (instances.length === 0) {
    throw new Error("No LLM API keys configured. Please set GROQ_API_KEY or GOOGLE_API_KEY.");
  }

  let lastError: unknown = null;

  for (const item of instances) {
    try {
      const response = await item.llm.invoke(prompt);
      const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      if (text && text.trim().length > 0) {
        return { text, modelUsed: `${item.provider}:${item.modelName}` };
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.warn(`LLM invocation failed on ${item.modelName} (${errMessage}). Trying next fallback...`);
      lastError = err;
    }
  }

  throw lastError || new Error("All LLM providers failed to respond.");
}

/**
 * Robust JSON extraction & repair utility for LLM responses.
 */
function extractAndParseJson<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;

  const cleaned = raw
    .replace(/^```(?:json)?\s*/gim, "")
    .replace(/\s*```$/gm, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      let candidate = raw.substring(firstBrace, lastBrace + 1);
      candidate = candidate
        .replace(/,\s*([\}\]])/g, "$1")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      try {
        return JSON.parse(candidate) as T;
      } catch {
        // Fallback
      }
    }
  }

  return fallback;
}

/**
 * Formats the tool catalog for inclusion in LLM prompts.
 */
function getFormattedToolsCatalog(): string {
  return AVAILABLE_TOOLS_CATALOG.map(
    (t, i) => `${i + 1}. Tool Name: "${t.name}"\n   Capability: ${t.description}\n   Input Specification: ${t.inputFormat}`
  ).join("\n\n");
}

/**
 * NODE 1: Initial Consultation & Intelligent Tool Decision
 */
export async function planResearchNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const toolsDoc = getFormattedToolsCatalog();
  const maxIterations = state.searchDepth === "deep" ? 4 : 2;

  let initialAnswer = "";
  let planReasoning = `Evaluating inquiry "${state.topic}"...`;
  let plannedTools: PlannedToolCall[] = [];
  let isEnough = false;
  let modelUsed = state.modelUsed || "";

  const cleanTopic = state.topic.trim().toLowerCase();
  const isSimpleGreeting = /^(hi|hello|hey|greetings|howdy|good\s*(morning|evening|afternoon|day)|who\s*are\s*you|what\s*can\s*you\s*do)[\.!\?]*$/.test(cleanTopic);

  if (isSimpleGreeting) {
    return {
      iterationCount: 1,
      maxIterations,
      modelUsed: modelUsed || "direct-response",
      initialAnswer: "Hello! I am your AI Deep Research Agent. I can directly answer your questions or autonomously execute specialized tools (ArXiv, GitHub, Live Finance, Demographics, Real DNS, Wikipedia, Tech Discussions, and Math AST) for deep empirical investigations. How can I help you today?",
      planReasoning: "Standard conversational greeting detected. Answered directly without calling external tools.",
      plannedToolCalls: [],
      subtopics: [],
      isEnough: true,
      isComplete: true,
      statusMessage: "Answered directly using AI knowledge (no external tools required).",
    };
  }

  const prompt = `You are a Principal AI Deep Research Scientist.
A user has submitted the following prompt or question:
"${state.topic}"

Below is your specialized external tool suite:
${toolsDoc}

YOUR INSTRUCTIONS:
1. Direct Knowledge First: Provide what you already know regarding this question from your own parametric knowledge in "initialAnswer".
2. Tool Necessity Decision:
   - If you can fully, accurately, and authoritatively answer the user's question from your existing knowledge (e.g. general science, history, programming explanations, conceptual questions, philosophy, writing, logic):
     -> Set "isEnough": true
     -> Set "toolCalls": []
     -> Set "reasoning": "Answered completely using internal knowledge; no external tools needed."
   - ONLY request external tools if you genuinely need live external data, real-time crypto/stock prices, live GitHub repo stats, recent ArXiv papers, real DNS diagnostics, or specific demographic statistics that require verification.
3. If tools ARE needed:
   - Provide the tool name and the EXACT input parameter in "toolCalls".
   - Set "isEnough": false.

Respond ONLY in valid JSON matching this schema:
{
  "initialAnswer": "Comprehensive direct answer or baseline explanation",
  "reasoning": "Why tools are or are NOT needed",
  "toolCalls": [
    {
      "tool": "tool_name",
      "input": "exact query or parameter",
      "reason": "why this tool is needed"
    }
  ],
  "isEnough": true
}`;

  try {
    const { text, modelUsed: used } = await invokeWithFallback(prompt, state.preferredModel);
    modelUsed = used;

    interface InitialPlanResponse {
      initialAnswer?: string;
      reasoning?: string;
      toolCalls?: PlannedToolCall[];
      isEnough?: boolean;
    }

    const parsed = extractAndParseJson<InitialPlanResponse>(text, {});
    if (parsed.initialAnswer) {
      initialAnswer = parsed.initialAnswer;
    }
    if (parsed.reasoning) {
      planReasoning = parsed.reasoning;
    }
    if (Array.isArray(parsed.toolCalls) && parsed.toolCalls.length > 0) {
      plannedTools = parsed.toolCalls.filter((t) => t.tool && t.input);
    }
    if (parsed.isEnough === false && plannedTools.length > 0) {
      isEnough = false;
    } else if (parsed.isEnough === true && plannedTools.length === 0) {
      isEnough = true;
    }
  } catch (err) {
    console.warn("LLM initial consultation error:", err);
  }

  // Heuristic verification trigger for explicit live queries
  const topicLower = state.topic.toLowerCase();
  const isMarketQuery = /(price|share\s*price|stock|quote|ticker|crypto|btc|eth|sol|nasdaq|market\s*cap)/i.test(topicLower);
  const isAcademicQuery = /(arxiv|paper|research\s*paper|quantum\s*transformer)/i.test(topicLower);
  const isRepoQuery = /(github\.com|github\s*repo|repository\s*stars)/i.test(topicLower);
  const isDemoQuery = /(population\s*of|capital\s*of|demographics\s*of)/i.test(topicLower);
  const isDnsQuery = /(dns\s*record|mx\s*record|whois|resolve\s*domain)/i.test(topicLower);

  if (plannedTools.length === 0 && !isSimpleGreeting) {
    if (isMarketQuery) {
      plannedTools.push({ tool: "finance", input: state.topic, reason: "Fetch live market price and quote data" });
      isEnough = false;
    } else if (isAcademicQuery) {
      plannedTools.push({ tool: "arxiv", input: state.topic, reason: "Search academic research literature on ArXiv" });
      isEnough = false;
    } else if (isRepoQuery) {
      plannedTools.push({ tool: "github", input: state.topic, reason: "Inspect GitHub repository statistics" });
      isEnough = false;
    } else if (isDemoQuery) {
      plannedTools.push({ tool: "demographics", input: state.topic, reason: "Fetch demographic country statistics" });
      isEnough = false;
    } else if (isDnsQuery) {
      plannedTools.push({ tool: "dns_domain", input: state.topic, reason: "Resolve domain DNS records" });
      isEnough = false;
    }
  }

  if (plannedTools.length === 0) {
    isEnough = true;
  }

  const subtopics = plannedTools.map((t) => `${t.tool.toUpperCase()}: "${t.input}"`);

  return {
    iterationCount: 1,
    maxIterations,
    modelUsed,
    initialAnswer: initialAnswer || `Direct response to "${state.topic}".`,
    planReasoning,
    plannedToolCalls: plannedTools,
    subtopics,
    isEnough,
    isComplete: isEnough,
    statusMessage: isEnough
      ? "Answered directly using AI knowledge (no external tools required)."
      : `Dispatched ${plannedTools.length} specialized empirical tool(s) for verification.`,
  };
}

/**
 * NODE 2: Concurrent Tool Execution & Source Ingestion
 */
export async function executeToolsNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const plannedTools = state.plannedToolCalls || [];
  const toolResults: ToolResult[] = [];
  const calculations: CalculationItem[] = [];
  const collectedSources: CitationSource[] = [];

  if (plannedTools.length === 0) {
    return {
      statusMessage: "No external tools needed for this question.",
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
        case "wikipedia": {
          res = await searchWikipedia(query);
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
        case "tech_discussions":
        case "reddit": {
          res = await searchTechDiscussions(query);
          break;
        }
        case "demographics":
        case "population": {
          res = await getDemographics(query);
          break;
        }
        case "finance": {
          res = await getFinancialData(query);
          break;
        }
        case "dns_domain":
        case "domain": {
          res = await analyzeDomain(query);
          break;
        }
        case "world_bank":
        case "macroeconomics": {
          res = await getWorldBankData(query);
          break;
        }
        case "weather":
        case "climate": {
          res = await getWeatherInfo(query);
          break;
        }
        case "ip_whois":
        case "whois": {
          res = await inspectIpWhois(query);
          break;
        }
        case "reddit_community": {
          res = await searchRedditCommunity(query);
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

    if (Array.isArray(res.sources)) {
      collectedSources.push(...res.sources);
    }
  });

  await Promise.all(tasks);

  return {
    toolOutputs: toolResults,
    calculations,
    sources: collectedSources,
    plannedToolCalls: [], // Reset after execution
    statusMessage: `Executed ${toolResults.length} tool(s). Analyzing findings...`,
  };
}

/**
 * NODE 3: Multi-Source Synthesis & Convergence Evaluation
 */
export async function synthesizeNotesNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const currentIteration = state.iterationCount || 1;
  const maxIterations = state.maxIterations || 2;
  const allOutputs = state.toolOutputs || [];
  const toolsDoc = getFormattedToolsCatalog();

  if (allOutputs.length === 0) {
    return {
      iterationCount: currentIteration,
      isEnough: true,
      isComplete: true,
      plannedToolCalls: [],
      statusMessage: "Synthesizing answer from AI knowledge.",
    };
  }

  const toolOutputsFormatted = allOutputs
    .map(
      (o, i) =>
        `[Tool Result ${i + 1}] Source: ${o.tool.toUpperCase()}\nInput Asked: "${o.input}"\nPurpose: ${o.reason || "Empirical Lookup"}\nFindings:\n${o.result}`
    )
    .join("\n\n---\n\n");

  let synthesisNote = `Synthesized ${allOutputs.length} empirical data point(s) against topic "${state.topic}".`;
  let isEnough = currentIteration >= maxIterations;
  let nextPlannedTools: PlannedToolCall[] = [];
  let nextReasoning = "";

  const evalPrompt = `You are the Lead Synthesizer for an AI Deep Research Agent.
User Research Query: "${state.topic}"

Baseline Knowledge:
${state.initialAnswer || "None"}

All Empirical Tool Results Collected:
${toolOutputsFormatted || "No tool data gathered."}

Prior Synthesis Evaluations:
${state.notes?.join("\n\n") || "None yet."}

Available Tools (if more specific evidence is needed):
${toolsDoc}

Current Cycle: ${currentIteration} of ${maxIterations}

YOUR OBJECTIVES:
1. Synthesize all tool data with baseline knowledge.
2. CRITICAL EVALUATION: Is the current information sufficient to answer the question?
   - In most cases, 1 round of tool execution is already enough!
   - Only request follow-up tools if a vital piece of information is still completely missing.
3. If ENOUGH (or if core answers are confirmed):
   - Set "isEnough": true
   - Set "followUpTools": []

Respond ONLY in valid JSON matching this schema:
{
  "analysis": "Analytical synthesis of findings",
  "isEnough": true,
  "reasoning": "Why the current data is enough",
  "followUpTools": []
}`;

  try {
    const { text } = await invokeWithFallback(evalPrompt, state.preferredModel);

    interface EvalResponse {
      analysis?: string;
      isEnough?: boolean;
      reasoning?: string;
      followUpTools?: PlannedToolCall[];
    }

    const parsed = extractAndParseJson<EvalResponse>(text, {});
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
      ? `Research findings verified. Compiling final report.`
      : `Launching follow-up query for Cycle ${nextIteration}/${maxIterations}.`,
  };
}

/**
 * NODE 4: Generate Final Markdown Response / Report
 */
export async function generateReportNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const outputs = state.toolOutputs || [];
  const sources = state.sources || [];
  const notesText = state.notes?.join("\n\n---\n\n") || "";
  const calculationsText = state.calculations?.length
    ? state.calculations.map((c) => `- \`${c.expression}\` = **${c.result}**`).join("\n")
    : "";

  // CASE 1: NO TOOLS WERE NEEDED - Direct Answer
  if (outputs.length === 0 && calculationsText.length === 0) {
    const directPrompt = `You are a helpful, expert AI assistant.
The user submitted the following prompt or question:
"${state.topic}"

Your baseline knowledge or draft response:
${state.initialAnswer}

Provide a direct, high-quality, articulate, and well-structured markdown response.
- If it is a greeting or brief conversational message (like "hi" or "who are you"), respond in a polite, helpful, and natural tone.
- If it is a technical, scientific, code, or conceptual question, format with clean markdown headings, bullet points, and code blocks as appropriate.
- Do NOT generate fake tool logs, "Empirical Evidence" headers, or claim you executed external tools when none were used.`;

    try {
      const { text } = await invokeWithFallback(directPrompt, state.preferredModel);
      if (text && text.trim().length > 0) {
        return {
          finalReport: text,
          statusMessage: "Response completed!",
        };
      }
    } catch (err) {
      console.warn("Direct response LLM error:", err);
    }

    return {
      finalReport: state.initialAnswer || `Response to: "${state.topic}".`,
      statusMessage: "Response completed!",
    };
  }

  // CASE 2: TOOLS WERE EXECUTED - Crisp, To-The-Point Synthesis Report
  const toolsSummarySection = outputs.length > 0
    ? "\n\n### Empirical Findings:\n" +
      outputs
        .map(
          (o, idx) =>
            `- **${o.tool.toUpperCase()}** (${o.input}): ${o.result.slice(0, 350)}`
        )
        .join("\n")
    : "";

  const citationsSection = sources.length > 0
    ? "\n\n### Sources:\n" +
      sources.slice(0, 5).map((s, idx) => `- [${s.title}](${s.url})`).join("\n")
    : "";

  const finalPrompt = `You are a crisp, high-impact AI Research Analyst.
The user asked: "${state.topic}"

Research Findings & Collected Evidence:
${state.initialAnswer}

Synthesis Notes:
${notesText}
${calculationsText ? `\nCalculations:\n${calculationsText}` : ""}
${toolsSummarySection}
${citationsSection}

INSTRUCTIONS FOR A CONCISE, TO-THE-POINT ANSWER:
1. **Direct Answer**: Start immediately with a direct, clear answer to the user's question (2-4 sentences max). Do NOT add filler like "Prepared by...", dates, or formal letters.
2. **Key Insights & Highlights**: 3-5 concise bullet points summarizing the most important facts, metrics, or takeaways.
3. **Key Data & Citations**: Include any relevant numbers, calculation results, or links cleanly in a compact format.
4. Keep the entire response concise, high-density, beautifully formatted, and easy to read.`;

  try {
    const { text } = await invokeWithFallback(finalPrompt, state.preferredModel);
    if (text && text.trim().length > 0) {
      return {
        finalReport: text,
        statusMessage: "Research Completed!",
      };
    }
  } catch (err) {
    console.warn("LLM report generation fallback:", err);
  }

  // Fallback structured report
  let fallbackReport = `### Answer: ${state.topic}\n\n`;
  fallbackReport += `${state.initialAnswer}\n\n`;
  if (calculationsText) {
    fallbackReport += `**Calculations:**\n${calculationsText}\n\n`;
  }
  if (citationsSection) {
    fallbackReport += `${citationsSection}\n\n`;
  }

  return {
    finalReport: fallbackReport,
    statusMessage: "Research Completed!",
  };
}
