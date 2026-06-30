import { cn } from "@/lib/utils"

/**
 * Avatar — quebi design system
 *
 * Renders a user image, falling back to initials on a subtle dark surface.
 * Circular by default, or rounded-square via `isSquare`. The full size scale
 * runs xs → 9xl, driven by a CSS variable so the image and the initials SVG
 * always track the same box. Depth is a faint cyan ring, never a drop shadow.
 */
export interface AvatarProps {
  src?: string | null
  initials?: string
  alt?: string
  className?: string
  isSquare?: boolean
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "8xl"
    | "9xl"
}

export function Avatar({
  src = null,
  isSquare = false,
  size = "md",
  initials,
  alt = "",
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="avatar"
      {...props}
      className={cn(
        "inline-grid size-(--avatar-size) shrink-0 select-none align-middle",
        "bg-white/[0.04] text-quebi-fg-muted",
        "outline outline-1 -outline-offset-1 outline-cyan-500/20",
        "[--avatar-radius:25%] *:col-start-1 *:row-start-1 *:size-(--avatar-size)",
        size === "xs" && "[--avatar-size:--spacing(5)]",
        size === "sm" && "[--avatar-size:--spacing(6)]",
        size === "md" && "[--avatar-size:--spacing(8)]",
        size === "lg" && "[--avatar-size:--spacing(10)]",
        size === "xl" && "[--avatar-size:--spacing(12)]",
        size === "2xl" && "[--avatar-size:--spacing(14)]",
        size === "3xl" && "[--avatar-size:--spacing(16)]",
        size === "4xl" && "[--avatar-size:--spacing(20)]",
        size === "5xl" && "[--avatar-size:--spacing(24)]",
        size === "6xl" && "[--avatar-size:--spacing(28)]",
        size === "7xl" && "[--avatar-size:--spacing(32)]",
        size === "8xl" && "[--avatar-size:--spacing(36)]",
        size === "9xl" && "[--avatar-size:--spacing(42)]",
        isSquare
          ? "rounded-(--avatar-radius) *:rounded-(--avatar-radius)"
          : "rounded-full *:rounded-full",
        className,
      )}
    >
      {initials &&
        (alt ? (
          <svg
            className="size-full select-none fill-current p-[5%] text-[48px] font-semibold uppercase"
            viewBox="0 0 100 100"
          >
            <title>{alt}</title>
            <text
              x="50%"
              y="50%"
              alignmentBaseline="middle"
              dominantBaseline="middle"
              textAnchor="middle"
              dy=".125em"
            >
              {initials}
            </text>
          </svg>
        ) : (
          <svg
            className="size-full select-none fill-current p-[5%] text-[48px] font-semibold uppercase"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <text
              x="50%"
              y="50%"
              alignmentBaseline="middle"
              dominantBaseline="middle"
              textAnchor="middle"
              dy=".125em"
            >
              {initials}
            </text>
          </svg>
        ))}
      {src && <img className="size-full object-cover object-center" src={src} alt={alt} />}
    </span>
  )
}
