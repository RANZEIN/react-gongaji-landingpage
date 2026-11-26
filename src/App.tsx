import { useCallback, useEffect, useState } from "react"
import GongajiLanding from "@/components/ui/gongaji-landing"
import { ArticleReaderPage, ArticlesDirectoryPage } from "@/components/ui/article-pages"

export type AppRoute =
  | { kind: "home"; anchor?: string }
  | { kind: "articles-list"; category: string }
  | { kind: "article-detail"; uuid: string }

function parseLocationRoute(): AppRoute {
  const { pathname, search, hash } = window.location

  if (pathname.startsWith("/artikel")) {
    const rest = pathname.slice("/artikel".length)
    const cleanRest = rest.replace(/^\/+/, "").split("/")[0]
    if (cleanRest) {
      return { kind: "article-detail", uuid: decodeURIComponent(cleanRest) }
    }
    const params = new URLSearchParams(search)
    return { kind: "articles-list", category: params.get("category") || "Semua" }
  }

  if (hash.startsWith("#/artikel")) {
    const rest = hash.slice("#/artikel".length)
    if (rest.startsWith("/") && rest.length > 1) {
      const uuid = decodeURIComponent(rest.slice(1).split("?")[0].split("/")[0])
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

const THEME_STORAGE_KEY = "gongaji-theme"

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseLocationRoute())
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === "dark"
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light")
    } catch {
      // ignore storage restrictions
    }
  }, [dark])

  const syncFromLocation = useCallback(() => {
    const next = parseLocationRoute()
    setRoute(next)
    if (next.kind === "articles-list" || next.kind === "article-detail") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    } else if (next.anchor) {
      window.setTimeout(() => {
        if (next.anchor === "top") {
          window.scrollTo({ top: 0, behavior: "smooth" })
        } else {
          document.getElementById(next.anchor!)?.scrollIntoView({ behavior: "smooth" })
        }
      }, 60)
    } else {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    }
  }, [])

  useEffect(() => {
    window.addEventListener("popstate", syncFromLocation)
    window.addEventListener("hashchange", syncFromLocation)
    return () => {
      window.removeEventListener("popstate", syncFromLocation)
      window.removeEventListener("hashchange", syncFromLocation)
    }
  }, [syncFromLocation])

  const navigate = useCallback(
    (to: string) => {
      if (to === window.location.pathname + window.location.search + window.location.hash) {
        syncFromLocation()
        return
      }
      window.history.pushState(null, "", to)
      syncFromLocation()
    },
    [syncFromLocation],
  )

  if (route.kind === "articles-list") {
    return (
      <ArticlesDirectoryPage
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        initialCategory={route.category}
        onNavigate={navigate}
      />
    )
  }

  if (route.kind === "article-detail") {
    return (
      <ArticleReaderPage
        uuid={route.uuid}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onNavigate={navigate}
      />
    )
  }

  return <GongajiLanding dark={dark} onDarkChange={setDark} />
}
