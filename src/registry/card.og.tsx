import { Card, CardContent, CardFooter, CardHeader } from "@/components/card"
import type { OgScene } from "./types"

/** The surface itself: header, body, footer, and the faint cyan border. */
export const cardOgScene: OgScene = {
  scale: 1.5,
  render: () => (
    <Card className="w-96">
      <CardHeader title="Storage upgrade" description="Another 500 GB of fast object storage." />
      <CardContent className="text-sm text-quebi-fg-muted">
        Billed monthly. Cancel anytime.
      </CardContent>
      <CardFooter>
        <span className="font-bold text-2xl text-quebi-fg tabular-nums">
          €9<span className="text-base font-medium text-quebi-fg-muted">/mo</span>
        </span>
      </CardFooter>
    </Card>
  ),
}
