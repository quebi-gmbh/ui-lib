import { useNavigation } from "react-router"

/**
 * The site's answer to "is this a slow navigation or a dead link?".
 *
 * React Router splits every route into its own chunk, so a click on a sidebar
 * link leaves the current page fully rendered and completely still until the
 * new module and its prerendered `.data` land. On a slow connection that is
 * indistinguishable from nothing having happened.
 *
 * The visible half is local and lives on the link itself: every NavLink on the
 * site composes {@link NAV_PENDING} into its class when its own `isPending` is
 * set, so the thing that changes is the thing that was clicked. That is the
 * right shape for a site whose pages are small — a global progress bar at the
 * top of the window would be a second, unanchored place to look, and by the
 * time the eye found it the page would usually have arrived.
 *
 * The audible half has to be global, because a live region is: this component
 * renders the announcement once, in the chrome, for a reader who cannot see
 * which link is pulsing.
 */

/**
 * The pending treatment for a nav link: it comes up out of the muted resting
 * colour and takes the same pulse a Skeleton uses, so "waiting" is one motion
 * across the whole site.
 *
 * Colour and animation only — no fill, no padding, nothing that occupies space
 * — because the same string lands on a padded sidebar row and on a bare header
 * link, and a treatment that changed either one's box would move the nav around
 * every time someone clicked it.
 *
 * It is deliberately *not* the current-page treatment. A link that already
 * looked current before the page arrived would make a navigation that never
 * lands look like one that did, which is the confusion this is here to remove.
 */
export const NAV_PENDING = "text-quebi-fg quebi-pulse"

/**
 * A polite live region that says a navigation is in flight.
 *
 * `role="status"` rather than `aria-live="assertive"`: a page change is worth
 * announcing at the next pause, not worth interrupting whatever the reader is
 * in the middle of. The region is in the DOM at all times and only its text
 * changes — a live region that is mounted at the same moment as its text is
 * routinely missed by screen readers.
 *
 * Nothing is announced for the state react-router calls `submitting`; this site
 * has no actions, so `loading` is the only state that ever appears here.
 */
export function NavigationStatus() {
  const navigation = useNavigation()
  const pending = navigation.state === "loading" ? navigation.location.pathname : undefined

  return (
    <div role="status" aria-live="polite" className="sr-only">
      {pending ? `Loading ${pending}` : ""}
    </div>
  )
}
