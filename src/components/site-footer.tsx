import { Link } from "react-router"

export function Footer() {
  return (
    <footer className="z-10 border-t border-quebi-line/10 py-8">
      <nav className="flex flex-row flex-wrap justify-center gap-4 text-sm text-quebi-fg-subtle sm:gap-6">
        <Link to="/components" className="hover:text-quebi-fg">
          Components
        </Link>
        <span aria-hidden>·</span>
        <Link to="/rules" className="hover:text-quebi-fg">
          Rules
        </Link>
        <span aria-hidden>·</span>
        <a href="https://quebi.de/en/imprint" className="hover:text-quebi-fg">
          Imprint
        </a>
        <span aria-hidden>·</span>
        <a href="https://quebi.de/en/privacy" className="hover:text-quebi-fg">
          Privacy
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://github.com/quebi-gmbh/ui-lib/blob/main/LICENSE"
          target="_blank"
          rel="noreferrer"
          className="hover:text-quebi-fg"
        >
          MIT License
        </a>
        <span aria-hidden>·</span>
        <a
          href="https://github.com/quebi-gmbh"
          target="_blank"
          rel="noreferrer"
          className="hover:text-quebi-fg"
        >
          GitHub
        </a>
      </nav>
      <p className="mt-4 text-center text-xs text-quebi-fg-subtle">
        © 2026 quebi GmbH · From Germany · Open source under MIT
      </p>
      <p className="mt-1 text-center text-xs text-quebi-fg-subtle">
        Hosted for free on{" "}
        <a
          href="https://pages.github.com/"
          target="_blank"
          rel="noreferrer"
          className="hover:text-quebi-fg"
        >
          GitHub Pages
        </a>{" "}
        — thank you, GitHub.
      </p>
    </footer>
  )
}
