import { Link, data, useParams } from "react-router"
import { ChevronRight } from "lucide-react"
import { getComponent } from "@/registry"
import { componentSources } from "@/registry/sources.generated"
import { CodeBlock } from "@/components/code-block"
import { seo } from "@/lib/seo"
import type { Route } from "./+types/components.$slug"

export function loader({ params }: Route.LoaderArgs) {
  const component = getComponent(params.slug)
  if (!component) throw data("Not found", { status: 404 })
  // Return only serializable fields for meta + prerender; the live examples are
  // read from the in-memory registry in the component (render fns aren't serializable).
  return {
    slug: component.slug,
    name: component.name,
    description: component.description,
    category: component.category,
  }
}

export function meta({ loaderData: d }: Route.MetaArgs) {
  if (!d) return seo({ title: "Not found", description: "Component not found.", path: "/components" })
  return seo({
    title: d.name,
    description: d.description,
    path: `/components/${d.slug}`,
    image: `/og/${d.slug}.png`,
  })
}

export default function ComponentDetail() {
  const { slug } = useParams()
  const component = slug ? getComponent(slug) : undefined
  const sourceData = component ? componentSources[component.slug] : undefined

  if (!component) return null

  return (
    <div>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-quebi-fg-subtle">
          <li>
            <Link
              to="/components"
              className="text-quebi-fg-muted transition-colors duration-200 hover:text-white"
            >
              Components
            </Link>
          </li>
          <li aria-hidden className="flex items-center">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li className="font-medium text-white" aria-current="page">
            {component.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6">
        <span className="quebi-eyebrow">{component.category}</span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {component.name}
        </h1>
        <p className="mt-3 max-w-quebi-content text-base leading-relaxed text-quebi-fg-muted">
          {component.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {component.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-cyan-500/10 px-3 py-1 text-xs text-quebi-fg-subtle"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-12 space-y-10">
        {component.examples.map((example) => (
          <div key={example.title}>
            <h2 className="text-lg font-semibold text-white">{example.title}</h2>
            {example.description && (
              <p className="mt-1 text-sm leading-relaxed text-quebi-fg-muted">
                {example.description}
              </p>
            )}
            <div className="mt-4 flex min-h-[120px] items-center justify-center rounded-quebi-md border border-cyan-500/10 bg-white/[0.02] p-8">
              {example.render()}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-semibold text-white">Source</h2>
        <p className="mt-1 text-sm leading-relaxed text-quebi-fg-muted">
          Copy this into your project. Resolve its dependencies from the{" "}
          <code className="text-quebi-fg-subtle">registryDependencies</code> in the component's API
          entry.
        </p>
        <div className="mt-4">
          {sourceData ? (
            <CodeBlock html={sourceData.highlighted} code={sourceData.source} />
          ) : (
            <div className="h-40 animate-pulse rounded-quebi-md border border-cyan-500/10 bg-white/[0.02]" />
          )}
        </div>
      </div>
    </div>
  )
}
