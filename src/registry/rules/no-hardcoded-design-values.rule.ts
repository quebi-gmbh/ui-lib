import type { RuleMeta } from "./types"

/**
 * Tier 3 — hardcoded design values. Always banned, with a documented escape hatch.
 */
export const noHardcodedDesignValuesRule: RuleMeta = {
  id: "no-hardcoded-design-values",
  title: "Design values come from quebi tokens, never from literals",
  summary:
    "No arbitrary values (bg-[#f00], text-[13px]), no raw Tailwind palette scales (text-gray-500), no hex in style props. Use the quebi token that means the thing — and if a value is genuinely domain-mandated, record it as an exception with its justification.",
  severity: "error",
  category: "element-usage",
  tier: 3,
  rationale: [
    "A token is a promise that one edit changes every site of a colour, radius, or elevation. A literal opts out of that promise silently: bg-[#0b0f14] looks identical to bg-quebi-bg today and stops matching the day the theme moves, and nothing fails when it does.",
    "Raw palette scales are the same defect wearing a nicer name. text-gray-500 is not a token — it is a hardcoded value with a Tailwind alias, it has no light/dark behaviour of its own, and it is why a page ends up with four almost-identical greys. quebi's tokens (quebi-fg-muted, quebi-fg-subtle, quebi-line) resolve per theme; the palette scales do not.",
    "This tier is where an escape hatch has to exist rather than be pretended away. Some values are mandated by something outside the design system — a regulator's colour scale, a partner's brand mark. Those stay literal, and the rule records where and why, so a real carve-out is not indistinguishable from sloppiness.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx,css}", "src/**/*.{tsx,jsx,css}"],
  classPolicy: {
    allowed: [
      "bg-quebi-*",
      "text-quebi-*",
      "border-quebi-line/*",
      "rounded-quebi-{sm,md,lg}",
      "rounded-full",
      "shadow-quebi-glow",
      "shadow-quebi-glow-strong",
      "text-{xs,sm,base,lg,xl,...}",
      "p-*, m-*, gap-* (the spacing scale)",
    ],
    violating: [
      "bg-[#...], text-[13px], p-[7px] (arbitrary values)",
      "text-gray-500, bg-slate-800 (raw palette scales)",
      "style={{ color: \"#0ea5e9\" }}",
      "rounded-md, rounded-lg (Tailwind's default radii instead of rounded-quebi-*)",
      "brand-*, ink-*, text-body-* (legacy Cellestial tokens)",
    ],
    note: "The spacing and type scales are tokens too — p-4 and text-sm are fine. It is colour, radius, elevation, and off-scale sizes that must resolve to quebi tokens.",
  },
  examples: [
    {
      title: "A hand-built chip with literal values",
      wrong: `<span className="rounded-md bg-[#0ea5e9] px-2 py-1 text-[13px] text-gray-500">
  Beta
</span>`,
      right: `import { Badge } from "@/components/badge"

<Badge intent="info">Beta</Badge>`,
      note: "Three literals and a Tailwind default radius, all to rebuild something the library ships. Tier 3 violations are usually tier 2 violations that went one step further.",
    },
    {
      title: "Translating literals to tokens",
      wrong: `<div className="border border-[#1f2937] bg-[#0b0f14] p-4 text-gray-400">
  <p className="text-[15px] font-semibold text-white">Storage</p>
</div>`,
      right: `<div className="border border-quebi-line/10 bg-quebi-bg p-4 text-quebi-fg-muted">
  <p className="text-base font-semibold text-quebi-fg">Storage</p>
</div>`,
      note: "Same pixels today, and the only version that follows the theme. Note that text-white is a literal too: quebi is dark-first but not dark-only, and quebi-fg is what flips in light mode.",
    },
    {
      title: "The exception, and why it is one",
      source: "src/components/energy-class-badge.tsx",
      wrong: `band: {
  // Approximating the EU energy-label scale with palette tokens
  A: "bg-emerald-600 text-white",
  B: "bg-lime-500 text-black",
}`,
      right: `band: {
  // Official EU energy-label scale (Regulation (EU) 2017/1369, dark-green A ->
  // red G). These colours ARE the label, not quebi brand colours: a token that
  // shifted with the theme would make the chip wrong, not just off-brand.
  A: "bg-[#00843d] text-quebi-fg",
  B: "bg-[#4caf30] text-black",
}`,
      note: "The literal is right here and the token is wrong — which is exactly why the exception has to be written down next to the rule instead of argued case by case in review.",
    },
  ],
  exceptions: [
    {
      scope: "src/components/energy-class-badge.tsx (the seven A-G band colours)",
      paths: ["src/components/energy-class-badge.tsx", "components/ui/energy-class-badge.tsx"],
      reason:
        "The EU energy-label colour scale is specified by regulation. The colours are domain-semantic — they identify the efficiency band the way the letter does — so they must not move with the quebi theme. The surrounding chip (radius, font, neutral fallback, text colours) is on quebi tokens, and the letter is always rendered as text so colour is never the sole signal.",
    },
    {
      scope: "Third-party brand marks (e.g. a provider's logo colour in an integration tile)",
      reason:
        "A partner's brand colour is not ours to theme. Keep it literal, next to a comment naming the brand, and keep everything around it on tokens.",
    },
  ],
  enforcement: {
    kind: "lint",
    // Matches any string literal, not just className attributes: quebi components
    // keep their classes in tailwind-variants objects and cn() calls, so an
    // attribute-only selector misses exactly the code this rule is about — the
    // energy-class-badge band colours among it, which would have left this
    // rule's own documented exception unreachable.
    selector:
      'Literal[value=/\\[#[0-9a-fA-F]{3,8}\\]|\\[\\d+(px|rem|em)\\]|(^|[\\s:])(bg|text|border|ring|fill|stroke|from|via|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}/]',
    message:
      "Hardcoded design value. Use a quebi token: colours -> bg-quebi-*/text-quebi-*/border-quebi-line, radii -> rounded-quebi-{sm,md,lg}, elevation -> shadow-quebi-glow. Raw palette scales (text-gray-500) are hardcoded values too — they do not follow the theme. If the value is mandated by something outside the design system, add it to the rule's exceptions with its justification. See https://ui-lib.quebi.de/rules/no-hardcoded-design-values",
    grep: "\\[#[0-9a-fA-F]{3,8}\\]|\\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}",
    note: "Pairs with a CSS-side check for hex literals outside src/quebi-theme.css, which the JSX selector cannot see. The brand-mark exception is not expressible as a path, so it needs an inline disable comment naming the brand — the last snippet below.",
  },
  tags: ["tokens", "tailwind", "theming", "tier-3"],
}
