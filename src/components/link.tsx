"use client"

import { Link as LinkPrimitive, type LinkProps as LinkPrimitiveProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Link — quebi design system
 *
 * Brand-teal text link, underlined at rest, brightening to
 * quebi-brand-text-hover on hover. Built on react-aria-components for the
 * accessibility baseline. External hrefs (http(s):, mailto:, tel:) render
 * as a plain anchor so they keep working outside a router context.
 *
 * The underline is not decoration, it is the second cue WCAG 1.4.1 asks for
 * when a link sits inside a block of text. Colour alone cannot carry it here:
 * `--q-brand-text` is 1.38:1 against `--q-fg-muted` in light mode and 1.34:1 in
 * dark, and no value clears both 4.5:1 on the page background and 3:1 against
 * the body copy at once (tests/badge-contrast.test.ts pins the arithmetic).
 * So a resting link is underlined wherever it lands, and the places where a
 * link is *not* inside prose — nav rows, breadcrumbs, sidebar items, a
 * standalone call to action — opt out with `no-underline`.
 */
const EXTERNAL_HREF_RE = /^(https?:|mailto:|tel:)/i

const BASE_CLASSES = [
  "font-sans font-medium text-quebi-brand-text",
  "underline decoration-quebi-brand-text/40 underline-offset-2",
  "transition-colors duration-150 ease-out",
  "hover:text-quebi-brand-text-hover hover:underline",
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand-mark focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg rounded-quebi-sm",
  "disabled:cursor-default disabled:opacity-50 disabled:no-underline",
  "data-disabled:cursor-default data-disabled:opacity-50 data-disabled:no-underline",
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
      className={cn([...BASE_CLASSES, "href" in props && "cursor-pointer"], className)}
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
