import { Avatar } from "@/components/avatar"
import type { ComponentExample } from "./types"

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-3">{children}</div>
)

const PHOTO =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=256&h=256&fit=crop&crop=faces"

export const avatarExamples: ComponentExample[] = [
  {
    title: "Image",
    description: "An avatar backed by a user photo. The image is clipped to the avatar box.",
    render: () => (
      <Row>
        <Avatar src={PHOTO} alt="Ada Lovelace" size="lg" />
        <Avatar src={PHOTO} alt="Ada Lovelace" size="xl" />
        <Avatar src={PHOTO} alt="Ada Lovelace" size="3xl" />
      </Row>
    ),
  },
  {
    title: "Initials fallback",
    description: "With no image, initials render on a subtle dark surface — ideal for missing photos.",
    render: () => (
      <Row>
        <Avatar initials="AL" alt="Ada Lovelace" size="lg" />
        <Avatar initials="GH" alt="Grace Hopper" size="xl" />
        <Avatar initials="AT" alt="Alan Turing" size="3xl" />
      </Row>
    ),
  },
  {
    title: "Square",
    description: "Rounded-square variant via isSquare, for product or org logos.",
    render: () => (
      <Row>
        <Avatar src={PHOTO} alt="Ada Lovelace" size="xl" isSquare />
        <Avatar initials="QB" alt="quebi" size="xl" isSquare />
      </Row>
    ),
  },
  {
    title: "Sizes",
    description: "The scale runs xs through 9xl; here is a representative slice.",
    render: () => (
      <Row>
        <Avatar initials="XS" size="xs" />
        <Avatar initials="SM" size="sm" />
        <Avatar initials="MD" size="md" />
        <Avatar initials="LG" size="lg" />
        <Avatar initials="XL" size="xl" />
        <Avatar initials="2X" size="2xl" />
        <Avatar initials="4X" size="4xl" />
      </Row>
    ),
  },
]
