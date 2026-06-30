import type { ComponentMeta } from "./types"

export const formattedStorageMeta: ComponentMeta = {
  slug: "formatted-storage",
  name: "Formatted Storage",
  description:
    "Renders a storage capacity given in GB as a compact label, rolling values of 1024GB and above up to TB.",
  category: "Display",
  tags: ["display", "format", "storage", "capacity", "text"],
}
