"use client"

import {
  composeRenderProps,
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { buttonStyles } from "@/components/button"

/**
 * LinkButton — quebi design system
 *
 * A semantic anchor (react-aria Link) styled exactly like a Button. Use it for
 * navigation that should look like a button — it inherits the full intent/size/
 * isCircle variant API from `buttonStyles`, so quebi tokens, glows, and the
 * hover lift all carry over.
 */
interface LinkButtonProps extends LinkPrimitiveProps, VariantProps<typeof buttonStyles> {
  ref?: React.Ref<HTMLAnchorElement>
}

const LinkButton = ({ className, intent, size, isCircle, ref, ...props }: LinkButtonProps) => {
  return (
    <LinkPrimitive
      ref={ref}
      {...props}
      className={composeRenderProps(className, (className, renderProps) =>
        buttonStyles({
          ...renderProps,
          intent,
          size,
          isCircle,
          className,
        }),
      )}
    >
      {(values) => (
        <>{typeof props.children === "function" ? props.children(values) : props.children}</>
      )}
    </LinkPrimitive>
  )
}

export type { LinkButtonProps }
export { LinkButton }
