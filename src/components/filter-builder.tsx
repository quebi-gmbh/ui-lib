"use client"

import { Plus, RotateCcw, X } from "lucide-react"
import { useId, useRef, useState } from "react"
import { Button } from "@/components/button"
import { describeFilter, FilterPanel } from "@/components/filter-bar"
import { FormattedNumber } from "@/components/formatted-number"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/popover"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/select"
import {
  conditionOnField,
  type FilterCondition,
  type FilterField,
  type FilterOperator,
  filterOperators,
  isConditionSet,
  newCondition,
} from "@/lib/data-table"
import { cn } from "@/lib/utils"

/**
 * Filter Builder — quebi design system
 *
 * `Where [Field] [operator] [Value]`, one row per condition. The only filter
 * surface that reads as a query rather than as a toolbar, and the only one that
 * can express **negation** or **two conditions on one field** — which is why it
 * could not be built until the model had an operator and a condition list
 * (task #193). A pill bar or a faceted rail draws one control per field, so a
 * field-keyed map is exactly as much as it can say; here the second row on
 * `Name` is a second row, and `is not` is the predicate rather than a label.
 *
 * It is a sibling of `FilterBar` and `FilterRail`, over the same
 * `FilterField[]` and the same `matchesFilter`, and `filterRows(rows, fields,
 * conditions)` in `@/lib/data-table` is still the one line that turns the
 * state into rows. The value cell is `FilterPanel` unchanged — every variant,
 * every validation, the same Clear / Apply pair — hosted in a popover instead
 * of under a pill.
 *
 * **Conditions are joined with AND, and there is no `or`.** A list where each
 * row picks its own conjunction is not a list: `a or b and c` has two readings
 * and the row that would disambiguate them is a bracket. That is a tree, it
 * needs nesting to draw and a nested shape to hold, and neither is what a
 * `FilterCondition[]` is. So the conjunction is stated once, in words, in the
 * first cell of every row after the first.
 */

/**
 * One height for every control in a row — the same `sm` (38px) `FilterBar`
 * pins its pills to, so a builder under a bar is one scale rather than two.
 */
const ROW_SIZE = "sm" as const

export interface FilterBuilderProps {
  fields: FilterField[]
  /** The conditions, in order. Controlled — the builder holds none of its own. */
  conditions: FilterCondition[]
  onChange: (conditions: FilterCondition[]) => void
  /**
   * How many rows the conditions select, for the line under the list. It is
   * the only thing on this surface that says the query did anything, because
   * unlike a pill bar the rows look identical whether they match everything or
   * nothing.
   */
  resultCount?: number
  /** Refuses to add past this many rows. Left out, there is no ceiling. */
  maxConditions?: number
  isLoadingOptions?: boolean
  onSearchOptions?: (fieldId: string, search: string) => void
  onLoadMoreOptions?: (fieldId: string) => void
  /**
   * Names the list of rows. Each row is named by its own controls — "Field",
   * "Operator", the value button that states the field it belongs to — so this
   * names the group they are read inside.
   */
  "aria-label"?: string
  className?: string
}

/**
 * FilterBuilder — a list of conditions, one per row.
 *
 * Controlled: it takes `conditions` and reports the next list through
 * `onChange`. Every edit is a whole new list, so a caller can put the list in a
 * URL, a saved view or a segment without the builder having an opinion about
 * where it lives.
 */
