import { Link } from "react-router-dom"
import { ArrowRight, Copy, Bot, Boxes } from "lucide-react"

function Hero() {
  return (
    <header className="relative overflow-hidden bg-quebi-bg">
      {/* Layer 1 — gradient circles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 z-[1] h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-quebi-brand/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 z-[1] h-[300px] w-[300px] rounded-full bg-purple-400/20 blur-3xl"
      />
      {/* Layer 2 — grid overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-quebi-grid" />

      {/* Foreground */}
      <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-quebi-content flex-col items-center justify-center px-6 py-32 text-center">
        <span className="quebi-eyebrow mb-4">React component library</span>
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
          ui-lib
        </h1>
        <p className="mt-6 max-w-xl text-lg text-quebi-fg-muted">
          A React component library. Copy-paste the source, no install required. Built for humans and
          for AI agents.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to="/components"
            className="inline-flex items-center gap-2 rounded-quebi-sm bg-quebi-brand px-6 py-3 font-semibold text-quebi-bg transition-all duration-200 hover:scale-[1.02] hover:bg-quebi-brand-hover hover:shadow-quebi-glow-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50"
          >
            Browse components
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/quebi-gmbh"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-quebi-sm border border-cyan-500/20 px-6 py-3 text-white transition-colors duration-200 hover:border-quebi-brand hover:text-quebi-brand"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}

const features = [
  {
    icon: Copy,
    eyebrow: "Copy-paste",
    title: "Own your components",
    body: "Every component ships as plain source you drop into your project. No black-box dependency — read it, edit it, keep it.",
  },
  {
    icon: Bot,
    eyebrow: "AI-ready",
    title: "Discoverable by agents",
    body: "A static JSON index and per-component source endpoints let coding agents search and pull components programmatically.",
  },
  {
    icon: Boxes,
    eyebrow: "95 components",
    title: "Batteries included",
    body: "Charts, forms, overlays, navigation, data display — plus Conform-bound variants for every form element.",
  },
]

function Features() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-24">
      <div className="mx-auto max-w-quebi-content text-center">
        <span className="quebi-eyebrow">What you get</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Components that solve real problems
        </h2>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {features.map(({ icon: Icon, eyebrow, title, body }) => (
          <article
            key={title}
            className="group relative rounded-quebi-md border border-cyan-500/10 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-quebi-brand/30 hover:shadow-quebi-glow"
          >
            <Icon className="h-6 w-6 text-quebi-brand" strokeWidth={1.75} />
            <span className="mt-4 block text-xs font-medium uppercase tracking-wider text-quebi-brand">
              {eyebrow}
            </span>
            <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-quebi-fg-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function ForAgents() {
  const endpoints = [
    { url: "/llms.txt", desc: "Agent entry point — how to discover and pull components" },
    { url: "/api/index.json", desc: "Full catalog: every component, metadata, dependencies" },
    { url: "/api/components/<name>.json", desc: "One component: metadata + raw source" },
    { url: "/r/<name>.json", desc: "shadcn-compatible registry item" },
  ]
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-24">
      <div className="mx-auto max-w-quebi-content text-center">
        <span className="quebi-eyebrow">For AI agents</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Built to be pulled by agents
        </h2>
        <p className="mt-4 text-base leading-relaxed text-quebi-fg-muted">
          Every component is published as a static, fetchable API. Point your coding agent at the
          endpoints below — no scraping, no auth.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-quebi-brand">
          Add a component with the shadcn CLI
        </p>
        <pre className="overflow-x-auto rounded-quebi-md border border-cyan-500/10 bg-quebi-bg p-4 text-sm text-white">
          <code>npx shadcn@latest add https://ui-lib.quebi.de/r/button.json</code>
        </pre>

        <p className="mt-8 mb-3 text-xs font-medium uppercase tracking-wider text-quebi-brand">
          Or fetch the API directly
        </p>
        <ul className="divide-y divide-cyan-500/10 overflow-hidden rounded-quebi-md border border-cyan-500/10">
          {endpoints.map((e) => (
            <li key={e.url} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
              <a
                href={e.url.includes("<") ? "/api/index.json" : e.url}
                className="shrink-0 font-mono text-sm text-quebi-brand transition-colors duration-200 hover:text-quebi-brand-hover"
              >
                {e.url}
              </a>
              <span className="text-sm text-quebi-fg-muted">{e.desc}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-sm text-quebi-fg-subtle">
          Start with{" "}
          <a href="/llms.txt" className="text-quebi-brand hover:text-quebi-brand-hover">
            llms.txt
          </a>{" "}
          — it documents the whole workflow for agents.
        </p>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <ForAgents />
    </>
  )
}
