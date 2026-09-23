import type { ComponentMeta } from "./types"

export const tableOfContentsMeta: ComponentMeta = {
  slug: "table-of-contents",
  name: "Table of Contents",
  description:
    "The \"on this page\" rail: a nav of links to the headings of the document beside it, nested by heading level, with the heading being read marked current by an IntersectionObserver scroll-spy. A click scrolls smoothly (or instantly under reduced motion), writes the #id into the URL and moves focus to the heading. The items are data, so a prerendered page ships the list in its HTML; useTableOfContents collects them from the DOM where that does not matter.",
  category: "Navigation",
  tags: ["navigation", "toc", "table-of-contents", "on-this-page", "scroll-spy", "anchor", "nav"],
  usage: {
    when: [
      "A long page of prose or reference with several h2/h3 sections: docs, a rule page, a settings page read top to bottom.",
      "A sticky rail beside the content, so the reader can see where they are and jump elsewhere.",
    ],
    whenNot: [
      "Don't use a TableOfContents to move between pages. Routes are a `Sidebar` or a `Navbar`.",
      "Don't use one for views of the same content that replace each other. That is `Tabs`.",
      "Don't use one for a page with two or three sections. The headings are the navigation.",
      "Don't build the item list with `useTableOfContents` on a prerendered page — it is empty in the HTML. Pass `items` from your data.",
    ],
    instead: [
      {
        job: "Moving between pages",
        use: [
          { name: "Sidebar", slug: "sidebar" },
          { name: "Navbar", slug: "navbar" },
          { name: "Breadcrumbs", slug: "breadcrumbs", when: "Where this page sits." },
        ],
      },
      {
        job: "Switching views in place",
        use: [{ name: "Tabs", slug: "tabs" }],
      },
    ],
  },
}
