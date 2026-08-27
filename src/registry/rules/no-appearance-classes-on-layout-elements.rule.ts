import type { RuleMeta } from "./types"

/**
 * Tier 2 — layout intrinsics. Allowed, gated on what the classes do.
 */
export const noAppearanceClassesOnLayoutElementsRule: RuleMeta = {
  id: "no-appearance-classes-on-layout-elements",
  title: "Layout elements are yours — until their classes describe appearance",
  summary:
    "div, span, section, ul, li and friends are fine and necessary. Keep their classes to layout and spacing; the moment you add bg-*, border-*, rounded-*, shadow-* or text sizing/colour you are rebuilding a component that already exists.",
  severity: "warn",
  category: "element-usage",
  tier: 2,
  rationale: [
    "Layout is the consumer's job. Forcing every flex row through a <Stack> or a <Container> is a known failure mode: it buys nothing, it makes the markup harder to read, and it produces components whose only content is a className passthrough. A plain <div className=\"flex items-center gap-3\"> is correct code and this rule leaves it alone.",
    "Appearance is the library's job. A div that carries bg-*, border-*, rounded-*, shadow-* or text sizing/colour is not laying anything out — it is drawing a surface. Every such div is a Card, Badge, Note, or Panel that was reinvented instead of imported, and it will not follow the next token or theme change. That is the actual signal worth catching, and it is checkable from the class list alone: no scope analysis, no type information.",
    "The gate is class *content*, not class *presence*. \"Any className on a div is suspicious\" is the heuristic that pushes people into wrapper-component soup; \"these prefixes on a div are suspicious\" is the one that finds real duplication.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  classPolicy: {
    allowed: [
      "flex",
      "grid",
      "block",
      "hidden",
      "gap-*",
      "p-*",
      "m-*",
      "space-*",
      "w-*",
      "h-*",
      "min-*",
      "max-*",
      "items-*",
      "justify-*",
      "col-*",
      "row-*",
      "order-*",
      "shrink-*",
      "grow-*",
      "absolute",
      "relative",
      "sticky",
      "inset-*",
      "z-*",
      "overflow-*",
      "text-left",
      "text-center",
      "text-right",
    ],
    violating: [
      "bg-*",
      "border-*",
      "rounded-*",
      "shadow-*",
      "ring-*",
      "divide-*",
      "text-{xs,sm,base,lg,xl,2xl,...}",
      "text-{color}",
      "font-{thin,light,normal,medium,semibold,bold}",
    ],
    note: "text-* splits across both lists: alignment (text-left/center/right) is layout; size and colour are appearance. Responsive and state prefixes do not change the verdict — sm:rounded-quebi-md and hover:bg-quebi-surface are appearance too.",
  },
  examples: [
    {
      title: "An appearance-styled article is a Card",
      source: "src/routes/_index.tsx (features grid)",
      wrong: `<article
  key={title}
  className="group relative rounded-quebi-md border border-quebi-line/10 bg-quebi-surface/[0.02] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-quebi-brand/30 hover:shadow-quebi-glow"
>
  <Icon className="h-6 w-6 text-quebi-brand" strokeWidth={1.75} />
  <h3 className="mt-2 text-xl font-semibold text-quebi-fg">{title}</h3>
  <p className="mt-3 text-sm leading-relaxed text-quebi-fg-muted">{body}</p>
</article>`,
      right: `import { Card, CardDescription, CardTitle } from "@/components/card"

<Card key={title} interactive>
  <Icon data-slot="icon" className="h-6 w-6 text-quebi-brand" strokeWidth={1.75} />
  <CardTitle className="mt-2">{title}</CardTitle>
  <CardDescription className="mt-3">{body}</CardDescription>
</Card>`,
      note: "rounded-quebi-md + border + bg-quebi-surface/[0.02] + the hover lift is Card's default variant, character for character, and `interactive` is the hover treatment. The mt-* spacing is layout and stays.",
    },
    {
      title: "The same surface, hand-built inside a link",
      source: "src/routes/components._index.tsx (catalog grid)",
      wrong: `<Link
  to={\`/components/\${c.slug}\`}
  className="group relative rounded-quebi-md border border-quebi-line/10 bg-quebi-surface/[0.02] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-quebi-brand/30 hover:shadow-quebi-glow"
>
  <h3 className="text-xl font-semibold text-quebi-fg">{c.name}</h3>
</Link>`,
      right: `import { Card, CardTitle } from "@/components/card"

<Link to={\`/components/\${c.slug}\`} className="group block">
  <Card interactive>
    <CardTitle>{c.name}</CardTitle>
  </Card>
</Link>`,
      note: "Two copies of the same surface in two routes is how a design system starts drifting. The Link keeps only its layout classes.",
    },
    {
      title: "Do not launder plain layout through a component",
      wrong: `<Card className="flex items-center gap-3 border-0 bg-transparent p-0">
  <Avatar src={user.avatar} />
  <Text>{user.name}</Text>
</Card>`,
      right: `<div className="flex items-center gap-3">
  <Avatar src={user.avatar} />
  <Text>{user.name}</Text>
</div>`,
      note: "The over-correction. If you have to strip a component's appearance to use it, you wanted a div. Layout is yours.",
    },
  ],
  exceptions: [
    {
      scope: "src/components/*.tsx (the library's own source)",
      reason:
        "Components are made of appearance-styled divs — that is what a component is. The rule is about app code reimplementing a surface the library already ships.",
    },
    {
      scope: "A one-off surface the library genuinely has no component for",
      reason:
        "The rule catches duplication, not novelty. If nothing in the catalog fits, write the div — and treat it as a signal that the library is missing a component, i.e. open an issue rather than copy the div into a second file.",
    },
  ],
  enforcement: {
    kind: "lint",
    selector:
      'JSXAttribute[name.name="className"][value.value=/(^|[\\s:])(bg-|border-|rounded-|shadow-|ring-|divide-|font-(thin|light|normal|medium|semibold|bold|extrabold|black)|text-(xs|sm|base|lg|[2-9]?xl)\\b)/]',
    note: "Only catches static string classNames, which is the common case; template literals and cn() calls need the rule to look at the concatenated parts. Nothing consumes the selector yet — this repo has no lint infrastructure.",
  },
  tags: ["elements", "layout", "tailwind", "tier-2"],
}
