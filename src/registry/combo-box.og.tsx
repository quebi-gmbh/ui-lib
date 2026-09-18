import { ComboBox, ComboBoxContent, ComboBoxInput, ComboBoxItem } from "@/components/combo-box"
import { Label } from "@/components/field"
import { useFocusOnMount } from "./og-scene"
import type { OgScene } from "./types"

const FRUITS = [
  { id: "apple", name: "Apple" },
  { id: "apricot", name: "Apricot" },
  { id: "avocado", name: "Avocado" },
]

/**
 * Focused, filtered, open. A ComboBox that is none of those things is an Input
 * with a chevron, which is the one thing it should not be mistaken for.
 */
const OpenFruitPicker = () => {
  const ref = useFocusOnMount<HTMLDivElement>()

  return (
    <div ref={ref} className="w-72">
      <ComboBox aria-label="Fruit" defaultInputValue="Ap">
        <Label>Favorite fruit</Label>
        <ComboBoxInput placeholder="Search fruit…" />
        <ComboBoxContent items={FRUITS}>
          {(item) => <ComboBoxItem id={item.id}>{item.name}</ComboBoxItem>}
        </ComboBoxContent>
      </ComboBox>
    </div>
  )
}

export const comboBoxOgScene: OgScene = {
  scale: 1.25,
  render: () => <OpenFruitPicker />,
}
