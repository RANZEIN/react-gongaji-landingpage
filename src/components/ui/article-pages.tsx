"use client"

import { useEffect, useMemo, useState } from "react"
import {
  cleanArticleExcerpt,
  DEFAULT_ARTICLES,
  estimateReadingMinutes,
  fetchAllPublicArticles,
  fetchPublicArticleDetail,
  formatArticleDate,
  GONGAJI_LINKS,
  GONGAJI_LOGO,
  sanitizeArticleHtml,
  splitCategories,
  type ApiArticle,
  type ApiArticleDetail,
} from "@/data/gongaji"

const FALLBACK_ARTICLE_IMAGE = "/assets/06-artikel-carousel/01-belajar-pemula.webp"
const PAGE_SIZE = 12

type SortMode = "newest" | "popular" | "oldest"

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4.93" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19.07" />
    </svg>
  )
}

function BrandLogo({ dark }: { dark: boolean }) {
  const markFill = dark ? "#FFFFFF" : "#5145B9"
  const wordFill = dark ? "#FFFFFF" : "#191919"
  return (
    <svg viewBox="38 33 358 82" height={24} role="img" aria-label="Gongaji" className="ga-brand-svg">
      <path d={GONGAJI_LOGO.markPath} fill={markFill} fillRule="evenodd" />
      {GONGAJI_LOGO.wordmarkPaths.map((path, i) => (
        <path key={i} d={path} fill={wordFill} />
      ))}
    </svg>
  )
}

