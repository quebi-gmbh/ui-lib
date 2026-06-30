"use client"

import {
  composeRenderProps,
  Link as LinkPrimitive,
  type LinkProps as LinkPrimitiveProps,
} from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { buttonStyles } from "./button"

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
