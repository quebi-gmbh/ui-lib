const BASE_URL = "https://ui-lib.quebi.de"
const SITE = "quebi ui-lib"

interface SeoInput {
  title: string
  description: string
  /** Path beginning with "/" for canonical + og:url. */
  path: string
  image?: string
  /** Use the title verbatim instead of appending the site name. */
  exactTitle?: boolean
}

/**
 * Build a React Router `meta` descriptor array: title, description, canonical,
 * and Open Graph / Twitter card tags. Prerendered into each route's static HTML.
 */
export function seo({ title, description, path, image, exactTitle }: SeoInput) {
  const fullTitle = exactTitle ? title : `${title} — ${SITE}`
  const url = `${BASE_URL}${path}`
  const ogImage = `${BASE_URL}${image ?? "/og/default.png"}`

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },

    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },

    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ]
}