export function FilterBuilder({
  fields,
  conditions,
  onChange,
  resultCount,
  maxConditions,
  isLoadingOptions,
  onSearchOptions,
  onLoadMoreOptions,
  "aria-label": ariaLabel = "Filter conditions",
  className,
}: FilterBuilderProps) {
  const [openValue, setOpenValue] = useState<string | null>(null)
  /*
   * Row identity, generated here because the rows are created here. `useId`
   * gives a prefix that is stable across a server render and its hydration, and
   * the counter is a ref rather than state: bumping it must not re-render, and
   * it must not be re-read during one — two rows added in the same tick have to
   * get two ids.
   */
  const idPrefix = useId()
  const nextId = useRef(0)
  const makeId = () => `${idPrefix}-${nextId.current++}`

  const fieldOf = (fieldId: string) => fields.find((field) => field.id === fieldId)
  const replace = (condition: FilterCondition) =>
    onChange(conditions.map((entry) => (entry.id === condition.id ? condition : entry)))

  const add = () => {
    const field = fields[0]
    if (!field) return
    onChange([...conditions, newCondition(field, makeId())])
  }

  const atCeiling = maxConditions != null && conditions.length >= maxConditions
  const incomplete = conditions.filter((condition) => !isConditionSet(condition)).length

  return (
    <div
      className={cn(
        // A container query, not a breakpoint: this is a panel as often as it
        // is a page, and the viewport does not predict how wide its host is.
        "@container flex flex-col gap-3 print:hidden",
        className,
      )}
    >
      {conditions.length > 0 && (
        /*
         * A grid, and not a `flex flex-wrap` row of fixed widths. Wrapping was
         * the sketch's shape and it failed twice at once: the cells were
         * aligned only because their widths were hardcoded, so the alignment
         * was a coincidence of the 1440px screenshot; and when a cell did wrap
         * it landed flush against the left margin with nothing tying it to the
         * row it belonged to. Sharing the tracks is what makes the alignment a
         * property instead — every row's Field cell is the same Field column,
         * whatever is in it — and below `@2xl` each row becomes its own bordered
         * card, which is the same tie stated a different way.
         */
        <ul
          aria-label={ariaLabel}
          className="grid grid-cols-1 gap-3 @2xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] @2xl:gap-2"
        >
          {conditions.map((condition, index) => {
            const field = fieldOf(condition.fieldId)
            const variant = field?.variant
            const isSet = isConditionSet(condition)
            const hintId = `${condition.id}-hint`
            return (
              <li
                key={condition.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-quebi-md border border-quebi-line/10 p-3 @2xl:col-span-full @2xl:grid-cols-subgrid @2xl:border-0 @2xl:p-0"
              >
                <span className="col-start-1 row-start-1 text-quebi-fg-subtle text-sm @2xl:justify-self-end">
                  {index === 0 ? "Where" : "and"}
                </span>

                <Select
                  aria-label="Field"
                  className="col-start-2 row-start-1"
                  selectedKey={condition.fieldId}
                  onSelectionChange={(key) => {
                    const next = fieldOf(String(key))
                    if (next) replace(conditionOnField(condition, next))
                  }}
                >
                  <SelectTrigger size={ROW_SIZE} />
                  <SelectContent items={fields}>
                    {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                  </SelectContent>
                </Select>

                <Select
                  aria-label="Operator"
                  className="col-span-3 col-start-1 row-start-2 @2xl:col-span-1 @2xl:col-start-3 @2xl:row-start-1"
                  selectedKey={condition.operator}
                  onSelectionChange={(key) =>
                    replace({ ...condition, operator: String(key) as FilterOperator })
                  }
                >
                  <SelectTrigger size={ROW_SIZE} />
                  <SelectContent items={filterOperators(variant)}>
                    {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
                  </SelectContent>
                </Select>

                <Popover
                  isOpen={openValue === condition.id}
                  onOpenChange={(isOpen) => setOpenValue(isOpen ? condition.id : null)}
                >
                  <PopoverTrigger
                    size={ROW_SIZE}
                    intent="outline"
                    aria-label={`Value for ${field?.label ?? condition.fieldId}`}
                    aria-describedby={isSet ? undefined : hintId}
                    className={cn(
                      "col-span-3 col-start-1 row-start-3 w-full justify-start font-normal @2xl:col-span-1 @2xl:col-start-4 @2xl:row-start-1",
                      // An unfinished condition is inert — it lets every row
                      // through — and the sketch drew its `Select…` in the same
                      // ink as a chosen value, so a row that was doing nothing
                      // looked exactly like the one beside it that was. Muted
                      // ink and a dashed edge are the two cheapest ways to say
                      // "there is nothing here yet"; the line below says why it
                      // matters.
                      !isSet && "border-dashed text-quebi-fg-subtle",
                    )}
                  >
                    <span className="truncate">
                      {isSet ? describeFilter(variant, condition.value) : "Select…"}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent placement="bottom start" className="w-80">
                    {field && (
                      <FilterPanel
                        fieldId={field.id}
                        label={field.label}
                        variant={field.variant}
                        value={condition.value}
                        operator={condition.operator}
                        options={field.options}
                        bounds={field.bounds}
                        isLoadingOptions={isLoadingOptions}
                        onSearchOptions={
                          onSearchOptions && ((search) => onSearchOptions(field.id, search))
                        }
                        onLoadMoreOptions={onLoadMoreOptions && (() => onLoadMoreOptions(field.id))}
                        onApply={(value) => replace({ ...condition, value })}
                        /* Clear empties the value and leaves the row — and
                           leaves its operator. The row is still a question
                           about this field; it is the answer that was taken
                           back. Removing the row is the × beside it. */
                        onClear={() =>
                          replace({ ...condition, value: newCondition(field, condition.id).value })
                        }
                        /* Applying is the end of the interaction here twice
                           over: the popover would otherwise sit over the
                           results it just produced *and* over the next
                           condition row, which it covers exactly (task #188). */
                        onClose={() => setOpenValue(null)}
                      />
                    )}
                  </PopoverContent>
                </Popover>

                {/* Boxed, like the three controls beside it. An unbordered ×
                    at the end of a row of bordered fields reads as decoration
                    rather than as the control that deletes the row. */}
                <Button
                  intent="outline"
                  size="sq-sm"
                  aria-label={`Remove condition on ${field?.label ?? condition.fieldId}`}
                  onPress={() =>
                    onChange(conditions.filter((entry) => entry.id !== condition.id))
                  }
                  className="col-start-3 row-start-1 justify-self-end @2xl:col-start-5"
                >
                  <X data-slot="icon" aria-hidden="true" />
                </Button>

                {!isSet && (
                  <p
                    id={hintId}
                    className="col-span-3 col-start-1 row-start-4 text-quebi-fg-subtle text-xs @2xl:col-span-2 @2xl:col-start-4 @2xl:row-start-2"
                  >
                    No value yet — this condition is not narrowing anything.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button intent="ghost" size={ROW_SIZE} onPress={add} isDisabled={atCeiling}>
          <Plus data-slot="icon" aria-hidden="true" />
          {conditions.length === 0 ? "Add a condition" : "Add condition"}
        </Button>
        {/* The count belongs to the whole list, not to a row, and it is the
            only thing here that says what the conditions did. `n of m` rather
            than `n` because a builder's usual failure is a condition that
            matches nothing, which reads as a broken page without the total. */}
        {resultCount != null && conditions.length > 0 && (
          <span className="text-quebi-fg-muted text-sm">
            <FormattedNumber value={resultCount} />
            {resultCount === 1 ? " result" : " results"}
            {incomplete > 0 && (
              <span className="text-quebi-fg-subtle">
                {" · "}
                {incomplete === 1 ? "1 condition" : `${incomplete} conditions`} not applied
              </span>
            )}
          </span>
        )}
        {conditions.length > 0 && (
          <Button
            intent="ghost"
            size={ROW_SIZE}
            className="ms-auto"
            onPress={() => onChange([])}
          >
            <RotateCcw data-slot="icon" aria-hidden="true" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
