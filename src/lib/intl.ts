/**
 * One `Intl` formatter per `(locale, options)` pair, for the whole app.
 *
 * Constructing `Intl.NumberFormat` / `Intl.DateTimeFormat` is one of the more
 * expensive things the platform does — it resolves the locale data — and the
 * result is a pure function of the locale and the options. Built in a component
 * body it is rebuilt for every rendered value, which is invisible next to one
 * price tag and is not invisible at all in a table: react-aria's collections are
 * complete even when the DOM is virtualized, so a `DataTable` with a currency
 * column and a date column over 10,000 rows constructs 20,000 formatters on the
 * first render and another 20,000 on every sort or filter. A `BarList`, a
 * `Leaderboard` and a long `DescriptionList` pay the same cost, just quieter.
 *
 * So the components ask here instead. `getNumberFormat`, `getDateTimeFormat` and
 * `getRelativeTimeFormat` are drop-in replacements for the corresponding `new
 * Intl.*` call and return the *same instance* for the same inputs — which is
 * what makes them safe to call in a render path.
 *
 * The key is the serialized options, not their identity: a caller writing
 * `options={{ style: "currency", currency: "EUR" }}` inline hands over a fresh
 * object on every render, and keying on identity would be a cache that never
 * hits. Keys are sorted, so two literals that spell the same options in a
 * different order share an entry, and `undefined` values are dropped, since
 * `Intl` ignores them.
 *
 * Nothing here renders, and nothing here imports: the API generator ships each
 * `@/lib/*` module as its own `registry:lib` item with `registryDependencies:
 * []`, so an import of a sibling module would land in a consumer's project as a
 * dangling one.
 */

/**
 * Formatters are keyed by option *values*, so a caller that varies an option per
 * row — `{ maximumFractionDigits: row.precision }` — can grow the map without
 * bound. Real call sites have a handful of shapes; this is the guard against the
 * one that does not. Dropping the whole map rather than evicting an entry keeps
 * the hot path a `Map.get` with no bookkeeping: the cost of being wrong is one
 * rebuild of a small working set, and it is paid at most once per 500 misses.
 */
const MAX_ENTRIES = 500

/**
 * `(locale, options)` as a string. Options are sorted by key and stripped of
 * `undefined` values so that equal options compare equal however they were
 * written — `{ style, currency }` and `{ currency, style }` are one entry.
 */
function cacheKey(locale: string | undefined, options: object | undefined): string {
  const entries = Object.entries(options ?? {})
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `${locale ?? ""}|${JSON.stringify(entries)}`
}

/**
 * Wrap a formatter constructor in a module-level cache. One map per formatter
 * kind, so a busy `NumberFormat` map cannot evict the two `DateTimeFormat`s a
 * `Calendar` builds its month and year labels with.
 */
function cached<Options extends object, Formatter>(
  construct: (locale: string | undefined, options: Options | undefined) => Formatter,
): (locale?: string, options?: Options) => Formatter {
  const cache = new Map<string, Formatter>()

  return (locale, options) => {
    const key = cacheKey(locale, options)
    const hit = cache.get(key)
    if (hit !== undefined) return hit

    // Constructed before the size check so that invalid options throw exactly as
    // `new Intl.*` would, and nothing is remembered about the call that threw.
    const formatter = construct(locale, options)
    if (cache.size >= MAX_ENTRIES) cache.clear()
    cache.set(key, formatter)
    return formatter
  }
}

/** `new Intl.NumberFormat(locale, options)`, built once per distinct pair. */
export const getNumberFormat = cached<Intl.NumberFormatOptions, Intl.NumberFormat>(
  (locale, options) => new Intl.NumberFormat(locale, options),
)

/** `new Intl.DateTimeFormat(locale, options)`, built once per distinct pair. */
export const getDateTimeFormat = cached<Intl.DateTimeFormatOptions, Intl.DateTimeFormat>(
  (locale, options) => new Intl.DateTimeFormat(locale, options),
)

/** `new Intl.RelativeTimeFormat(locale, options)`, built once per distinct pair. */
export const getRelativeTimeFormat = cached<
  Intl.RelativeTimeFormatOptions,
  Intl.RelativeTimeFormat
>((locale, options) => new Intl.RelativeTimeFormat(locale, options))
