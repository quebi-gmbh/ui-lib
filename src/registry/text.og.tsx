import { Code, Strong, Text } from "@/components/text"
import type { OgScene } from "./types"

/** Body copy with the two inline parts that ship with it. */
export const textOgScene: OgScene = {
  scale: 1.8,
  render: () => (
    <div className="w-96">
      <Text>
        Copy the source into your project — <Strong>no install</Strong> — and resolve its{" "}
        <Code>registryDependencies</Code> from the API entry.
      </Text>
    </div>
  ),
}
