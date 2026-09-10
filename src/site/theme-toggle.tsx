import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/button"

type Theme = "light" | "dark"

const STORAGE_KEY = "quebi-theme"

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

function applyTheme(theme: Theme) {
  const el = document.documentElement
  el.classList.remove("light", "dark")
  el.classList.add(theme)
  el.style.colorScheme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* private mode / storage disabled — the in-page toggle still works */
  }
}

/**
 * Header dark/light switch. The actual initial theme is set before paint by the
 * inline script in root.tsx (no FOUC); this control only reads and flips the
 * `dark`/`light` class on <html> and persists the choice.
 *
 * Hydration-safe: `theme` starts `undefined` and is resolved from the live DOM
 * in an effect, so server markup and first client render agree.
 *
 * Button rather than Toggle: this is not a two-state control whose "on" state
 * means anything — neither theme is the pressed one — so `aria-pressed` would
 * be a lie. It is a single action that swaps to the other theme.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | undefined>(undefined)

  useEffect(() => {
    setTheme(currentTheme())
  }, [])

  const isLight = theme === "light"
  const next: Theme = isLight ? "dark" : "light"

  function toggle() {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <Button
      intent="outline"
      size="sq-sm"
      onPress={toggle}
      aria-label={`Switch to ${next} theme`}
    >
      {/* Icon reflects the target action; before mount (theme undefined) both are
          hidden to avoid rendering the wrong glyph, then it settles on mount. */}
      {theme !== undefined &&
        (isLight ? <Moon data-slot="icon" aria-hidden /> : <Sun data-slot="icon" aria-hidden />)}
    </Button>
  )
}
