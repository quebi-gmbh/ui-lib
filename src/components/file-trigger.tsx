"use client"

import {
  FileTrigger as FileTriggerPrimitive,
  type FileTriggerProps as FileTriggerPrimitiveProps,
} from "react-aria-components"
import type { VariantProps } from "tailwind-variants"
import { Button, type buttonStyles } from "@/components/button"
import { Loader } from "@/components/loader"

/**
 * FileTrigger — quebi design system
 *
 * A button that opens the native file picker, built on
 * react-aria-components' FileTrigger. It mirrors the quebi Button API
 * (intent / size / isCircle) and swaps its glyph based on intent:
 * camera for `defaultCamera`, folder for `acceptDirectory`, otherwise a
 * paperclip. While `isPending` it shows the quebi Loader.
 */
const PaperClipIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M18.4 8.6 9.2 17.8a3.5 3.5 0 0 1-4.95-4.95l9.2-9.2a2.33 2.33 0 0 1 3.3 3.3l-9.21 9.2a1.17 1.17 0 0 1-1.65-1.65l8.5-8.5" />
  </svg>
)

const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)

const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    data-slot="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </svg>
)

export interface FileTriggerProps
  extends FileTriggerPrimitiveProps,
    VariantProps<typeof buttonStyles> {
  isDisabled?: boolean
  isPending?: boolean
  ref?: React.RefObject<HTMLInputElement>
  className?: string
}

export function FileTrigger({
  intent = "outline",
  size = "md",
  isCircle = false,
  ref,
  className,
  ...props
}: FileTriggerProps) {
  return (
    <FileTriggerPrimitive ref={ref} {...props}>
      <Button
        className={className}
        isDisabled={props.isDisabled}
        intent={intent}
        size={size}
        isCircle={isCircle}
      >
        {!props.isPending ? (
          props.defaultCamera ? (
            <CameraIcon />
          ) : props.acceptDirectory ? (
            <FolderIcon />
          ) : (
            <PaperClipIcon />
          )
        ) : (
          <Loader />
        )}
        {props.children ? (
          props.children
        ) : (
          <>
            {props.allowsMultiple
              ? "Browse files"
              : props.acceptDirectory
                ? "Browse"
                : "Browse a file"}
            ...
          </>
        )}
      </Button>
    </FileTriggerPrimitive>
  )
}
