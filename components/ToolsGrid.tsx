"use client";

import Link from "next/link";
import {
  BookOpen,
  Calculator,
  Code2,
  FileText,
  Globe,
  Share2,
  ShieldCheck,
  TrendingUp,
  Search,
  Landmark,
  CloudSun,
  Network,
  MessageSquare,
  Newspaper,
  Coins,
} from "lucide-react";

const catalog = [
  {
    name: "Wikipedia",
    icon: <BookOpen className="h-4 w-4" />,
    description: "Encyclopedic summaries, scientific concepts, and factual context.",
    sample: "Wikipedia summary of James Webb Space Telescope discoveries",
  },
  {
    name: "ArXiv Preprints",
    icon: <FileText className="h-4 w-4" />,
    description: "Academic research papers in CS, Physics, Math, and AI/ML.",
    sample: "ArXiv papers on transformer linear attention mechanisms",
  },
  {
    name: "GitHub Analysis",
    icon: <Code2 className="h-4 w-4" />,
    description: "Repository statistics, open issues, star metrics, and READMEs.",
    sample: "Analyze github.com/facebook/react repository statistics",
  },
  {
    name: "World Bank Data",
    icon: <Landmark className="h-4 w-4" />,
    description: "Macroeconomic indicators (GDP, inflation, unemployment) via World Bank.",
    sample: "World Bank economic metrics for United States vs India",
  },
  {
    name: "Global Weather",
    icon: <CloudSun className="h-4 w-4" />,
    description: "Live temperatures, humidity, wind speed, and 7-day forecast via Open-Meteo.",
    sample: "Weather forecast for Tokyo and London",
  },
  {
    name: "IP & WHOIS Inspector",
    icon: <Network className="h-4 w-4" />,
    description: "IP geolocation, ISP registration, ASN routing, and domain inspection.",
    sample: "Inspect IP geolocation and ISP details for 8.8.8.8",
  },
  {
    name: "Reddit Community",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "Reddit discussion threads, sentiment analysis, and top subreddit topics.",
    sample: "Search r/MachineLearning for latest Claude 3.7 benchmarks",
  },
  {
    name: "Hacker News",
    icon: <Share2 className="h-4 w-4" />,
    description: "Developer community discussions, benchmark feedback, and sentiment.",
    sample: "Postgres vs SQLite for AI agents on Hacker News",
  },
  {
    name: "GDELT Global News",
    icon: <Newspaper className="h-4 w-4" />,
    description: "Worldwide news coverage and event timelines from thousands of outlets.",
    sample: "Global news coverage of semiconductor export controls",
  },
  {
    name: "REST Demographics",
    icon: <Globe className="h-4 w-4" />,
    description: "Live population, capitals, languages, and geographic statistics.",
    sample: "Compare population, capital, and currency of Germany vs India",
  },
  {
    name: "Markets & Crypto",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "Real-time cryptocurrency quotes, stock tickers, and price movements.",
    sample: "BTC and ETH 24h market movement and price trends",
  },
  {
    name: "Currency Exchange",
    icon: <Coins className="h-4 w-4" />,
    description: "Official ECB reference rates and conversion for 30+ world currencies.",
    sample: "Convert 100 USD to EUR exchange rate",
  },
  {
    name: "DNS Resolution",
    icon: <ShieldCheck className="h-4 w-4" />,
    description: "Domain IPv4 records, MX mail servers, and TXT security records.",
    sample: "Inspect DNS and mail server records for vercel.com",
  },
  {
    name: "AST Math Engine",
    icon: <Calculator className="h-4 w-4" />,
    description: "High-precision AST evaluation for growth, formulas, and ratios.",
    sample: "Calculate 5000 * (1 + 0.07/12)^(12*10)",
  },
  {
    name: "Live Web Stream",
    icon: <Search className="h-4 w-4" />,
    description: "Live search queries and Cheerio web page content extraction.",
    sample: "Next.js 16 latest features and server actions updates",
  },
];

export default function ToolsGrid() {
  return (
    <section
      id="tools"
      className="scroll-mt-20 border-t border-stone-200/70 bg-white py-20 dark:border-zinc-800/70 dark:bg-zinc-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
            A tool for every question
          </h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">
            The agent picks the right instruments automatically. Click any tool to try a sample
            query in the app.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((tool) => (
            <Link
              key={tool.name}
              href={`/chat?q=${encodeURIComponent(tool.sample)}`}
              className="group rounded-2xl border border-stone-200 bg-stone-50/60 p-4 transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-teal-500/40 dark:hover:bg-zinc-900"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                  {tool.icon}
                </span>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">
                  {tool.name}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-stone-500 dark:text-zinc-400">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}