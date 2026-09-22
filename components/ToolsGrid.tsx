"use client";

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
} from "lucide-react";

interface ToolsGridProps {
  onSelectToolSample?: (sampleQuery: string) => void;
}

export default function ToolsGrid({ onSelectToolSample }: ToolsGridProps) {
  const catalog = [
    {
      name: "Wikipedia",
      icon: <BookOpen className="w-4 h-4 text-sky-400" />,
      description: "Encyclopedic summaries, scientific concepts, and factual context.",
      sample: "Wikipedia summary of James Webb Space Telescope discoveries",
      border: "hover:border-sky-500/40 bg-sky-950/10",
    },
    {
      name: "ArXiv Preprints",
      icon: <FileText className="w-4 h-4 text-blue-400" />,
      description: "Academic research papers in CS, Physics, Math, and AI/ML.",
      sample: "ArXiv papers on transformer linear attention mechanisms",
      border: "hover:border-blue-500/40 bg-blue-950/10",
    },
    {
      name: "GitHub Analysis",
      icon: <Code2 className="w-4 h-4 text-purple-400" />,
      description: "Repository statistics, open issues, star metrics, and READMEs.",
      sample: "Analyze github.com/facebook/react repository statistics",
      border: "hover:border-purple-500/40 bg-purple-950/10",
    },
    {
      name: "World Bank Data",
      icon: <Landmark className="w-4 h-4 text-emerald-400" />,
      description: "Macroeconomic indicators (GDP, inflation, unemployment) via World Bank.",
      sample: "World Bank economic metrics for United States vs India",
      border: "hover:border-emerald-500/40 bg-emerald-950/10",
    },
    {
      name: "Global Weather",
      icon: <CloudSun className="w-4 h-4 text-yellow-400" />,
      description: "Live temperatures, humidity, wind speed, and 7-day forecast via Open-Meteo.",
      sample: "Weather forecast for Tokyo and London",
      border: "hover:border-yellow-500/40 bg-yellow-950/10",
    },
    {
      name: "IP & WHOIS Inspector",
      icon: <Network className="w-4 h-4 text-teal-400" />,
      description: "IP geolocation, ISP registration, ASN routing, and domain inspection.",
      sample: "Inspect IP geolocation and ISP details for 8.8.8.8",
      border: "hover:border-teal-500/40 bg-teal-950/10",
    },
    {
      name: "Reddit Community",
      icon: <MessageSquare className="w-4 h-4 text-red-400" />,
      description: "Reddit discussion threads, sentiment analysis, and top subreddit topics.",
      sample: "Search r/MachineLearning for latest Claude 3.7 benchmarks",
      border: "hover:border-red-500/40 bg-red-950/10",
    },
    {
      name: "Hacker News",
      icon: <Share2 className="w-4 h-4 text-orange-400" />,
      description: "Developer community discussions, benchmark feedback, and sentiment.",
      sample: "Postgres vs SQLite for AI agents on Hacker News",
      border: "hover:border-orange-500/40 bg-orange-950/10",
    },
    {
      name: "REST Demographics",
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      description: "Live population, capitals, languages, and geographic statistics.",
      sample: "Compare population, capital, and currency of Germany vs India",
      border: "hover:border-emerald-500/40 bg-emerald-950/10",
    },
    {
      name: "Markets & Crypto",
      icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
      description: "Real-time cryptocurrency quotes, stock tickers, and price movements.",
      sample: "BTC and ETH 24h market movement and price trends",
      border: "hover:border-amber-500/40 bg-amber-950/10",
    },
    {
      name: "DNS Resolution",
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
      description: "Domain IPv4 records, MX mail servers, and TXT security records.",
      sample: "Inspect DNS and mail server records for vercel.com",
      border: "hover:border-cyan-500/40 bg-cyan-950/10",
    },
    {
      name: "AST Math Engine",
      icon: <Calculator className="w-4 h-4 text-pink-400" />,
      description: "High-precision AST evaluation for growth, formulas, and ratios.",
      sample: "Calculate 5000 * (1 + 0.07/12)^(12*10)",
      border: "hover:border-pink-500/40 bg-pink-950/10",
    },
    {
      name: "Live Web Stream",
      icon: <Search className="w-4 h-4 text-indigo-400" />,
      description: "Live search queries and Cheerio web page content extraction.",
      sample: "Next.js 16 latest features and server actions updates",
      border: "hover:border-indigo-500/40 bg-indigo-950/10",
    },
  ];

  return (
    <section className="py-12 border-t border-slate-800/60 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-left space-y-1">
          <h2 className="text-lg font-semibold text-slate-200">Integrated Tool Suite</h2>
          <p className="text-xs text-slate-400">
            Automated tool execution pipeline for deep empirical retrieval.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {catalog.map((tool, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (onSelectToolSample) onSelectToolSample(tool.sample);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 ${tool.border} transition-all cursor-pointer space-y-2 group`}
            >
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                  {tool.icon}
                </div>
                <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  {tool.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
