"use client"

import { useEffect, useMemo, useState, type MouseEvent } from "react"
import {
  cleanArticleExcerpt,
  DEFAULT_ARTICLES,
  estimateReadingMinutes,
  fetchAllPublicArticles,
  fetchPublicArticleDetail,
  formatArticleDate,
  GONGAJI_LINKS,
  GONGAJI_LOGO,
  NAV_ITEMS,
  sanitizeArticleHtml,
  splitCategories,
  type ApiArticle,
  type ApiArticleDetail,
} from "@/data/gongaji"

const FALLBACK_ARTICLE_IMAGE = "/assets/06-artikel-carousel/01-belajar-pemula.webp"
const PAGE_SIZE = 12

type SortMode = "newest" | "popular" | "oldest"

const ICON = {
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  download: "M12 4v11M7 10l5 5 5-5M5 19h14",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  spark: "M12 3v6M12 15v6M3 12h6M15 12h6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5",
  sliders: "M4 6h16M7 12h10M10 18h4",
  left: "M19 12H5M11 6l-6 6 6 6",
  link: "M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4.93M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19.07",
}

function Svg({ d, size = 15, stroke = 1.7 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

function BrandLogo({ dark }: { dark: boolean }) {
  const markFill = dark ? "#FFFFFF" : "#5145B9"
  const wordFill = dark ? "#FFFFFF" : "#191919"
  return (
    <svg viewBox="38 33 358 82" height={24} role="img" aria-label="Gongaji" className="gj-brand-svg">
      <path d={GONGAJI_LOGO.markPath} fill={markFill} fillRule="evenodd" style={{ transition: "fill .25s ease" }} />
      {GONGAJI_LOGO.wordmarkPaths.map((path, i) => (
        <path key={i} d={path} fill={wordFill} style={{ transition: "fill .25s ease" }} />
      ))}
    </svg>
  )
}

function isPlainLeftClick(e: MouseEvent<HTMLAnchorElement>) {
  return !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0
}

function SubpageHeader({
  dark,
  onToggleDark,
  onNavigate,
}: {
  dark: boolean
  onToggleDark: () => void
  onNavigate: (to: string) => void
}) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNav = (e: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (!target.startsWith("/")) return
    if (isPlainLeftClick(e)) {
      e.preventDefault()
      onNavigate(target)
    }
  }

  return (
    <header className={"gj-nav gj-subnav" + (solid ? " gj-solid" : "")}>
      <a className="gj-brand" href="/" onClick={(e) => handleNav(e, "/")} aria-label="Gongaji — Beranda">
        <BrandLogo dark={dark} />
      </a>
      <nav className="gj-links" aria-label="Navigasi utama">
        {NAV_ITEMS.map((item) => {
          const isMail = item.href.startsWith("mailto:")
          const target = item.label === "Artikel" ? "/artikel" : isMail ? item.href : "/" + item.href
          const isCurrent = item.label === "Artikel"
          return (
            <a
              key={item.label}
              className={"gj-link" + (isCurrent ? " is-current" : "")}
              href={target}
              aria-current={isCurrent ? "page" : undefined}
              onClick={(e) => handleNav(e, target)}
            >
              {"live" in item && item.live && <i className="gj-dot" aria-hidden="true" />}
              {item.label}
            </a>
          )
        })}
      </nav>
      <div className="gj-tools">
        <a
          className="gj-round"
          href={GONGAJI_LINKS.playStore}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download Gongaji di Google Play"
        >
          <Svg d={ICON.download} size={15} />
        </a>
        <button
          type="button"
          className="gj-round"
          aria-label={dark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
          aria-pressed={dark}
          onClick={onToggleDark}
        >
          <Svg d={ICON.sun} size={15} />
        </button>
      </div>
    </header>
  )
}

function SubpageFooter({ onNavigate }: { onNavigate: (to: string) => void }) {
  const mail = "mailto:" + GONGAJI_LINKS.email
  const handleNav = (e: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (isPlainLeftClick(e)) {
      e.preventDefault()
      onNavigate(target)
    }
  }

  return (
    <>
      <section className="gj-sub-cta-wrap" aria-label="Unduh Aplikasi Gongaji">
        <div className="gj-wrap">
          <div className="gj-sub-cta">
            <div>
              <span className="gj-duo-pill">Ekosistem Gongaji · App, Qursus &amp; DonasiQu</span>
              <h2 className="gj-h3">
                Baca Al-Qur’an &amp; Belajar{" "}
                <span>Lebih Terarah</span>
              </h2>
              <p className="gj-small">
                Nikmati 25+ fitur ibadah gratis di Gongaji App, kelas live Qursus 5–8 peserta, dan transparansi donasi DonasiQu.
              </p>
            </div>
            <div className="gj-sub-cta-btns">
              <a className="gj-btn gj-btn-w" href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer">
                Unduh Gongaji App
              </a>
              <a className="gj-btn-outline-w" href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Kenali Qursus
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="gj-foot">
        <div className="gj-wrap gj-foot-grid">
          <div>
            <h2 className="gj-h4">
              Baca. Belajar. Berbagi. <span className="gj-foot-dots">#JadiLebihMudah</span>
            </h2>
            <p className="gj-small">
              Membantu siapa pun membaca, belajar, dan berbagi kebaikan bersama Al-Qur’an. DonasiQu dikelola oleh Yayasan Quran Bina Bangsa (Qubba Foundation).
            </p>
            <a className="gj-mail" href={mail}>
              {GONGAJI_LINKS.email}
            </a>
            <span className="gj-contact-meta">
              {GONGAJI_LINKS.whatsapp} · {GONGAJI_LINKS.instagram}
            </span>
            <div className="gj-socials">
              <a href={mail} aria-label="Email Gongaji">
                <Svg d={ICON.mail} size={12} />
              </a>
              <a href={GONGAJI_LINKS.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Gongaji">
                <Svg d={ICON.globe} size={12} />
              </a>
              <a href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer" aria-label="Gongaji di Google Play">
                <Svg d={ICON.grid} size={12} />
              </a>
              <a href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer" aria-label="Qursus by Gongaji">
                <Svg d={ICON.spark} size={12} />
              </a>
            </div>
          </div>
          <ul>
            <li>
              <a href="/#fitur" onClick={(e) => handleNav(e, "/#fitur")}>
                Gongaji App
              </a>
            </li>
            <li>
              <i className="gj-dot" />{" "}
              <a href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Qursus
              </a>{" "}
              <span className="gj-new">Live</span>
            </li>
            <li>
              <a href="/#donasiqu" onClick={(e) => handleNav(e, "/#donasiqu")}>
                DonasiQu
              </a>
            </li>
            <li>
              <a href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer">
                Google Play
              </a>
            </li>
            <li>
              <a href={GONGAJI_LINKS.appStore} target="_blank" rel="noopener noreferrer">
                App Store
              </a>
            </li>
          </ul>
          <ul>
            <li>
              <a href="/#qursus" onClick={(e) => handleNav(e, "/#qursus")}>
                Pemula 1 – Mahir 2
              </a>
            </li>
            <li>
              <i className="gj-dot" />{" "}
              <a href="/#pricing" onClick={(e) => handleNav(e, "/#pricing")}>
                Biaya &amp; Beasiswa
              </a>
            </li>
            <li>
              <a href="/#donasiqu" onClick={(e) => handleNav(e, "/#donasiqu")}>
                Program DonasiQu
              </a>
            </li>
            <li>
              <a href="/artikel" onClick={(e) => handleNav(e, "/artikel")}>
                Artikel Islami <span className="gj-soon">Baru</span>
              </a>
            </li>
          </ul>
          <ul>
            <li>Qubba Foundation</li>
            <li>
              <a href={mail}>Kontak Kami</a>
            </li>
            <li>
              Kemitraan <span className="gj-soon">Mitra</span>
            </li>
          </ul>
          <p className="gj-copy">© 2026 Gongaji. Semua hak dilindungi.</p>
        </div>
      </footer>
    </>
  )
}

function ArticleCard({
  item,
  onNavigate,
}: {
  item: ApiArticle
  onNavigate: (to: string) => void
}) {
  const categories = splitCategories(item.article_category)
  const href = `/artikel/${item.article_uuid}`

  return (
    <a
      href={href}
      className="gj-art-card"
      aria-label={`Baca artikel ${item.article_title}`}
      onClick={(e) => {
        if (isPlainLeftClick(e)) {
          e.preventDefault()
          onNavigate(href)
        }
      }}
    >
      <div className="gj-art-media">
        <img
          src={item.article_image_url || FALLBACK_ARTICLE_IMAGE}
          alt={item.article_title}
          width={400}
          height={250}
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.dataset.fb) {
              e.currentTarget.dataset.fb = "1"
              e.currentTarget.src = FALLBACK_ARTICLE_IMAGE
            }
          }}
        />
        {categories[0] ? <span className="gj-art-cat">{categories[0]}</span> : null}
      </div>
      <div className="gj-art-body">
        <div className="gj-art-meta">
          <span>{formatArticleDate(item.article_published_at)}</span>
          <span>{(item.article_total_view ?? 0).toLocaleString("id-ID")} dilihat</span>
        </div>
        <h3>{item.article_title}</h3>
        <p>{cleanArticleExcerpt(item.article_excerpt)}</p>
        <div className="gj-art-foot">
          <span className="gj-art-author">{item.article_author || "Redaksi Gongaji"}</span>
          <small>Baca artikel →</small>
        </div>
      </div>
    </a>
  )
}

