import { Code, Strong, Text, TextLink } from "@/components/text"
import type { ComponentExample } from "./types"

export const textExamples: ComponentExample[] = [
  {
    title: "Paragraph",
    description: "Running text: Inter in the muted ink.",
    render: () => (
      <Text>
        Quebi pairs your roster against the brief and surfaces the strongest matches in seconds, so
        you spend your time on conversations instead of spreadsheets.
      </Text>
    ),
  },
  {
    title: "With emphasis",
    description: "Strong steps up to full ink to pull a phrase out of the running text.",
    render: () => (
      <Text>
        Every match ships with a <Strong>confidence score</Strong> and a short rationale you can
        forward to the client untouched.
      </Text>
    ),
  },
  {
    title: "With a link",
    description: "Inline TextLink carries the ink underline every Link has at rest, and opens it on hover.",
    render: () => (
      <Text>
        Need the full breakdown? Read the{" "}
        <TextLink href="https://quebi.de">matching methodology</TextLink> or jump straight into a new
        search.
      </Text>
    ),
  },
  {
    title: "Inline code",
    description: "Code wraps identifiers and snippets within prose.",
    render: () => (
      <Text>
        Set the <Code>QUEBI_API_KEY</Code> environment variable, then call <Code>quebi match</Code>{" "}
        to run a search from the CLI.
      </Text>
    ),
  },
]
