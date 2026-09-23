# DeepQuery — Autonomous Multi-Tool Research Agent

A Next.js 16 application that runs an autonomous research agent powered by **LangGraph**, **Groq**, and **Google Gemini**. Enter any research question and the agent plans, executes live tools in parallel, synthesizes findings, and streams back a cited Markdown report.

![Tech Stack](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![LangGraph](https://img.shields.io/badge/LangGraph-1.4-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## Features

- **Autonomous Graph Orchestration** — LangGraph state machine decides which tools to invoke based on your question.
- **13 Live Integrated Tools** — Wikipedia, ArXiv, GitHub, Hacker News, Reddit, Demographics, Finance, World Bank, Weather, DNS, IP/WHOIS, Web Search, and a mathjs AST calculator.
- **Multi-Provider LLM Fallbacks** — Primary Groq model with fallback models + Google Gemini fallback.
- **Streaming Progress UI** — Real-time SSE updates as each graph node runs.
- **Cited Markdown Reports** — Final output includes sources, calculations, and tool findings.
- **Export Results** — Copy or download the report as Markdown or JSON.

## Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│ 1. Plan         │  Decide if external tools are needed
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
Execute    Generate (direct answer)
Tools
    │
    ▼
┌─────────────────┐
│ 2. Execute      │  Run selected tools in parallel
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Synthesize   │  Evaluate completeness; loop if needed
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Report       │  Format Markdown response with citations
└─────────────────┘
```

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a `.env` file with at least one LLM provider key:

```bash
GROQ_API_KEY=your_groq_key_here
GOOGLE_API_KEY=your_google_key_here   # optional fallback
TAVILY_API_KEY=your_tavily_key_here   # optional for premium web search
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |

## Project Structure

```
app/
  api/research/route.ts   # SSE streaming research endpoint
  page.tsx                # Main research UI
  layout.tsx              # Root layout & metadata
  globals.css             # Tailwind / global styles
components/
  Navbar.tsx              # Brand, depth selector, model picker
  Hero.tsx                # Search input and sample prompts
  Features.tsx            # Capability highlights
  Architecture.tsx        # Pipeline overview
  ToolsGrid.tsx           # Interactive tool catalog
  Footer.tsx
lib/agent/
  graph.ts                # LangGraph workflow definition
  nodes.ts                # Plan, execute, synthesize, report nodes
  state.ts                # Shared graph state schema
  tools.ts                # Tool implementations and catalog
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | **Yes** | Primary LLM provider via Groq |
| `GOOGLE_API_KEY` | No | Gemini fallback provider |
| `TAVILY_API_KEY` | No | Premium web search fallback |
| `GROQ_MODEL` | No | Override default Groq model |
| `GEMINI_MODEL` | No | Override default Gemini model |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Agent Framework:** LangGraph + LangChain
- **LLMs:** Groq, Google Gemini
- **Tools:** mathjs, cheerio, DuckDuckGo, Wikipedia, ArXiv, GitHub, HN, Reddit, Open-Meteo, World Bank, ip-api, CoinGecko, Binance, Nasdaq

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Groq Documentation](https://console.groq.com/docs)

## License

Private project — see `package.json` for details.
