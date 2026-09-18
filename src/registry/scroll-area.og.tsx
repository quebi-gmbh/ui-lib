import { useEffect, useRef } from "react"
import { Card } from "@/components/card"
import { ScrollArea } from "@/components/scroll-area"
import type { OgScene } from "./types"

const CITIES = [
  "Aachen",
  "Bochum",
  "Cologne",
  "Dortmund",
  "Essen",
  "Freiburg",
  "Gelsenkirchen",
  "Hanover",
]

/**
 * Scrolled a little way in before the picture is taken, because the two things
 * worth photographing here only exist once the content has moved: the edge fade
 * and the teal pill. A fixed offset, not a smooth scroll — the image has to be
 * the same one twice.
 */
const ScrolledList = () => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 64
  }, [])

  return (
    <Card className="h-52 w-96 overflow-hidden p-0">
      <ScrollArea ref={ref} orientation="vertical" scrollFade className="h-full p-4">
        <div className="flex flex-col gap-3">
          {CITIES.map((city) => (
            <p key={city} className="text-sm text-quebi-fg">
              {city} — 3 kiosks online
            </p>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}

export const scrollAreaOgScene: OgScene = {
  scale: 1.5,
  render: () => <ScrolledList />,
}
