import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock LLM providers before importing the graph so the real API is never hit.
const createMockLLM = (responses: string[]) => {
  let callIndex = 0;
  return {
    invoke: vi.fn(async () => {
      const content = responses[callIndex % responses.length];
      callIndex += 1;
      return { content };
    }),
  };
};

vi.mock("@langchain/groq", () => ({
  ChatGroq: vi.fn(),
}));

vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}));

import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const ChatGroqMock = vi.mocked(ChatGroq);
const ChatGoogleGenerativeAIMock = vi.mocked(ChatGoogleGenerativeAI);

describe("researchAgentGraph integration", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;

    // Stub all network calls the agent may make so tests run offline.
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      // Wikipedia summary endpoint
      if (url.includes("en.wikipedia.org/api/rest_v1/page/summary")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            type: "standard",
            title: "Artificial Intelligence",
            description: "Intelligence demonstrated by machines",
            extract:
              "AI is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans.",
            content_urls: {
              desktop: { page: "https://en.wikipedia.org/wiki/Artificial_intelligence" },
            },
          }),
        } as Response;
      }

      // Default: return empty 404 so unknown endpoints don't crash the agent.
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    });

    vi.stubEnv("GROQ_API_KEY", "test-groq-key");
    vi.stubEnv("GOOGLE_API_KEY", "");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns a direct answer when the planner decides no tools are needed", async () => {
    const directResponse = JSON.stringify({
      initialAnswer: "The sky appears blue because of Rayleigh scattering.",
      reasoning: "The question is conceptual and can be answered from internal knowledge.",
      toolCalls: [],
      isEnough: true,
    });

    ChatGroqMock.mockImplementation(() => createMockLLM([directResponse, "# Direct Answer\nRayleigh scattering."]) as unknown as ChatGroq);
    ChatGoogleGenerativeAIMock.mockImplementation(() => createMockLLM([]) as unknown as ChatGoogleGenerativeAI);

    // Dynamic import ensures the mock is applied before the graph is compiled.
    const { researchAgentGraph } = await import("../graph");

    const result = await researchAgentGraph.invoke({
      topic: "Why is the sky blue?",
      searchDepth: "standard",
      preferredModel: "openai/gpt-oss-20b",
    });

    expect(result.isEnough).toBe(true);
    expect(result.finalReport).toBeTruthy();
    expect(result.finalReport.length).toBeGreaterThan(0);
    expect(result.toolOutputs).toHaveLength(0);
  });

  it("executes tools and produces a final report when tools are requested", async () => {
    const planResponse = JSON.stringify({
      initialAnswer: "I know AI is intelligence demonstrated by machines.",
      reasoning: "Wikipedia can provide a well-sourced summary.",
      toolCalls: [{ tool: "wikipedia", input: "Artificial intelligence", reason: "Get encyclopedic summary" }],
      isEnough: false,
    });

    const synthesisResponse = JSON.stringify({
      analysis: "Wikipedia provided a clear definition of AI.",
      isEnough: true,
      reasoning: "The Wikipedia result is sufficient to answer the user question.",
      followUpTools: [],
    });

    const reportResponse = "# Artificial Intelligence\nAI is intelligence demonstrated by machines.";

    ChatGroqMock.mockImplementation(() => createMockLLM([planResponse, synthesisResponse, reportResponse]) as unknown as ChatGroq);
    ChatGoogleGenerativeAIMock.mockImplementation(() => createMockLLM([]) as unknown as ChatGoogleGenerativeAI);

    const { researchAgentGraph } = await import("../graph");

    const result = await researchAgentGraph.invoke({
      topic: "What is artificial intelligence?",
      searchDepth: "standard",
      preferredModel: "openai/gpt-oss-20b",
    });

    expect(result.toolOutputs).toHaveLength(1);
    expect(result.toolOutputs?.[0]?.tool).toBe("wikipedia");
    expect(result.finalReport).toBeTruthy();
    expect(result.finalReport.length).toBeGreaterThan(0);
  });
});
