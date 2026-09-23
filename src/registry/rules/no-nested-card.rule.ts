import type { RuleMeta } from "./types"

/**
 * Element usage, tier 7 — how the library's own surfaces are put together.
 *
 * The first six tiers are about writing something the library already ships.
 * This one is about the library component itself, used where it does not
 * belong: a Card is a surface, and a surface drawn on a surface is a second
 * border, a second radius and a second padding saying what a heading would
 * have said. The Card page makes the argument at length ("Never nest a card in
 * a card"); this is the part of it a linter can see.
 *
 * The check is lexical on purpose. It sees a `<Card>` written inside another
 * `<Card>`'s children in the same JSX tree, which is the shape an agent writes
 * when it copies a card into a card. A Card rendered by a child component is
 * invisible to it, and that is both the blind spot and the reason a gallery
 * frame around a Card example is not reported: the frame and the specimen are
 * two components, and neither is a section of the other.
 */
export const noNestedCardRule: RuleMeta = {
  id: "no-nested-card",
  title: "A card inside a card is a section",
  navTitle: "Nested cards",
  summary:
    "Never write a Card inside another Card. The inner one is separating part of the outer one from the rest, and a Heading does that — with a Separator if a line is needed. Items that share the same fields are rows in a Table or a list, not cards.",
  severity: "warn",
  category: "element-usage",
  tier: 7,
  failureMode:
    "An agent that has found `Card` reaches for it for every box: a settings card grows a card per section, a card of members grows a card per member. Each one renders correctly and is the library's own component, so nothing about it looks like a shortcut — and the page ends up with borders inside borders, three levels of padding, and no heading anywhere a reader or a screen reader could use to find their way.",
  rationale: [
    "A Card says \"this is one thing, separate from what is around it\". A Card inside a Card says the same thing twice, one level down, and the second time it is wrong: the inner content is not separate from the outer card, it is part of it. What the inner card was doing is dividing that one thing into parts, and a heading is what divides a thing into parts — it names the part, it is in the outline, and it costs no border.",
    "The cost is visible and it compounds. Card draws a border, a radius, a tinted surface and 20px of padding; nesting one draws all four again inside the first set, so the content ends up 40px from the outer edge behind two lines and two tints. A third level is not unusual in agent-written settings pages. None of that is a token or a theme the library can correct, because every piece of it is the library behaving exactly as asked.",
    "When the inner cards repeat — one per member, one per invoice — they are not sections either: they are rows. Items that share the same fields read faster down a column than across a grid of boxes, and a Table (DataTable, ServerTable) or a plain list gives them alignment, sorting and a header the boxes cannot. The card page's \"What to use instead\" section draws each of these side by side with the card-shaped version it replaces.",
    "It warns rather than fails. The fix is a change of shape — the inner Card becomes a Heading and a Separator, or the repeated ones become a Table — and occasionally a nested surface really is the design, say an inset preview of something that is itself a card. That is a judgement the linter cannot make, so it asks for one instead.",
  ],
  appliesTo: ["app/**/*.{tsx,jsx}", "src/**/*.{tsx,jsx}"],
  examples: [
    {
      title: "Sections, not cards",
      wrong: `<Card>
  <CardHeader title="Project settings" />
  <CardContent className="flex flex-col gap-3">
    <Card>
      <CardHeader title="General" description="Name and visibility." />
    </Card>
    <Card>
      <CardHeader title="Danger zone" description="Archive or delete the project." />
    </Card>
  </CardContent>
</Card>`,
      right: `<Card>
  <CardHeader title="Project settings" />
  <CardContent className="flex flex-col gap-4">
    <div>
      <Heading level={4}>General</Heading>
      <Text>Name and visibility.</Text>
    </div>
    <Separator />
    <div>
      <Heading level={4}>Danger zone</Heading>
      <Text>Archive or delete the project.</Text>
    </div>
  </CardContent>
</Card>`,
      source: "src/registry/card.examples.tsx",
      note: "The inner cards were separating one part of the outer one from the rest. A heading does that and puts the part in the outline; the separator draws the line the inner border was drawing. The outer card stays — it is still one thing, separate from the page around it.",
    },
    {
      title: "Repeated cards are rows",
      wrong: `<Card>
  <CardHeader title="Members" />
  <CardContent className="flex flex-col gap-3">
    {members.map((m) => (
      <Card key={m.id}>
        <CardHeader title={m.name} description={m.role} />
      </Card>
    ))}
  </CardContent>
</Card>`,
      right: `<Card>
  <CardHeader title="Members" />
  <CardContent>
    <DataTable
      aria-label="Members"
      columns={columns}
      data={members}
      getRowId={(m) => m.id}
    />
  </CardContent>
</Card>`,
      note: "A Card inside a map inside a Card is the same nesting, written once. Every member has a name and a role, which makes them rows: the table aligns them, sorts them, and says what each column is — and if the outer card has nothing else in it, the table does not need it either.",
    },
  ],
  exceptions: [
    {
      scope: "A frame around a rendered specimen — a gallery, a docs page, a preview",
      reason:
        "A component gallery that draws each example inside a framed Card, and an example that is itself a Card, put one card inside another on screen without either being a section of the other: the frame belongs to the page and the specimen to the example. This site's gallery does exactly that, and the check does not fire there, because the two are written in different components and the match is lexical. Only a Card written inside a Card's children in the same JSX is reported.",
    },
    {
      scope: "An inset preview of something that is itself a card",
      reason:
        "A settings card showing what a notification card will look like, or a theme picker drawing a sample card, nests a surface because the surface is the content. Say so on the line above the inner card with `{/* biome-ignore lint/plugin/no-nested-card: <reason> */}`, whose reason names what the inner card is a picture of. Name the rule: a bare `lint/plugin` is accepted too, and it quiets every plugin rule on that element — the hardcoded colour and the hand-built surface along with the nesting.",
    },
  ],
  enforcement: {
    kind: "lint",
    // The inner Card is what gets reported, because it is the one that has to
    // change. `within` counts the node itself, so a lone <Card> is inside a
    // Card; what rules that out is `children = $kids ... contains $card` — an
    // element's children cannot contain the element. The same clause is what
    // leaves a Card passed as a prop (`footer={<Card />}`) alone: it is inside
    // the outer element but not inside its children. `contains` reaches any
    // depth, so a Card two <div>s or a `.map()` below another Card is found.
    //
    // No `bubble` on the `within`, and that is load-bearing: `$card` has to be
    // the same variable inside the clause as outside it. Passed in as
    // `bubble($card)` it matched every node and the rule fired on every Card.
    biome: {
      via: "plugin",
      pattern: `or {
  JsxElement(opening_element = JsxOpeningElement(name = $name)),
  JsxSelfClosingElement(name = $name)
} as $card where {
  $name <: r"^Card$",
  $card <: within JsxElement(
    opening_element = JsxOpeningElement(name = $outer),
    children = $kids
  ) where {
    $outer <: r"^Card$",
    $kids <: contains $card
  }`,
    },
    message:
      "A Card inside a Card is a section: the inner one is dividing the outer one into parts, which a Heading does — add a Separator if a line is needed. If the inner cards repeat with the same fields, they are rows in a Table or a list. See https://ui-lib.quebi.de/rules/no-nested-card",
    grep: "<Card[\\s>]",
    note: "The check is lexical. It reports a <Card> written inside another <Card>'s children in the same JSX, at any depth and through a .map(); it does not see a Card rendered by a child component, or one passed in a prop. That is the blind spot and it is deliberate — the copy-paste case is the one agents write, and a component boundary is usually where a frame (a gallery, a preview) meets a specimen. The ripgrep line only finds Cards; which of them are nested is a review question.",
  },
  tags: ["elements", "card", "composition", "agents", "tier-7"],
}
