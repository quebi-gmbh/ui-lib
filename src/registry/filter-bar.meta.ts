import type { ComponentMeta } from "./types"

export const filterBarMeta: ComponentMeta = {
  slug: "filter-bar",
  name: "Filter Bar",
  description:
    "The filter model with no table under it: one pill per field above a list, a gallery or a card grid, collapsing to a counted button and a sheet below md. An inactive pill is an outline chip naming its field; an active one fills and states its own value, so the row is both the control and the summary. Fields that do not fit wait behind a + Filter menu, and a Reset appears once anything is set. It ships the two parts the table family already had — FilterPanel, a Conform form over all five variants (text, number, date, boolean, enum) that commits either through a Clear/Apply pair or live on every change, and FilterChips, the removable active-filter strip — which table-controls re-exports as TableFilterPanel and TableFilterChips. Controlled: it takes the values and reports the next set, and filterRows and facetCounts in lib/data-table are the two lines that turn them into rows.",
  category: "Display",
  tags: ["filter", "facet", "search", "list", "sheet", "chips", "conform", "interactive"],
}
