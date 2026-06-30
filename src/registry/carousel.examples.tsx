import {
  Carousel,
  CarouselButton,
  CarouselContent,
  CarouselHandler,
  CarouselItem,
} from "@/components/carousel"
import type { ComponentExample } from "./types"

const Slide = ({ n }: { n: number }) => (
  <div className="flex aspect-video items-center justify-center rounded-quebi-md border border-cyan-500/10 bg-quebi-bg text-4xl font-semibold text-quebi-brand">
    {n}
  </div>
)

export const carouselExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A horizontal track with prev/next controls.",
    render: () => (
      <Carousel className="mx-auto w-full max-w-md">
        <CarouselContent>
          {[1, 2, 3, 4, 5].map((n) => (
            <CarouselItem key={n}>
              <Slide n={n} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselHandler>
          <CarouselButton segment="previous" />
          <CarouselButton segment="next" />
        </CarouselHandler>
      </Carousel>
    ),
  },
  {
    title: "Multiple per view",
    description: "Items size themselves with basis utilities to show several slides at once.",
    render: () => (
      <Carousel className="mx-auto w-full max-w-md">
        <CarouselContent>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <CarouselItem key={n} className="basis-1/2 md:basis-1/3">
              <Slide n={n} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselHandler>
          <CarouselButton segment="previous" />
          <CarouselButton segment="next" />
        </CarouselHandler>
      </Carousel>
    ),
  },
  {
    title: "Vertical",
    description: "Set orientation to vertical to scroll the track up and down.",
    render: () => (
      <Carousel orientation="vertical" className="mx-auto w-full max-w-xs">
        <CarouselContent className="h-64">
          {[1, 2, 3, 4].map((n) => (
            <CarouselItem key={n} className="basis-1/2">
              <Slide n={n} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselHandler>
          <CarouselButton segment="previous" />
          <CarouselButton segment="next" />
        </CarouselHandler>
      </Carousel>
    ),
  },
]
