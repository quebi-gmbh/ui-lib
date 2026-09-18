import type { RuleMeta } from "./types"

/**
 * Element usage, tier 6 — the last thing an agent hand-rolls after it has
 * stopped hand-rolling the components: the formatting of the values inside them.
 */
export const formatValuesThroughTheLibraryRule: RuleMeta = {
  id: "format-values-through-the-library",
  title: "Format numbers and dates through the library, with an explicit locale",
  navTitle: "Value formatting",
  summary:
    "toLocaleString() and a bare new Intl.NumberFormat() resolve against whatever locale the runtime happens to have, and a .toString() rendered as JSX text prints the wire format in all of them. Render FormattedNumber / FormattedDate, or call formatNumber / formatCurrency with a locale you passed in.",
  severity: "error",
  category: "element-usage",
  tier: 6,
  failureMode:
    "An agent needs `8420` to read as `8.420` and writes `value.toLocaleString()`, because it is one call and it renders correctly on the machine that wrote it. It is the same shortest-path-to-something-that-looks-right reflex that produces a hand-built card, applied to the value inside the card.",
  rationale: [
    "A bare `toLocaleString()` is not a formatting choice, it is the absence of one. With no locale argument the result comes from the runtime's default — the server's ICU default in Node, the user's browser setting in the client — so the same value renders `8,420` in one place and `8.420` in another with nothing in the code to explain the difference.",
    "In a prerendered app that is a hydration bug, not a cosmetic one. This site sets `ssr: false` with a `prerender()` list, so every page is HTML generated in Node and then hydrated in the browser: the two runs format the same number against two different default locales, React finds text it did not expect, and what it does about it is not something to reason about per-component. The fix is the same in either direction — say which locale you mean.",
    "The library's formatters are where that decision is written down once. `FormattedNumber`, `FormattedCurrency` and `FormattedPercentage` render the value through `Intl.NumberFormat` with a locale from the nearest `I18nProvider` (mount one, or pass `locale`); `FormattedDate` pins both a locale and an IANA time zone, so a date is not silently reinterpreted in the reader's zone. For string contexts where a component cannot go — a chart tick callback, a `valueFormatter`, an aria-label — `formatNumber(value, locale)` and `formatCurrency(value, locale)` take the locale as an argument, which is the point: it cannot be forgotten.",
    "`CalendarDate#toString()` and `Time#toString()` from `@internationalized/date` fail the same way from the other end, and worse. They are not locale-dependent at all — they return ISO 8601, the wire format — so instead of a different spelling in each runtime you get the serialization in every runtime: `2026-06-30` in a Description sitting a few pixels under a trigger whose segments spell the same day `30.6.2026`. GritQL cannot see types, so \"a value whose type comes from @internationalized/date\" is not a pattern that can be written. The position is. A `.toString()` rendered as JSX *text* is either redundant — React stringifies whatever you hand it — or a serialization leak, and neither is something anyone writes on purpose, so that position, and only that position, is what the check matches.",
    "Two honest limits. `FormattedStorage` is not a byte formatter — it takes gigabytes and rolls up to TB, with no KB, MB or PB and no binary-vs-decimal choice — so hand-rolled byte arithmetic is outside what this rule can redirect you to. And `new Intl.DateTimeFormat().resolvedOptions().timeZone`, the standard way to ask what zone you are in, is a construction like any other and is reported; that one is a suppression with a reason, not a rewrite.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  replacements: [
    {
      element: "Number.toLocaleString()",
      use: [
        {
          name: "FormattedNumber",
          from: "@/components/formatted-number",
          slug: "formatted-number",
          when: "rendering a number in JSX",
        },
        {
          name: "formatNumber",
          from: "@/components/formatted-number",
          slug: "formatted-number",
          when: "a string is needed — it takes the locale as its second argument",
        },
        {
          name: "useFormatNumber",
          from: "@/components/formatted-number",
          slug: "formatted-number",
          when: "a string is needed inside a component, with the locale read from the I18nProvider",
        },
      ],
    },
    {
      element: "Number.toLocaleString() for money",
      use: [
        {
          name: "FormattedCurrency",
          from: "@/components/formatted-number",
          slug: "formatted-number",
          when: "rendering an amount in JSX",
        },
        {
          name: "formatCurrency",
          from: "@/components/formatted-number",
          slug: "formatted-number",
          when: "a string is needed — EUR, always two decimals",
        },
      ],
    },
    {
      element: "Date.toLocaleDateString() / new Intl.DateTimeFormat()",
      use: [
        {
          name: "FormattedDate",
          from: "@/components/formatted-date",
          slug: "formatted-date",
          when: "an absolute date or time — it renders a semantic <time> with a pinned locale and time zone",
        },
      ],
      note: "Relative output (\"3 days ago\") depends on when it is rendered, so pass `now` when the result has to be identical on the server and in the browser.",
    },
    {
      element: "CalendarDate.toString() / Time.toString() rendered into JSX",
      use: [
        {
          name: "FormattedDate",
          from: "@/components/formatted-date",
          slug: "formatted-date",
          when: "echoing a picker's value back to the reader — the segments above it are localized, so the echo has to be too",
        },
      ],
      note: "A `CalendarDate` has no time of day and a `Time` has no day at all, so formatting either through Intl means choosing both plus a zone. Anchor the value with `toZoned(value, zone)` and pass that same `zone` to FormattedDate: anchoring in the viewer's zone instead puts the echo a day away from the segments for any reader west of the one you format in.",
    },
  ],
  examples: [
    {
      title: "A value formatter in a gallery example",
      source: "src/registry/bar-list.examples.tsx",
      sourceFixed: true,
      wrong: `<BarList
  data={pages}
  valueFormatter={(value) => value.toLocaleString()}
  className="w-full max-w-md"
/>`,
      right: `import { formatNumber } from "@/components/formatted-number"

<BarList
  data={pages}
  valueFormatter={(value) => formatNumber(value, "de-DE")}
  className="w-full max-w-md"
/>`,
      note: "A callback returning a string cannot render a component, which is exactly what formatNumber is for. The locale is now in the code rather than in the environment that happens to run it.",
    },
    {
      title: "A number rendered straight into JSX",
      source: "src/registry/leaderboard.examples.tsx",
      sourceFixed: true,
      wrong: `<LeaderboardEnd>{player.score.toLocaleString()}</LeaderboardEnd>`,
      right: `import { FormattedNumber } from "@/components/formatted-number"

<LeaderboardEnd>
  <FormattedNumber value={player.score} />
</LeaderboardEnd>`,
      note: "FormattedNumber reads the locale from the nearest I18nProvider, so one decision at the root of the app covers every number under it — and the same markup is produced on the server and in the browser.",
    },
    {
      title: "A controlled picker echoing its own value",
      source: "src/registry/date-picker.examples.tsx",
      sourceFixed: true,
      wrong: `<Description>{value ? value.toString() : "No date selected"}</Description>`,
      right: `import { toZoned } from "@internationalized/date"
import { FormattedDate } from "@/components/formatted-date"

<Description>
  {value ? (
    <FormattedDate
      date={toZoned(value, DISPLAY_TIME_ZONE).toDate()}
      timeZone={DISPLAY_TIME_ZONE}
      dateStyle="medium"
    />
  ) : (
    "No date selected"
  )}
</Description>`,
      note: "Four sibling examples printed 2026-06-30 under a trigger whose segments spelled 30.6.2026, and lint was silent for the whole life of the rule: toString() is on every object in the language, so it can only be matched by where it sits. Here it sits in a JSX expression child, which is the one position where nobody means it.",
    },
  ],
  exceptions: [
    {
      scope: "Your copy of the ui-lib component source (components/ui/**)",
      paths: ["src/components/**", "components/ui/**"],
      reason:
        "The formatters this rule points at are implemented there: FormattedNumber, FormattedDate and the Calendar's month/year labels format through Intl themselves — via the cached constructors in `@/lib/intl`, which build one formatter per (locale, options) pair instead of one per rendered value — which is what makes the rest of the codebase able not to.",
    },
    {
      scope: "Asking the platform what it resolved, rather than formatting with it",
      reason:
        "`new Intl.DateTimeFormat().resolvedOptions().timeZone` is the standard way to read the current time zone and has no library equivalent. Written with `new` it matches the pattern, so it needs an inline suppression saying that is what it is — the one false positive this check is known to produce. (Written without `new`, which is how the idiom is usually spelled, it is not matched at all.)",
    },
  ],
  enforcement: {
    kind: "lint",
    // The call has to be matched as a template, not as JsCallExpression(callee =
    // r"..."), which compiles and never matches. `$args` also matches an empty
    // argument list, which is the whole point: `n.toLocaleString()` is the case
    // this rule is about.
    //
    // The `toString()` arm is matched by *position*, because it cannot be
    // matched by name: every object in the language has the method. `until`
    // is what makes "in a JSX expression child" mean the child itself rather
    // than anything anywhere beneath one — without it, `key={id.toString()}`
    // inside a `{items.map(...)}` has a JsxExpressionChild ancestor and is
    // reported. It also takes no `$args`: `n.toString(16)` is a radix
    // conversion, not a date reaching the DOM.
    biome: {
      via: "plugin",
      pattern: `or {
  \`$value.toLocaleDateString($args)\`,
  \`$value.toLocaleTimeString($args)\`,
  \`$value.toLocaleString($args)\`,
  \`new Intl.DateTimeFormat($args)\`,
  \`new Intl.NumberFormat($args)\`,
  \`new Intl.RelativeTimeFormat($args)\`,
  \`$value.toString()\` where {
    $value <: within JsxExpressionChild() until or {
      JsxAttributeInitializerClause(),
      JsArrowFunctionExpression(),
      JsFunctionExpression()
    }
  }
} as $call where {
  $call <: not within JsFunctionDeclaration(id = r"^(?:format[A-Z]|use[A-Z]).*")`,
    },
    message:
      "This puts a value on the page without the library formatter: a toLocale* call or an Intl construction formats against whatever locale the runtime has, which differs between the prerender and the browser, and a .toString() rendered as JSX text prints the wire format in both. Render <FormattedNumber>, <FormattedCurrency> or <FormattedDate> from @/components/formatted-number and @/components/formatted-date, or call formatNumber(value, locale) / formatCurrency(value, locale) where a string is needed. See https://ui-lib.quebi.de/rules/format-values-through-the-library",
    grep: "\\.toLocale(String|DateString|TimeString)\\(|new Intl\\.(NumberFormat|DateTimeFormat|RelativeTimeFormat)\\(|\\{.*\\.toString\\(\\)",
    note: "A wrapper of your own is allowed to call Intl: the check skips anything inside a function declaration named format* or use*, which is how a project-level formatter opts out without a suppression. It reads the call, not the locale — `toLocaleString(\"de-DE\")` with an explicit locale is reported too, because the library formatter is still the answer and one place to change it is the reason the rule exists. It matches a construction, so a formatter called without `new` — `Intl.NumberFormat(locale).format(n)` is legal and does the same thing — escapes it entirely; the ripgrep line catches those. `new Intl.DateTimeFormat().resolvedOptions().timeZone` is the known false positive in the other direction; suppress it with the reason. The `.toString()` half is matched by position and not by type, because GritQL has none: the call has to *be* a JSX expression child — `{value.toString()}`, or a template literal in that same slot — with no JSX attribute and no function boundary between the two. So `key={id.toString()}`, a `valueFormatter` callback, `{rows.map((r) => r.id.toString()).join()}` and a `new URLSearchParams(q).toString()` in a helper are all outside it on purpose, as is `n.toString(16)`, which is a radix conversion rather than a date reaching the DOM. Those are misses, not exceptions: the ripgrep line is deliberately looser than the plugin here and will show you them.",
  },
  tags: ["formatting", "i18n", "hydration", "tier-6"],
}
