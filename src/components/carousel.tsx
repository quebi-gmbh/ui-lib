"use client"

import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createContext, use, useCallback, useEffect, useState } from "react"
import { Button, type ButtonProps } from "@/components/button"
import { cn } from "@/lib/utils"

/**
 * Carousel — quebi design system
 *
 * A slide-able content region powered by embla-carousel-react. Compose with
 * CarouselContent + CarouselItem for the track, and CarouselHandler +
 * CarouselButton for the prev/next controls (built on the quebi Button).
 * Supports horizontal/vertical orientation and arrow-key navigation.
 */

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = createContext<CarouselContextProps | null>(null)

const useCarousel = () => {
  const context = use(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

interface CarouselRootProps {
  CarouselContent?: typeof CarouselContent
  CarouselHandler?: typeof CarouselHandler
  CarouselItem?: typeof CarouselItem
  CarouselButton?: typeof CarouselButton
}

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement>, CarouselRootProps {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

const Carousel = ({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: CarouselProps) => {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  )
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) {
      return
    }

    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = useCallback(() => {
    api?.scrollNext()
  }, [api])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext],
  )

  useEffect(() => {
    if (!api || !setApi) {
      return
    }

    setApi(api)
  }, [api, setApi])

  useEffect(() => {
    if (!api) {
      return
    }

    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: carousel requires role="region" with aria-roledescription */}
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

const CarouselContent = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ms-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  )
}

const CarouselItem = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { orientation } = useCarousel()

  return (
    <div
      className={cn(
        "group/carousel-item relative min-w-0 shrink-0 grow-0 basis-full focus:outline-hidden focus-visible:outline-hidden",
        orientation === "horizontal" ? "ps-4" : "pt-4",
        className,
      )}
      {...props}
    />
  )
}

const CarouselHandler = ({ ref, className, ...props }: React.ComponentProps<"div">) => {
  const { orientation } = useCarousel()
  return (
    <div
      data-slot="carousel-handler"
      ref={ref}
      className={cn(
        "relative z-10 mt-6 flex items-center gap-x-2",
        orientation === "horizontal" ? "justify-end" : "justify-center",
        className,
      )}
      {...props}
    />
  )
}

const CarouselButton = ({
  segment,
  className,
  intent = "outline",
  isCircle = true,
  size = "sq-sm",
  ref,
  ...props
}: ButtonProps & { segment: "previous" | "next" }) => {
  const { orientation, scrollPrev, canScrollPrev, scrollNext, canScrollNext } = useCarousel()
  const isNext = segment === "next"
  const canScroll = isNext ? canScrollNext : canScrollPrev
  const scroll = isNext ? scrollNext : scrollPrev
  const Icon = isNext ? ChevronRight : ChevronLeft

  return (
    <Button
      aria-label={isNext ? "Next slide" : "Previous slide"}
      data-handler={segment}
      intent={intent}
      ref={ref}
      size={size}
      isCircle={isCircle}
      className={cn(orientation === "vertical" ? "rotate-90" : "", "shrink-0", className)}
      isDisabled={!canScroll}
      onPress={scroll}
      {...props}
    >
      <Icon data-slot="icon" className="size-4" />
    </Button>
  )
}

export type { CarouselApi }
export { Carousel, CarouselButton, CarouselContent, CarouselHandler, CarouselItem }
