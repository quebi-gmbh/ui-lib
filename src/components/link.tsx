"use client"

import {
  composeRenderProps,
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Link — quebi design system
 *
 * The design's text link: ink, a 1px underline at a 5px offset that drops to
 * 8px on hover. Built on react-aria-components for the accessibility baseline.
 * External hrefs (http(s):, mailto:, tel:) render as a plain anchor so they keep
 * working outside a router context.
 *
 * No font of its own: a link inside prose is set in the prose's Inter at the
 * prose's size and weight, and the underline is what sets it apart (WCAG 1.4.1
 * — ink against the body grey is not a second cue on its own). A standalone
 * call to action takes the design's Outfit link role from the caller —
 * `className="font-display text-quebi-link"`, a lowercase verb phrase ending
 * in → — rather than a variant, because the only difference is two utilities.
 * Places where a link is not inside prose — nav rows, breadcrumbs, sidebar
 * items — opt out with `no-underline` and still underline on hover.
 */
const EXTERNAL_HREF_RE = /^(https?:|mailto:|tel:)/i

const BASE_CLASSES = [
  "text-quebi-fg",
  "underline decoration-1 underline-offset-5",
  "transition-[text-underline-offset] duration-150 ease-out",
  "hover:underline hover:underline-offset-8",
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-focus focus-visible:ring-offset-3 focus-visible:ring-offset-quebi-bg",
  "disabled:cursor-default disabled:opacity-45 disabled:no-underline",
  "data-disabled:cursor-default data-disabled:opacity-45 data-disabled:no-underline",
]

export interface LinkProps extends LinkPrimitiveProps {
  ref?: React.Ref<HTMLAnchorElement>
}

export function Link({ className, ref, ...props }: LinkProps) {
  const href = "href" in props ? props.href : undefined
  if (typeof href === "string" && EXTERNAL_HREF_RE.test(href)) {
    return <ExternalLink ref={ref} className={className} {...props} href={href} />
  }
  return (
    <LinkPrimitive
      ref={ref}
      // `className` may be a render-prop function (react-aria passes it
      // isHovered/isPressed/... ), which is how a caller styles a link per
      // state. `cn` is clsx underneath and clsx drops a function silently, so
      // merging it directly threw the caller's classes away and left only
      // BASE_CLASSES behind — a sidebar item rendered as underlined prose.
      // composeRenderProps keeps both shapes: it calls the function and merges
      // what it returns, and passes a plain string straight through.
      className={composeRenderProps(className, (resolved) =>
        cn([...BASE_CLASSES, "href" in props && "cursor-pointer"], resolved),
      )}
      {...props}
    />
  )
}

type ExternalLinkProps = LinkProps & { href: string }

function ExternalLink({
  className,
  children,
  style,
  ref,
  href,
  isDisabled: _isDisabled,
  onPress: _onPress,
  onPressStart: _onPressStart,
  onPressEnd: _onPressEnd,
  onPressChange: _onPressChange,
  onPressUp: _onPressUp,
  slot: _slot,
  routerOptions: _routerOptions,
  ...rest
}: ExternalLinkProps) {
  const anchorProps = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>
  return (
    // biome-ignore lint/correctness/noRestrictedElements: this is the anchor's wrapping layer. An external href (http(s)/mailto/tel) must render a plain <a> so it keeps working outside a router context, which is exactly what react-aria's Link cannot do here.
    <a
      ref={ref}
      href={href}
      className={cn(
        [...BASE_CLASSES, "cursor-pointer"],
        typeof className === "function" ? undefined : className,
      )}
      style={typeof style === "function" ? undefined : style}
      {...anchorProps}
    >
      {typeof children === "function" ? null : children}
    </a>
  )
}
