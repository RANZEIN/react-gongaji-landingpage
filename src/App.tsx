import { useEffect, useState } from "react"
import EaselShowcaseTemplate from "@/components/ui/easel-showcase-template"
import { ArticleReaderPage, ArticlesDirectoryPage } from "@/components/ui/article-pages"

type ArticleRoute =
  | { kind: "home"; anchor?: string }
  | { kind: "articles-list"; category: string }
  | { kind: "article-detail"; uuid: string }

function parseHashRoute(hash: string): ArticleRoute {
  if (hash.startsWith("#/artikel")) {
    const rest = hash.slice("#/artikel".length)
    if (rest.startsWith("/") && rest.length > 1) {
      const uuid = decodeURIComponent(rest.slice(1).split("?")[0])
      if (uuid) return { kind: "article-detail", uuid }
    }
    const qIdx = rest.indexOf("?")
    let category = "Semua"
    if (qIdx >= 0) {
      const params = new URLSearchParams(rest.slice(qIdx + 1))
      category = params.get("category") || "Semua"
    }
    return { kind: "articles-list", category }
  }
  const anchor = hash.startsWith("#") && hash.length > 1 ? hash.slice(1) : undefined
  return { kind: "home", anchor }
}

export default function App() {
  const [route, setRoute] = useState<ArticleRoute>(() => parseHashRoute(window.location.hash))
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    const onHashChange = () => {
      const next = parseHashRoute(window.location.hash)
      setRoute(next)
      if (next.kind === "articles-list" || next.kind === "article-detail") {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
      } else if (next.anchor) {
        requestAnimationFrame(() => {
          if (next.anchor === "top") {
            window.scrollTo({ top: 0, behavior: "smooth" })
          } else {
            document.getElementById(next.anchor!)?.scrollIntoView({ behavior: "smooth" })
          }
        })
      }
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  if (route.kind === "articles-list") {
    return (
      <ArticlesDirectoryPage
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        initialCategory={route.category}
      />
    )
  }

  if (route.kind === "article-detail") {
    return (
      <ArticleReaderPage
        uuid={route.uuid}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
      />
    )
  }

  return <EaselShowcaseTemplate dark={dark} onDarkChange={setDark} />
}
