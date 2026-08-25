import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ResearchState, CalculationItem } from "./state";
import { calculateExpression } from "./tools";

function getLLM() {
  // Primary: Use locally downloaded Ollama model (llama3.1:8b)
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
  
  // Match simple arithmetic patterns like "2+2", "100 * 5", "(50 + 20) / 2", "2.5 ^ 3", "sqrt(144)"
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
 * NODE 1: Plan Research & Calculations
 * Identifies subtopics and math expressions needed for the user's prompt.
 */
export async function planResearchNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const currentCount = state.iterationCount || 0;
  const newIteration = currentCount + 1;

  // Direct extraction check first
  const directMath = extractDirectMathExpressions(state.topic);
  const plannedCalculations: CalculationItem[] = [];

  for (const expr of directMath) {
    const res = calculateExpression(expr);
    if (res.result) {
      plannedCalculations.push({ expression: expr, result: res.result });
    }
  }

  if (llm) {
    try {
      const prompt = `You are an AI Analyst equipped with a Math Calculation Tool.
User Prompt: "${state.topic}"

Decompose this request into a JSON object:
1. "subtopics": array of 1-3 analytical topics.
2. "calculations": array of math expressions (e.g. ["2+2"], ["100 * (1.05^5)"]) to evaluate.

Output ONLY valid JSON:
{
  "subtopics": ["..."],
  "calculations": ["..."]
}`;

      const response = await llm.invoke(prompt);
      const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      const cleanJson = text.replace(/```json|```/g, "").trim();
      
      const parsedMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (parsedMatch) {
        const parsed = JSON.parse(parsedMatch[0]);
        if (Array.isArray(parsed.calculations)) {
          for (const expr of parsed.calculations) {
            if (typeof expr === "string" && expr.trim()) {
              const res = calculateExpression(expr);
              if (res.result && !plannedCalculations.some(c => c.expression === expr)) {
                plannedCalculations.push({ expression: expr.trim(), result: res.result });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("LLM planning error:", e);
    }
  }

  return {
    subtopics: [state.topic],
    calculations: plannedCalculations,
    iterationCount: newIteration,
    statusMessage: `Iteration ${newIteration}: Identified ${plannedCalculations.length} math calculation(s)`,
  };
}

/**
 * NODE 2: Execute Calculation Tool
 * Ensures all math expressions for the topic are evaluated.
 */
export async function executeToolsNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const currentCalcs = [...(state.calculations || [])];

  // Also check if any uncalculated math expression exists in topic
  const directMath = extractDirectMathExpressions(state.topic);
  for (const expr of directMath) {
    if (!currentCalcs.some((c) => c.expression === expr)) {
      const res = calculateExpression(expr);
      if (res.result) {
        currentCalcs.push({ expression: expr, result: res.result });
      }
    }
  }

  return {
    calculations: currentCalcs,
    statusMessage: `Executed ${currentCalcs.length} math tool calculation(s)`,
  };
}

/**
 * NODE 3: Synthesize Notes
 * Summarizes calculation outputs and reasoning.
 */
export async function synthesizeNotesNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const calcs = state.calculations || [];

  if (calcs.length > 0) {
    const calcSummary = calcs.map((c) => `${c.expression} = ${c.result}`).join(", ");
    return {
      notes: [`Calculated results: ${calcSummary}`],
      statusMessage: "Synthesized math calculation results",
    };
  }

  if (llm) {
    try {
      const prompt = `Topic: "${state.topic}"
Provide a concise analysis answering the user's prompt.`;

      const response = await llm.invoke(prompt);
      const text = typeof response.content === "string" ? response.content : "";
      if (text) {
        return {
          notes: [text],
          statusMessage: "Synthesized analytical notes",
        };
      }
    } catch (err) {
      console.warn("LLM synthesis error:", err);
    }
  }

  return {
    notes: [`Analyzed prompt: ${state.topic}`],
    statusMessage: "Synthesized analytical notes",
  };
}

/**
 * NODE 4: Generate Final Report
 * Compiles final answer/report using actual calculations and reasoning.
 */
export async function generateReportNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const llm = getLLM();
  const calcs = state.calculations || [];
  const notesText = state.notes.join("\n\n");

  const calcSection = calcs.length > 0
    ? "\n\n### Math Tool Calculation Results\n" +
      calcs.map((c) => `- \`${c.expression}\` = **${c.result}**`).join("\n")
    : "";

  if (llm) {
    try {
      const prompt = `You are a Precise AI Quantitative Analyst.
User Prompt: "${state.topic}"

Calculated Results (Exact outputs from Math Tool):
${calcs.map((c) => `${c.expression} = ${c.result}`).join("\n")}

Analytical Notes:
${notesText}

Requirements:
- Answer the user's prompt directly and accurately.
- DO NOT invent or assume unrelated math calculations (like compound interest) if they are not in the prompt!
- Format nicely with Markdown.`;

      const response = await llm.invoke(prompt);
      const report = typeof response.content === "string" ? response.content : "";
      if (report) {
        return {
          finalReport: report,
          statusMessage: "Report completed!",
        };
      }
    } catch (err) {
      console.warn("LLM report generation error:", err);
    }
  }

  // Exact fallback if LLM is unavailable
  let fallbackReport = `# Analysis Report: ${state.topic}\n\n`;
  if (calcs.length > 0) {
    fallbackReport += `## Calculation Result\n\n`;
    for (const c of calcs) {
      fallbackReport += `**${c.expression}** = \`${c.result}\`\n\n`;
    }
  } else {
    fallbackReport += `${notesText}\n\n`;
  }

  return {
    finalReport: fallbackReport,
    statusMessage: "Report completed!",
  };
}
