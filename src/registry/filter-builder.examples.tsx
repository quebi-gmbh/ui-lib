import { useState } from "react"
import { Badge } from "@/components/badge"
import { Card, CardContent } from "@/components/card"
import { FilterBuilder } from "@/components/filter-builder"
import { FormattedNumber } from "@/components/formatted-number"
import { Note } from "@/components/note"
import { Text } from "@/components/text"
import type { FilterCondition, FilterField } from "@/lib/data-table"
import { emptyQuery, facetCounts, filterRows, queryToSearchParams } from "@/lib/data-table"
import { KIOSKS, type Kiosk } from "./filter-bar.examples"
import type { ComponentExample } from "./types"

/**
 * The same ten kiosks `FilterBar` filters, asked a question a bar cannot ask.
 *
 * A pill bar draws one control per field, so its state is a map keyed by field
 * and "not live" and "two conditions on Name" have nowhere to live. A condition
 * list is the other shape, and these examples are the three things only it can
 * do: negate, repeat a field, and hand the whole query to somebody else.
 */

const FIELDS: FilterField[] = [
  { id: "status", label: "Status", variant: "enum" },
  { id: "room", label: "Room", variant: "enum" },
  { id: "price", label: "Price", variant: "number", bounds: [129, 399] },
  { id: "updated", label: "Updated", variant: "date" },
  { id: "title", label: "Name", variant: "text" },
]

/**
 * The two lines that filtering a list actually is — the same two `FilterBar`
 * uses, handed conditions instead of a map.
 *
 * `filterRows` runs every condition over the array, operator included;
 * `facetCounts` counts one field's choices against the rows the *other*
 * conditions leave. Neither knows which surface collected the conditions, which
 * is the whole reason a builder is a component and not a second model.
 */
function useKiosks(initial: FilterCondition[] = []) {
  const [conditions, setConditions] = useState<FilterCondition[]>(initial)
  const rows = filterRows(KIOSKS, FIELDS, conditions)
  const fields = FIELDS.map((field) =>
    field.variant === "enum"
      ? { ...field, options: facetCounts(KIOSKS, FIELDS, field.id, conditions) }
      : field,
  )
  return { conditions, setConditions, rows, fields }
}

function Results({ rows }: { rows: Kiosk[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Text className="text-quebi-fg-subtle text-xs">
        <FormattedNumber value={rows.length} /> of <FormattedNumber value={KIOSKS.length} /> kiosks
      </Text>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="flex flex-col items-start gap-1 p-3">
              <span className="font-medium text-quebi-fg text-sm">{row.title}</span>
              <span className="text-quebi-fg-subtle text-xs">{row.room}</span>
              <Badge intent={row.status === "live" ? "success" : "neutral"}>{row.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Builder() {
  const { conditions, setConditions, rows, fields } = useKiosks()
  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBuilder
        fields={fields}
        conditions={conditions}
        onChange={setConditions}
        resultCount={rows.length}
      />
      <Results rows={rows} />
    </div>
  )
}

function Negation() {
  const { conditions, setConditions, rows, fields } = useKiosks([
    { id: "c1", fieldId: "status", operator: "isNot", value: ["live"] },
    { id: "c2", fieldId: "title", operator: "contains", value: "o" },
    { id: "c3", fieldId: "title", operator: "doesNotContain", value: "Rooftop" },
  ])
  return (
    <div className="flex w-full flex-col gap-4">
      <Note>
        Two of these three rows are impossible in a field-keyed filter map:{" "}
        <code>is not</code> has no operator to be, and the second condition on Name would overwrite
        the first. Switch <code>is not</code> to <code>is</code> and the result inverts — the select
        is the predicate, not a label beside it.
      </Note>
      <FilterBuilder
        fields={fields}
        conditions={conditions}
        onChange={setConditions}
        resultCount={rows.length}
      />
      <Results rows={rows} />
    </div>
  )
}

/**
 * The conditions as the query they are.
 *
 * `matchesFilter` promises a client filter and a server query answer the same
 * question for the same condition, so the operator has to survive the trip —
 * which is why `DataTableQuery.filters` is a list of conditions and
 * `queryToSearchParams` writes the operator into the URL. It writes it only
 * when it is not the variant's default, and only uses `;` when a field carries
 * more than one condition, so a plain filter still produces a plain link.
 */
function AsAQuery() {
  const { conditions, setConditions, rows, fields } = useKiosks([
    { id: "c1", fieldId: "status", operator: "isNot", variant: "enum", value: ["offline"] },
  ])
  const params = new URLSearchParams(
    queryToSearchParams({ ...emptyQuery, filters: conditions }),
  ).toString()
  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBuilder
        fields={fields}
        conditions={conditions}
        onChange={setConditions}
        resultCount={rows.length}
      />
      <Card>
        <CardContent className="p-3">
          <code className="break-all text-quebi-fg-muted text-xs">
            {params === "" ? "/kiosks" : `/kiosks?${params}`}
          </code>
        </CardContent>
      </Card>
      <Note>
        The same list is what <code>ServerTable</code> reports through{" "}
        <code>onQueryChange</code>, so the loader behind it runs the user's actual question rather
        than the one the operator was dropped from.
      </Note>
    </div>
  )
}

export const filterBuilderExamples: ComponentExample[] = [
  {
    title: "A list of conditions",
    description:
      "Where [Field] [operator] [Value], one row per condition, over the same card grid FilterBar filters. Add a condition and it starts inert — with no value it narrows nothing, and the row says so rather than looking applied.",
    render: () => <Builder />,
  },
  {
    title: "Negation, and two conditions on one field",
    description:
      "The two things a field-keyed filter map cannot hold, which is the reason this surface needed a model change before it needed a layout.",
    render: () => <Negation />,
  },
  {
    title: "The conditions as a link",
    description:
      "The operator travels with the value — into the URL, and into the query a server-driven table reports.",
    render: () => <AsAQuery />,
  },
]
