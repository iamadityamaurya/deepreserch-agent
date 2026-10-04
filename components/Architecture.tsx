"use client";

export default function Architecture() {
  const steps = [
    {
      name: "01",
      title: "Plan",
      desc: "Breaks the topic into subtopics and tool calls.",
    },
    {
      name: "02",
      title: "Execute",
      desc: "Queries ArXiv, GitHub, HN, web, math & APIs.",
    },
    {
      name: "03",
      title: "Synthesize",
      desc: "Evaluates completeness, cross-references and checks logic.",
    },
    {
      name: "04",
      title: "Report",
      desc: "Formats a cited Markdown report with sources.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-stone-200/70 bg-stone-50 py-20 dark:border-zinc-800/70 dark:bg-zinc-950/60"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
            How it works
          </h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">
            A self-reflecting LangGraph pipeline executed on every question you ask.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-4 hidden h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent lg:block dark:via-zinc-800"
          />

          {steps.map((node) => (
            <div key={node.name} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-teal-600/30 bg-white text-[11px] font-semibold text-teal-600 shadow-sm dark:border-teal-500/40 dark:bg-zinc-900 dark:text-teal-400">
                  {node.name}
                </span>
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              </div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-white">
                {node.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
                {node.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}