function SubpageHeader({
  dark,
  onToggleDark,
  activeRoute,
}: {
  dark: boolean
  onToggleDark: () => void
  activeRoute: "list" | "detail"
}) {
  return (
    <header className="ga-nav">
      <div className="ga-wrap ga-nav-inner">
        <a href="#top" className="ga-brand" aria-label="Gongaji Beranda">
          <BrandLogo dark={dark} />
        </a>
        <nav className="ga-nav-links" aria-label="Navigasi Artikel">
          <a href="#top" className="ga-nav-link">
            Beranda
          </a>
          <a href="#/artikel" className={"ga-nav-link" + (activeRoute === "list" ? " is-active" : "")} aria-current={activeRoute === "list" ? "page" : undefined}>
            Semua Artikel
          </a>
          <a href="#fitur" className="ga-nav-link">
            Fitur App
          </a>
          <a href="#qursus" className="ga-nav-link">
            Qursus
          </a>
        </nav>
        <div className="ga-nav-tools">
          <a href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer" className="ga-pill-cta">
            Unduh App
          </a>
          <button
            type="button"
            className="ga-theme-btn"
            onClick={onToggleDark}
            aria-label={dark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
            aria-pressed={dark}
          >
            <SunIcon />
          </button>
        </div>
      </div>
    </header>
  )
}

function SubpageFooter() {
  return (
    <footer className="ga-footer">
      <div className="ga-wrap ga-footer-inner">
        <div>
          <strong>Gongaji · Artikel &amp; Wawasan Qur’ani</strong>
          <p>Bacaan terkurasi seputar Al-Qur’an, fikih, akidah, Ramadan, dan keluarga Muslim.</p>
        </div>
        <div className="ga-footer-links">
          <a href="#top">Kembali ke Beranda</a>
          <a href="#/artikel">Indeks Artikel</a>
          <a href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
            Gabung Qursus
          </a>
        </div>
      </div>
    </footer>
  )
}

function ArticleCard({ item }: { item: ApiArticle }) {
  const categories = splitCategories(item.article_category)
  return (
    <a href={`#/artikel/${item.article_uuid}`} className="ga-card" aria-label={`Baca artikel ${item.article_title}`}>
      <div className="ga-card-media">
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
        {categories[0] ? <span className="ga-card-badge">{categories[0]}</span> : null}
      </div>
      <div className="ga-card-body">
        <div className="ga-card-meta">
          <span>{formatArticleDate(item.article_published_at)}</span>
          <span>{(item.article_total_view ?? 0).toLocaleString("id-ID")} dilihat</span>
        </div>
        <h3>{item.article_title}</h3>
        <p>{cleanArticleExcerpt(item.article_excerpt)}</p>
        <div className="ga-card-foot">
          <span className="ga-card-author">{item.article_author || "Redaksi Gongaji"}</span>
          <span className="ga-card-read">Baca artikel →</span>
        </div>
      </div>
    </a>
  )
}

export function ArticlesDirectoryPage({
  dark,
  onToggleDark,
  initialCategory = "Semua",
}: {
  dark: boolean
  onToggleDark: () => void
  initialCategory?: string
}) {
  const [articles, setArticles] = useState<readonly ApiArticle[]>(DEFAULT_ARTICLES)
  const [totalCount, setTotalCount] = useState<number>(DEFAULT_ARTICLES.length)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState(initialCategory || "Semua")
  const [sort, setSort] = useState<SortMode>("newest")
  const [page, setPage] = useState(1)

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
          setTotalCount(res.total)
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
    <div className={"ga-page" + (dark ? " ga-dark" : "")}>
      <style>{SUBPAGE_CSS}</style>
      <SubpageHeader dark={dark} onToggleDark={onToggleDark} activeRoute="list" />

      <main className="ga-main">
        <section className="ga-hero-dir">
          <div className="ga-wrap">
            <a href="#artikel" className="ga-back-link">
              <ArrowLeftIcon />
              Kembali ke Beranda
            </a>
            <div className="ga-dir-top">
              <div>
                <p className="ga-eyebrow">ARTIKEL &amp; WAWASAN GONGAJI</p>
                <h1>Semua Artikel &amp; Panduan Qur’an</h1>
                <p className="ga-dir-sub">
                  Jelajahi bacaan Islami seputar tafsir Al-Qur’an, fikih, akidah, Ramadan, adab, hingga fatwa ulama langsung dari redaksi Gongaji.
                </p>
              </div>
              <div className="ga-stat-box" aria-live="polite">
                <strong>{loading ? "Memuat..." : `${filtered.length} Artikel`}</strong>
                <span>dari {totalCount} arsip redaksi</span>
              </div>
            </div>

            <div className="ga-controls" role="region" aria-label="Filter dan pencarian artikel">
              <div className="ga-search-row">
                <div className="ga-search-box">
                  <SearchIcon />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Cari judul artikel, topik, atau penulis..."
                    aria-label="Cari artikel"
                  />
                  {query ? (
                    <button
                      type="button"
                      className="ga-clear-x"
                      onClick={() => {
                        setQuery("")
                        setPage(1)
                      }}
                      aria-label="Hapus kata kunci"
                    >
                      ×
                    </button>
                  ) : null}
                </div>

                <label className="ga-sort-wrap">
                  <span>Urutkan</span>
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

              <div className="ga-cats" role="tablist" aria-label="Filter kategori artikel">
                <button
                  type="button"
                  className={"ga-cat-pill" + (category === "Semua" ? " is-on" : "")}
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
                    className={"ga-cat-pill" + (category === name ? " is-on" : "")}
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
              <div className="ga-notice">
                <span>{error}</span>
                <button type="button" onClick={() => setReloadTick((t) => t + 1)}>
                  Muat Ulang
                </button>
              </div>
            ) : null}

            {loading && articles.length <= 3 ? (
              <div className="ga-grid">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="ga-skeleton-card" aria-hidden="true">
                    <div className="ga-sk-media" />
                    <div className="ga-sk-body">
                      <div className="ga-sk-line w40" />
                      <div className="ga-sk-line w90" />
                      <div className="ga-sk-line w75" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="ga-empty">
                <h2>Belum ada artikel yang cocok</h2>
                <p>Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
                {hasActiveFilter ? (
                  <button type="button" className="ga-pill-cta" onClick={resetFilters}>
                    Reset Semua Filter
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="ga-result-bar">
                  <span>
                    Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} dari {filtered.length} artikel
                    {category !== "Semua" ? ` di kategori “${category}”` : ""}
                  </span>
                  {hasActiveFilter ? (
                    <button type="button" className="ga-reset-btn" onClick={resetFilters}>
                      Reset Filter
                    </button>
                  ) : null}
                </div>

                <div className="ga-grid">
                  {visibleItems.map((item) => (
                    <ArticleCard key={item.article_uuid} item={item} />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <nav className="ga-pagination" aria-label="Navigasi halaman artikel">
                    <button type="button" disabled={safePage <= 1} onClick={() => goToPage(safePage - 1)}>
                      ← Sebelumnya
                    </button>
                    <div className="ga-page-nums">
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

      <SubpageFooter />
    </div>
  )
}

export function ArticleReaderPage({
  uuid,
  dark,
  onToggleDark,
}: {
  uuid: string
  dark: boolean
  onToggleDark: () => void
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
      .catch(() => {})

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
      return article.article_category_list.map((c) => c.name)
    }
    return splitCategories(article.article_category)
  }, [article])

  const tags = useMemo(() => {
    if (!article) return []
    if (article.article_tag_list && article.article_tag_list.length > 0) {
      return article.article_tag_list.map((t) => t.name)
    }
    return article.article_tag ? splitCategories(article.article_tag) : []
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
    <div className={"ga-page" + (dark ? " ga-dark" : "")}>
      <style>{SUBPAGE_CSS}</style>
      <SubpageHeader dark={dark} onToggleDark={onToggleDark} activeRoute="detail" />

      <main className="ga-main">
        <div className="ga-wrap">
          <div className="ga-reader-topbar">
            <a href="#/artikel" className="ga-back-link">
              <ArrowLeftIcon />
              Kembali ke Semua Artikel
            </a>
            <div className="ga-breadcrumb">
              <a href="#top">Beranda</a>
              <span aria-hidden="true">/</span>
              <a href="#/artikel">Artikel</a>
            </div>
          </div>

          {loading ? (
            <div className="ga-reader-shell">
              <div className="ga-sk-line w40" />
              <div className="ga-sk-line w90" style={{ height: 34 }} />
              <div className="ga-sk-line w75" style={{ height: 34 }} />
              <div className="ga-sk-cover" />
              <div className="ga-sk-line w90" />
              <div className="ga-sk-line w90" />
              <div className="ga-sk-line w75" />
            </div>
          ) : error || !article ? (
            <div className="ga-empty">
              <h2>Gagal Membuka Artikel</h2>
              <p>{error || "Artikel tidak ditemukan."}</p>
              <div className="ga-empty-actions">
                <button type="button" className="ga-pill-cta" onClick={() => setReloadTick((t) => t + 1)}>
                  Coba Lagi
                </button>
                <a href="#/artikel" className="ga-reset-btn">
                  Lihat Semua Artikel
                </a>
              </div>
            </div>
          ) : (
            <article className="ga-reader-shell">
              <header className="ga-reader-head">
                <div className="ga-reader-cats">
                  {categories.map((cat) => (
                    <a key={cat} href={`#/artikel?category=${encodeURIComponent(cat)}`} className="ga-reader-cat">
                      {cat}
                    </a>
                  ))}
                </div>
                <h1>{article.article_title}</h1>
                <div className="ga-reader-meta-bar">
                  <div className="ga-author-box">
                    <span className="ga-author-avatar" aria-hidden="true">
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
                  <button type="button" className="ga-share-btn" onClick={handleCopyLink}>
                    <ShareIcon />
                    {copied ? "Tautan Disalin" : "Salin Tautan"}
                  </button>
                </div>
              </header>

              <figure className="ga-reader-cover">
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

              <div className="ga-reader-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />

              {tags.length > 0 ? (
                <div className="ga-reader-tags">
                  <span>Topik:</span>
                  {tags.map((tag) => (
                    <a key={tag} href={`#/artikel?category=${encodeURIComponent(tag)}`} className="ga-tag-chip">
                      #{tag}
                    </a>
                  ))}
                </div>
              ) : null}

              <div className="ga-reader-cta">
                <div>
                  <strong>Ingin bacaan &amp; mutaba’ah ibadah lebih lengkap?</strong>
                  <p>Unduh Gongaji App untuk membaca Al-Qur’an, Qu-Lib 300+ buku Islami, dan pengingat ibadah harian.</p>
                </div>
                <div className="ga-reader-cta-btns">
                  <a href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer" className="ga-pill-cta">
                    Unduh Gongaji App
                  </a>
                  <a href="#/artikel" className="ga-ghost-btn">
                    Jelajahi Artikel Lain
                  </a>
                </div>
              </div>
            </article>
          )}

          {relatedThree.length > 0 ? (
            <section className="ga-related" aria-label="Artikel Terkait">
              <div className="ga-related-head">
                <h2>Artikel Terkait Lainnya</h2>
                <a href="#/artikel">Lihat Semua Artikel →</a>
              </div>
              <div className="ga-grid">
                {relatedThree.map((item) => (
                  <ArticleCard key={item.article_uuid} item={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <SubpageFooter />
    </div>
  )
}

const SUBPAGE_CSS = `
.ga-page{
  --bg:#f6f6f5;--ink:#141414;--mute:#626260;--card:#ffffff;--line:#e3e3e1;--foot:#efefee;--blue:#5145b9;--soft:#e9e7fb;
  min-height:100svh;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);
  font-family:'Instrument Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;
  transition:background-color .35s ease,color .35s ease;
}
.ga-page.ga-dark{
  --bg:#0f0f10;--ink:#f1f1ef;--mute:#a3a3a0;--card:#19191b;--line:#2b2b2d;--foot:#151517;--blue:#8d82f6;--soft:#252142;
}
.ga-page *{box-sizing:border-box}
.ga-page a{color:inherit;text-decoration:none}
.ga-page button{font:inherit;color:inherit;cursor:pointer}
.ga-wrap{width:100%;max-width:1360px;margin:0 auto;padding:0 clamp(18px,5.5vw,88px)}
.ga-nav{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.ga-nav-inner{height:72px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.ga-brand{display:inline-flex;align-items:center}
.ga-brand-svg{height:24px;width:auto;display:block}
.ga-nav-links{display:flex;align-items:center;gap:26px;font-size:13px;font-weight:500}
.ga-nav-link{color:var(--mute);transition:color .2s ease}
.ga-nav-link:hover,.ga-nav-link.is-active{color:var(--ink)}
.ga-nav-tools{display:flex;align-items:center;gap:10px}
.ga-pill-cta{display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 18px;border-radius:999px;background:var(--blue);color:#fff!important;font-size:12.5px;font-weight:600;border:0;white-space:nowrap;transition:transform .2s ease,opacity .2s ease}
.ga-pill-cta:hover{transform:translateY(-1px);opacity:.94}
.ga-theme-btn{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--card);border:1px solid var(--line)}
.ga-main{flex:1;padding:clamp(28px,5vh,52px) 0 clamp(60px,9vh,100px)}
.ga-back-link{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:var(--mute);margin-bottom:20px;transition:color .2s ease}
.ga-back-link:hover{color:var(--blue)}
.ga-eyebrow{font-size:10.5px;letter-spacing:.26em;font-weight:700;text-transform:uppercase;color:var(--blue);margin:0 0 10px}
.ga-dir-top{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.ga-dir-top h1{font-size:clamp(30px,4vw,52px);line-height:1.08;letter-spacing:-.035em;font-weight:600;margin:0}
.ga-dir-sub{margin:12px 0 0;max-width:600px;font-size:14.5px;line-height:1.65;color:var(--mute)}
.ga-stat-box{padding:14px 18px;border-radius:14px;background:var(--card);border:1px solid var(--line);display:flex;flex-direction:column;gap:2px;min-width:170px}
.ga-stat-box strong{font-size:20px;font-weight:600;letter-spacing:-.02em}
.ga-stat-box span{font-size:12px;color:var(--mute)}
.ga-controls{display:flex;flex-direction:column;gap:14px;padding:18px;border-radius:18px;background:var(--card);border:1px solid var(--line);margin-bottom:24px}
.ga-search-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ga-search-box{flex:1;min-width:240px;height:44px;display:flex;align-items:center;gap:10px;padding:0 14px;border-radius:12px;background:var(--bg);border:1px solid var(--line);color:var(--mute)}
.ga-search-box:focus-within{border-color:var(--blue)}
.ga-search-box input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:var(--ink)}
.ga-clear-x{width:24px;height:24px;border-radius:50%;border:0;background:var(--line);color:var(--ink);display:grid;place-items:center;font-size:16px;line-height:1}
.ga-sort-wrap{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-radius:12px;background:var(--bg);border:1px solid var(--line);font-size:13px;color:var(--mute)}
.ga-sort-wrap select{border:0;outline:0;background:transparent;font:inherit;font-weight:600;color:var(--ink);cursor:pointer}
.ga-cats{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ga-cat-pill{height:32px;padding:0 13px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font-size:12.5px;font-weight:500;display:inline-flex;align-items:center;gap:6px;transition:all .2s ease}
.ga-cat-pill small{font-size:11px;opacity:.7}
.ga-cat-pill:hover{border-color:var(--blue)}
.ga-cat-pill.is-on{background:var(--blue);border-color:var(--blue);color:#fff}
.ga-result-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;font-size:13px;color:var(--mute)}
.ga-reset-btn{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 14px;font-size:12px;font-weight:500}
.ga-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
.ga-card{border-radius:16px;background:var(--card);border:1px solid var(--line);overflow:hidden;display:flex;flex-direction:column;transition:transform .35s cubic-bezier(.22,1,.36,1),border-color .25s ease}
.ga-card:hover{transform:translateY(-4px);border-color:var(--blue)}
.ga-card-media{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--foot)}
.ga-card-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.22,1,.36,1)}
.ga-card:hover .ga-card-media img{transform:scale(1.04)}
.ga-card-badge{position:absolute;left:12px;top:12px;height:24px;padding:0 11px;border-radius:999px;background:rgba(18,17,24,.82);backdrop-filter:blur(8px);color:#fff;font-size:11px;font-weight:600;display:inline-flex;align-items:center}
.ga-card-body{padding:18px;flex:1;display:flex;flex-direction:column;gap:8px}
.ga-card-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:var(--mute)}
.ga-card-body h3{margin:0;font-size:16.5px;line-height:1.32;font-weight:600;letter-spacing:-.015em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ga-card-body p{margin:0;font-size:13px;line-height:1.58;color:var(--mute);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ga-card-foot{margin-top:auto;padding-top:12px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}
.ga-card-author{font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ga-card-read{color:var(--blue);font-weight:600;white-space:nowrap}
.ga-pagination{margin-top:36px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.ga-pagination button{height:38px;padding:0 14px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:13px;font-weight:500}
.ga-pagination button:disabled{opacity:.45;cursor:not-allowed}
.ga-page-nums{display:flex;gap:6px;flex-wrap:wrap}
.ga-page-nums button{min-width:38px;padding:0 10px}
.ga-page-nums button.is-on{background:var(--blue);border-color:var(--blue);color:#fff}
.ga-notice{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:12px;background:var(--soft);margin-bottom:20px;font-size:13px}
.ga-notice button{border:0;background:var(--blue);color:#fff;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600}
.ga-empty{text-align:center;padding:64px 20px;border-radius:18px;background:var(--card);border:1px solid var(--line)}
.ga-empty h2{margin:0 0 8px;font-size:22px;font-weight:600}
.ga-empty p{margin:0 0 18px;color:var(--mute);font-size:14px}
.ga-empty-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}

/* Article detail reader */
.ga-reader-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:14px}
.ga-reader-topbar .ga-back-link{margin-bottom:0}
.ga-breadcrumb{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--mute)}
.ga-breadcrumb a:hover{color:var(--ink)}
.ga-reader-shell{max-width:820px;margin:18px auto 0;background:var(--card);border:1px solid var(--line);border-radius:22px;padding:clamp(22px,4vw,46px)}
.ga-reader-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.ga-reader-cat{height:26px;padding:0 12px;border-radius:999px;background:var(--soft);color:var(--blue);font-size:12px;font-weight:600;display:inline-flex;align-items:center}
.ga-reader-head h1{margin:0 0 20px;font-size:clamp(26px,3.6vw,42px);line-height:1.15;letter-spacing:-.03em;font-weight:600}
.ga-reader-meta-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.ga-author-box{display:flex;align-items:center;gap:12px}
.ga-author-avatar{width:40px;height:40px;border-radius:50%;background:var(--blue);color:#fff;display:grid;place-items:center;font-weight:600;font-size:15px;flex:none}
.ga-author-box strong{display:block;font-size:14px;font-weight:600}
.ga-author-box small{display:block;font-size:12px;color:var(--mute);margin-top:2px}
.ga-share-btn{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 14px;border-radius:999px;background:var(--bg);border:1px solid var(--line);font-size:12.5px;font-weight:500}
.ga-share-btn:hover{border-color:var(--blue)}
.ga-reader-cover{margin:26px 0;border-radius:16px;overflow:hidden;aspect-ratio:16/9;background:var(--foot)}
.ga-reader-cover img{width:100%;height:100%;object-fit:cover;display:block}
.ga-reader-content{font-size:16.5px;line-height:1.82;color:var(--ink);overflow-wrap:anywhere}
.ga-reader-content *{max-width:100%!important}
.ga-reader-content p{margin:0 0 1.25em}
.ga-reader-content h2{margin:1.7em 0 .65em;font-size:clamp(20px,2.2vw,26px);line-height:1.25;letter-spacing:-.02em;font-weight:600;color:var(--ink)}
.ga-reader-content h3,.ga-reader-content h4{margin:1.4em 0 .5em;font-size:19px;line-height:1.3;font-weight:600;color:var(--ink)}
.ga-reader-content ul,.ga-reader-content ol{margin:0 0 1.25em;padding-left:1.35em}
.ga-reader-content li{margin-bottom:.45em}
.ga-reader-content blockquote{margin:1.5em 0;padding:14px 18px;border-left:3px solid var(--blue);background:var(--soft);border-radius:0 12px 12px 0;font-style:italic}
.ga-reader-content a{color:var(--blue);text-decoration:underline;text-underline-offset:3px}
.ga-reader-content img{border-radius:12px;height:auto;margin:1.2em auto;display:block}
.ga-reader-tags{margin-top:30px;padding-top:20px;border-top:1px solid var(--line);display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12.5px;color:var(--mute)}
.ga-tag-chip{height:28px;padding:0 11px;border-radius:999px;background:var(--bg);border:1px solid var(--line);color:var(--ink);font-size:12px;display:inline-flex;align-items:center}
.ga-tag-chip:hover{border-color:var(--blue)}
.ga-reader-cta{margin-top:28px;padding:20px 22px;border-radius:16px;background:var(--soft);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.ga-reader-cta strong{display:block;font-size:15.5px;margin-bottom:4px}
.ga-reader-cta p{margin:0;font-size:13px;color:var(--mute);max-width:440px}
.ga-reader-cta-btns{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ga-ghost-btn{display:inline-flex;align-items:center;height:36px;padding:0 16px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:12.5px;font-weight:500}
.ga-related{margin-top:52px}
.ga-related-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap}
.ga-related-head h2{margin:0;font-size:22px;font-weight:600;letter-spacing:-.02em}
.ga-related-head a{font-size:13px;font-weight:600;color:var(--blue)}

/* skeletons */
.ga-skeleton-card{border-radius:16px;background:var(--card);border:1px solid var(--line);overflow:hidden}
.ga-sk-media{aspect-ratio:16/10;background:var(--foot)}
.ga-sk-cover{aspect-ratio:16/9;border-radius:16px;background:var(--foot);margin:24px 0}
.ga-sk-body{padding:18px;display:flex;flex-direction:column;gap:10px}
.ga-sk-line{height:14px;border-radius:999px;background:var(--foot);margin-bottom:10px}
.ga-sk-line.w40{width:40%}.ga-sk-line.w75{width:75%}.ga-sk-line.w90{width:90%}

.ga-footer{background:var(--foot);border-top:1px solid var(--line);padding:26px 0}
.ga-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.ga-footer-inner p{margin:4px 0 0;font-size:12.5px;color:var(--mute)}
.ga-footer-links{display:flex;gap:18px;font-size:13px;font-weight:500;flex-wrap:wrap}
.ga-footer-links a:hover{color:var(--blue)}

@media (max-width:1023px){
  .ga-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ga-nav-links{display:none}
}
@media (max-width:679px){
  .ga-grid{grid-template-columns:1fr}
}
`

