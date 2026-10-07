import { metaRegistry } from "@/registry/meta"
import { groupByCategory } from "@/registry/grouping"
import { seo } from "@/lib/seo"
import { IndexLinkList } from "@/site/prose-link"

export function meta() {
  return seo({
    title: "Components",
    description: `Browse ${metaRegistry.length} accessible React components styled with the quebi design system — buttons, forms, overlays, charts, navigation, and more. Copy-paste source.`,
    path: "/components",
  })
}

const pad = (n: number) => String(n).padStart(2, "0")

export default function Components() {
  const groups = groupByCategory(metaRegistry)

  return (
    <div>
      <p className="quebi-eyebrow">catalog — {metaRegistry.length} components</p>
      <h1 className="mt-3 font-display text-quebi-display-l text-quebi-fg">components</h1>
      <p className="mt-5 max-w-[60ch] text-quebi-body text-quebi-fg-muted">
        {metaRegistry.length} component{metaRegistry.length === 1 ? "" : "s"} and counting. Each
        renders live and ships as copy-paste source.
      </p>

      {groups.map((group) => (
        <section key={group.category} className="mt-quebi-9">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-quebi-display-s text-quebi-fg">
              {group.category.toLowerCase()}
            </h2>
            <span className="quebi-eyebrow">{pad(group.components.length)} entries</span>
          </div>
          <IndexLinkList
            rows={group.components.map((c) => ({
              to: `/components/${c.slug}`,
              title: c.name,
              description: c.description,
            }))}
          />
        </section>
      ))}
    </div>
  )
}
