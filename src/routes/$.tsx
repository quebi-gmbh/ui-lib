import { seo } from "@/lib/seo"
import { ProseLink } from "@/site/prose-link"

export function meta() {
  return seo({ title: "Not found", description: "That page doesn't exist.", path: "/404" })
}

export default function NotFound() {
  return (
    <section className="quebi-shell flex min-h-[60vh] flex-col justify-end py-quebi-10">
      <p className="quebi-eyebrow">error 404 — not found</p>
      <div className="mt-quebi-8">
        <h1 className="font-display text-quebi-display-xl text-quebi-fg">not found.</h1>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-quebi-hairline border-t pt-4">
          <p className="text-quebi-body-s text-quebi-fg-muted">That page doesn't exist.</p>
          <ProseLink to="/" className="font-display text-quebi-link">
            back home →
          </ProseLink>
        </div>
      </div>
    </section>
  )
}
