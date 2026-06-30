"use client"

import { Link as LinkPrimitive, type LinkProps as LinkPrimitiveProps } from "react-aria-components"
import { twMerge } from "tailwind-merge"
import { cx } from "@/lib/primitive"

const EXTERNAL_HREF_RE = /^(https?:|mailto:|tel:)/i

const BASE_CLASSES = [
  "font-medium text-(--text)",
  "outline-0 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring forced-colors:outline-[Highlight]",
  "disabled:cursor-default disabled:opacity-50 forced-colors:disabled:text-[GrayText]",
]

export interface LinkProps extends LinkPrimitiveProps {
  ref?: React.RefObject<HTMLAnchorElement>
}

export function Link({ className, ref, ...props }: LinkProps) {
  const href = "href" in props ? props.href : undefined
  if (typeof href === "string" && EXTERNAL_HREF_RE.test(href)) {
    return <ExternalLink ref={ref} className={className} {...props} href={href} />
  }
  return (
    <LinkPrimitive
      ref={ref}
      className={cx([...BASE_CLASSES, "href" in props && "cursor-pointer"], className)}
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
      className={twMerge(
        ...BASE_CLASSES,
        "cursor-pointer",
        typeof className === "function" ? undefined : className,
      )}
      style={typeof style === "function" ? undefined : style}
      {...anchorProps}
    >
      {typeof children === "function" ? null : children}
    </a>
  )
}
