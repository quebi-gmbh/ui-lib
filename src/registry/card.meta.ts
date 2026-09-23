import type { ComponentMeta } from "./types"

export const cardMeta: ComponentMeta = {
  slug: "card",
  name: "Card",
  description:
    "A surface for a self-contained unit that sits beside a few others of a different kind. Composes a header, content, and footer, with default and feature variants plus an optional hover glow. Most things that look like they want a card want a heading, a list or a table instead — read `usage` first.",
  category: "Layout",
  tags: ["layout", "surface", "container", "display"],
  usage: {
    when: [
      "A small number of *different*, self-contained units side by side — each with its own title and, often, its own actions.",
      "A dashboard widget: a chart with a title and a menu, next to widgets that are not charts.",
      "A feature or pricing tile, where each tile is one offer and there are three or four of them.",
      "A gallery item that is mostly media. Put `p-0 overflow-hidden` on the Card to let the image run edge to edge.",
    ],
    whenNot: [
      "Never nest a card in a card. The inner one is a section: a `Heading` and a `Separator`.",
      "Items that share the same fields are rows, not cards: a `Table` (`DataTable`, `ServerTable`) or a list.",
      "More than about six cards of the same shape is a list. Scanning a grid of identical boxes is slower than reading down a column.",
      "Don't put a card around a page section just to separate it. Whitespace and a `Heading` do that.",
      "Don't wrap a key/value block in a card. That is a `DescriptionList`.",
      "Don't use a row of cards for KPIs. A bare stat — number, label, delta `Badge` or `Sparkline` — with vertical `Separator`s between them.",
      "Don't build a callout or a selectable option out of a card. Those are `Note` and `ChoiceBox`.",
    ],
    instead: [
      {
        job: "Grouping or separating content",
        use: [
          { name: "Whitespace + Heading", slug: "heading" },
          { name: "Separator", slug: "separator" },
          {
            name: "Two-column settings layout",
            when: "Label and help text on the left, controls on the right, rows divided by a Separator.",
          },
        ],
      },
      {
        job: "A list item",
        use: [
          { name: "Divided list rows", slug: "separator", when: "Static rows." },
          { name: "GridList", slug: "grid-list", when: "Rows the user acts on." },
          { name: "ListBox", slug: "list-box", when: "Rows the user chooses from." },
          { name: "Tree", slug: "tree", when: "A hierarchy." },
          { name: "Leaderboard", slug: "leaderboard", when: "Ranked items." },
          { name: "BarList", slug: "bar-list", when: "Items with a magnitude." },
          { name: "TagGroup", slug: "tag-group", when: "Short items." },
        ],
      },
      {
        job: "Tabular data",
        use: [
          { name: "Table", slug: "table" },
          { name: "DataTable", slug: "data-table", when: "All the rows are in the browser." },
          { name: "ServerTable", slug: "server-table", when: "The server owns the query." },
          { name: "DescriptionList", slug: "description-list", when: "A single record." },
        ],
      },
      {
        job: "A metric or KPI",
        use: [
          {
            name: "Stat row",
            when: "Number, label, delta Badge or Sparkline; vertical Separators between stats.",
          },
          { name: "Sparkline", slug: "sparkline" },
          { name: "Meter", slug: "meter" },
          { name: "ProgressBar", slug: "progress-bar" },
          { name: "Tracker", slug: "tracker" },
        ],
      },
      {
        job: "A callout",
        use: [
          { name: "Note", slug: "note" },
          { name: "Toast", slug: "toast", when: "Transient feedback." },
        ],
      },
      {
        job: "Hiding or organising content",
        use: [
          { name: "Tabs", slug: "tabs" },
          { name: "DisclosureGroup", slug: "disclosure-group" },
          { name: "ShowMore", slug: "show-more" },
          { name: "Stepper", slug: "stepper" },
          { name: "Sheet", slug: "sheet" },
          { name: "Drawer", slug: "drawer" },
          { name: "Dialog", slug: "dialog" },
        ],
      },
      {
        job: "An action target",
        use: [
          { name: "Link", slug: "link" },
          { name: "LinkButton", slug: "link-button" },
          { name: "ChoiceBox", slug: "choice-box", when: "The right selectable card." },
          { name: "IconTile", slug: "icon-tile" },
        ],
      },
    ],
  },
}
