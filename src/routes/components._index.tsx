import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { Card, CardDescription, CardTitle } from "@/components/card"
import { registry } from "@/registry"
import { groupByCategory } from "@/registry/grouping"
import { seo } from "@/lib/seo"

export function meta() {
  return seo({
    title: "Components",
    description: `Browse ${registry.length} accessible React components styled with the quebi design system — buttons, forms, overlays, charts, navigation, and more. Copy-paste source.`,
    path: "/components",
  })
}

export default function Components() {
  const groups = groupByCategory(registry)

  return (
    <div>
      <span className="quebi-eyebrow">Catalog</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-quebi-fg sm:text-4xl">
        Components
      </h1>
      <p className="mt-4 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
        {registry.length} component{registry.length === 1 ? "" : "s"} and counting. Each renders live
        and ships as copy-paste source.
      </p>

      <div className="mt-12 space-y-14">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="quebi-eyebrow mb-4">{group.category}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {group.components.map((c) => (
                <Link key={c.slug} to={`/components/${c.slug}`} className="group block">
                  <Card interactive className="p-6">
                    <CardTitle>{c.name}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">{c.description}</CardDescription>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-quebi-brand transition-colors duration-200 group-hover:text-quebi-brand-hover">
                      View <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
