import type { DefaultValue, FormMetadata } from "@conform-to/react"
import { useForm } from "@conform-to/react"
import type { ReactNode } from "react"
import { useEffect, useRef } from "react"

/**
 * Shared machinery for the OG scenes in this directory.
 *
 * Only the things a still life needs that an app never does. Everything else a
 * scene shows is the component behaving normally.
 */

/**
 * Focuses the first input inside the returned container after mount, for the
 * components whose interesting surface only exists once they are focused — a
 * ComboBox opens its list on focus, an AsyncSelect starts its first query
 * there.
 *
 * A scene is a photograph of a state, and for these components that state is
 * "someone is using it": closed, half the Selection category is the same box
 * with a chevron on it. It reaches for the input rather than taking an id
 * because the control that owns the id is usually the wrapper, and it is the
 * `<input>` underneath that takes focus.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    const input = root instanceof HTMLInputElement ? root : root?.querySelector("input")
    input?.focus()
  }, [])

  return ref
}

/**
 * Opens a ContextMenu on mount by doing the only thing that opens one: raising
 * a `contextmenu` event on its trigger, at the trigger's own middle.
 *
 * There is no `defaultOpen` here and there should not be — a context menu is
 * defined by where the pointer was, and the component reads `clientX`/`clientY`
 * off the event to place itself. So the scene supplies a pointer position
 * instead of a prop, and picks the one position that is the same every run.
 */
export function useContextMenuOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const target = ref.current?.querySelector("button") ?? ref.current
    if (!target) return
    const rect = target.getBoundingClientRect()
    target.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        clientX: Math.round(rect.left + rect.width / 2),
        clientY: Math.round(rect.top + rect.height / 2),
      }),
    )
  }, [])

  return ref
}

/**
 * A Conform form with no server behind it, for the thirty-two `conform-*`
 * scenes.
 *
 * Every one of those components takes a `FieldMetadata`, which only `useForm`
 * can produce — so a scene either calls it or photographs nothing. Doing it in
 * one place rather than thirty-two keeps the scenes down to the component and
 * its value, and means the one lint exception this needs (`useForm` with no
 * `lastResult`, which is a true reading of an app and a false one of a still
 * life) is written down once, against this file, in `localScopes`.
 *
 * There is no `<form>` element and none is wanted: nothing here submits, and
 * the binding a scene is showing — label, description, error, name, id — comes
 * off the field metadata, not off the element around it.
 */
export function OgForm<T extends Record<string, unknown>>({
  defaultValue,
  className = "w-80",
  children,
}: {
  defaultValue?: DefaultValue<T>
  className?: string
  children: (fields: ReturnType<FormMetadata<T>["getFieldset"]>) => ReactNode
}) {
  const [, fields] = useForm<T>({ defaultValue })

  return <div className={className}>{children(fields)}</div>
}
