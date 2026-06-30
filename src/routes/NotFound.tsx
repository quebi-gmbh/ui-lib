import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-quebi-content flex-col items-center justify-center px-6 py-24 text-center">
      <span className="quebi-eyebrow">404</span>
      <h1 className="mt-3 text-5xl font-bold tracking-tight text-white sm:text-6xl">Not found</h1>
      <p className="mt-4 text-base text-quebi-fg-muted">
        That page doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-quebi-brand transition-colors duration-200 hover:text-quebi-brand-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        Back home
      </Link>
    </section>
  )
}
