import { Card, CardContent, CardFooter, CardHeader } from "@/components/card"
import type { OgScene } from "./types"

/** The surface itself: header, body, footer, and the hairline round it. */
export const cardOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <Card className="w-96">
      <CardHeader title="storage upgrade" description="Another 500 GB of fast object storage." />
      <CardContent className="text-quebi-body-s text-quebi-fg-muted">
        Billed monthly. Cancel anytime.
      </CardContent>
      <CardFooter>
        <span className="font-display font-extralight text-4xl text-quebi-fg tabular-nums">
          €9<span className="font-sans text-quebi-body-s text-quebi-fg-subtle">/mo</span>
        </span>
      </CardFooter>
    </Card>
  ),
}
