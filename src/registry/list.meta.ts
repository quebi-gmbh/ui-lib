import type { ComponentMeta } from "./types"

export const listMeta: ComponentMeta = {
  slug: "list",
  name: "List",
  description:
    "A list of same-shaped things: Item rows (media, title, secondary line, meta, action) arranged divided or plain, comfortable or compact, flush with the page or inset to a Card's edges — plus ListLink for rows that navigate, ListSection for grouped lists and ListEmpty for the list with nothing in it. Selection, keyboard row navigation and tabular data are GridList, ListBox and DataTable.",
  category: "Display",
  tags: ["display", "list", "rows", "stacked-list", "empty-state", "navigation"],
  usage: {
    when: [
      "Several things that share the same fields, read down a column: members, files, notifications, projects.",
      "Rows that each lead to their own page — a `ListLink` in the title makes the whole row the target.",
      "Rows with one or two actions of their own, in `ItemActions` — a Button or a Menu trigger.",
      "One list as the content of a Card on a dashboard, with `inset` so the rows run to the card's edges.",
      "A long list split by date or status, one `ListSection` per group.",
    ],
    whenNot: [
      "Don't use a List when the user selects rows, moves through them with arrow keys, or drags them. That is a `GridList`.",
      "Don't use a List for picking one option from several. That is a `ListBox`, or a `Select` / `ComboBox` when it lives in a field.",
      "Don't use a List for one record's fields. A label and its value are a `DescriptionList`.",
      "Don't use a List when the reader compares values across rows, sorts or filters them. Columns are a `Table` — `DataTable` or `ServerTable`.",
      "Don't give each row its own Card. A card per row reads slower and stops being readable at about six; the hairline is the separation.",
      "Don't render an empty `<li>` saying there is nothing here. Render `ListEmpty` in place of the list.",
    ],
    instead: [
      {
        job: "Rows the user acts on",
        use: [
          {
            name: "GridList",
            slug: "grid-list",
            when: "Selection, keyboard row navigation, drag and drop.",
          },
          { name: "ListBox", slug: "list-box", when: "Choosing one or more options." },
          { name: "Tree", slug: "tree", when: "A hierarchy the user expands." },
        ],
      },
      {
        job: "Data with fields",
        use: [
          { name: "DescriptionList", slug: "description-list", when: "A single record." },
          { name: "DataTable", slug: "data-table", when: "All the rows are in the browser." },
          { name: "ServerTable", slug: "server-table", when: "The server owns the query." },
        ],
      },
      {
        job: "Items with a magnitude or a rank",
        use: [
          { name: "BarList", slug: "bar-list" },
          { name: "Leaderboard", slug: "leaderboard" },
        ],
      },
      {
        job: "Short items",
        use: [{ name: "TagGroup", slug: "tag-group" }],
      },
    ],
  },
}
