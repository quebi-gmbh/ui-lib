"use client"

import { Link as LinkPrimitive, type LinkProps as LinkPrimitiveProps } from "react-aria-components"
import { cn } from "@/lib/utils"

/**
 * Link — quebi design system
 *
 * Brand-teal text link, no underline by default, brightens to
 * quebi-brand-hover on hover. Built on react-aria-components for the
 * accessibility baseline. External hrefs (http(s):, mailto:, tel:) render
 * as a plain anchor so they keep working outside a router context.
 */
const EXTERNAL_HREF_RE = /^(https?:|mailto:|tel:)/i

const BASE_CLASSES = [
  "font-sans font-medium text-quebi-brand no-underline",
  "transition-colors duration-150 ease-out",
  "hover:text-quebi-brand-hover hover:underline",
  "outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quebi-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-quebi-bg rounded-quebi-sm",
  "disabled:cursor-default disabled:opacity-50 disabled:no-underline",
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
