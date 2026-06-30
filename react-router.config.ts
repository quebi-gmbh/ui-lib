import type { Config } from "@react-router/dev/config"
// Import the metadata-only registry (plain data, no JSX/@-alias imports) so this
// config loads outside Vite's module resolution.
import { metaRegistry } from "./src/registry/meta"

// Static-only build for GitHub Pages: no runtime server, prerender every route
// to real HTML so each page ships complete content + meta for SEO/social/AI.
export default {
  appDirectory: "src",
  ssr: false,
  async prerender() {
    return ["/", "/components", ...metaRegistry.map((c) => `/components/${c.slug}`)]
  },
} satisfies Config