export function ArticlesDirectoryPage({
  dark,
  onToggleDark,
  initialCategory = "Semua",
  onNavigate,
}: {
  dark: boolean
  onToggleDark: () => void
  initialCategory?: string
  onNavigate: (to: string) => void
}) {
  const [articles, setArticles] = useState<readonly ApiArticle[]>(DEFAULT_ARTICLES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(initialCategory || "Semua")
  const [sort, setSort] = useState<SortMode>("newest")
  const [page, setPage] = useState(1)

  useEffect(() => {
    document.title = "Artikel & Wawasan — Gongaji"
    return () => {
      document.title = "Gongaji — Jalani hari bersama Al-Qur’an"
    }
  }, [])

  useEffect(() => {
    setCategory(initialCategory || "Semua")
    setPage(1)
  }, [initialCategory])

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    fetchAllPublicArticles(ctrl.signal)
      .then((res) => {
        if (res.items.length > 0) {
          setArticles(res.items)
        }
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Sebagian artikel gagal dimuat dari server.")
        setLoading(false)
      })
    return () => ctrl.abort()
  }, [reloadTick])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of articles) {
      for (const cat of splitCategories(item.article_category)) {
        counts.set(cat, (counts.get(cat) ?? 0) + 1)
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [articles])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matching = articles.filter((item) => {
      if (category !== "Semua") {
        const cats = splitCategories(item.article_category)
        if (!cats.includes(category)) return false
      }
      if (!needle) return true
      const haystack = `${item.article_title ?? ""} ${item.article_excerpt ?? ""} ${item.article_author ?? ""} ${item.article_category ?? ""}`.toLowerCase()
      return haystack.includes(needle)
    })

    const sorted = [...matching]
    sorted.sort((a, b) => {
      if (sort === "popular") return (b.article_total_view ?? 0) - (a.article_total_view ?? 0)
      const ta = new Date(a.article_published_at ?? "").getTime() || 0
      const tb = new Date(b.article_published_at ?? "").getTime() || 0
      return sort === "oldest" ? ta - tb : tb - ta
    })
    return sorted
  }, [articles, category, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  const hasActiveFilter = category !== "Semua" || query.trim().length > 0 || sort !== "newest"

  const resetFilters = () => {
    setQuery("")
    setCategory("Semua")
    setSort("newest")
    setPage(1)
  }

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className={"gj-root gj-subpage" + (dark ? " gj-dark" : "")}>
      <style>{SUBPAGE_CSS}</style>
      <SubpageHeader dark={dark} onToggleDark={onToggleDark} onNavigate={onNavigate} />

      <main className="gj-submain">
        <section className="gj-sub-hero">
          <div className="gj-wrap">
            <div className="gj-sub-head">
              <div className="gj-sub-head-copy">
                <p className="gj-eyebrow">
                  ARTIKEL &amp; <span className="gj-purplew">WAWASAN</span>
                </p>
                <h1 className="gj-h2">
                  Artikel Pilihan &amp;
                  <br />
                  Panduan Qur’an
                </h1>
                <p className="gj-small gj-sub-desc">
                  Bacaan terkurasi seputar Al-Qur’an, fikih, akidah, Ramadan, dan keluarga Muslim langsung dari redaksi Gongaji.
                </p>
              </div>
              <div className="gj-sub-head-side">
                <div className="gj-sub-tags" aria-hidden="true">
                  <span className="gj-tag-inline gj-blue">@gongaji.artikel</span>
                  <span className="gj-tag-inline gj-mint">#WawasanQurani</span>
                </div>
              </div>
            </div>

            <div className="gj-filter-card" role="region" aria-label="Filter dan pencarian artikel">
              <div className="gj-search-row">
                <label className="gj-search-box">
                  <Svg d={ICON.search} size={15} />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Cari artikel atau penulis..."
                    aria-label="Cari artikel"
                  />
                  {query ? (
                    <button
                      type="button"
                      className="gj-clear-x"
                      onClick={() => {
                        setQuery("")
                        setPage(1)
                      }}
                      aria-label="Hapus kata kunci"
                    >
                      ×
                    </button>
                  ) : null}
                </label>

                <label className={"gj-sort-wrap" + (sort !== "newest" ? " is-filtered" : "")} title="Urutkan & filter artikel">
                  <Svg d={ICON.sliders} size={15} />
                  <span className="gj-sort-label">Urutkan</span>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as SortMode)
                      setPage(1)
                    }}
                    aria-label="Urutkan artikel"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="popular">Terpopuler (Dilihat)</option>
                    <option value="oldest">Terlama</option>
                  </select>
                </label>
              </div>

              <div
                className="gj-cats"
                role="tablist"
                aria-label="Filter kategori artikel"
                onWheel={(e) => {
                  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
                    e.preventDefault()
                    e.currentTarget.scrollLeft += e.deltaY
                  }
                }}
              >
                <button
                  type="button"
                  className={"gj-cat-pill" + (category === "Semua" ? " is-on" : "")}
                  aria-pressed={category === "Semua"}
                  onClick={() => {
                    setCategory("Semua")
                    setPage(1)
                  }}
                >
                  Semua <small>{articles.length}</small>
                </button>
                {categoryCounts.map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    className={"gj-cat-pill" + (category === name ? " is-on" : "")}
                    aria-pressed={category === name}
                    onClick={() => {
                      setCategory(name)
                      setPage(1)
                    }}
                  >
                    {name} <small>{count}</small>
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="gj-notice">
                <span>{error}</span>
                <button type="button" className="gj-btn" onClick={() => setReloadTick((t) => t + 1)}>
                  Muat Ulang
                </button>
              </div>
            ) : null}

            {loading && articles.length <= 3 ? (
              <div className="gj-art-grid gj-in">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="gj-sk-card" aria-hidden="true">
                    <div className="gj-sk-media" />
                    <div className="gj-sk-body">
                      <div className="gj-sk-line w40" />
                      <div className="gj-sk-line w90" />
                      <div className="gj-sk-line w75" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="gj-empty-box">
                <h2 className="gj-h4">Belum ada artikel yang cocok</h2>
                <p className="gj-small">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
                {hasActiveFilter ? (
                  <button type="button" className="gj-btn" onClick={resetFilters}>
                    Reset Semua Filter
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="gj-result-bar">
                  <span>
                    Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} artikel
                    {category !== "Semua" ? ` · Kategori “${category}”` : ""}
                  </span>
                  {hasActiveFilter ? (
                    <button type="button" className="gj-ghost" onClick={resetFilters}>
                      Reset Filter
                    </button>
                  ) : null}
                </div>

                <div className="gj-art-grid gj-in">
                  {visibleItems.map((item) => (
                    <ArticleCard key={item.article_uuid} item={item} onNavigate={onNavigate} />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <nav className="gj-pagination" aria-label="Navigasi halaman artikel">
                    <button type="button" disabled={safePage <= 1} onClick={() => goToPage(safePage - 1)}>
                      ← Sebelumnya
                    </button>
                    <div className="gj-page-nums">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          className={num === safePage ? "is-on" : ""}
                          aria-current={num === safePage ? "page" : undefined}
                          onClick={() => goToPage(num)}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <button type="button" disabled={safePage >= totalPages} onClick={() => goToPage(safePage + 1)}>
                      Berikutnya →
                    </button>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>

      <SubpageFooter onNavigate={onNavigate} />
    </div>
  )
}

export function ArticleReaderPage({
  uuid,
  dark,
  onToggleDark,
  onNavigate,
}: {
  uuid: string
  dark: boolean
  onToggleDark: () => void
  onNavigate: (to: string) => void
}) {
  const [article, setArticle] = useState<ApiArticleDetail | null>(null)
  const [related, setRelated] = useState<readonly ApiArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    setCopied(false)

    fetchPublicArticleDetail(uuid, ctrl.signal)
      .then((detail) => {
        setArticle(detail)
        setLoading(false)
        document.title = `${detail.article_title} — Artikel Gongaji`
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Artikel tidak dapat dimuat. Silakan coba lagi atau pilih artikel lainnya.")
        setLoading(false)
      })

    fetchAllPublicArticles(ctrl.signal)
      .then((res) => {
        setRelated(res.items.filter((it) => it.article_uuid !== uuid))
      })
      .catch(() => { })

    return () => {
      ctrl.abort()
      document.title = "Gongaji — Jalani hari bersama Al-Qur’an"
    }
  }, [uuid, reloadTick])

  const cleanHtml = useMemo(
    () => (article ? sanitizeArticleHtml(article.article_description) : ""),
    [article],
  )

  const readMinutes = useMemo(
    () => (article ? estimateReadingMinutes(article.article_description) : 1),
    [article],
  )

  const categories = useMemo(() => {
    if (!article) return []
    if (article.article_category_list && article.article_category_list.length > 0) {
      return article.article_category_list.map((c) => c.name).filter(Boolean)
    }
    return splitCategories(article.article_category)
  }, [article])

  const tags = useMemo(() => {
    if (!article) return []
    if (article.article_tag_list && article.article_tag_list.length > 0) {
      return article.article_tag_list.map((t) => t.name).filter(Boolean)
    }
    return splitCategories(article.article_tag)
  }, [article])

  const relatedThree = useMemo(() => {
    if (!article || related.length === 0) return []
    const primaryCats = new Set(categories)
    const sameCategory = related.filter((r) => splitCategories(r.article_category).some((c) => primaryCats.has(c)))
    const fallback = related.filter((r) => !sameCategory.some((s) => s.article_uuid === r.article_uuid))
    return [...sameCategory, ...fallback].slice(0, 3)
  }, [article, categories, related])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={"gj-root gj-subpage" + (dark ? " gj-dark" : "")}>
      <style>{SUBPAGE_CSS}</style>
      <SubpageHeader dark={dark} onToggleDark={onToggleDark} onNavigate={onNavigate} />

      <main className="gj-submain">
        <div className="gj-wrap">
          <div className="gj-reader-topbar">
            <a
              href="/artikel"
              className="gj-back-link"
              onClick={(e) => {
                if (isPlainLeftClick(e)) {
                  e.preventDefault()
                  onNavigate("/artikel")
                }
              }}
            >
              <Svg d={ICON.left} size={14} />
              Kembali ke Semua Artikel
            </a>
            <div className="gj-breadcrumb">
              <a
                href="/#artikel"
                onClick={(e) => {
                  if (isPlainLeftClick(e)) {
                    e.preventDefault()
                    onNavigate("/#artikel")
                  }
                }}
              >
                Beranda
              </a>
              <span aria-hidden="true">/</span>
              <a
                href="/artikel"
                onClick={(e) => {
                  if (isPlainLeftClick(e)) {
                    e.preventDefault()
                    onNavigate("/artikel")
                  }
                }}
              >
                Artikel
              </a>
            </div>
          </div>

          {loading ? (
            <div className="gj-reader-shell">
              <div className="gj-sk-line w40" />
              <div className="gj-sk-line w90" style={{ height: 34 }} />
              <div className="gj-sk-line w75" style={{ height: 34 }} />
              <div className="gj-sk-cover" />
              <div className="gj-sk-line w90" />
              <div className="gj-sk-line w90" />
              <div className="gj-sk-line w75" />
            </div>
          ) : error || !article ? (
            <div className="gj-empty-box">
              <h2 className="gj-h4">Gagal Membuka Artikel</h2>
              <p className="gj-small">{error || "Artikel tidak ditemukan."}</p>
              <div className="gj-empty-actions">
                <button type="button" className="gj-btn" onClick={() => setReloadTick((t) => t + 1)}>
                  Coba Lagi
                </button>
                <a
                  href="/artikel"
                  className="gj-ghost"
                  onClick={(e) => {
                    if (isPlainLeftClick(e)) {
                      e.preventDefault()
                      onNavigate("/artikel")
                    }
                  }}
                >
                  Lihat Semua Artikel
                </a>
              </div>
            </div>
          ) : (
            <article className="gj-reader-shell">
              <header className="gj-reader-head">
                {categories.length > 0 ? (
                  <div className="gj-reader-cats">
                    {categories.map((cat) => {
                      const target = `/artikel?category=${encodeURIComponent(cat)}`
                      return (
                        <a
                          key={cat}
                          href={target}
                          className="gj-reader-cat"
                          onClick={(e) => {
                            if (isPlainLeftClick(e)) {
                              e.preventDefault()
                              onNavigate(target)
                            }
                          }}
                        >
                          {cat}
                        </a>
                      )
                    })}
                  </div>
                ) : null}
                <h1>{article.article_title}</h1>
                <div className="gj-reader-meta-bar">
                  <div className="gj-author-box">
                    <span className="gj-author-avatar" aria-hidden="true">
                      {(article.article_author || "Gongaji").trim().charAt(0).toUpperCase() || "G"}
                    </span>
                    <div>
                      <strong>{article.article_author || "Redaksi Gongaji"}</strong>
                      <small>
                        {formatArticleDate(article.article_published_at)} · {readMinutes} menit baca ·{" "}
                        {(article.article_total_view ?? 0).toLocaleString("id-ID")} dilihat
                        {typeof article.article_total_like === "number" ? ` · ${article.article_total_like} suka` : ""}
                      </small>
                    </div>
                  </div>
                  <button type="button" className="gj-share-btn" onClick={handleCopyLink}>
                    <Svg d={ICON.link} size={13} />
                    {copied ? "Tautan Disalin" : "Salin Tautan"}
                  </button>
                </div>
              </header>

              <figure className="gj-reader-cover">
                <img
                  src={article.article_image_url || FALLBACK_ARTICLE_IMAGE}
                  alt={article.article_title}
                  onError={(e) => {
                    if (!e.currentTarget.dataset.fb) {
                      e.currentTarget.dataset.fb = "1"
                      e.currentTarget.src = FALLBACK_ARTICLE_IMAGE
                    }
                  }}
                />
              </figure>

              <div className="gj-reader-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />

              {tags.length > 0 ? (
                <div className="gj-reader-tags">
                  <span>Topik:</span>
                  {tags.map((tag) => {
                    const target = `/artikel?category=${encodeURIComponent(tag)}`
                    return (
                      <a
                        key={tag}
                        href={target}
                        className="gj-tag-chip"
                        onClick={(e) => {
                          if (isPlainLeftClick(e)) {
                            e.preventDefault()
                            onNavigate(target)
                          }
                        }}
                      >
                        #{tag}
                      </a>
                    )
                  })}
                </div>
              ) : null}
            </article>
          )}

          {relatedThree.length > 0 ? (
            <section className="gj-related" aria-label="Artikel Terkait">
              <div className="gj-related-head">
                <div>
                  <p className="gj-eyebrow">
                    BACAAN <span className="gj-purplew">SERUPA</span>
                  </p>
                  <h2 className="gj-h3">Artikel Terkait Lainnya</h2>
                </div>
                <a
                  href="/artikel"
                  className="gj-art-cta-link"
                  onClick={(e) => {
                    if (isPlainLeftClick(e)) {
                      e.preventDefault()
                      onNavigate("/artikel")
                    }
                  }}
                >
                  Lihat Semua Artikel →
                </a>
              </div>
              <div className="gj-art-grid gj-in">
                {relatedThree.map((item) => (
                  <ArticleCard key={item.article_uuid} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <SubpageFooter onNavigate={onNavigate} />
    </div>
  )
}

const EASE = "cubic-bezier(.22,1,.36,1)"

const SUBPAGE_CSS = `
.gj-root{
  --bg:#f6f6f5;--ink:#141414;--mute:#666666;--soft:#bdbdbd;--card:#ffffff;--line:#e3e3e1;--foot:#efefee;--red:#5145b9;--blue:#5145b9;--mint:#a6e8c1;--purple:#736ac8;--lime:#e6fa6a;--orange:#5145b9;--sun:#ffda03;
  position:relative;width:100%;min-height:100svh;display:flex;flex-direction:column;overflow-x:clip;
  background:var(--bg);color:var(--ink);font-family:'Instrument Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  font-weight:400;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;letter-spacing:-.01em;line-height:1.4;
  transition:background-color .4s ease,color .4s ease;
}
.dark .gj-root,.gj-root.gj-dark{
  --bg:#0f0f10;--ink:#f1f1ef;--mute:#a3a3a0;--soft:#4a4a4c;--card:#19191b;--line:#2b2b2d;--foot:#151517;--red:#aba6de;--blue:#6c60d8;--purple:#aba6de;
}
.gj-root *,.gj-root *::before,.gj-root *::after{box-sizing:border-box}
.gj-root :focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:8px}
.gj-root :where(a){color:inherit;text-decoration:none}
.gj-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.gj-root :where(h1,h2,h3,h4,p,ul,figure){margin:0;padding:0}
.gj-root :where(ul){list-style:none}
.gj-wrap{width:100%;max-width:1440px;margin:0 auto;padding:0 clamp(20px,7.1vw,102px)}

/* Identical Beranda Header */
.gj-nav{position:sticky;top:0;z-index:40;height:110px;margin-bottom:-110px;display:flex;align-items:center;gap:24px;padding:30px clamp(20px,5.6vw,80px) 0;pointer-events:none}
.gj-nav>*{pointer-events:auto}
.gj-nav::before{content:'';position:absolute;left:0;right:0;top:0;bottom:12px;z-index:-1;background:rgba(246,246,245,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line);opacity:0;transition:opacity .35s ease}
.dark .gj-nav::before,.gj-dark .gj-nav::before{background:rgba(15,15,16,.8)}
.gj-nav.gj-solid::before{opacity:1}
.gj-brand{display:inline-flex;align-items:center;margin-right:auto}
.gj-brand-svg{height:24px;width:auto;display:block}
.gj-links{display:flex;align-items:center;gap:clamp(18px,2.4vw,34px);font-size:13px;font-weight:500}
.gj-link{position:relative;display:inline-flex;align-items:center;gap:6px;padding:4px 0}
.gj-link::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s ${EASE}}
.gj-link.is-current::after{transform:scaleX(1)}
.gj-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--blue);box-shadow:inset 0 0 0 2px var(--blue),inset 0 0 0 3px var(--bg)}
.gj-tools{display:flex;gap:8px;margin-left:clamp(12px,3vw,48px)}
.gj-round{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--card);box-shadow:0 1px 0 var(--line);transition:transform .3s ${EASE}}

/* Shared Beranda Typography & Buttons */
.gj-h2{font-size:clamp(34px,4.6vw,66px);line-height:1.06;letter-spacing:-.04em;font-weight:500}
.gj-h3{font-size:clamp(24px,2.4vw,34px);line-height:1.1;letter-spacing:-.035em;font-weight:500}
.gj-h4{font-size:17px;line-height:1.25;letter-spacing:-.02em;font-weight:600}
.gj-eyebrow{font-size:10px;letter-spacing:.32em;font-weight:600;text-transform:uppercase;margin-bottom:14px}
.gj-small{font-size:12.5px;line-height:1.6;color:var(--mute)}
.gj-purplew{color:var(--purple)}
.gj-btn{display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 22px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:12px;font-weight:500;white-space:nowrap;transition:transform .35s ${EASE},box-shadow .35s ${EASE}}
.gj-btn-w{background:#fff;color:#141414}
.gj-ghost{font-size:12px;font-weight:500;position:relative;display:inline-flex;align-items:center}
.gj-ghost::after{content:'';position:absolute;left:0;right:0;bottom:-3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s ${EASE}}

/* Main layout */
.gj-submain{flex:1;padding-top:clamp(122px,15vh,148px);padding-bottom:clamp(40px,7vh,76px)}
.gj-back-link{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;color:var(--mute);margin-bottom:22px;transition:color .2s ease}
.gj-back-link:hover{color:var(--ink)}
.gj-sub-head{display:flex;justify-content:space-between;align-items:flex-end;gap:28px;flex-wrap:wrap;margin-bottom:30px}
.gj-sub-head-copy{max-width:720px}
.gj-sub-desc{margin-top:16px;max-width:460px}
.gj-sub-head-side{display:flex;flex-direction:column;align-items:flex-end;gap:14px}
.gj-sub-tags{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.gj-tag-inline{position:relative;display:inline-flex;align-items:center;height:30px;padding:0 13px;border-radius:999px;font-size:12.5px;font-weight:500;letter-spacing:-.01em;white-space:nowrap}
.gj-tag-inline.gj-blue{background:#5145b9;color:#fff;transform:rotate(-3deg)}
.gj-tag-inline.gj-mint{background:#a6e8c1;color:#0f5b38;transform:rotate(4deg)}

/* Filter controls */
.gj-filter-card{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:16px;background:var(--card);border:1px solid var(--line);margin-bottom:26px;overflow:hidden}
.gj-search-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.gj-search-box{flex:1;min-width:220px;height:44px;display:flex;align-items:center;gap:10px;padding:0 15px;border-radius:999px;background:var(--bg);border:1px solid var(--line);color:var(--mute)}
.gj-search-box:focus-within{border-color:var(--blue)}
.gj-search-box input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font:inherit;font-size:13.5px;color:var(--ink)}
.gj-clear-x{width:22px;height:22px;flex:none;border-radius:50%;background:var(--line);color:var(--ink);display:grid;place-items:center;font-size:15px;line-height:1}
.gj-sort-wrap{position:relative;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:999px;background:var(--bg);border:1px solid var(--line);font-size:12px;color:var(--mute);flex:none}
.gj-sort-wrap select{border:0;outline:0;background:transparent;font:inherit;font-weight:600;color:var(--ink);cursor:pointer}
.gj-cats{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none;padding:2px 20px 4px 0;-webkit-mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 28px),transparent 100%);mask-image:linear-gradient(90deg,#000 0,#000 calc(100% - 28px),transparent 100%)}
.gj-cats::-webkit-scrollbar{display:none}
.gj-cat-pill{flex:0 0 auto;white-space:nowrap;height:30px;padding:0 13px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:12px;font-weight:500;display:inline-flex;align-items:center;gap:6px;transition:all .2s ease}
.gj-cat-pill small{font-size:10.5px;opacity:.68}
.gj-cat-pill:hover{border-color:var(--blue)}
.gj-cat-pill.is-on{background:var(--blue);border-color:var(--blue);color:#fff}

.gj-result-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;font-size:12px;color:var(--mute)}

/* Identical Beranda Article Grid & Cards */
.gj-art-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.gj-art-card{border-radius:16px;background:var(--card);border:1px solid var(--line);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:transform .45s ${EASE},border-color .25s ease}
.gj-art-media{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--foot)}
.gj-art-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .8s ${EASE}}
.gj-art-cat{position:absolute;left:12px;top:12px;height:22px;padding:0 10px;border-radius:999px;background:rgba(18,17,24,.82);backdrop-filter:blur(8px);color:#fff;font-size:10px;font-weight:600;display:inline-flex;align-items:center}
.gj-art-body{padding:18px;flex:1;display:flex;flex-direction:column;gap:8px}
.gj-art-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10.5px;color:var(--mute)}
.gj-art-body h3{font-size:15.5px;font-weight:600;line-height:1.3;letter-spacing:-.015em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.gj-art-body p{font-size:12px;line-height:1.55;color:var(--mute);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.gj-art-foot{margin-top:auto;padding-top:10px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;font-weight:500;color:var(--ink)}
.gj-art-author{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gj-art-foot small{font-size:10.5px;font-weight:600;color:var(--blue);white-space:nowrap}

.gj-pagination{margin-top:34px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.gj-pagination button{height:36px;padding:0 14px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:12.5px;font-weight:500}
.gj-pagination button:disabled{opacity:.45;cursor:not-allowed}
.gj-page-nums{display:flex;gap:6px;flex-wrap:wrap}
.gj-page-nums button{min-width:36px;padding:0 10px}
.gj-page-nums button.is-on{background:var(--blue);border-color:var(--blue);color:#fff}

.gj-notice{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-radius:16px;background:var(--card);border:1px solid var(--line);margin-bottom:20px;font-size:12.5px}
.gj-empty-box{text-align:center;padding:56px 20px;border-radius:16px;background:var(--card);border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;gap:12px}
.gj-empty-actions{display:flex;gap:16px;align-items:center;margin-top:6px}

/* Article Detail Reader */
.gj-reader-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.gj-reader-topbar .gj-back-link{margin-bottom:0}
.gj-breadcrumb{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--mute)}
.gj-breadcrumb a:hover{color:var(--ink)}
.gj-reader-shell{max-width:860px;margin:0 auto;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:clamp(22px,4.2vw,48px)}
.gj-reader-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.gj-reader-cat{height:24px;padding:0 11px;border-radius:999px;background:rgba(81,69,185,.12);color:var(--blue);font-size:11px;font-weight:600;display:inline-flex;align-items:center}
.gj-dark .gj-reader-cat{background:rgba(171,166,222,.16)}
.gj-reader-head h1{font-size:clamp(26px,3.6vw,42px);line-height:1.12;letter-spacing:-.035em;font-weight:500;margin-bottom:20px}
.gj-reader-meta-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.gj-author-box{display:flex;align-items:center;gap:12px}
.gj-author-avatar{width:38px;height:38px;border-radius:50%;background:var(--blue);color:#fff;display:grid;place-items:center;font-weight:600;font-size:14px;flex:none}
.gj-author-box strong{display:block;font-size:13.5px;font-weight:600}
.gj-author-box small{display:block;font-size:11.5px;color:var(--mute);margin-top:2px}
.gj-share-btn{display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 14px;border-radius:999px;background:var(--bg);border:1px solid var(--line);font-size:12px;font-weight:500}
.gj-share-btn:hover{border-color:var(--blue)}
.gj-reader-cover{margin:24px 0;border-radius:14px;overflow:hidden;aspect-ratio:16/9;background:var(--foot)}
.gj-reader-cover img{width:100%;height:100%;object-fit:cover;display:block}
.gj-reader-content{font-size:15.5px;line-height:1.82;color:var(--ink);overflow-wrap:anywhere}
.gj-reader-content *{max-width:100%!important}
.gj-reader-content p{margin:0 0 1.25em}
.gj-reader-content h2{margin:1.7em 0 .6em;font-size:clamp(20px,2.2vw,26px);line-height:1.25;letter-spacing:-.025em;font-weight:600}
.gj-reader-content h3,.gj-reader-content h4{margin:1.4em 0 .5em;font-size:18px;line-height:1.3;font-weight:600}
.gj-reader-content ul,.gj-reader-content ol{margin:0 0 1.25em;padding-left:1.35em}
.gj-reader-content li{margin-bottom:.45em}
.gj-reader-content blockquote{margin:1.4em 0;padding:14px 18px;border-left:3px solid var(--blue);background:var(--bg);border-radius:0 12px 12px 0;font-style:italic}
.gj-reader-content a{color:var(--blue);text-decoration:underline;text-underline-offset:3px}
.gj-reader-content img{border-radius:12px;height:auto;margin:1.2em auto;display:block}
.gj-reader-tags{margin-top:28px;padding-top:18px;border-top:1px solid var(--line);display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--mute)}
.gj-tag-chip{height:28px;padding:0 12px;border-radius:999px;background:var(--bg);border:1px solid var(--line);color:var(--ink);font-size:11.5px;display:inline-flex;align-items:center}
.gj-tag-chip:hover{border-color:var(--blue)}

.gj-related{margin-top:58px}
.gj-related-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}
.gj-art-cta-link{display:inline-flex;align-items:center;height:40px;padding:0 22px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:12px;font-weight:500}

/* Beranda Duo-style Purple Banner before Footer */
.gj-sub-cta-wrap{padding:0 0 clamp(40px,6vh,64px)}
.gj-sub-cta{border-radius:16px;padding:clamp(26px,3.6vw,44px);background:radial-gradient(circle at 80% 14%,rgba(167,159,248,.36),transparent 54%),linear-gradient(155deg,#3a3286,#5145b9);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}
.gj-duo-pill{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(8px);color:#fff;font-size:10px;font-weight:600;letter-spacing:.02em;margin-bottom:12px}
.gj-sub-cta h2 span{color:#ffda03}
.gj-sub-cta .gj-small{color:rgba(255,255,255,.84);margin-top:10px;max-width:460px}
.gj-sub-cta-btns{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.gj-btn-outline-w{display:inline-flex;align-items:center;height:40px;padding:0 20px;border-radius:999px;border:1px solid rgba(255,255,255,.32);color:#fff;font-size:12px;font-weight:500}

/* Skeletons */
.gj-sk-card{border-radius:16px;background:var(--card);border:1px solid var(--line);overflow:hidden}
.gj-sk-media{aspect-ratio:16/10;background:var(--foot)}
.gj-sk-cover{aspect-ratio:16/9;border-radius:14px;background:var(--foot);margin:24px 0}
.gj-sk-body{padding:18px;display:flex;flex-direction:column;gap:10px}
.gj-sk-line{height:14px;border-radius:999px;background:var(--foot);margin-bottom:10px}
.gj-sk-line.w40{width:40%}.gj-sk-line.w75{width:75%}.gj-sk-line.w90{width:90%}

/* Identical Beranda Footer */
.gj-foot{background:var(--foot);padding:clamp(50px,7vh,70px) 0 clamp(30px,5vh,46px)}
.gj-foot-grid{display:grid;grid-template-columns:1.4fr .8fr .8fr .6fr;gap:32px;position:relative}
.gj-foot-grid .gj-small{max-width:300px;margin-top:12px}
.gj-foot .gj-h4{font-size:clamp(17px,1.45vw,21px)}
.gj-foot-dots{font-size:9px;letter-spacing:.08em;vertical-align:3px;margin-left:8px;padding:3px 8px;border-radius:999px;background:var(--card);color:var(--blue);font-weight:600}
.gj-mail{display:inline-block;margin-top:8px;font-size:12.5px;font-weight:500;border-bottom:1px solid var(--line)}
.gj-contact-meta{display:block;margin-top:6px;font-size:11.5px;color:var(--mute)}
.gj-socials{display:flex;gap:8px;margin-top:18px}
.gj-socials a{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--mute);transition:color .3s ease,border-color .3s ease}
.gj-foot ul{display:flex;flex-direction:column;gap:11px;font-size:12.5px}
.gj-foot li{display:flex;align-items:center;gap:6px}
.gj-new,.gj-soon{height:16px;padding:0 7px;border-radius:999px;font-size:9px;display:inline-flex;align-items:center}
.gj-new{background:#5145b9;color:#fff}
.gj-soon{background:#f2f1fa;color:#5145b9}
.gj-copy{position:absolute;right:clamp(20px,7.1vw,102px);bottom:0;font-size:10.5px;color:var(--mute)}

@media (hover:hover) and (pointer:fine){
  .gj-link:hover::after,.gj-ghost:hover::after{transform:scaleX(1);transform-origin:0 50%}
  .gj-round:hover{transform:scale(1.1)}
  .gj-btn:hover,.gj-art-cta-link:hover{transform:translate3d(0,-2px,0);box-shadow:0 12px 24px -12px rgba(0,0,0,.45)}
  .gj-art-card:hover .gj-art-media img{transform:scale(1.05)}
  .gj-art-card:hover{transform:translate3d(0,-4px,0);border-color:var(--blue)}
  .gj-socials a:hover{color:var(--ink);border-color:var(--ink)}
}
@media (max-width:1023px){
  .gj-links{display:none}
  .gj-art-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .gj-foot-grid{grid-template-columns:1fr 1fr}
  .gj-copy{position:static;grid-column:1/-1}
  .gj-sub-head-side{align-items:flex-start}
}
@media (max-width:767px){
  .gj-nav{height:76px;margin-bottom:-76px;padding-top:16px}
  .gj-submain{padding-top:96px}
  .gj-filter-card{padding:14px;gap:12px}
  .gj-search-row{flex-direction:row;flex-wrap:nowrap;align-items:center;gap:8px}
  .gj-search-box{flex:1;width:auto;min-width:0;height:42px;padding:0 13px;gap:8px}
  .gj-search-box input{font-size:14px}
  .gj-sort-wrap{width:42px;height:42px;padding:0;justify-content:center;color:var(--ink)}
  .gj-sort-wrap.is-filtered{background:var(--blue);border-color:var(--blue);color:#fff}
  .gj-sort-label{display:none}
  .gj-sort-wrap select{position:absolute;inset:0;width:100%;height:100%;opacity:0;font-size:16px}
  .gj-cats{margin:0 -14px;padding:2px 24px 2px 14px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 28px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 28px),transparent 100%)}
  .gj-filter-card{padding:14px;gap:12px}
  .gj-search-row{flex-direction:row;flex-wrap:nowrap;align-items:center;gap:8px}
  .gj-search-box{flex:1;width:auto;min-width:0;height:42px;padding:0 13px;gap:8px}
  .gj-search-box input{font-size:14px}
  .gj-sort-wrap{width:42px;height:42px;padding:0;justify-content:center;color:var(--ink)}
  .gj-sort-wrap.is-filtered{background:var(--blue);border-color:var(--blue);color:#fff}
  .gj-sort-label{display:none}
  .gj-sort-wrap select{position:absolute;inset:0;width:100%;height:100%;opacity:0;font-size:16px}
  .gj-cats{margin:0 -14px;padding:2px 24px 2px 14px;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 28px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 14px,#000 calc(100% - 28px),transparent 100%)}
  .gj-art-grid{grid-template-columns:1fr}
}
`
