import {
  Carousel,
  CarouselButton,
  CarouselContent,
  CarouselHandler,
  CarouselItem,
} from "@/components/carousel"
import { Card } from "@/components/card"
import type { OgScene } from "./types"

/**
 * No autoplay, and none is passed: the track has to be where it was left, or
 * the same commit photographs a different slide every run.
 */
export const carouselOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <Carousel className="w-96">
      <CarouselContent>
        {[1, 2, 3].map((n) => (
          <CarouselItem key={n}>
            <Card className="flex h-32 items-center justify-center text-3xl font-semibold text-quebi-fg">
              {n}
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselHandler>
        <CarouselButton segment="previous" />
        <CarouselButton segment="next" />
      </CarouselHandler>
    </Carousel>
  ),
}
