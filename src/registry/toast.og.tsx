import { useEffect, useRef } from "react"
import { ToastProvider, useToast } from "@/components/toast"
import type { OgScene } from "./types"

/**
 * Two toasts, raised on mount and given no duration so they do not start
 * counting down out of the picture. A Toast has no declarative open state — it
 * is a queue you push onto — so the scene pushes.
 */
const Raise = () => {
  const toast = useToast()
  // A queue does not de-duplicate, and an effect that runs twice — React's
  // development double-invoke, a remount — would put four toasts in the
  // picture instead of two.
  const raised = useRef(false)

  useEffect(() => {
    if (raised.current) return
    raised.current = true
    toast.success("Catalog synced", { description: "24 plans updated", duration: 0 })
    toast({ title: "Changes autosaved · 14:02", duration: 0 })
  }, [toast])

  return null
}

export const toastOgScene: OgScene = {
  render: () => (
    <ToastProvider position="bottom-right">
      <Raise />
    </ToastProvider>
  ),
}
