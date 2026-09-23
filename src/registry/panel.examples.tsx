import { Button } from "@/components/button"
import { Container } from "@/components/container"
import { Heading } from "@/components/heading"
import { Input } from "@/components/input"
import { Panel } from "@/components/panel"
import { Separator } from "@/components/separator"
import { Switch } from "@/components/switch"
import { Text } from "@/components/text"
import { TextField } from "@/components/text-field"
import type { ComponentExample } from "./types"

export const panelExamples: ComponentExample[] = [
  {
    title: "Default",
    frame: "none",
    description:
      "A muted band between two stretches of page. No edge and no corner: the tint is the whole separation.",
    render: () => (
      <div className="flex flex-col gap-6">
        <Text>The page runs on untinted, under its own headings.</Text>
        <Panel>
          <Heading level={3}>Frequently asked</Heading>
          <Text className="mt-2">
            A region the reader should see as one piece, set apart without drawing a box round it.
          </Text>
        </Panel>
        <Text>And carries on below it.</Text>
      </div>
    ),
  },
  {
    title: "Brand tone",
    frame: "none",
    description: "The mint tint, for the one band on the page that is asking for something.",
    render: () => (
      <Panel tone="brand" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level={3}>Move your team to Pro</Heading>
          <Text className="mt-1">Unlimited projects, audit log and SSO.</Text>
        </div>
        <Button intent="primary">Upgrade</Button>
      </Panel>
    ),
  },
  {
    title: "Two-column settings",
    frame: "none",
    description:
      "Label and help text on the left, controls on the right, rows divided by a Separator. The Panel groups the rows; nothing inside it needs a surface of its own.",
    render: () => (
      <Panel as="section" aria-labelledby="panel-settings-heading">
        <Heading id="panel-settings-heading" level={3}>
          Workspace
        </Heading>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <div>
              <Heading level={4}>Name</Heading>
              <Text className="mt-1">Shown in the sidebar and in invitations.</Text>
            </div>
            <TextField aria-label="Workspace name" defaultValue="Nordlicht">
              <Input />
            </TextField>
          </div>
          <Separator />
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <div>
              <Heading level={4}>Public profile</Heading>
              <Text className="mt-1">Anyone with the link can see the workspace's projects.</Text>
            </div>
            <Switch defaultSelected>Visible to everyone</Switch>
          </div>
        </div>
      </Panel>
    ),
  },
  {
    title: "Bleed inside a Container",
    frame: "none",
    description:
      "`bleed` pulls the band out through the Container's gutter and pads its content back in by the same amount, so the text inside starts where the text outside does.",
    render: () => (
      <Container className="flex flex-col gap-6">
        <Text>The column's text starts here.</Text>
        <Panel bleed>
          <Text>So does the band's, while its fill runs to the Container's edges.</Text>
        </Panel>
      </Container>
    ),
  },
  {
    title: "Across the window",
    frame: "none",
    description:
      "For a band the width of the window, put the Panel outside the Container and the Container inside it — the fill spans everything and the content keeps to the column.",
    render: () => (
      <Panel className="px-0">
        <Container>
          <Heading level={3}>Release notes</Heading>
          <Text className="mt-2">The content sits in the column; only the fill is full width.</Text>
        </Container>
      </Panel>
    ),
  },
]
