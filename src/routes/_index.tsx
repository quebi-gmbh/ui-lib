import { Link as RouterLink } from "react-router"
import { metaRegistry } from "@/registry/meta"
import { seo } from "@/lib/seo"
import { CodeBlock } from "@/site/code-block"
import { Eyebrow } from "@/components/eyebrow"
import { IndexList } from "@/components/index-list"
import { Link } from "@/components/link"
import { LowTitle } from "@/components/low-title"
import { Snippet } from "@/components/snippet"
import { Stage } from "@/components/stage"
import { skillHighlighted, skillSource } from "@/registry/skill.generated"

export function meta() {
  return seo({
    title: "quebi ui-lib — React component library",
    exactTitle: true,
    description: `A React component library of ${metaRegistry.length} accessible components styled with the quebi design system. Copy-paste source, no install required. Built for humans and AI agents.`,
    path: "/",
  })
}

/** The design's text-link CTA, on the router's Link so internal routes stay client-side. */
const CTA =
  "font-display text-quebi-link text-quebi-fg underline decoration-1 underline-offset-5 transition-[text-underline-offset] duration-150 hover:underline-offset-8"

function Hero() {
  return (
    <Stage variant="cinematic" className="md:min-h-[calc(100svh-4rem)]">
      <Eyebrow>react component library — {metaRegistry.length} components</Eyebrow>
      <LowTitle
        as="h1"
        title="components for quebi apps."
        action={
          <RouterLink to="/components" className={CTA}>
            browse components →
          </RouterLink>
        }
      >
        Accessible React components in the quebi design system. Copy the source into your project,
        no install required — written to be read by people and pulled by agents.
      </LowTitle>
    </Stage>
  )
}

/**
 * A landing-page section: the design's `.qb-section` — a display-s heading on
 * the left, a mono count on the right, then the content. Sections sit in the
 * same shell as the header and step down the page at the 120px rhythm.
 */
function HomeSection({
  title,
  count,
  children,
}: {
  title: string
  count: string
  children: React.ReactNode
}) {
  return (
    <section className="quebi-shell pt-quebi-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-quebi-display-s text-quebi-fg">{title}</h2>
        <Eyebrow as="span">{count}</Eyebrow>
      </div>
      {children}
    </section>
  )
}

const features = [
  {
    label: "a",
    title: "own your components",
    body: "Every component ships as plain source you drop into your project. Read it, edit it, keep it.",
  },
  {
    label: "b",
    title: "discoverable by agents",
    body: "A static JSON index and per-component source endpoints let coding agents search and pull components.",
  },
  {
    label: "c",
    title: "forms to charts",
    body: "Charts, forms, overlays, navigation and data display, with a Conform-bound variant of every form element.",
  },
]

function Features() {
  return (
    <HomeSection title="what you get" count="01">
      <div className="grid grid-cols-1 border-t border-quebi-rule md:grid-cols-3">
        {features.map(({ label, title, body }) => (
          <div
            key={title}
            className="border-b border-quebi-hairline py-4 md:mr-5 md:border-r md:border-b-0 md:pr-5 md:last:mr-0 md:last:border-r-0"
          >
            <Eyebrow as="span">{label}</Eyebrow>
            <h3 className="mt-2 mb-2 font-display text-quebi-title text-quebi-fg">{title}</h3>
            <p className="max-w-[40ch] text-quebi-body-s text-quebi-fg-muted">{body}</p>
          </div>
        ))}
      </div>
    </HomeSection>
  )
}

const endpoints = [
  { url: "/llms.txt", desc: "agent entry point" },
  { url: "/api/index.json", desc: "every component, metadata, dependencies" },
  { url: "/api/components/<name>.json", desc: "one component: metadata and source" },
  { url: "/r/<name>.json", desc: "shadcn registry item" },
]

function ForAgents() {
  return (
    <HomeSection title="for agents" count={`${String(endpoints.length).padStart(2, "0")} endpoints`}>
      <p className="mb-6 max-w-[60ch] text-quebi-body text-quebi-fg-muted">
        Every component is published as a static, fetchable API. Point your coding agent at the
        endpoints below — no scraping, no auth. Start with{" "}
        <Link href="/llms.txt">llms.txt</Link>, which documents the whole workflow.
      </p>
      <IndexList
        items={endpoints.map((e) => ({
          id: e.url,
          title: <span className="font-mono text-quebi-code">{e.url}</span>,
          meta: e.desc,
          href: e.url.includes("<") ? "/api/index.json" : e.url,
        }))}
      />
      <Eyebrow className="mt-quebi-8 mb-2">add a component with the shadcn cli</Eyebrow>
      <Snippet symbol="" text="npx shadcn@latest add https://ui-lib.quebi.de/r/button.json" />
    </HomeSection>
  )
}

function ClaudeSkill() {
  return (
    <HomeSection title="claude skill" count="03 steps">
      <p className="mb-6 max-w-[60ch] text-quebi-body text-quebi-fg-muted">
        Drop this skill into Claude Code and it will pull components from the live registry instead
        of writing them from scratch — for any React project, not just this one.
      </p>
      <IndexList
        className="mb-8"
        items={[
          {
            id: "save",
            title: "save the skill",
            meta: ".claude/skills/quebi-ui-lib/SKILL.md",
          },
          {
            id: "download",
            title: "or download it",
            meta: <Link href="/skills/quebi-ui-lib/SKILL.md">SKILL.md</Link>,
          },
          {
            id: "run",
            title: "ask for a component",
            meta: "the skill activates in Claude Code",
          },
        ]}
      />
      <CodeBlock html={skillHighlighted} code={skillSource} />
    </HomeSection>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <ForAgents />
      <ClaudeSkill />
    </>
  )
}
