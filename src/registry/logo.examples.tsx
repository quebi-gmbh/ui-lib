import { Logo } from "@/components/logo"
import type { ComponentExample } from "./types"

export const logoExamples: ComponentExample[] = [
  {
    title: "Wordmark",
    description: "The default: 20px for a nav bar, 32px in a landing page's top-left corner.",
    render: () => (
      <div className="flex items-center gap-8">
        <Logo />
        <Logo height={32} />
      </div>
    ),
  },
  {
    title: "Mark",
    description: "The round q on its own, at 36px or more — where the name is already said nearby.",
    render: () => (
      <div className="flex items-center gap-8">
        <Logo variant="mark" />
        <Logo variant="mark" height={56} />
      </div>
    ),
  },
  {
    title: "Both inks",
    description:
      "Each logo renders both files and the theme picks one. A `light` or `dark` class on any ancestor re-themes the subtree, so the same component reads on paper and on ink.",
    render: () => (
      <div className="grid w-full grid-cols-2">
        <div className="light flex items-center justify-center bg-quebi-bg py-8">
          <Logo height={32} />
        </div>
        <div className="dark flex items-center justify-center bg-quebi-bg py-8">
          <Logo height={32} />
        </div>
      </div>
    ),
  },
]
