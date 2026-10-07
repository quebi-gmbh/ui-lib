import { Link } from "react-router"
import { Link as UiLink } from "@/components/link"

export function Footer() {
  return (
    <footer className="z-10 mt-quebi-10 border-t border-quebi-hairline">
      {/* The design's footer: one ruled line, the studio on the left, the
          links on the right, all of it caption-sized and muted. The border
          spans the viewport; the content sits in the same shell as the header
          and the page, so all three share one set of edges. */}
      <div className="quebi-shell flex flex-col gap-4 pt-5 pb-7 text-quebi-caption text-quebi-fg-subtle sm:flex-row sm:items-center sm:justify-between">
        <p>quebi GmbH · München · open source under MIT</p>
        {/* Navigation, not prose, so these opt out of the resting underline a
            `Link` carries; hover gives it back. */}
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/components" className="hover:text-quebi-fg hover:underline hover:underline-offset-5">
            components
          </Link>
          <Link to="/rules" className="hover:text-quebi-fg hover:underline hover:underline-offset-5">
            rules
          </Link>
          <UiLink href="https://quebi.de/en/imprint" className="no-underline hover:text-quebi-fg hover:underline">
            impressum
          </UiLink>
          <UiLink href="https://quebi.de/en/privacy" className="no-underline hover:text-quebi-fg hover:underline">
            datenschutz
          </UiLink>
          <UiLink
            href="https://github.com/quebi-gmbh/ui-lib/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="no-underline hover:text-quebi-fg hover:underline"
          >
            license
          </UiLink>
          <UiLink
            href="https://github.com/quebi-gmbh"
            target="_blank"
            rel="noreferrer"
            className="no-underline hover:text-quebi-fg hover:underline"
          >
            github
          </UiLink>
        </nav>
      </div>
    </footer>
  )
}
