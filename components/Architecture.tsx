"use client";

export default function Architecture() {
  const steps = [
    {
      name: "1. Plan",
      title: "Query Deconstruction",
      desc: "Breaks topic into subtopics & tool calls",
      color: "text-purple-400 border-purple-500/20 bg-purple-950/10",
    },
    {
      name: "2. Execute",
      title: "Parallel Tool Retrieval",
      desc: "Queries ArXiv, GitHub, HN, Web, Math & APIs",
      color: "text-sky-400 border-sky-500/20 bg-sky-950/10",
    },
    {
      name: "3. Synthesize",
      title: "Iterative Reflection",
      desc: "Evaluates completeness & checks logic",
      color: "text-amber-400 border-amber-500/20 bg-amber-950/10",
    },
    {
      name: "4. Report",
      title: "Cited Report Stream",
      desc: "Formats Markdown report with sources",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/10",
    },
  ];

  return (
    <section className="py-10 border-t border-slate-800/60 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-left space-y-1">
          <h2 className="text-lg font-semibold text-slate-200">LangGraph Pipeline</h2>
          <p className="text-xs text-slate-400">
            Self-reflecting agent workflow executed on every research query.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((node, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1 ${node.color}`}
            >
              <span className="text-[11px] font-mono font-semibold">{node.name}</span>
              <h3 className="text-xs font-semibold text-slate-200">{node.title}</h3>
              <p className="text-[11px] text-slate-400">{node.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
