import { Keyboard, Kbd } from "@/components/keyboard"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-4">{children}</div>
)

export const keyboardExamples: ComponentExample[] = [
  {
    title: "Default",
    description: "A muted shortcut hint. Hidden below the lg breakpoint.",
    render: () => (
      <Row>
        <Keyboard>⌘K</Keyboard>
      </Row>
    ),
  },
  {
    title: "Individual keys",
    description: "Compose individual keys with Kbd.",
    render: () => (
      <Keyboard>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>P</Kbd>
      </Keyboard>
    ),
  },
  {
    title: "Inside a menu item",
    description: "Lives in a group parent and inherits hover/focus state.",
    render: () => (
      <div className="group flex w-64 cursor-pointer items-center justify-between border border-quebi-hairline px-3 py-2 text-quebi-fg transition-colors duration-150 hover:bg-quebi-raised">
        <span>open command palette</span>
        <Keyboard className="inline">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </Keyboard>
      </div>
    ),
  },
  {
    title: "Standalone keys",
    description: "Kbd works on its own for inline documentation.",
    render: () => (
      <Row>
        <Kbd>Esc</Kbd>
        <Kbd>Enter</Kbd>
        <Kbd>Tab</Kbd>
        <Kbd>⌫</Kbd>
      </Row>
    ),
  },
]
