import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { registry } from "@/registry"
import { groupByCategory } from "@/registry/grouping"

export default function Components() {
  const groups = groupByCategory(registry)

  return (
    <div>
      <span className="quebi-eyebrow">Catalog</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
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
                <Link
                  key={c.slug}
                  to={`/components/${c.slug}`}
                  className="group relative rounded-quebi-md border border-cyan-500/10 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-quebi-brand/30 hover:shadow-quebi-glow"
                >
                  <h3 className="text-xl font-semibold text-white">{c.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-quebi-fg-muted">
                    {c.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-quebi-brand transition-colors duration-200 group-hover:text-quebi-brand-hover">
                    View <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
