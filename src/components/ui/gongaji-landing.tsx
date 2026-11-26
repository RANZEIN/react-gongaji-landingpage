"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  BAND_BOT_ASSETS,
  BAND_TOP_ASSETS,
  cleanArticleExcerpt,
  DECK1_ASSETS,
  DECK2_CARDS,
  DEFAULT_ARTICLES,
  DONASIQU_CAMPAIGNS,
  formatArticleDate,
  GATEWAY_SLIDES,
  GONGAJI_LINKS,
  GONGAJI_LOGO,
  NAV_ITEMS,
  PUBLIC_ARTICLE_API,
  splitCategories,
  TRUST_ITEMS,
  WALL_ASSETS,
  type ApiArticle,
  type DonasiQuCampaign,
} from "@/data/gongaji"

// Gongaji Ecosystem — kinetic scroll-driven landing page for the Gongaji ecosystem (Gongaji App, Qursus, DonasiQu).

// #region motion
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** 0 → 1 as p runs from a to b */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
/** pinned-stage progress: 0 when the stage top meets the viewport top, 1 when the pin is released */
export const stageProgress = (top: number, stageH: number, pinH: number) => clamp(-top / Math.max(1, stageH - pinH))

export type Pose = { x: number; y: number; s: number; r: number; ry: number; o: number }
export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  s: lerp(a.s, b.s, t),
  r: lerp(a.r, b.r, t),
  ry: lerp(a.ry, b.ry, t),
  o: lerp(a.o, b.o, t),
})
/** layout unit: 1 at 1440px, smaller on tablets, phone-sized below 768 */
export const unit = (w: number) => (w >= 1024 ? w / 1440 : w >= 768 ? w / 1180 : Math.max(0.5, w / 640))
/** the stage unit: never larger than the height allows (a 1580 × 847 window must not outgrow its pin) */
export const unitWH = (w: number, h: number) => Math.min(unit(w), Math.max(0.5, h / 862))

export const DECK = 8 // stage-1 cards, 260 × 282 base
/** hero fan: cards spread left → right, the last one in front */
export function fanPose(i: number, n: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  const d = i - (n - 1) / 2
  const step = w < 768 ? Math.min(40, (w - 150) / (n - 1)) : 120 * u
  return { x: w / 2 + d * step, y: h * (w < 768 ? 0.6 : 0.65) + d * d * 1.2 * u, s: 0.92 * u, r: d * 2.4, ry: -18, o: 1 }
}
/** collapsed deck around a centre */
export function stackPose(i: number, n: number, cx: number, cy: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  const d = i - (n - 1) / 2
  return { x: cx + d * 2.5 * u, y: cy - d * 1.8 * u, s: 0.84 * u, r: d * 1.6 - 5, ry: -10, o: 1 }
}
/** the showcase staircase: down and to the right, running off the edge */
export function stairPose(i: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  if (w < 768) return { x: w * 0.27 + i * w * 0.13, y: h * 0.66 + i * h * 0.035, s: 0.62 * u, r: 0, ry: -8, o: 1 }
  return { x: w * 0.473 + i * 155 * u, y: h * 0.62 + i * 40 * u, s: u, r: 0, ry: -12, o: 1 }
}

export const DECK2 = 7 // stage-2 cards: dashboard, info, then five Gongaji visuals; 230 × 230 base (info 230 × 280)
/** stage 2 staircase from the top-left corner */
export function stair2Pose(j: number, w: number, h: number): Pose {
  const u = unitWH(w, h)
  if (w < 768) return { x: w * 0.2 + j * w * 0.1, y: h * 0.3 + j * h * 0.075, s: 0.55 * u, r: 0, ry: -6, o: 1 }
  return { x: 190 * u + j * 172 * u, y: h * 0.22 + j * h * 0.1, s: u, r: 0, ry: -8, o: 1 }
}
/** folder geometry: left, top, inner pad, cell size, gap (px) */
export function folderBox(w: number, h: number) {
  const u = unitWH(w, h)
  if (w < 768) {
    const fw = w * 0.88
    const pad = 10
    const gap = 8
    const cell = (fw - 2 * pad - 2 * gap) / 3
    return { x: w * 0.06, y: h * 0.42, w: fw, pad, cell, gap, head: 98 }
  }
  const fw = 606 * u
  const pad = 16 * u
  const gap = 12 * u
  const cell = (fw - 2 * pad - 2 * gap) / 3
  return { x: w - 102 * u - fw, y: h / 2 - 290 * u, w: fw, pad, cell, gap, head: 122 + pad }
}
/** where card j lands in the folder (the info card has no slot) */
export const FOLDER_SLOT = [3, -1, 0, 1, 2, 4, 5]
export function folderPose(j: number, w: number, h: number): Pose {
  const f = folderBox(w, h)
  const slot = Math.max(0, FOLDER_SLOT[j])
  const c = slot % 3
  const r = Math.floor(slot / 3)
  return {
    x: f.x + f.pad + f.cell / 2 + c * (f.cell + f.gap),
    y: f.y + f.head + f.cell / 2 + r * (f.cell + f.gap),
    s: f.cell / 230,
    r: 0,
    ry: 0,
    o: FOLDER_SLOT[j] < 0 ? 0 : 1,
  }
}

/** how inked word i of n is while the paragraph progress runs 0 → 1 (0.18 floor, two-word ramp) */
export const inkAt = (q: number, i: number, n: number) => 0.18 + 0.82 * clamp((q * (n + 2) - i) / 2)

/** stage 3: the banner rectangle at progress p */
export function bannerRect(p: number, w: number, h: number) {
  const u = unitWH(w, h)
  const t = easeInOut(seg(p, 0, 0.5))
  const cw = Math.min(390 * u, w * 0.62)
  const ch = cw * (460 / 390)
  const a = { x: w * 0.03, y: h * 0.76, w: w * 0.94, h: h * 0.9 }
  const b = { x: w / 2 - cw / 2, y: h * 0.53 - ch / 2, w: cw, h: ch }
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), rad: lerp(18, 16, t) }
}
const MOBILE_WALL_INDEX: Record<number, { c: number; r: number }> = {
  0: { c: 0, r: 0 },
  1: { c: 1, r: 0 },
  2: { c: 2, r: 0 },
  10: { c: 0, r: 2 },
  11: { c: 1, r: 2 },
  12: { c: 2, r: 2 },
}

/** stage 3: the portrait wall, 5 columns × 3 rows around the banner (3×2 framing on mobile) */
export function wallPose(k: number, w: number, h: number) {
  const u = unitWH(w, h)
  if (w < 768) {
    const slot = MOBILE_WALL_INDEX[k]
    if (!slot) return { x: w / 2, y: h * 0.53, hidden: true }
    const pitch = w * 0.31
    return { x: w / 2 + (slot.c - 1) * pitch, y: h * [0.19, 0.53, 0.86][slot.r], hidden: false }
  }
  const c = k % 5
  const r = Math.floor(k / 5)
  const pitch = 246 * u
  return { x: w / 2 + (c - 2) * pitch, y: h * [0.21, 0.53, 0.86][r], hidden: false }
}

// The lime band's doodles: circles under gravity, bouncing off the box, basketball hoop, and each other.
export type Ball = { x: number; y: number; prevY: number; vx: number; vy: number; a: number; r: number; grab?: boolean }
export function getHoopGeometry(W: number, H: number) {
  const isMobile = W < 500
  const rimW = isMobile ? 76 : 114
  const rimRight = Math.max(rimW + 24, W - (isMobile ? 16 : 32))
  const rimLeft = rimRight - rimW
  const rimY = Math.round(H * 0.28)
  const boardTop = rimY - (isMobile ? 48 : 66)
  const boardBottom = rimY + 8
  return { rimLeft, rimRight, rimW, rimY, boardTop, boardBottom }
}

export function stepBalls(bs: Ball[], W: number, H: number, dt: number, g = 2600): number {
  const hoop = getHoopGeometry(W, H)
  let scored = 0
  for (const b of bs) {
    b.prevY = b.y
    if (b.grab) continue
    b.vy += g * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    if (b.y + b.r > H) {
      b.y = H - b.r
      b.vy = -b.vy * 0.28
      b.vx *= 0.92
      if (Math.abs(b.vy) < 30) b.vy = 0
    }
    if (b.x - b.r < 0) {
      b.x = b.r
      b.vx = Math.abs(b.vx) * 0.4
    }
    if (b.x + b.r > W) {
      b.x = W - b.r
      b.vx = -Math.abs(b.vx) * 0.4
    }
    // Backboard collision (vertical wall at hoop.rimRight)
    if (b.y > hoop.boardTop - b.r && b.y < hoop.boardBottom + b.r) {
      const distToBoard = hoop.rimRight - b.x
      if (distToBoard > 0 && distToBoard < b.r) {
        b.x = hoop.rimRight - b.r
        if (b.vx > 0) b.vx = -b.vx * 0.55
      } else if (distToBoard <= 0 && distToBoard > -b.r - 8) {
        b.x = hoop.rimRight + 8 + b.r
        if (b.vx < 0) b.vx = -b.vx * 0.55
      }
    }
    // Left rim lip collision (circle vs rim point)
    const rdx = b.x - hoop.rimLeft
    const rdy = b.y - hoop.rimY
    const rd = Math.hypot(rdx, rdy) || 0.001
    const rMin = b.r + 5
    if (rd < rMin) {
      const nx = rdx / rd
      const ny = rdy / rd
      b.x = hoop.rimLeft + nx * rMin
      b.y = hoop.rimY + ny * rMin
      const vn = b.vx * nx + b.vy * ny
      if (vn < 0) {
        b.vx -= 1.5 * vn * nx
        b.vy -= 1.5 * vn * ny
      }
    }
    // Score detection: ball falls cleanly downward through rim opening
    if (
      b.vy > 0 &&
      b.prevY <= hoop.rimY &&
      b.y >= hoop.rimY &&
      b.x > hoop.rimLeft + b.r * 0.3 &&
      b.x < hoop.rimRight - b.r * 0.25
    ) {
      scored += 1
      b.vy *= 0.62
      b.vx *= 0.45
    }
    b.a += (b.vx * dt * 180) / (Math.PI * b.r)
  }
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const p = bs[i]
      const q = bs[j]
      if (p.grab || q.grab) continue
      const dx = q.x - p.x
      const dy = q.y - p.y
      const d = Math.hypot(dx, dy) || 0.001
      const min = p.r + q.r
      if (d >= min) continue
      const nx = dx / d
      const ny = dy / d
      const push = (min - d) / 2
      p.x -= nx * push
      p.y -= ny * push
      q.x += nx * push
      q.y += ny * push
      const rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny
      if (rel < 0) {
        const imp = (-(1 + 0.25) * rel) / 2
        p.vx -= imp * nx
        p.vy -= imp * ny
        q.vx += imp * nx
        q.vy += imp * ny
      }
    }
  }
  return scored
}
export const settled = (bs: Ball[]) => bs.every((b) => !b.grab && Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6)
// #endregion

// line-art doodles: one path set per icon, drawn on a 24-unit grid (stage 2 background)
const DOODLES = [
  "M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z",
  "M4 6.5A2.5 2.5 0 0 1 6.5 4H12v16H6.5A2.5 2.5 0 0 1 4 17.5z M20 6.5A2.5 2.5 0 0 0 17.5 4H12v16h5.5a2.5 2.5 0 0 0 2.5-2.5z",
  "M12 8a4 4 0 1 0 .01 0 M8 15a4 4 0 1 0 .01 0 M16 15a4 4 0 1 0 .01 0",
  "M15 4a7 7 0 1 0 5 11.9A6 6 0 0 1 15 4z",
  "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  "M6 18c0-8 5-12 12-12 0 7-4 12-12 12z M6 18l7-7",
  "M13 3L5 13h6l-1 8 8-10h-6z",
  "M12 3l6 4v10l-6 4-6-4V7z M12 3v18 M6 7l12 10 M18 7L6 17",
  "M12 4a8 8 0 1 0 .01 0 M12 4v16 M4 12h16 M6.5 6.5l11 11",
]

// 14 Gongaji App icons & official Gongaji mark for the interactive basketball pile
const GONGAJI_BALL_ICONS = [
  { kind: "mark" as const, label: "Gongaji App" },
  { kind: "img" as const, path: "04-fitur-icons/tafsir.webp", label: "Tafsir Al-Qur'an" },
  { kind: "img" as const, path: "04-fitur-icons/dzikir.webp", label: "Dzikir Harian" },
  { kind: "img" as const, path: "04-fitur-icons/jadwal-sholat.webp", label: "Jadwal Shalat" },
  { kind: "img" as const, path: "04-fitur-icons/arah-kiblat.webp", label: "Arah Kiblat" },
  { kind: "img" as const, path: "04-fitur-icons/doa.webp", label: "Doa Harian" },
  { kind: "img" as const, path: "04-fitur-icons/hadist.webp", label: "Kumpulan Hadits" },
  { kind: "img" as const, path: "04-fitur-icons/vr.webp", label: "Manasik VR" },
  { kind: "img" as const, path: "04-fitur-icons/qr.webp", label: "QR Content" },
  { kind: "img" as const, path: "04-fitur-icons/sirah.webp", label: "Qu-Lib & Sirah" },
  { kind: "img" as const, path: "04-fitur-icons/asmaul-husna.webp", label: "Asmaul Husna" },
  { kind: "img" as const, path: "04-fitur-icons/kalender-hijriyah.webp", label: "Kalender Hijriyah" },
  { kind: "img" as const, path: "04-fitur-icons/kalkulator-zakat.webp", label: "Kalkulator Zakat" },
  { kind: "img" as const, path: "04-fitur-icons/donasi.webp", label: "DonasiQu" },
] as const

const ICON = {
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1-4 4-6 7-6s6 2 7 6",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  eye: "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  left: "M14 6l-6 6 6 6",
  right: "M10 6l6 6-6 6",
  up: "M6 14l6-6 6 6",
  down: "M6 10l6 6 6-6",
  play: "M8 5v14l11-7z",
  pause: "M7 5h3v14H7zM14 5h3v14h-3z",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  pen: "M4 20l4-1 11-11-3-3L5 16zM14 6l3 3",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  spark: "M12 3v6M12 15v6M3 12h6M15 12h6",
  book: "M4 6.5A2.5 2.5 0 0 1 6.5 4H12v16H6.5A2.5 2.5 0 0 1 4 17.5zM20 6.5A2.5 2.5 0 0 0 17.5 4H12v16h5.5a2.5 2.5 0 0 0 2.5-2.5z",
  download: "M12 4v11M7 10l5 5 5-5M5 19h14",
}

function Svg({ d, size = 16, stroke = 1.6, fill = "none" }: { d: string; size?: number; stroke?: number; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

function GongajiBrandLogo({ dark = false }: { dark?: boolean }) {
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

function GongajiMarkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="38 33 84 82" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d={GONGAJI_LOGO.markPath} fillRule="evenodd" />
    </svg>
  )
}

type Part = string | [string, string]
/** words that blur in one after another when an ancestor gets .gj-in; "\n" breaks the line */
function Words({ parts, at = 0 }: { parts: Part[]; at?: number }) {
  let i = at
  const out: ReactNode[] = []
  parts.forEach((p, pi) => {
    const txt = typeof p === "string" ? p : p[0]
    const cls = typeof p === "string" ? "" : p[1]
    if (txt === "\n") {
      out.push(<br key={"br" + pi} />)
      return
    }
    txt
      .split(" ")
      .filter(Boolean)
      .forEach((w, wi) => {
        out.push(
          <span key={pi + "-" + wi} className={"gj-w" + (cls ? " " + cls : "")} style={{ ["--i" as string]: i++ } as CSSProperties}>
            {w}
          </span>,
          " ",
        )
      })
  })
  return <>{out}</>
}

export interface GongajiLandingProps {
  /** height of the hero and of every pinned stage; a definite length (never a percentage) */
  height?: string
  /** contact address for every call to action */
  email?: string
  /** where the pictures live; defaults to /assets/ */
  assetBase?: string
  /** optional DonasiQu campaigns from API; defaults to local sample data */
  campaigns?: readonly DonasiQuCampaign[]
  /** optional articles override; by default fetches live from Gongaji public article API */
  articles?: readonly ApiArticle[]
  /** optional controlled dark mode state */
  dark?: boolean
  onDarkChange?: (dark: boolean) => void
  className?: string
  style?: CSSProperties
}

export default function GongajiLanding({
  height = "100svh",
  email = GONGAJI_LINKS.email,
  assetBase = "/assets/",
  campaigns = DONASIQU_CAMPAIGNS,
  articles,
  dark: controlledDark,
  onDarkChange,
  className,
  style,
}: GongajiLandingProps) {
  const base = assetBase.replace(/\/?$/, "/")
  const asset = (rel: string) => base + rel
  const mail = "mailto:" + email

  const rootRef = useRef(null as HTMLDivElement | null)
  const navRef = useRef(null as HTMLElement | null)
  const s1 = useRef(null as HTMLDivElement | null)
  const pin1 = useRef(null as HTMLDivElement | null)
  const heroText = useRef(null as HTMLDivElement | null)
  const showText = useRef(null as HTMLDivElement | null)
  const deck = useRef([] as (HTMLDivElement | null)[])
  const s2 = useRef(null as HTMLDivElement | null)
  const pin2 = useRef(null as HTMLDivElement | null)
  const whether = useRef(null as HTMLDivElement | null)
  const vision = useRef(null as HTMLDivElement | null)
  const folder = useRef(null as HTMLDivElement | null)
  const deck2 = useRef([] as (HTMLDivElement | null)[])
  const s3 = useRef(null as HTMLDivElement | null)
  const pin3 = useRef(null as HTMLDivElement | null)
  const banner = useRef(null as HTMLDivElement | null)
  const appRow = useRef(null as HTMLDivElement | null)
  const wall = useRef([] as (HTMLDivElement | null)[])
  const bands = useRef(null as HTMLElement | null)
  const bandA = useRef(null as HTMLDivElement | null)
  const bandB = useRef(null as HTMLDivElement | null)
  const limeRef = useRef(null as HTMLDivElement | null)
  const limeTrack = useRef(null as HTMLDivElement | null)
  const pile = useRef(null as HTMLDivElement | null)
  const balls = useRef([] as (HTMLSpanElement | null)[])

  const [slide, setSlide] = useState(0)
  const [watchVideo, setWatchVideo] = useState(true)
  const [liveArticles, setLiveArticles] = useState<readonly ApiArticle[]>(articles ?? DEFAULT_ARTICLES)
  const [liked, setLiked] = useState(false)
  const [hoopScore, setHoopScore] = useState(0)
  const [swishTick, setSwishTick] = useState(0)
  const [innerDark, setInnerDark] = useState(false)
  const dark = controlledDark ?? innerDark
  const setDark = (updater: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof updater === "function" ? updater(dark) : updater
    setInnerDark(next)
    onDarkChange?.(next)
  }
  const gateVideoRef = useRef(null as HTMLVideoElement | null)

  useEffect(() => {
    if (articles) {
      setLiveArticles(articles)
      return
    }
    const ctrl = new AbortController()
    fetch(PUBLIC_ARTICLE_API, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { status?: boolean; data?: { data?: ApiArticle[] } } | null) => {
        const rows = json?.data?.data
        if (Array.isArray(rows) && rows.length > 0) {
          setLiveArticles(rows)
        }
      })
      .catch(() => {
        // fallback cleanly ke DEFAULT_ARTICLES jika jaringan/API tidak tersedia
      })
    return () => ctrl.abort()
  }, [articles])

  useEffect(() => {
    const vid = gateVideoRef.current
    if (!watchVideo || !vid) return
    vid.muted = true
    vid.play().catch(() => { })
  }, [watchVideo, slide])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let reduced = mq.matches
    const onMq = () => {
      reduced = mq.matches
      root.classList.toggle("gj-reduce", reduced)
      kick()
    }
    root.classList.toggle("gj-reduce", reduced)
    root.classList.add("gj-ready")
    const t0 = performance.now()
    let raf = 0
    let lastT = t0

    // physics state for the lime pile
    const sim = {
      on: false,
      bs: [] as Ball[],
      W: 0,
      H: 0,
      started: false,
      dragIdx: -1,
      pointerId: -1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      lastTime: 0,
    }
    const startPile = () => {
      const box = pile.current
      if (!box || sim.started) return
      sim.started = true
      sim.W = box.clientWidth
      sim.H = box.clientHeight
      const n = balls.current.length
      const r = sim.W < 500 ? 24 : 36
      sim.bs = balls.current.map((_, i) => {
        const y = -60 - i * 70 - (i % 3) * 30
        return {
          x: r + sim.W * 0.04 + ((i * 0.618 * sim.W * 0.3) % (sim.W * 0.3)),
          y,
          prevY: y,
          vx: (i % 2 ? 1 : -1) * (40 + (i * 37) % 90),
          vy: 0,
          a: (i * 47) % 360,
          r,
        }
      })
      if (reduced || n === 0) {
        for (let k = 0; k < 900; k++) stepBalls(sim.bs, sim.W, sim.H, 1 / 120)
      } else sim.on = true
    }
    const drawPile = () => {
      sim.bs.forEach((b, i) => {
        const el = balls.current[i]
        if (el) el.style.transform = "translate3d(" + (b.x - b.r).toFixed(1) + "px," + (b.y - b.r).toFixed(1) + "px,0) rotate(" + b.a.toFixed(1) + "deg)"
      })
    }

    const setPose = (el: HTMLElement | null, p: Pose, bw: number, bh: number) => {
      if (!el) return
      el.style.transform =
        "translate3d(" + (p.x - bw / 2).toFixed(1) + "px," + (p.y - bh / 2).toFixed(1) + "px,0) perspective(1400px) rotateY(" + p.ry.toFixed(2) + "deg) rotate(" + p.r.toFixed(2) + "deg) scale(" + p.s.toFixed(4) + ")"
      el.style.opacity = p.o.toFixed(3)
    }
    const flag = (el: HTMLElement | null, cls: string, on: boolean) => el && el.classList.toggle(cls, on)

    const frame = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, (now - lastT) / 1000)
      lastT = now
      const t = reduced ? 99 : (now - t0) / 1000
      const w = root.clientWidth
      let again = false
      flag(navRef.current, "gj-solid", root.getBoundingClientRect().top < -40)

      // ---- stage 1: hero fan → stack → ecosystem staircase
      const st1 = s1.current
      const pn1 = pin1.current
      if (st1 && pn1) {
        const h = pn1.clientHeight
        const r = st1.getBoundingClientRect()
        const p = stageProgress(r.top, st1.offsetHeight, h)
        const fanIn = easeInOut(seg(t, 1.35, 2.35))
        const k1 = easeInOut(seg(p, 0.06, 0.28))
        const fanAmt = fanIn * (1 - k1)
        const cy = lerp(h * (w < 768 ? 0.6 : 0.65), h * 0.8, easeInOut(seg(p, 0.1, 0.34)))
        const m2 = easeInOut(seg(p, 0.34, 0.46))
        const s0 = stairPose(0, w, h)
        const cx = lerp(w / 2, s0.x, m2)
        const cyy = lerp(cy, s0.y, m2)
        const rise = easeOut(seg(t, 0.35, 1.25))
        for (let i = 0; i < DECK; i++) {
          let pose = mixPose(stackPose(i, DECK, cx, cyy, w, h), fanPose(i, DECK, w, h), fanAmt)
          const ti = easeInOut(seg(p, 0.44 + i * 0.02, 0.62 + i * 0.02))
          if (ti > 0) pose = mixPose(pose, stairPose(i, w, h), ti)
          if (i === DECK - 1 && t < 1.6) {
            pose = { ...pose, y: lerp(h + 260, pose.y, rise), r: lerp(-32, pose.r, easeInOut(seg(t, 0.6, 1.6))), ry: lerp(0, pose.ry, rise) }
          } else if (i < DECK - 1) pose.o = seg(t, 0.95, 1.15)
          setPose(deck.current[i], pose, 260, 282)
        }
        const ht = heroText.current
        if (ht) {
          const foot = ht.querySelector(".gj-hero-foot") as HTMLElement | null
          if (foot) {
            const f = fanPose(0, DECK, w, h)
            foot.style.top = (fanPose(3, DECK, w, h).y + 141 * f.s + 26 - ht.offsetTop).toFixed(1) + "px"
            // the copy under the fan leaves before the deck collapses onto it
            foot.style.opacity = (1 - seg(p, 0.03, 0.12)).toFixed(3)
          }
          const a = easeInOut(seg(p, 0.04, 0.3))
          ht.style.transform = "translate3d(0," + (-a * h * 0.42).toFixed(1) + "px,0)"
          ht.style.opacity = (1 - seg(p, 0.2, 0.34)).toFixed(3)
          ht.style.visibility = p > 0.36 ? "hidden" : "visible"
        }
        flag(pn1, "gj-tags1", t > 2.3 && p < 0.2)
        flag(pn1, "gj-tags2", p > 0.68)
        flag(showText.current, "gj-in", p > 0.4)
        if (t < 2.6) again = true
      }

      // ---- stage 2: inked paragraph + riffling deck → staircase → folder
      const st2 = s2.current
      const pn2 = pin2.current
      if (st2 && pn2) {
        const h = pn2.clientHeight
        const r = st2.getBoundingClientRect()
        const p = stageProgress(r.top, st2.offsetHeight, h)
        const q = seg(p, 0, 0.32)
        const u = unitWH(w, h)
        const cx = w < 768 ? w * 0.5 : w * 0.52
        const cy = w < 768 ? h * 0.3 : h * 0.33
        for (let j = 0; j < DECK2; j++) {
          const d = j - (DECK2 - 1) / 2
          const lift = Math.max(0, Math.sin(clamp(q * 6 - (DECK2 - 1 - j) * 0.7, 0, 1) * Math.PI))
          let pose: Pose = {
            x: cx + d * 7 * u + lift * 40 * u * (j % 2 ? 1 : -1),
            y: cy - d * 3 * u - lift * 70 * u,
            s: (w < 768 ? 0.62 : 1.05) * u,
            r: d * 5 + Math.sin(q * 7 + j) * 5 + lift * 12,
            ry: -6,
            o: j === 1 ? 0 : 1,
          }
          const tj = easeInOut(seg(p, 0.34 + j * 0.015, 0.52 + j * 0.015))
          if (tj > 0) pose = mixPose(pose, stair2Pose(j, w, h), tj)
          if (j === 1) pose.o = seg(p, 0.36, 0.46) * (1 - seg(p, 0.58, 0.66))
          const order = Math.max(0, FOLDER_SLOT[j])
          const fj = easeInOut(seg(p, 0.6 + order * 0.015, 0.78 + order * 0.015))
          if (fj > 0 && j !== 1) pose = mixPose(pose, folderPose(j, w, h), fj)
          setPose(deck2.current[j], pose, 230, j === 1 ? 280 : 230)
        }
        const words = pn2.querySelectorAll(".gj-sw")
        words.forEach((el, i) => {
          ; (el as HTMLElement).style.opacity = inkAt(reduced ? 1 : q, i, words.length).toFixed(3)
        })
        const wt = whether.current
        if (wt) {
          const a = seg(p, 0.3, 0.4)
          wt.style.opacity = (1 - a).toFixed(3)
          wt.style.transform = "translate3d(0," + (-a * 60).toFixed(1) + "px,0)"
          wt.style.visibility = p > 0.42 ? "hidden" : "visible"
        }
        const fd = folder.current
        if (fd) {
          const f = folderBox(w, h)
          const a = easeOut(seg(p, 0.6, 0.74))
          fd.style.left = f.x.toFixed(1) + "px"
          fd.style.top = f.y.toFixed(1) + "px"
          fd.style.width = f.w.toFixed(1) + "px"
          fd.style.height = (f.head + 2 * f.cell + f.gap + f.pad).toFixed(1) + "px"
          fd.style.opacity = a.toFixed(3)
          fd.style.transform = "translate3d(0," + ((1 - a) * 40).toFixed(1) + "px,0)"
        }
        flag(vision.current, "gj-in", p > 0.66)
        flag(pn2, "gj-doodled", p > 0.7)
      }

      // ---- stage 3: banner shrinks into the centre of a mentor & feature wall
      const st3 = s3.current
      const pn3 = pin3.current
      if (st3 && pn3) {
        const h = pn3.clientHeight
        const r = st3.getBoundingClientRect()
        const p = stageProgress(r.top, st3.offsetHeight, h)
        const b = bannerRect(p, w, h)
        const bn = banner.current
        if (bn) {
          bn.style.left = b.x.toFixed(1) + "px"
          bn.style.top = b.y.toFixed(1) + "px"
          bn.style.width = b.w.toFixed(1) + "px"
          bn.style.height = b.h.toFixed(1) + "px"
          bn.style.borderRadius = b.rad.toFixed(1) + "px"
        }
        flag(pn3, "gj-card-on", p > 0.52)
        const ar = appRow.current
        if (ar) {
          ar.style.transform = "translate3d(-50%," + (-seg(p, 0, 0.4) * h * 0.4).toFixed(1) + "px,0)"
          ar.style.opacity = (1 - seg(p, 0.12, 0.32)).toFixed(3)
        }
        const u = unitWH(w, h)
        const tw = w < 768 ? w * 0.27 : 195 * u
        const th = tw * (210 / 195)
        wall.current.forEach((el, k) => {
          if (!el) return
          const wp = wallPose(k, w, h)
          if (wp.hidden) {
            el.style.opacity = "0"
            return
          }
          const a = easeOut(seg(p, 0.35 + (k % 5) * 0.03, 0.55 + (k % 5) * 0.03))
          const dx = (wp.x - w / 2) * (1 - a) * 0.5
          const dy = (wp.y - h * 0.53) * (1 - a) * 0.5
          el.style.width = tw.toFixed(1) + "px"
          el.style.height = th.toFixed(1) + "px"
          el.style.transform = "translate3d(" + (wp.x - tw / 2 + dx).toFixed(1) + "px," + (wp.y - th / 2 + dy).toFixed(1) + "px,0) scale(" + (0.7 + 0.3 * a).toFixed(3) + ")"
          el.style.opacity = a.toFixed(3)
        })
      }

      // ---- feature icon & mentor bands drift apart with scroll
      const bd = bands.current
      if (bd) {
        const r = bd.getBoundingClientRect()
        const vh = window.innerHeight
        const pr = clamp((vh - r.top) / (vh + r.height))
        const u = unit(w)
        if (bandA.current) bandA.current.style.transform = "translate3d(" + (40 * u - pr * 420 * u).toFixed(1) + "px,0,0)"
        if (bandB.current) bandB.current.style.transform = "translate3d(" + (-380 * u + pr * 420 * u).toFixed(1) + "px,0,0)"
      }

      // ---- lime marquee follows scroll and creeps on its own; doodles fall once it is on screen
      const lm = limeRef.current
      if (lm) {
        const r = lm.getBoundingClientRect()
        const vh = window.innerHeight
        const tr = limeTrack.current
        if (tr) {
          const half = tr.scrollWidth / 2 || 1
          const x = ((window.scrollY * 0.6 + (reduced ? 0 : t * 40)) % half + half) % half
          tr.style.transform = "translate3d(" + (-x).toFixed(1) + "px,0,0)"
          if (!reduced && r.bottom > 0 && r.top < vh) again = true
        }
        if (r.top < vh * 0.7 && r.bottom > 0) startPile()
      }
      if (sim.on) {
        const sub = 4
        let deltaScore = 0
        for (let k = 0; k < sub; k++) deltaScore += stepBalls(sim.bs, sim.W, sim.H, dt / sub)
        if (deltaScore > 0) {
          setHoopScore((s) => s + deltaScore)
          setSwishTick((t) => t + 1)
        }
        if (settled(sim.bs) && sim.bs.every((b) => b.y > 0)) sim.on = false
        else again = true
      }
      if (sim.started) drawPile()

      if (again) raf = requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    kick()

    // interactive grab-and-throw + cursor shove for basketball hoop play
    const onPileDown = (e: PointerEvent) => {
      const box = pile.current
      if (!box || !sim.started) return
      const rb = box.getBoundingClientRect()
      const mx = e.clientX - rb.left
      const my = e.clientY - rb.top
      let pick = -1
      let best = Infinity
      sim.bs.forEach((b, i) => {
        const d = Math.hypot(b.x - mx, b.y - my)
        if (d <= b.r * 1.35 && d < best) {
          best = d
          pick = i
        }
      })
      if (pick < 0) return
      const b = sim.bs[pick]
      b.grab = true
      b.vx = 0
      b.vy = 0
      sim.dragIdx = pick
      sim.pointerId = e.pointerId
      sim.startX = mx
      sim.startY = my
      sim.lastX = mx
      sim.lastY = my
      sim.lastTime = performance.now()
      balls.current[pick]?.classList.add("is-grab")
      try {
        box.setPointerCapture(e.pointerId)
      } catch {
        // ignore if unsupported
      }
      sim.on = true
      kick()
    }

    const onPileMove = (e: PointerEvent) => {
      const box = pile.current
      if (!box || !sim.started) return
      const rb = box.getBoundingClientRect()
      const mx = e.clientX - rb.left
      const my = e.clientY - rb.top

      if (sim.dragIdx >= 0 && e.pointerId === sim.pointerId) {
        const b = sim.bs[sim.dragIdx]
        if (!b) return
        const now = performance.now()
        const ddt = Math.max(0.008, (now - sim.lastTime) / 1000)
        const ivx = clamp((mx - sim.lastX) / ddt, -1800, 1800)
        const ivy = clamp((my - sim.lastY) / ddt, -1800, 1800)
        b.vx = lerp(b.vx, ivx, 0.65)
        b.vy = lerp(b.vy, ivy, 0.65)
        b.x = clamp(mx, b.r, sim.W - b.r)
        b.y = clamp(my, -90, sim.H - b.r)
        sim.lastX = mx
        sim.lastY = my
        sim.lastTime = now
        sim.on = true
        kick()
        return
      }

      if (reduced || e.pointerType === "touch") return
      let hit = false
      for (const b of sim.bs) {
        const dx = b.x - mx
        const dy = b.y - my
        const d = Math.hypot(dx, dy)
        if (d < b.r * 2.2) {
          b.vx += (dx / (d || 1)) * 520
          b.vy -= 520 + Math.random() * 300
          hit = true
        }
      }
      if (hit) {
        sim.on = true
        kick()
      }
    }

    const onPileUp = (e: PointerEvent) => {
      if (sim.dragIdx < 0 || e.pointerId !== sim.pointerId) return
      const box = pile.current
      const b = sim.bs[sim.dragIdx]
      balls.current[sim.dragIdx]?.classList.remove("is-grab")
      if (b) {
        b.grab = false
        if (box) {
          const rb = box.getBoundingClientRect()
          const mx = e.clientX - rb.left
          const my = e.clientY - rb.top
          const moved = Math.hypot(mx - sim.startX, my - sim.startY)
          // Quick tap launches a parabolic arc that drops cleanly into the hoop from above
          if (moved < 10) {
            const hoop = getHoopGeometry(sim.W, sim.H)
            const targetX = hoop.rimLeft + hoop.rimW * 0.52
            const apexY = Math.min(b.y - 40, hoop.rimY - (sim.W < 500 ? 64 : 88))
            const g = 2600
            const tUp = Math.sqrt((2 * Math.max(20, b.y - apexY)) / g)
            const tDown = Math.sqrt((2 * Math.max(20, hoop.rimY - apexY)) / g)
            const flight = tUp + tDown
            b.vx = clamp((targetX - b.x) / flight, -1400, 1400)
            b.vy = clamp(-g * tUp, -1700, -480)
          }
        }
      }
      sim.dragIdx = -1
      sim.pointerId = -1
      sim.on = true
      kick()
    }

    const pileEl = pile.current
    pileEl?.addEventListener("pointerdown", onPileDown)
    pileEl?.addEventListener("pointermove", onPileMove)
    pileEl?.addEventListener("pointerup", onPileUp)
    pileEl?.addEventListener("pointercancel", onPileUp)

    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) (e.target as HTMLElement).classList.add("gj-in")
      },
      { rootMargin: "0px 0px 80px 0px", threshold: 0.01 },
    )
    root.querySelectorAll("[data-rv]").forEach((el) => io.observe(el))

    const onResize = () => {
      if (pile.current && sim.started) {
        sim.W = pile.current.clientWidth
        sim.H = pile.current.clientHeight
        sim.on = true
      }
      kick()
    }
    window.addEventListener("scroll", kick, { passive: true })
    window.addEventListener("resize", onResize)
    mq.addEventListener("change", onMq)
    const heroIn = window.setTimeout(() => heroText.current?.classList.add("gj-in"), reduced ? 0 : 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(heroIn)
      io.disconnect()
      pileEl?.removeEventListener("pointerdown", onPileDown)
      pileEl?.removeEventListener("pointermove", onPileMove)
      pileEl?.removeEventListener("pointerup", onPileUp)
      pileEl?.removeEventListener("pointercancel", onPileUp)
      window.removeEventListener("scroll", kick)
      window.removeEventListener("resize", onResize)
      mq.removeEventListener("change", onMq)
    }
  }, [])

  const stage = (n: number) => ({ height: "calc(" + height + " * " + n + ")" })
  const activeSlide = GATEWAY_SLIDES[slide]

  return (
    <div ref={rootRef} className={"gj-root" + (dark ? " gj-dark" : "") + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>

      <header ref={navRef} className="gj-nav">
        <a className="gj-brand" href="#top" aria-label="Gongaji — Beranda">
          <GongajiBrandLogo dark={dark} />
        </a>
        <nav className="gj-links" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} className="gj-link" href={item.href}>
              {"live" in item && item.live && <i className="gj-dot" aria-hidden="true" />}
              {item.label}
            </a>
          ))}
        </nav>
        <div className="gj-tools">
          <a className="gj-round" href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer" aria-label="Download Gongaji di Google Play">
            <Svg d={ICON.download} size={15} />
          </a>
          <button
            type="button"
            className="gj-round"
            aria-label={dark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
            aria-pressed={dark}
            onClick={() => setDark((d) => !d)}
          >
            <Svg d={ICON.sun} size={15} />
          </button>
        </div>
      </header>

      {/* ---------- stage 1: hero → ekosistem showcase ---------- */}
      <section ref={s1} id="top" className="gj-stage" style={stage(3.4)} aria-label="Pembuka Gongaji">
        <div ref={pin1} className="gj-pin" style={{ height }}>
          <div ref={heroText} className="gj-hero">
            <h1 className="gj-h1">
              <Words parts={["Jalani hari bersama", "\n", "Al-Qur’an."]} />
            </h1>
            <div className="gj-hero-foot">
              <p className="gj-fade" style={{ ["--d" as string]: "1.9s" } as CSSProperties}>
                Gongaji adalah ekosistem digital Muslim: aplikasi tilawah harian Gongaji App, kelas belajar mengaji Qursus, dan platform kebaikan DonasiQu.
              </p>
              <div className="gj-btns gj-fade" style={{ ["--d" as string]: "2.05s" } as CSSProperties}>
                <a className="gj-btn" href="#download">
                  Unduh Gongaji App
                </a>
                <a className="gj-ghost" href="#ekosistem">
                  Kenali Gongaji
                </a>
              </div>
            </div>
          </div>
          <span className="gj-tag gj-t1 gj-blue">@gongaji.app</span>
          <span className="gj-tag gj-t2 gj-mint">#JadiLebihMudah</span>

          <div ref={showText} id="ekosistem" className="gj-show">
            <p className="gj-eyebrow">
              <Words parts={["APA ITU GONGAJI · EKOSISTEM DIGITAL"]} />
            </p>
            <h2 className="gj-h2 gj-big">
              <Words parts={["Berawal dari app,", "\n", ["tumbuh jadi", "gj-red"], "\n", "ekosistem Qur'an."]} at={4} />
            </h2>
            <p className="gj-body gj-wrapp">
              <Words parts={["Dimulai dari Gongaji App sebagai teman tilawah harian, kini hadir dua sub-brand resmi: Qursus untuk belajar mengaji dan DonasiQu untuk berbagi."]} at={12} />
            </p>
            <div className="gj-btns gj-late">
              <a className="gj-btn" href="#fitur">
                Lihat Fitur App
              </a>
              <a className="gj-ghost" href="#qursus">
                Jelajahi Sub-Brand
              </a>
            </div>
          </div>
          <span className="gj-tag gj-t3 gj-redtag">@qursus · @donasiqu</span>
          <span className="gj-tag gj-t4 gj-ink">50rb+ unduhan</span>
          <div className="gj-updown" aria-hidden="true">
            <Svg d={ICON.up} size={12} />
            <Svg d={ICON.down} size={12} />
          </div>

          <div className="gj-deck" aria-hidden="true">
            {DECK1_ASSETS.map((item, i) => {
              if (item.kind === "cutout") {
                const bgCls =
                  item.theme === "sky"
                    ? "gj-s1-sky"
                    : item.theme === "sunburst"
                      ? "gj-s1-sunburst"
                      : "gj-s1-rose"
                return (
                  <div key={item.path + "-" + i} ref={(el) => { deck.current[i] = el }} className={"gj-card gj-c1 " + bgCls}>
                    <img src={asset(item.path)} alt="" width={240} height={254} className={item.float ? "gj-s1-mcut" : "gj-s1-cut"} draggable={false} />
                    <div className={"gj-s1-phead " + (item.darkText ? "gj-s1-pdark" : "")}>
                      <span className={"gj-s1-pill " + (item.inkPill ? "gj-s1-pill-ink" : "")}>{item.badge}</span>
                      {item.sub ? <small>{item.sub}</small> : null}
                    </div>
                  </div>
                )
              }
              if (item.kind === "features") {
                return (
                  <div key={item.kind + "-" + i} ref={(el) => { deck.current[i] = el }} className="gj-card gj-c1 gj-s1 gj-s1-coral">
                    <div className="gj-s1-top">
                      <span className="gj-s1-pill">{item.badge}</span>
                    </div>
                    <div className="gj-s1-tiles">
                      {item.icons.map((ic) => (
                        <span key={ic} className="gj-s1-tile">
                          <img src={asset(ic)} alt="" width={34} height={34} className="gj-s1-timg" />
                        </span>
                      ))}
                    </div>
                    <div className="gj-s1-copy gj-s1-copy-sm">
                      <b>{item.title}</b>
                      <small>{item.sub}</small>
                    </div>
                  </div>
                )
              }
              if (item.kind === "qulib") {
                return (
                  <div key={item.kind + "-" + i} ref={(el) => { deck.current[i] = el }} className="gj-card gj-c1 gj-s1 gj-s1-teal">
                    <div className="gj-s1-top">
                      <span className="gj-s1-pill">{item.badge}</span>
                      <img src={asset(item.icon)} alt="" width={38} height={38} className="gj-s1-ico" />
                    </div>
                    <div className="gj-s1-copy">
                      <b>{item.title}</b>
                      <small>{item.sub}</small>
                    </div>
                    <div className="gj-s1-chips">
                      {item.chips.map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  </div>
                )
              }
              if (item.kind === "showcase") {
                const isMint = item.theme === "mint"
                const bgCls = isMint ? "gj-s1-mint" : item.theme === "dark" ? "gj-s1-dark" : "gj-s1-teal"
                return (
                  <div
                    key={item.badge + "-" + i}
                    ref={(el) => { deck.current[i] = el }}
                    className={"gj-card gj-c1 gj-s1 " + bgCls}
                  >
                    <div className="gj-s1-top">
                      <span className={"gj-s1-pill " + (isMint ? "gj-s1-pill-ink" : item.theme === "dark" ? "gj-s1-pill-gold" : "")}>{item.badge}</span>
                    </div>
                    <div className={"gj-s1-heroico " + (isMint ? "is-mint" : "")}>
                      <img src={asset(item.icon)} alt="" width={60} height={60} className="gj-s1-bigico" />
                    </div>
                    <div className={"gj-s1-copy gj-s1-copy-sm " + (isMint ? "gj-s1-copydark" : "")}>
                      <b>{item.title}</b>
                      <small>{item.sub}</small>
                    </div>
                  </div>
                )
              }
              return (
                <div key={item.kind + "-" + i} ref={(el) => { deck.current[i] = el }} className="gj-card gj-c1 gj-s1-app">
                  <div className="gj-s1-apphead">
                    <span className="gj-s1-pill gj-s1-pill-indigo">{item.badge}</span>
                    <span className="gj-s1-pill gj-s1-pill-gold">{item.rating}</span>
                  </div>
                  <div className="gj-s1-phone">
                    <img src={asset(item.path)} alt="" width={216} height={240} className="gj-s1-screen" draggable={false} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- gateway banner ---------- */}
      <section className="gj-sec gj-gate" aria-label="Sorotan Ekosistem">
        <div className="gj-wrap">
          <div data-rv className="gj-gate-head">
            <p className="gj-eyebrow">
              <Words parts={["SEKILAS EKOSISTEM GONGAJI"]} />
            </p>
            <h2 className="gj-h2">
              <Words parts={["Dari aplikasi ibadah,", "\n", "ke kelas & aksi peduli."]} at={3} />
            </h2>
            <span className="gj-tag gj-ink gj-pop gj-t5">50rb+ Download</span>
          </div>
          <div className="gj-banner" data-rv>
            {watchVideo && activeSlide.video ? (
              <video
                key={activeSlide.video}
                ref={gateVideoRef}
                src={asset(activeSlide.video)}
                poster={activeSlide.path ? asset(activeSlide.path) : undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="gj-banner-vid"
                style={{ objectPosition: slide === 0 ? "50% 50%" : "50% 25%" }}
              />
            ) : activeSlide.path ? (
              GATEWAY_SLIDES.map((item, i) =>
                item.path ? (
                  <img
                    key={item.path}
                    src={asset(item.path)}
                    alt={i === slide ? item.alt : ""}
                    className={i === slide ? "on" : ""}
                    width={1400}
                    height={560}
                    draggable={false}
                  />
                ) : null,
              )
            ) : (
              <div className="gj-dq-stage" role="status">
                <img
                  src={asset("02-gateway-banner/donasiqu-empty-stage.webp")}
                  alt="Ilustrasi kotak kebaikan, Al-Qur'an, dan lencana video DonasiQu by Gongaji"
                  className="on gj-dq-bg"
                  width={1376}
                  height={768}
                  draggable={false}
                />
                <div className="gj-dq-copy">
                  <span className="gj-dq-pill">
                    <i aria-hidden="true" />
                    Video Segera Hadir
                  </span>
                  <h3>Video Profil DonasiQu Belum Tersedia</h3>
                  <p>
                    Dokumentasi penyaluran mushaf, guru ngaji, &amp; program wakaf bersama Qubba Foundation sedang dipersiapkan.
                  </p>
                  <a className="gj-dq-btn" href="#donasiqu">
                    Lihat Program DonasiQu →
                  </a>
                </div>
              </div>
            )}
            <div className="gj-banner-scrim" aria-hidden="true" />
            <span className="gj-switch" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="gj-slide-meta">
              <b>{activeSlide.badge}</b>
              <small>{activeSlide.caption}</small>
            </span>
            <span className="gj-more" aria-hidden="true">
              <Svg d={ICON.dots} size={18} stroke={3} />
            </span>
            {activeSlide.video ? (
              <button type="button" className="gj-watch" onClick={() => setWatchVideo((v) => !v)} aria-pressed={watchVideo}>
                <Svg d={watchVideo ? ICON.pause : ICON.play} size={9} fill="currentColor" stroke={0} />
                {watchVideo ? "Tutup Video" : "Tonton Video"}
              </button>
            ) : (
              <span className="gj-watch is-empty" aria-disabled="true">
                Video Belum Tersedia
              </span>
            )}
            <div className="gj-arrows">
              <button
                type="button"
                aria-label="Sorotan sebelumnya"
                onClick={() => {
                  setSlide((s) => (s + GATEWAY_SLIDES.length - 1) % GATEWAY_SLIDES.length)
                }}
              >
                <Svg d={ICON.left} size={12} stroke={2} />
              </button>
              <button
                type="button"
                aria-label="Sorotan berikutnya"
                onClick={() => {
                  setSlide((s) => (s + 1) % GATEWAY_SLIDES.length)
                }}
              >
                <Svg d={ICON.right} size={12} stroke={2} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- trusted by / stats ---------- */}
      <section className="gj-sec gj-trust" aria-label="Pencapaian Gongaji">
        <div className="gj-wrap" data-rv>
          <div className="gj-trust-head">
            <div>
              <h2 className="gj-h3">
                <Words parts={["Perjalanan baik", ["yang terus bertumbuh.", "gj-grey"]]} />
              </h2>
              <p className="gj-small gj-late">
                50 ribu+ download · 10 ribu+ pengguna aktif bulanan · Ribuan aktivitas tilawah setiap hari (Data internal Gongaji App, September 2026).
              </p>
            </div>
            <div className="gj-mini-arrows" aria-hidden="true">
              <Svg d={ICON.left} size={11} stroke={2} />
              <Svg d={ICON.right} size={11} stroke={2} />
            </div>
          </div>
        </div>
        <div className="gj-logos" aria-label="Sorotan angka ekosistem Gongaji">
          <div className="gj-logos-track">
            {[0, 1].map((rep) =>
              TRUST_ITEMS.map((item, i) => (
                <span key={rep + item} className="gj-logo-item" aria-hidden={rep === 1}>
                  <Svg d={[ICON.download, ICON.user, ICON.spark, ICON.heart, ICON.grid, ICON.book, ICON.globe][i]} size={18} />
                  {item}
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* ---------- stage 2: inked paragraph → staircase → folder ---------- */}
      <section ref={s2} className="gj-stage" style={stage(3.8)} aria-label="Filosofi Gongaji">
        <div ref={pin2} className="gj-pin" style={{ height }}>
          <div ref={whether} className="gj-whether">
            <p className="gj-ink-text">
              {"Dari pengingat waktu Subuh".split(" ").map((w, i) => (
                <span key={"a" + i} className="gj-sw">
                  {w}{" "}
                </span>
              ))}
              <br />
              {"/ hingga menutup hari dengan".split(" ").map((w, i) => (
                <span key={"b" + i} className="gj-sw">
                  {w}{" "}
                </span>
              ))}{" "}
              <span className="gj-sw gj-mintw">tilawah </span>
              <span className="gj-sw">dan hafalan </span>
              <span className="gj-chip gj-sw">
                <img src={asset("03-filosofi-deck/chip-1-quran.webp")} alt="" width={44} height={44} />
              </span>{" "}
              <span className="gj-sw">Gongaji App </span>
              <br />
              {"menyatukan Al-Qur'an, murottal, dan".split(" ").map((w, i) => (
                <span key={"c" + i} className="gj-sw">
                  {w}{" "}
                </span>
              ))}{" "}
              <span className="gj-chip gj-sw">
                <img src={asset("03-filosofi-deck/chip-2-mentor.webp")} alt="" width={44} height={44} />
              </span>{" "}
              <span className="gj-sw">25+ fitur </span>
              <span className="gj-sw">ibadah harian.</span>
            </p>
            <div className="gj-iconrow" aria-hidden="true">
              <Svg d={ICON.book} size={14} />
              <Svg d={ICON.grid} size={14} />
              <Svg d={ICON.heart} size={14} />
            </div>
            <span className="gj-tag gj-ink gj-t6">4,8★ &amp; 4,9★</span>
            <span className="gj-tag gj-blue gj-t7">25+ fitur ibadah</span>
          </div>

          <div ref={folder} className="gj-folder" aria-hidden="true">
            <div className="gj-folder-tab">
              <span>Aplikasi</span>
              <b>
                <i className="gj-dot" /> Gongaji App
              </b>
            </div>
            <div className="gj-folder-bar">
              <span>25+ Fitur Tilawah &amp; Ibadah</span>
            </div>
          </div>

          <div ref={vision} className="gj-vision">
            <span className="gj-eye">
              <GongajiMarkIcon size={20} />
            </span>
            <h2 className="gj-h2 gj-mid">
              <Words parts={["Semua kebutuhan tilawah", "\n", "dalam satu aplikasi."]} />
            </h2>
            <p className="gj-small gj-wrapv">
              <Words parts={["Dari mushaf digital, target khatam 30 hari, murottal 11 qari, hingga 300+ buku di Qu-Lib — gratis dan nyaman digunakan setiap hari."]} at={7} />
            </p>
            <a className="gj-textlink gj-late" href="#fitur">
              Jelajahi fitur app
            </a>
          </div>
          <div className="gj-doodles" aria-hidden="true">
            {DOODLES.slice(0, 9).map((d, i) => (
              <span key={i} className="gj-doodle" style={{ ["--i" as string]: i } as CSSProperties}>
                <Svg d={d} size={40} stroke={1.3} />
              </span>
            ))}
          </div>

          <div className="gj-deck" aria-hidden="true">
            {DECK2_CARDS.map((card, j) => {
              if (card.kind === "info") {
                return (
                  <div key="info" ref={(el) => { deck2.current[j] = el }} className="gj-card gj-info">
                    <span className="gj-info-dot" />
                    <b>
                      Gongaji
                      <br />
                      App
                    </b>
                    <small>4,8★ &amp; 4,9★ · Gratis</small>
                    <p>Mushaf, target khatam, 11 qari, Qu-Lib 300+ buku &amp; jadwal shalat.</p>
                  </div>
                )
              }
              if (card.kind === "tilawah") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="gj-card gj-c2 gj-s2 gj-s2-purple">
                    <div className="gj-s2-top">
                      <span className="gj-s2-pill">{card.badge}</span>
                      <img src={asset(card.icon)} alt="" width={44} height={44} className="gj-s2-ico" />
                    </div>
                    <div className="gj-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                    <div className="gj-s2-foot">
                      <div className="gj-s2-bar">
                        <i style={{ width: "72%" }} />
                      </div>
                      <span>{card.meta}</span>
                    </div>
                  </div>
                )
              }
              if (card.kind === "murottal") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="gj-card gj-c2 gj-s2 gj-s2-rose">
                    <div className="gj-s2-top">
                      <span className="gj-s2-pill">{card.badge}</span>
                      <img src={asset(card.icon)} alt="" width={44} height={44} className="gj-s2-ico" />
                    </div>
                    <div className="gj-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                    <div className="gj-s2-foot">
                      <div className="gj-s2-wave">
                        {[42, 76, 56, 94, 68, 86, 48, 72, 60, 40].map((h, wi) => (
                          <i key={wi} style={{ height: h + "%" }} />
                        ))}
                      </div>
                      <span>{card.meta}</span>
                    </div>
                  </div>
                )
              }
              if (card.kind === "photo") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="gj-card gj-c2 gj-s2 gj-s2-sky">
                    <div className="gj-s2-top">
                      <span className="gj-s2-pill">{card.badge}</span>
                    </div>
                    <div className="gj-s2-phonebox">
                      <img src={asset(card.photo)} alt="" width={160} height={110} draggable={false} />
                    </div>
                    <div className="gj-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                  </div>
                )
              }
              if (card.kind === "features") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="gj-card gj-c2 gj-s2 gj-s2-teal">
                    <div className="gj-s2-grid">
                      {card.icons.map((ic) => (
                        <span key={ic} className="gj-s2-tile">
                          <img src={asset(ic)} alt="" width={34} height={34} />
                        </span>
                      ))}
                    </div>
                    <div className="gj-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                  </div>
                )
              }
              if (card.kind === "rapor") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="gj-card gj-c2 gj-s2 gj-s2-dark">
                    <div className="gj-s2-top">
                      <span className="gj-s2-pill gj-s2-pill-gold">{card.badge}</span>
                    </div>
                    <div className="gj-s2-blist">
                      {card.levels.map((lv, li) => (
                        <span key={lv} className={li === 0 ? "on" : ""}>
                          {lv}
                        </span>
                      ))}
                    </div>
                    <div className="gj-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                  </div>
                )
              }
              return (
                <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="gj-card gj-c2 gj-s2 gj-s2-gold">
                  <div className="gj-s2-top">
                    <span className="gj-s2-pill gj-s2-pill-ink">{card.badge}</span>
                    <img src={asset(card.icon)} alt="" width={44} height={44} className="gj-s2-ico" />
                  </div>
                  <div className="gj-s2-copy">
                    <b>{card.title}</b>
                    <small>{card.sub}</small>
                  </div>
                  <div className="gj-s2-foot">
                    <span className="gj-s2-ver">{card.meta}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <span className="gj-tag gj-orange gj-t8">@gongaji.app</span>
        </div>
      </section>

      {/* ---------- drifting feature icons ---------- */}
      <section ref={bands} className="gj-bands" aria-label="25+ Fitur Ibadah Gongaji App">
        <div ref={bandA} className="gj-band gj-band-a" aria-hidden="true">
          {BAND_TOP_ASSETS.map((item, i) => (
            <span
              key={item.path + i}
              className="gj-av gj-av-icon"
              style={{ ["--y" as string]: ((i * 37) % 5) * 12 - 24 + "px", backgroundColor: item.bg } as CSSProperties}
            >
              <img src={asset(item.path)} alt="" width={88} height={88} />
            </span>
          ))}
        </div>
        <div className="gj-bands-mid" data-rv>
          <span className="gj-spark" aria-hidden="true">
            <GongajiMarkIcon size={18} />
          </span>
          <h2 className="gj-h2 gj-center">
            <Words parts={["25+ fitur ibadah", "\n", "dalam satu aplikasi"]} />
          </h2>
          <p className="gj-small gj-center">
            <Words parts={["Target tilawah, murottal 11 qari, 300+ buku di Qu-Lib, jadwal shalat, kiblat, hingga simulasi manasik VR."]} at={6} />
          </p>
        </div>
        <div ref={bandB} className="gj-band gj-band-b" aria-hidden="true">
          {BAND_BOT_ASSETS.map((item, i) => (
            <span
              key={item.path + i}
              className={"gj-av" + (item.kind === "icon" ? " gj-av-icon" : " gj-av-portrait")}
              style={{ ["--y" as string]: ((i * 53) % 5) * 12 - 24 + "px", backgroundColor: item.bg } as CSSProperties}
            >
              <img src={asset(item.path)} alt="" width={88} height={88} />
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Ekosistem Gongaji: App, Qursus & DonasiQu ---------- */}
      <section id="fitur" className="gj-sec gj-story" aria-label="Ekosistem Gongaji: Go Ngaji, Qursus, dan DonasiQu">
        <div className="gj-wrap">
          <div data-rv className="gj-center-head">
            <p className="gj-eyebrow">
              <Words parts={["EKOSISTEM", ["GONGAJI", "gj-bluew"]]} />
            </p>
            <h2 className="gj-h2 gj-center">
              <Words parts={["Go Ngaji, Qursus,", "\n", "dan DonasiQu"]} at={3} />
            </h2>
          </div>
          <div className="gj-bento">
            <div className="gj-col">
              <article className="gj-bcard gj-b1" data-rv>
                <span className="gj-label">
                  <Svg d={ICON.download} size={10} stroke={2} /> Go Ngaji App · 4,8★ &amp; 4,9★
                </span>
                <div className="gj-pile" aria-hidden="true">
                  <div className="gj-pcard gj-pc1">
                    <div className="gj-pc-top">
                      <span className="gj-pc-pill">AL-QUR’AN</span>
                      <img src={asset("05-bento-pilar/tafsir.webp")} alt="" width={24} height={24} className="gj-pc-ico" />
                    </div>
                    <div className="gj-pc-mid">
                      <strong>30 Hari</strong>
                      <span>Target Khatam · Hari ke-12</span>
                    </div>
                    <div>
                      <div className="gj-pc-bar"><i style={{ width: "72%" }} /></div>
                      <span className="gj-pc-meta">Al-Baqarah : 142</span>
                    </div>
                  </div>
                  <div className="gj-pcard gj-pc2">
                    <div className="gj-pc-top">
                      <span className="gj-pc-pill gj-pc-pill-w">IBADAH</span>
                      <img src={asset("05-bento-pilar/jadwal-sholat.webp")} alt="" width={24} height={24} className="gj-pc-ico" />
                    </div>
                    <div className="gj-pc-mid">
                      <strong>04:03</strong>
                      <span>Adzan &amp; Arah Kiblat</span>
                    </div>
                    <div className="gj-pc-chips">
                      <span>Dzikir</span>
                      <span>Manasik VR</span>
                    </div>
                  </div>
                  <div className="gj-pcard gj-pc3">
                    <div className="gj-pc-top">
                      <span className="gj-pc-pill gj-pc-pill-y">MUROTTAL</span>
                      <img src={asset("05-bento-pilar/dzikir.webp")} alt="" width={24} height={24} className="gj-pc-ico" />
                    </div>
                    <div className="gj-pc-mid">
                      <strong>11 Qari</strong>
                      <span>Tikrar &amp; Qu-Lib 300+ Buku</span>
                    </div>
                    <div className="gj-pc-bars">
                      <i style={{ height: "42%" }} />
                      <i style={{ height: "85%" }} />
                      <i style={{ height: "62%" }} />
                      <i style={{ height: "100%" }} />
                      <i style={{ height: "70%" }} />
                      <i style={{ height: "48%" }} />
                    </div>
                  </div>
                  <span className="gj-tag gj-blue gj-t9">25+ fitur</span>
                </div>
                <h3 className="gj-h4">01 — Go Ngaji · Teman Tilawah &amp; Ibadah Harian</h3>
                <p className="gj-small">
                  Aplikasi Al-Qur’an digital dengan penanda ayat otomatis, target khatam 30 hari, murottal 11 qari, Qu-Lib 300+ buku, serta 25+ fitur ibadah harian gratis.
                </p>
                <a className="gj-chipbtn" href="#download">
                  Unduh Go Ngaji App
                </a>
              </article>
              <article className="gj-bcard gj-img" data-rv>
                <div className="gj-photo">
                  <img src={asset("05-bento-pilar/card2-qursus.webp")} alt="Kelas live Qursus by Gongaji bersama pengajar mengaji daring" width={1280} height={800} style={{ objectPosition: "50% 25%" }} />
                  <div className="gj-ph-badge" aria-hidden="true">
                    <strong>Qursus · Kelas Live 3 Bulan</strong>
                    <span>Grup kecil 5–8 peserta · Ikhwan &amp; Akhwat terpisah</span>
                  </div>
                </div>
                <h3 className="gj-h4">02 — Qursus · Belajar Ngaji Dibimbing Pengajar</h3>
                <p className="gj-small">
                  Sub-brand edukasi Gongaji dengan kelas live berjenjang dari Pemula 1 hingga Mahir 2. Lengkap dengan evaluasi berkala, rapor perkembangan, dan sertifikat.
                </p>
                <a className="gj-chipbtn" href="https://qursus.gongaji.id/" target="_blank" rel="noopener noreferrer">
                  Daftar Qursus
                </a>
              </article>
            </div>
            <div className="gj-col gj-col-r">
              <article className="gj-bcard gj-img" data-rv>
                <div className="gj-photo">
                  <img src={asset("05-bento-pilar/card3-qupeduli.webp")} alt="Penyaluran mushaf dan bantuan DonasiQu by Gongaji" width={1280} height={800} style={{ objectPosition: "50% 35%" }} />
                  <div className="gj-qu-card" aria-hidden="true">
                    <div className="gj-qu-top">
                      <img src={asset("05-bento-pilar/donasi.webp")} alt="" width={20} height={20} />
                      <span>Terverifikasi</span>
                    </div>
                    <strong>1.200+ Mushaf &amp; Bantuan</strong>
                    <div className="gj-qu-bar"><i style={{ width: "72%" }} /></div>
                    <small>Bersama Qubba Foundation</small>
                  </div>
                  <div className="gj-ph-badge" aria-hidden="true">
                    <strong>DonasiQu · Qubba Foundation</strong>
                    <span>Sedekah, zakat &amp; wakaf dengan laporan terbuka</span>
                  </div>
                </div>
                <h3 className="gj-h4">03 — DonasiQu · Berbagi Kebaikan &amp; Wakaf Transparan</h3>
                <p className="gj-small">
                  Sub-brand filantropi Gongaji bersama Yayasan Quran Bina Bangsa untuk menyalurkan sedekah, zakat, dan wakaf mushaf bagi santri serta guru ngaji secara terbuka.
                </p>
                <a className="gj-chipbtn" href="#donasiqu">
                  Lihat Program DonasiQu
                </a>
              </article>
              <article className="gj-bcard gj-phone-wrap" data-rv>
                <span className="gj-pen" aria-hidden="true">
                  <Svg d={ICON.book} size={13} />
                </span>
                <div className="gj-phone">
                  <div className="gj-ph-status">
                    <span>Ekosistem Gongaji</span>
                    <span>50rb+ Unduhan</span>
                  </div>
                  <div className="gj-ph-hero">
                    <small>Satu Ekosistem</small>
                    <b>#JadiLebihMudah</b>
                    <div className="gj-ph-pills">
                      <span>Go Ngaji</span>
                      <span>Qursus</span>
                      <span>DonasiQu</span>
                    </div>
                  </div>
                  <div className="gj-ph-qulib">
                    <img src={asset("05-bento-pilar/tafsir.webp")} alt="" width={34} height={34} aria-hidden="true" />
                    <div>
                      <strong>Baca · Belajar · Berbagi</strong>
                      <span>Tilawah harian, kelas ngaji &amp; donasi</span>
                    </div>
                  </div>
                  <div className="gj-ph-foot">
                    <em>Bersama Qubba Foundation</em>
                    <small>Gongaji App · Qursus · DonasiQu</small>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Sub-Brand 01: stage 3 banner → mentor & learner wall ---------- */}
      <section ref={s3} id="qursus" className="gj-stage" style={stage(3)} aria-label="Sub-Brand Qursus by Gongaji">
        <div ref={pin3} className="gj-pin" style={{ height }}>
          <div ref={appRow} className="gj-lead">
            <p className="gj-eyebrow">
              SUB-BRAND 01 · <span className="gj-orangew">QURSUS BY GONGAJI</span>
            </p>
            <h2 className="gj-h2 gj-center">
              Ingin belajar ngaji
              <br />
              dibimbing pengajar?
            </h2>
            <p className="gj-small gj-center">
              Qursus adalah sub-brand edukasi Gongaji dengan kelas live grup kecil 5–8 peserta berjenjang (Pemula 1 – Mahir 2), dipisah ikhwan &amp; akhwat.
            </p>
          </div>
          {WALL_ASSETS.map((item, i) =>
            item.path ? (
              <div
                key={item.path + i}
                ref={(el) => { wall.current[i] = el }}
                className="gj-wall"
                style={{ backgroundColor: item.bg }}
                aria-hidden="true"
              >
                <img src={asset(item.path)} alt="" width={195} height={210} className="gj-portrait" />
              </div>
            ) : null,
          )}
          <div ref={banner} className="gj-orange">
            <img src={asset("07-mentor-wall/mentor-center.webp")} alt="Pengajar Qursus tersenyum saat membimbing kelas daring" width={1600} height={900} />
            <div className="gj-orange-scrim" aria-hidden="true" />
            <div className="gj-orange-ui">
              <span className="gj-tag gj-redtag gj-t10">@qursus.gongaji</span>
              <button type="button" className={"gj-like" + (liked ? " on" : "")} aria-pressed={liked} onClick={() => setLiked((l) => !l)}>
                <Svg d={ICON.heart} size={10} fill={liked ? "currentColor" : "none"} stroke={2} />
                {liked ? "Disukai" : "Suka"}
              </button>
              <div className="gj-by">
                <img src={asset("07-mentor-wall/ilham.webp")} alt="" width={28} height={28} />
                <span>
                  <b>Fajar Nugraha · Pemula 2</b>
                  <small>“Kelasnya kecil, salah langsung dibenerin.”</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Qursus pricing ---------- */}
      <section id="pricing" className="gj-sec gj-price" aria-label="Biaya Sub-Brand Qursus">
        <div className="gj-wrap gj-price-grid">
          <div data-rv>
            <span className="gj-eye">
              <Svg d={ICON.spark} size={15} />
            </span>
            <h2 className="gj-h3">
              <Words parts={["Biaya Qursus"]} />
            </h2>
            <p className="gj-small gj-wrapp">
              <Words
                parts={["Harga sama untuk semua level dari Pemula 1 hingga Mahir 2. Termasuk kelas live 3 bulan, evaluasi, rapor, dan sertifikat."]}
                at={2}
              />
            </p>
            <div className="gj-btns gj-price-cta">
              <a className="gj-btn" href="https://qursus.gongaji.id/" target="_blank" rel="noopener noreferrer">
                Daftar Qursus →
              </a>
            </div>
          </div>
          <div className="gj-plans" data-rv>
            <div className="gj-plan gj-p1">
              <small>Bayar Penuh</small>
              <b>
                <sup>Rp</sup>699<small>rb</small>
              </b>
              <em>Per level · Hemat Rp51.000</em>
            </div>
            <div className="gj-plan gj-p2">
              <small>Bertahap</small>
              <span className="gj-pop-pill">Populer</span>
              <b>
                <sup>Rp</sup>750<small>rb</small>
              </b>
              <em>Dicicil selama 3 bulan</em>
            </div>
            <div className="gj-plan gj-p3">
              <small>Beasiswa</small>
              <b>
                <sup>Rp</sup>0<small>/batch</small>
              </b>
              <em>Jalur beasiswa Pemula 1–3</em>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Sub-Brand 02: dedicated DonasiQu section ---------- */}
      <section id="donasiqu" className="gj-sec gj-qupeduli" aria-label="Sub-Brand DonasiQu by Gongaji">
        <div className="gj-wrap">
          <div className="gj-qup-head" data-rv>
            <div>
              <p className="gj-eyebrow">
                <Words parts={["SUB-BRAND 02 ·", ["DONASIQU BY GONGAJI", "gj-purplew"]]} />
              </p>
              <h2 className="gj-h2">
                <Words parts={["Kebaikan yang lahir", "\n", "dari rasa percaya."]} at={2} />
              </h2>
            </div>
            <p className="gj-small gj-qup-sub">
              Platform donasi online, sedekah, dan wakaf bersama Yayasan Quran Bina Bangsa (Qubba Foundation) dengan rincian dana &amp; laporan penyaluran terbuka.
            </p>
          </div>
          <div className="gj-qup-grid">
            <div className="gj-qup-hero" data-rv>
              <span className="gj-qup-pill">Qubba Foundation · Terverifikasi</span>
              <h3>1.200+ Mushaf &amp; Bantuan Tersalurkan</h3>
              <p>Setiap donasi dicatat terbuka dan disalurkan berkala untuk santri, guru ngaji, serta masyarakat membutuhkan.</p>
              <div className="gj-qup-chips">
                <span>Laporan Terbuka</span>
                <span>Sedekah &amp; Wakaf</span>
              </div>
              <a className="gj-btn" href="#download">
                Salurkan Lewat Gongaji App
              </a>
              <img src={asset("10-qupeduli/donor-spotlight.webp")} alt="" width={280} height={320} className="gj-qup-donor" aria-hidden="true" draggable={false} />
            </div>
            <div className="gj-qup-list" data-rv>
              {campaigns.map((camp) => (
                <article key={camp.id} className="gj-qup-item">
                  <div className={"gj-qup-thumb" + (camp.isIcon ? " is-icon" : "")}>
                    <img src={asset(camp.image)} alt={camp.title} width={76} height={76} />
                  </div>
                  <div className="gj-qup-body">
                    <div className="gj-qup-meta">
                      <span>{camp.category}</span>
                      <small>{camp.daysLeft}</small>
                    </div>
                    <h4>{camp.title}</h4>
                    <div className="gj-qup-bar">
                      <i style={{ width: camp.pct + "%" }} />
                    </div>
                    <div className="gj-qup-foot">
                      <span>
                        <b>{camp.raisedText}</b> / {camp.targetText}
                      </span>
                      <small>{camp.donors} donatur</small>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Artikel & wawasan (live API) ---------- */}
      <section id="artikel" className="gj-sec gj-artikel" aria-label="Artikel dan Wawasan Gongaji">
        <div className="gj-wrap">
          <div className="gj-art-head" data-rv>
            <div>
              <p className="gj-eyebrow">
                <Words parts={["ARTIKEL &", ["WAWASAN", "gj-purplew"]]} />
              </p>
              <h2 className="gj-h2">
                <Words parts={["Artikel Pilihan &", "\n", "Panduan Qur'an"]} at={2} />
              </h2>
            </div>
            <p className="gj-small gj-art-sub">
              Bacaan ringan seputar Ramadan, fikih keluarga, dan tadabbur Al-Qur'an langsung dari redaksi Gongaji.
            </p>
          </div>
          <div className="gj-art-grid" data-rv>
            {liveArticles.map((item) => {
              const primaryCategory = splitCategories(item.article_category)[0]
              return (
                <a
                  key={item.article_uuid}
                  href={`/artikel/${item.article_uuid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gj-art-card"
                  aria-label={`Baca artikel ${item.article_title}`}
                >
                  <div className="gj-art-media">
                    <img
                      src={item.article_image_url || asset("06-artikel-carousel/01-belajar-pemula.webp")}
                      alt={item.article_title}
                      width={400}
                      height={250}
                      loading="lazy"
                      onError={(e) => {
                        if (!e.currentTarget.dataset.fb) {
                          e.currentTarget.dataset.fb = "1"
                          e.currentTarget.src = asset("06-artikel-carousel/01-belajar-pemula.webp")
                        }
                      }}
                    />
                    {primaryCategory ? <span className="gj-art-cat">{primaryCategory}</span> : null}
                  </div>
                  <div className="gj-art-body">
                    <div className="gj-art-meta">
                      <span>{formatArticleDate(item.article_published_at)}</span>
                      <span>{(item.article_total_view ?? 0).toLocaleString("id-ID")} dilihat</span>
                    </div>
                    <h3>{item.article_title}</h3>
                    <p>{cleanArticleExcerpt(item.article_excerpt)}</p>
                    <div className="gj-art-foot">
                      <span>{item.article_author || "Redaksi Gongaji"}</span>
                      <small className="gj-art-read">Baca artikel →</small>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
          <div className="gj-art-actions">
            <a className="gj-art-cta" href="/artikel" target="_blank" rel="noopener noreferrer">
              Lihat Semua Artikel →
            </a>
          </div>
        </div>
      </section>

      {/* ---------- lime marquee + falling doodles ---------- */}
      <section ref={limeRef} className="gj-sec gj-lime-sec" aria-label="Ajakan Ekosistem Gongaji">
        <div className="gj-lime">
          <span className="gj-water" aria-hidden="true">
            GONGAJI
          </span>
          <div className="gj-marquee">
            <div ref={limeTrack} className="gj-mtrack">
              {[0, 1].map((rep) => (
                <span key={rep} className="gj-mrun" aria-hidden={rep === 1}>
                  Baca. Belajar. Berbagi.
                  <span className="gj-mthumbs">
                    <i style={{ background: "#5145B9" }} />
                    <img src={asset("08-lime-marquee/thumb-1-app-home.webp")} alt="" width={44} height={44} />
                    <img src={asset("08-lime-marquee/thumb-2-app-quran.webp")} alt="" width={44} height={44} />
                    <small>#JADILEBIHMUDAH</small>
                  </span>
                  25+ Fitur di Gongaji App
                  <span className="gj-mthumbs">
                    <img src={asset("08-lime-marquee/thumb-3-teaching-smile.webp")} alt="" width={44} height={44} />
                  </span>
                  Sub-Brand Qursus · 5 Level
                  <span className="gj-mthumbs">
                    <img src={asset("08-lime-marquee/thumb-4-qursus-murid.webp")} alt="" width={44} height={44} />
                  </span>
                  Sub-Brand DonasiQu · Qubba Foundation
                  <span className="gj-mthumbs">
                    <img src={asset("08-lime-marquee/thumb-5-teaching-mushaf.webp")} alt="" width={44} height={44} />
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div ref={pile} className="gj-pilebox">
            <div className="gj-hoop-hud" aria-live="polite">
              <span className="gj-hoop-score">
                🏀 Skor <b>{hoopScore}</b>
              </span>
              <small key={swishTick} className={swishTick > 0 ? "gj-swish-pop" : ""}>
                {swishTick > 0 ? "Masuk! +1" : "Lempar fitur"}
              </small>
            </div>
            <div className={"gj-hoop" + (swishTick > 0 ? " is-swish" : "")} key={"hoop-" + swishTick} aria-hidden="true">
              <div className="gj-hoop-board">
                <span className="gj-hoop-sq" />
              </div>
              <div className="gj-hoop-rim" />
              <svg className="gj-hoop-net" viewBox="0 0 114 70" fill="none" aria-hidden="true">
                <path d="M6 2L22 66H92L108 2" stroke="rgba(255,255,255,.92)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M24 2L38 66M45 2L54 66M69 2L60 66M90 2L76 66" stroke="rgba(255,255,255,.78)" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 22H102M17 44H97" stroke="rgba(255,255,255,.72)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            {GONGAJI_BALL_ICONS.map((item, i) => (
              <span key={item.label} ref={(el) => { balls.current[i] = el }} className="gj-ball" title={item.label}>
                {item.kind === "mark" ? (
                  <GongajiMarkIcon size={34} />
                ) : (
                  <img src={asset(item.path)} alt={item.label} width={42} height={42} draggable={false} />
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- duo: download Gongaji App + daftar Qursus ---------- */}
      <section id="download" className="gj-sec gj-duo" aria-label="Mulai Bersama Gongaji">
        <div className="gj-wrap gj-duo-grid">
          <article className="gj-meet" data-rv>
            <div className="gj-duo-phones" aria-hidden="true">
              <span className="gj-duo-pill">50rb+ Unduhan · 25+ Fitur</span>
              <div className="gj-phone-back">
                <img src={asset("09-download-cta/app-quran.webp")} alt="" width={210} height={380} draggable={false} />
              </div>
              <div className="gj-phone-front">
                <img src={asset("09-download-cta/app-home.webp")} alt="" width={230} height={420} draggable={false} />
              </div>
            </div>
            <div className="gj-duo-copy">
              <Svg d={ICON.download} size={14} />
              <h3 className="gj-h3">
                Unduh
                <br />
                <span>Gongaji App</span>
              </h3>
              <p className="gj-small">Tersedia gratis di Google Play (4,8★) dan App Store (4,9★). Mulai kebiasaan tilawahmu hari ini.</p>
              <div className="gj-store-row">
                <a className="gj-store-badge" href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer" aria-label="Download Gongaji di Google Play">
                  <img src={asset("09-download-cta/badge-google-play.svg")} alt="" height={40} />
                </a>
                <a className="gj-store-badge" href={GONGAJI_LINKS.appStore} target="_blank" rel="noopener noreferrer" aria-label="Download Gongaji di App Store">
                  <img src={asset("09-download-cta/badge-app-store.svg")} alt="" height={40} />
                </a>
              </div>
            </div>
          </article>
          <article className="gj-arch" data-rv>
            <div className="gj-qursus-ui" aria-hidden="true">
              <div className="gj-qursus-photo">
                <img src={asset("09-download-cta/qursus-mentor.webp")} alt="" width={520} height={240} draggable={false} />
                <span className="gj-qursus-live">Kelas Live · 5–8 Peserta</span>
              </div>
              <div className="gj-qursus-steps">
                {[
                  { label: "Pemula 1", st: "done" },
                  { label: "Pemula 2", st: "on" },
                  { label: "Pemula 3", st: "" },
                  { label: "Mahir 1", st: "" },
                  { label: "Mahir 2", st: "" },
                ].map((lv) => (
                  <span key={lv.label} className={lv.st}>
                    {lv.label}
                  </span>
                ))}
              </div>
              <div className="gj-qursus-tags">
                <span>Asesmen Awal</span>
                <span>Ikhwan &amp; Akhwat Terpisah</span>
                <span>Rapor &amp; Sertifikat</span>
              </div>
            </div>
            <div className="gj-duo-copy">
              <Svg d={ICON.spark} size={14} />
              <h3 className="gj-h3">
                Mulai Belajar
                <br />
                di Qursus
              </h3>
              <p className="gj-small">Ikuti asesmen awal, pilih jadwal kelas live kecil bersama pengajar bersertifikat, dan pantau rapor progresmu.</p>
              <a className="gj-btn" href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Daftar Qursus
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- footer ---------- */}
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
              {email}
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
              <a href="#fitur">Gongaji App</a>
            </li>
            <li>
              <i className="gj-dot" />{" "}
              <a href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Qursus
              </a>{" "}
              <span className="gj-new">Live</span>
            </li>
            <li>
              <a href="#donasiqu">DonasiQu</a>
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
              <a href="#qursus">Pemula 1 – Mahir 2</a>
            </li>
            <li>
              <i className="gj-dot" /> <a href="#pricing">Biaya &amp; Beasiswa</a>
            </li>
            <li>
              <a href="#donasiqu">Program DonasiQu</a>
            </li>
            <li>
              <a href="#artikel">
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
    </div>
  )
}

const EASE = "cubic-bezier(.22,1,.36,1)"

const CSS =
  ".gj-root{--bg:#f6f6f5;--ink:#141414;--mute:#666666;--soft:#bdbdbd;--card:#ffffff;--line:#e3e3e1;--foot:#efefee;--red:#5145b9;--blue:#5145b9;--mint:#a6e8c1;--purple:#736ac8;--lime:#e6fa6a;--orange:#5145b9;--sun:#ffda03;" +
  "position:relative;width:100%;overflow:clip;background:var(--bg);color:var(--ink);font-family:'Instrument Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:400;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;letter-spacing:-.01em;line-height:1.4;transition:background-color .4s ease,color .4s ease}" +
  ".dark .gj-root,.gj-root.gj-dark{--bg:#0f0f10;--ink:#f1f1ef;--mute:#a3a3a0;--soft:#4a4a4c;--card:#19191b;--line:#2b2b2d;--foot:#151517;--red:#aba6de;--blue:#6c60d8;--orange:#5145b9}" +
  ".gj-root *,.gj-root *::before,.gj-root *::after{box-sizing:border-box}" +
  ".gj-root :focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:8px}" +
  ".gj-root img{max-width:none}" +
  ".gj-root :where(img){display:block;user-select:none;-webkit-user-drag:none}" +
  ".gj-root :where(a){color:inherit;text-decoration:none}" +
  ".gj-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}" +
  ".gj-root :where(h1,h2,h3,h4,p,ul,figure){margin:0;padding:0}" +
  ".gj-root :where(ul){list-style:none}" +
  ".gj-wrap{width:100%;max-width:1440px;margin:0 auto;padding:0 clamp(20px,7.1vw,102px)}" +
  // nav
  ".gj-nav{position:sticky;top:0;z-index:40;height:110px;margin-bottom:-110px;display:flex;align-items:center;gap:24px;padding:30px clamp(20px,5.6vw,80px) 0;pointer-events:none}" +
  ".gj-nav>*{pointer-events:auto}" +
  ".gj-nav::before{content:'';position:absolute;left:0;right:0;top:0;bottom:12px;z-index:-1;background:rgba(246,246,245,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line);opacity:0;transition:opacity .35s ease}" +
  ".dark .gj-nav::before,.gj-dark .gj-nav::before{background:rgba(15,15,16,.8)}" +
  ".gj-nav.gj-solid::before{opacity:1}" +
  ".gj-brand{display:inline-flex;align-items:center;margin-right:auto}" +
  ".gj-brand-svg{height:24px;width:auto;display:block}" +
  ".gj-links{display:flex;align-items:center;gap:clamp(18px,2.4vw,34px);font-size:13px;font-weight:500}" +
  ".gj-link{position:relative;display:inline-flex;align-items:center;gap:6px;padding:4px 0}" +
  ".gj-link::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s " + EASE + "}" +
  ".gj-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--blue);box-shadow:inset 0 0 0 2px var(--blue),inset 0 0 0 3px var(--bg)}" +
  ".gj-tools{display:flex;gap:8px;margin-left:clamp(12px,3vw,48px)}" +
  ".gj-round{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--card);box-shadow:0 1px 0 var(--line);transition:transform .3s " + EASE + "}" +
  // shared type
  ".gj-h1{font-size:clamp(38px,5.6vw,80px);line-height:1.05;letter-spacing:-.045em;font-weight:500;text-align:center}" +
  ".gj-h2{font-size:clamp(34px,4.6vw,66px);line-height:1.06;letter-spacing:-.04em;font-weight:500}" +
  ".gj-h2.gj-big{font-size:clamp(36px,4.85vw,70px)}" +
  ".gj-h2.gj-mid{font-size:clamp(28px,3vw,44px)}" +
  ".gj-h3{font-size:clamp(26px,2.65vw,38px);line-height:1.1;letter-spacing:-.035em;font-weight:500}" +
  ".gj-h4{font-size:17px;line-height:1.25;letter-spacing:-.02em;font-weight:600}" +
  ".gj-center{text-align:center}" +
  ".gj-eyebrow{font-size:10px;letter-spacing:.32em;font-weight:600;text-transform:uppercase;margin-bottom:16px}" +
  ".gj-body{font-size:13px;line-height:1.7}" +
  ".gj-small{font-size:12.5px;line-height:1.6;color:var(--mute)}" +
  ".gj-red{color:var(--red)}" +
  ".gj-grey{color:var(--mute)}" +
  ".gj-bluew{color:var(--blue)}" +
  ".gj-purplew{color:var(--purple)}" +
  ".gj-orangew{color:var(--orange)}" +
  // word reveal
  ".gj-w{display:inline-block;opacity:0;filter:blur(6px);transform:translate3d(0,.22em,0);transition:opacity .45s " + EASE + ",filter .45s " + EASE + ",transform .45s " + EASE + ";transition-delay:calc(var(--i) * 35ms)}" +
  ".gj-in .gj-w{opacity:1;filter:blur(0);transform:none}" +
  ".gj-late{opacity:0;transform:translate3d(0,14px,0);transition:opacity .7s " + EASE + " .55s,transform .7s " + EASE + " .55s}" +
  ".gj-in .gj-late,.gj-in.gj-late{opacity:1;transform:none}" +
  ".gj-fade{opacity:0;transform:translate3d(0,14px,0);transition:opacity .8s " + EASE + " var(--d),transform .8s " + EASE + " var(--d)}" +
  ".gj-in .gj-fade{opacity:1;transform:none}" +
  // buttons, tags
  ".gj-btns{display:flex;align-items:center;gap:22px}" +
  ".gj-btn{display:inline-flex;align-items:center;height:40px;padding:0 22px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:12px;font-weight:500;white-space:nowrap;transition:transform .35s " + EASE + ",box-shadow .35s " + EASE + "}" +
  ".gj-btn-w{background:#fff;color:#141414}" +
  ".gj-ghost,.gj-textlink{font-size:12px;font-weight:500;position:relative}" +
  ".gj-ghost::after,.gj-textlink::after{content:'';position:absolute;left:0;right:0;bottom:-3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s " + EASE + "}" +
  ".gj-tag{position:absolute;z-index:30;display:inline-flex;align-items:center;height:30px;padding:0 13px;border-radius:999px;font-size:13px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;opacity:0;transform:translate3d(0,8px,0) scale(.6) rotate(var(--r,0deg));transition:opacity .45s " + EASE + ",transform .6s cubic-bezier(.34,1.56,.64,1);pointer-events:none}" +
  ".gj-tag::after{content:'';position:absolute;left:50%;bottom:-5px;width:10px;height:10px;margin-left:-5px;background:inherit;transform:rotate(45deg);border-radius:2px;z-index:-1}" +
  ".gj-blue{background:#5145b9;color:#fff}" +
  ".gj-mint{background:#a6e8c1;color:#0f5b38}" +
  ".gj-redtag{background:#ffda03;color:#141414}" +
  ".gj-ink{background:#141414;color:#fff}" +
  ".gj-orange{background:#5145b9;color:#fff}" +
  ".gj-pop.gj-tag{position:absolute}" +
  ".gj-in .gj-pop,.gj-tags1 .gj-t1,.gj-tags1 .gj-t2,.gj-tags2 .gj-t3,.gj-tags2 .gj-t4{opacity:1;transform:translate3d(0,0,0) scale(1) rotate(var(--r,0deg))}" +
  // pinned stages
  ".gj-stage{position:relative}" +
  ".gj-pin{position:sticky;top:0;overflow-x:clip;overflow-y:visible;min-height:520px}" +
  ".gj-deck{position:absolute;inset:0;pointer-events:none}" +
  ".gj-card{position:absolute;left:0;top:0;border-radius:16px;overflow:hidden;background:var(--card);box-shadow:0 30px 54px -26px rgba(18,17,24,.46),0 0 0 1px rgba(18,17,24,.06);will-change:transform;backface-visibility:hidden;opacity:0}" +
  ".gj-ready .gj-card{opacity:1}" +
  ".gj-card img{width:100%;height:100%;object-fit:cover}" +
  ".gj-shot{object-position:50% 8%!important}" +
  ".gj-portrait{object-position:50% 18%!important}" +
  ".gj-c1{width:260px;height:282px}" +
  ".gj-s1{padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:10px}" +
  ".gj-s1-coral{background:linear-gradient(150deg,#f97316,#d94616);color:#fff}" +
  ".gj-s1-sky{background:radial-gradient(circle at 55% 32%,#60a5fa,#1d6fe8);color:#fff}" +
  ".gj-s1-sunburst{background:radial-gradient(circle at 55% 32%,#ffec94,#f8be24);color:#141414}" +
  ".gj-s1-rose{background:radial-gradient(circle at 55% 32%,#ff9bb0,#da4d6e);color:#fff}" +
  ".gj-s1-dark{background:radial-gradient(circle at 80% 18%,rgba(255,218,3,.14),transparent 54%),#17171b;color:#fff;border:1px solid rgba(255,255,255,.1)}" +
  ".gj-s1-teal{background:linear-gradient(150deg,#0fa39d,#06767d);color:#fff}" +
  ".gj-s1-mint{background:radial-gradient(circle at 55% 34%,#c6f6db,#6fd49c);color:#0f3923}" +
  ".gj-s1-app{background:radial-gradient(circle at 82% 16%,rgba(167,159,248,.38),transparent 52%),linear-gradient(160deg,#5b4fd1 0%,#3a3286 100%);color:#fff;padding:12px 12px 0;display:flex;flex-direction:column;justify-content:space-between;gap:8px}" +
  ".gj-s1-cut{position:absolute!important;left:45%;bottom:0;transform:translateX(-50%);width:86%!important;height:82%!important;object-fit:contain!important;object-position:50% 100%!important;filter:drop-shadow(0 12px 24px rgba(0,0,0,.22))}" +
  ".gj-s1-mcut{position:absolute!important;left:50%;bottom:10px;transform:translateX(-50%);width:88%!important;height:78%!important;object-fit:contain!important;object-position:50% 50%!important;filter:drop-shadow(0 14px 26px rgba(100,14,38,.28))}" +
  ".gj-s1-phead{position:relative;z-index:2;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:4px}" +
  ".gj-s1-phead small{font-size:10px;font-weight:600;opacity:.88}" +
  ".gj-s1-pdark small{color:#171333;opacity:.86}" +
  ".gj-s1-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}" +
  ".gj-s1-ico{width:38px!important;height:38px!important;object-fit:contain!important;flex:none}" +
  ".gj-s1-pill{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}" +
  ".gj-s1-pill-ink{background:#141414;color:#fff;text-transform:none;letter-spacing:-.01em}" +
  ".gj-s1-pill-indigo{background:rgba(255,255,255,.95);color:#3a3286;text-transform:none;letter-spacing:-.01em}" +
  ".gj-s1-pill-gold{background:#ffda03;color:#141414;text-transform:none;letter-spacing:-.01em}" +
  ".gj-s1-copy{display:flex;flex-direction:column;gap:4px}" +
  ".gj-s1-copy b{font-size:18px;font-weight:600;letter-spacing:-.025em;line-height:1.12}" +
  ".gj-s1-copy-sm b{font-size:15.5px}" +
  ".gj-s1-copy small{font-size:10.5px;color:rgba(255,255,255,.84);line-height:1.3}" +
  ".gj-s1-copydark small{color:rgba(15,57,35,.82)}" +
  ".gj-s1-heroico{width:84px;height:84px;border-radius:20px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.24);display:grid;place-items:center}" +
  ".gj-s1-heroico.is-mint{background:rgba(255,255,255,.48);border-color:rgba(15,57,35,.12)}" +
  ".gj-s1-bigico{width:58px!important;height:58px!important;object-fit:contain!important}" +
  ".gj-s1-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
  ".gj-s1-tile{height:54px;border-radius:12px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.22);display:grid;place-items:center}" +
  ".gj-s1-timg{width:34px!important;height:34px!important;object-fit:contain!important}" +
  ".gj-s1-foot{display:flex;flex-direction:column;gap:6px}" +
  ".gj-s1-foot span{font-size:11px;font-weight:500;color:rgba(255,255,255,.88)}" +
  ".gj-s1-bar{height:6px;border-radius:999px;background:rgba(255,255,255,.24);overflow:hidden}" +
  ".gj-s1-bar i{display:block;height:100%;border-radius:999px;background:#ffda03}" +
  ".gj-s1-chips{display:flex;flex-direction:column;gap:6px}" +
  ".gj-s1-chips span{font-size:11px;font-weight:600;padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.08);color:#fff}" +
  ".gj-s1-apphead{display:flex;align-items:center;justify-content:space-between;gap:6px}" +
  ".gj-s1-phone{flex:1;min-height:0;border-radius:20px 20px 0 0;border:4px solid #161523;border-bottom:0;background:#fff;overflow:hidden;box-shadow:0 16px 32px -12px rgba(0,0,0,.45)}" +
  ".gj-s1-screen{width:100%!important;height:100%!important;object-fit:cover!important;object-position:50% 0%!important;display:block}" +
  ".gj-c2{width:230px;height:230px;border-radius:14px}" +
  ".gj-hero{position:absolute;left:0;right:0;top:clamp(120px,20.5vh,180px);display:flex;flex-direction:column;align-items:center;z-index:2;will-change:transform}" +
  ".gj-hero-foot{position:absolute;top:calc(80vh - clamp(120px,20.5vh,180px));left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center;padding:0 20px}" +
  ".gj-hero-foot p{font-size:13px;color:var(--ink)!important;max-width:460px}" +
  ".gj-t1{left:calc(50% - clamp(160px,25vw,360px));top:calc(clamp(120px,20.5vh,180px) + clamp(118px,16.5vh,152px));--r:-6deg}" +
  ".gj-t2{left:calc(50% + clamp(120px,24vw,350px));top:calc(clamp(120px,20.5vh,180px) + clamp(120px,17vh,160px));--r:8deg}" +
  ".gj-show{position:absolute;left:clamp(20px,7.1vw,102px);top:clamp(96px,13vh,112px);max-width:min(620px,92vw);z-index:2;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .35s ease,visibility 0s linear .35s}" +
  ".gj-show.gj-in{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .35s ease,visibility 0s}" +
  ".gj-show .gj-btns{margin-top:clamp(22px,8vh,80px)}" +
  ".gj-wrapp{max-width:320px;margin-top:22px}" +
  ".gj-t3{left:calc(47% - 100px);top:calc(53% - 40px);--r:-4deg}" +
  ".gj-t4{left:calc(78%);top:58%;--r:5deg}" +
  ".gj-updown{position:absolute;right:clamp(20px,6.2vw,90px);top:48%;display:flex;flex-direction:column;gap:6px;color:var(--mute);z-index:2}" +
  // gateway
  ".gj-sec{position:relative}" +
  ".gj-gate{position:relative;padding:clamp(110px,15vh,150px) 0 0}" +
  ".gj-gate-head{position:relative;margin-bottom:28px}" +
  ".gj-t5{right:9%;bottom:6px;--r:9deg}" +
  ".gj-banner{position:relative;height:clamp(300px,36vw,520px);border-radius:16px;overflow:hidden;background:#3a3286;opacity:0;transform:translate3d(0,40px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".gj-banner.gj-in{opacity:1;transform:none}" +
  ".gj-banner img,.gj-banner-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;opacity:0;transform:scale(1.04);transition:opacity .8s ease,transform 1.4s " + EASE + "}" +
  ".gj-banner img.on,.gj-banner-vid{opacity:1;transform:none}" +
  ".gj-banner-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,17,17,.12) 0%,rgba(17,17,17,.08) 45%,rgba(17,17,17,.65) 100%);pointer-events:none}" +
  ".gj-switch{position:absolute;left:24px;top:24px;display:flex;flex-direction:column;gap:6px;z-index:2}" +
  ".gj-switch i{width:34px;height:34px;border-radius:10px;background:#fff}" +
  ".gj-switch i+i{background:#5145b9}" +
  ".gj-slide-meta{position:absolute;left:24px;bottom:64px;z-index:2;color:#fff;display:flex;flex-direction:column;gap:2px}" +
  ".gj-slide-meta b{font-size:15px;font-weight:600;letter-spacing:-.01em}" +
  ".gj-slide-meta small{font-size:12px;color:rgba(255,255,255,.8)}" +
  ".gj-more{position:absolute;right:22px;top:16px;color:#fff;opacity:.8;z-index:2}" +
  ".gj-watch{position:absolute;left:24px;bottom:22px;z-index:2;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 16px;border-radius:999px;background:#fff;color:#141414;font-size:12.5px;font-weight:500}" +
  ".gj-watch.is-empty{background:rgba(255,255,255,.14);color:rgba(255,255,255,.86);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.22);cursor:default}" +
  ".gj-dq-stage{position:absolute;inset:0;display:flex;align-items:center;padding:44px 80px 98px 86px;background:#0e1118;color:#fff}" +
  ".gj-dq-bg{object-position:62% 50%!important;opacity:1!important;transform:none!important}" +
  ".gj-dq-copy{display:flex;flex-direction:column;align-items:flex-start;gap:10px;position:relative;z-index:2;max-width:440px}" +
  ".gj-dq-pill{display:inline-flex;align-items:center;gap:7px;height:24px;padding:0 11px;border-radius:999px;background:rgba(245,184,46,.14);border:1px solid rgba(245,184,46,.34);color:#ffe570;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}" +
  ".gj-dq-pill i{width:6px;height:6px;border-radius:50%;background:#ffe570}" +
  ".gj-dq-copy h3{font-size:clamp(22px,2.5vw,34px);line-height:1.08;letter-spacing:-.03em;font-weight:600}" +
  ".gj-dq-copy p{font-size:clamp(12px,1.05vw,14px);line-height:1.5;color:rgba(255,255,255,.78)}" +
  ".gj-dq-btn{margin-top:4px;display:inline-flex;align-items:center;height:36px;padding:0 16px;border-radius:999px;background:#f8be24;color:#141414;font-size:12px;font-weight:600;transition:transform .25s " + EASE + "}" +
  ".gj-dq-btn:hover{transform:translate3d(0,-2px,0)}" +
  ".gj-arrows{position:absolute;right:22px;bottom:20px;z-index:2;display:flex;gap:6px}" +
  ".gj-arrows button{width:36px;height:36px;border-radius:50%;background:#fff;color:#141414;display:grid;place-items:center;transition:transform .3s " + EASE + "}" +
  // trusted
  ".gj-trust{padding:clamp(80px,13vh,130px) 0 clamp(40px,7vh,70px)}" +
  ".gj-trust-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}" +
  ".gj-trust-head .gj-small{margin-top:10px}" +
  ".gj-mini-arrows{display:flex;gap:12px;color:var(--mute)}" +
  ".gj-mini-arrows button:disabled{opacity:.3;cursor:default}" +
  ".gj-logos{margin-top:clamp(36px,6vh,60px);overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}" +
  ".gj-logos-track{display:flex;width:max-content;animation:gj-marq 28s linear infinite}" +
  ".gj-logo-item{display:inline-flex;align-items:center;gap:8px;padding:0 clamp(28px,3.4vw,50px);font-size:clamp(17px,1.6vw,23px);font-weight:600;letter-spacing:-.02em;color:var(--mute);opacity:.8;white-space:nowrap}" +
  "@keyframes gj-marq{to{transform:translate3d(-50%,0,0)}}" +
  // whether
  ".gj-whether{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px;z-index:1}" +
  ".gj-ink-text{font-size:clamp(26px,3.9vw,56px);line-height:1.2;letter-spacing:-.04em;font-weight:500;text-align:center;max-width:1240px;margin-top:16vh}" +
  ".gj-sw{opacity:.18;transition:opacity .15s linear}" +
  ".gj-mintw{color:#5145b9}" +
  ".dark .gj-mintw,.gj-dark .gj-mintw{color:#aba6de}" +
  ".gj-chip{display:inline-block;vertical-align:-.12em;width:.85em;height:.85em;border-radius:.2em;overflow:hidden}" +
  ".gj-chip img{width:100%;height:100%;object-fit:cover}" +
  ".gj-iconrow{display:flex;gap:10px;margin-top:5vh;color:var(--ink)}" +
  ".gj-iconrow svg{width:22px;height:22px;padding:4px;border-radius:6px;background:var(--card)}" +
  ".gj-t6{left:14%;top:37%;--r:-5deg;opacity:1;transform:rotate(var(--r))}" +
  ".gj-t7{left:80%;top:38%;--r:7deg;opacity:1;transform:rotate(var(--r))}" +
  ".gj-t8{left:62%;top:44%;--r:-6deg}" +
  ".gj-doodled .gj-t8{opacity:0}" +
  ".gj-pin:not(.gj-doodled) .gj-t8{opacity:0}" +
  ".gj-info{width:230px;height:280px;padding:22px 20px;display:flex;flex-direction:column;gap:6px;background:var(--card);color:var(--ink)}" +
  ".gj-info b{font-size:15px;line-height:1.15;font-weight:600;letter-spacing:-.02em;padding-right:26px}" +
  ".gj-info small{font-size:10px;color:var(--mute)}" +
  ".gj-info p{margin-top:auto;font-size:11.5px;line-height:1.5;color:var(--mute);padding-right:42px}" +
  ".gj-info-dot{position:absolute;right:18px;top:18px;width:22px;height:22px;border-radius:50%;background:var(--blue);box-shadow:inset 0 0 0 6px var(--blue),inset 0 0 0 8px var(--card)}" +
  // stage 2 folder cards (230x230 bespoke cards)
  ".gj-s2{padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:10px}" +
  ".gj-s2-purple{background:linear-gradient(145deg,#5145b9,#3a3286);color:#fff}" +
  ".gj-s2-rose{background:linear-gradient(145deg,#fb5a7c,#dc3055);color:#fff}" +
  ".gj-s2-sky{background:linear-gradient(145deg,#38bdf8,#1d6fe8);color:#fff}" +
  ".gj-s2-teal{background:linear-gradient(145deg,#009e97,#007d8a);color:#fff}" +
  ".gj-s2-dark{background:radial-gradient(circle at 80% 18%,rgba(255,218,3,.14),transparent 54%),#17171b;color:#fff;border:1px solid rgba(255,255,255,.1)}" +
  ".gj-s2-gold{background:linear-gradient(145deg,#ffda03,#f2b800);color:#141414}" +
  ".gj-s2-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}" +
  ".gj-s2-ico{width:42px!important;height:42px!important;object-fit:contain!important;flex:none}" +
  ".gj-s2-pill{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;background:rgba(255,255,255,.18);color:inherit;font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}" +
  ".gj-s2-pill-gold{background:#ffda03;color:#141414}" +
  ".gj-s2-pill-ink{background:#141414;color:#fff}" +
  ".gj-s2-copy{display:flex;flex-direction:column;gap:2px}" +
  ".gj-s2-copy b{font-size:15px;line-height:1.15;font-weight:600;letter-spacing:-.02em}" +
  ".gj-s2-copy small{font-size:10.5px;line-height:1.35;opacity:.84}" +
  ".gj-s2-foot{display:flex;flex-direction:column;gap:5px}" +
  ".gj-s2-foot span{font-size:9.5px;font-weight:500;opacity:.88}" +
  ".gj-s2-bar{height:5px;width:100%;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden}" +
  ".gj-s2-bar i{display:block;height:100%;border-radius:999px;background:#ffda03}" +
  ".gj-s2-wave{display:flex;align-items:flex-end;gap:4px;height:24px;max-width:140px}" +
  ".gj-s2-wave i{flex:1;border-radius:999px;background:rgba(255,255,255,.92)}" +
  ".gj-s2-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:108px}" +
  ".gj-s2-tile{width:50px;height:50px;border-radius:10px;background:rgba(255,255,255,.18);display:grid;place-items:center;padding:6px}" +
  ".gj-s2-tile img{width:100%!important;height:100%!important;object-fit:contain!important}" +
  ".gj-s2-phonebox{height:106px;border-radius:12px;border:3px solid #161523;background:#fff;overflow:hidden;box-shadow:0 12px 24px -10px rgba(0,0,0,.35)}" +
  ".gj-s2-phonebox img{width:100%!important;height:100%!important;object-fit:cover!important;object-position:50% 8%!important}" +
  ".gj-s2-blist{display:flex;flex-direction:column;gap:5px;max-width:145px}" +
  ".gj-s2-blist span{height:24px;padding:0 9px;border-radius:7px;display:flex;align-items:center;font-size:9.5px;font-weight:600;background:rgba(255,255,255,.1);color:rgba(255,255,255,.88);white-space:nowrap}" +
  ".gj-s2-blist span.on{background:#009e97;color:#fff}" +
  ".gj-s2-ver{display:inline-flex;align-items:center;padding:4px 8px;border-radius:8px;background:rgba(20,20,20,.1);font-size:9.5px;font-weight:600}" +
  ".gj-folder{position:absolute;opacity:0;border-radius:16px;z-index:0;background:var(--card);box-shadow:0 30px 60px -40px rgba(0,0,0,.35)}" +
  ".gj-folder-tab{position:absolute;left:0;top:0;right:0;height:56px;display:flex;justify-content:space-between;align-items:center;padding:0 16px 0 22px;font-size:clamp(14px,1.35vw,19px);font-weight:500;color:var(--ink)}" +
  ".gj-folder-tab b{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:var(--card);font-size:10px;font-weight:500}" +
  ".gj-folder-bar{position:absolute;left:0;right:0;top:58px;height:64px;background:#5145b9;color:#fff;border-radius:14px 14px 0 0;clip-path:polygon(0 0,62% 0,68% 42%,100% 42%,100% 100%,0 100%);padding:16px 22px;font-size:clamp(14px,1.35vw,19px);font-weight:500}" +
  ".gj-vision{position:absolute;left:clamp(20px,7.1vw,102px);top:clamp(140px,19vh,170px);max-width:min(560px,88vw);z-index:2;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .35s ease,visibility 0s linear .35s}" +
  ".gj-vision.gj-in{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .35s ease,visibility 0s}" +
  ".gj-eye{display:inline-grid;place-items:center;margin-bottom:12px;color:var(--blue)}" +
  ".gj-wrapv{margin-top:12px;max-width:340px}" +
  ".gj-textlink{display:inline-block;margin-top:22px}" +
  ".gj-doodles{position:absolute;left:clamp(30px,6vw,90px);top:62%;width:min(420px,60vw);height:30%;z-index:1}" +
  ".gj-doodle{position:absolute;color:var(--ink);opacity:0;transform:scale(.3) rotate(-30deg);transition:opacity .5s " + EASE + ",transform .7s cubic-bezier(.34,1.56,.64,1);transition-delay:calc(var(--i) * 60ms)}" +
  ".gj-doodled .gj-doodle{opacity:1;transform:none}" +
  ".gj-doodle:nth-child(1){left:20%;top:0}.gj-doodle:nth-child(2){left:0;top:38%}.gj-doodle:nth-child(3){left:17%;top:36%}.gj-doodle:nth-child(4){left:36%;top:42%}.gj-doodle:nth-child(5){left:61%;top:40%}" +
  ".gj-doodle:nth-child(6){left:4%;top:76%}.gj-doodle:nth-child(7){left:22%;top:78%}.gj-doodle:nth-child(8){left:44%;top:80%}.gj-doodle:nth-child(9){left:66%;top:6%}" +
  // bands
  ".gj-bands{position:relative;padding:clamp(60px,10vh,110px) 0;overflow:hidden}" +
  ".gj-band{display:flex;gap:clamp(14px,2.2vw,32px);width:max-content;will-change:transform}" +
  ".gj-av{width:clamp(56px,6.1vw,88px);height:clamp(56px,6.1vw,88px);border-radius:14px;overflow:hidden;flex:none;transform:translate3d(0,var(--y),0);box-shadow:0 10px 24px -14px rgba(0,0,0,.4)}" +
  ".gj-av img{width:100%;height:100%;object-fit:cover}" +
  ".gj-av-icon{padding:10px}" +
  ".gj-av-icon img{object-fit:contain}" +
  ".gj-av-portrait img{object-position:50% 18%}" +
  ".gj-bands-mid{display:flex;flex-direction:column;align-items:center;gap:14px;padding:clamp(60px,9vh,100px) 20px}" +
  ".gj-bands-mid .gj-small{max-width:340px}" +
  ".gj-spark{color:var(--blue)}" +
  // story / bento
  ".gj-story{padding:clamp(60px,9vh,100px) 0}" +
  ".gj-center-head{display:flex;flex-direction:column;align-items:center;margin-bottom:clamp(40px,8vh,90px)}" +
  ".gj-bento{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1116px;margin:0 auto}" +
  ".gj-col{display:flex;flex-direction:column;gap:16px}" +
  ".gj-col-r{padding-top:clamp(0px,6vw,85px)}" +
  ".gj-bcard{position:relative;border-radius:16px;background:var(--card);padding:22px;display:flex;flex-direction:column;gap:8px;opacity:0;transform:translate3d(0,50px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".gj-bcard.gj-in{opacity:1;transform:none}" +
  ".gj-bcard .gj-chipbtn{align-self:flex-start;margin-top:6px;height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--line);display:inline-flex;align-items:center;font-size:11px;font-weight:500}" +
  ".gj-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:500;color:var(--blue)}" +
  ".gj-b1 .gj-pile{position:relative;height:clamp(220px,22vw,300px);margin:6px 0 10px}" +
  ".gj-pile .gj-pcard{position:absolute;left:50%;top:50%;width:clamp(142px,14vw,196px);height:clamp(142px,14vw,196px);border-radius:14px;padding:13px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;box-shadow:0 20px 34px -20px rgba(0,0,0,.45);transition:transform .7s " + EASE + "}" +
  ".gj-pile .gj-pcard:nth-child(1){transform:translate(-66%,-46%) rotate(-12deg);z-index:1}" +
  ".gj-pile .gj-pcard:nth-child(2){transform:translate(-50%,-52%) rotate(-3deg);z-index:2}" +
  ".gj-pile .gj-pcard:nth-child(3){transform:translate(-34%,-56%) rotate(8deg);z-index:3}" +
  ".gj-pc1{background:#f5f4fd;color:#121118;border:1px solid rgba(81,69,185,.16)}" +
  ".gj-pc2{background:linear-gradient(150deg,#3a3286,#5145b9);color:#fff}" +
  ".gj-pc3{background:#171525;color:#fff;border:1px solid rgba(255,255,255,.1)}" +
  ".gj-pc-top{display:flex;align-items:center;justify-content:space-between;gap:6px}" +
  ".gj-pc-ico{width:26px;height:26px;object-fit:contain;flex:none}" +
  ".gj-pc-pill{font-size:8.5px;font-weight:700;letter-spacing:.08em;padding:3px 7px;border-radius:999px;background:rgba(81,69,185,.12);color:#5145b9}" +
  ".gj-pc-pill-w{background:rgba(255,255,255,.18);color:#fff}" +
  ".gj-pc-pill-y{background:rgba(255,218,3,.16);color:#ffda03}" +
  ".gj-pc-mid{display:flex;flex-direction:column;gap:2px}" +
  ".gj-pc-mid strong{font-size:clamp(14px,1.25vw,18px);font-weight:600;letter-spacing:-.02em;line-height:1.1}" +
  ".gj-pc-mid span{font-size:10px;opacity:.76;line-height:1.25}" +
  ".gj-pc-bar{height:5px;border-radius:999px;background:rgba(81,69,185,.16);overflow:hidden;margin-bottom:5px}" +
  ".gj-pc-bar i{display:block;height:100%;border-radius:999px;background:#5145b9}" +
  ".gj-pc-meta{display:block;font-size:9.5px;font-weight:500;color:#5145b9}" +
  ".gj-pc-chips{display:flex;gap:5px}" +
  ".gj-pc-chips span{flex:1;text-align:center;font-size:9.5px;font-weight:600;padding:4px 6px;border-radius:7px;background:rgba(255,255,255,.16);color:#fff}" +
  ".gj-pc-bars{display:flex;align-items:flex-end;gap:4px;height:22px}" +
  ".gj-pc-bars i{flex:1;border-radius:999px;background:#ffda03}" +
  ".gj-pc-bars i:nth-child(even){background:#a39cf4}" +
  ".gj-t9{left:62%;top:8%;--r:6deg;z-index:4}" +
  ".gj-b1.gj-in .gj-t9{opacity:1;transform:rotate(var(--r));transition-delay:.5s}" +
  ".gj-photo{position:relative;aspect-ratio:16/10;margin:-22px -22px 10px;border-radius:16px;overflow:hidden}" +
  ".gj-photo>img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s " + EASE + "}" +
  ".gj-ibadahph{background:radial-gradient(circle at 82% 18%,rgba(167,159,248,.34),transparent 54%),linear-gradient(150deg,#3a3286,#5145b9);padding:16px;display:flex;align-items:center;justify-content:center}" +
  ".gj-ib-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%}" +
  ".gj-ib-item{border-radius:12px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);padding:10px 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center}" +
  ".gj-ib-item img{width:34px;height:34px;object-fit:contain}" +
  ".gj-ib-item span{font-size:10px;font-weight:600;color:#fff;line-height:1.15}" +
  ".gj-ph-badge{position:absolute;left:12px;bottom:12px;display:flex;flex-direction:column;gap:2px;padding:7px 11px;border-radius:10px;background:rgba(18,17,24,.82);backdrop-filter:blur(8px);color:#fff;pointer-events:none}" +
  ".gj-ph-badge strong{font-size:11px;font-weight:600}" +
  ".gj-ph-badge span{font-size:9.5px;color:rgba(255,255,255,.82)}" +
  ".gj-qu-card{position:absolute;right:12px;top:12px;width:clamp(146px,15vw,186px);padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.95);color:#121118;box-shadow:0 14px 28px -16px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:5px;pointer-events:none}" +
  ".gj-qu-top{display:flex;align-items:center;justify-content:space-between;gap:6px}" +
  ".gj-qu-top img{width:20px;height:20px;object-fit:contain}" +
  ".gj-qu-top span{font-size:8.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 6px;border-radius:999px;background:#e8f8ef;color:#0f6d3f}" +
  ".gj-qu-card strong{font-size:11.5px;font-weight:600;line-height:1.2}" +
  ".gj-qu-bar{height:5px;border-radius:999px;background:#ebe9f7;overflow:hidden}" +
  ".gj-qu-bar i{display:block;height:100%;border-radius:999px;background:#5145b9}" +
  ".gj-qu-card small{font-size:9px;color:#4a4858;line-height:1.25}" +
  ".gj-phone-wrap{min-height:clamp(330px,34vw,470px);align-items:center;justify-content:center;background:transparent}" +
  ".gj-pen{position:absolute;right:16px;top:16px;width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--bg);display:grid;place-items:center}" +
  ".gj-phone{width:clamp(224px,21vw,284px);aspect-ratio:3/4;border-radius:24px;background:#14131d;color:#fff;border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;justify-content:space-between;gap:8px;padding:15px;box-shadow:0 30px 60px -30px rgba(0,0,0,.65)}" +
  ".gj-ph-status{display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:rgba(255,255,255,.72);padding:0 2px}" +
  ".gj-ph-hero{border-radius:14px;background:linear-gradient(145deg,#3a3286,#5145b9);padding:12px;display:flex;flex-direction:column;gap:5px}" +
  ".gj-ph-hero small{font-size:8.5px;font-weight:600;color:rgba(255,255,255,.78);letter-spacing:.1em;text-transform:uppercase}" +
  ".gj-ph-hero b{font-size:clamp(15px,1.35vw,18px);font-weight:600;letter-spacing:-.02em;color:#ffda03;line-height:1.15}" +
  ".gj-ph-pills{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}" +
  ".gj-ph-pills span{font-size:9px;font-weight:500;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,.16);color:#fff}" +
  ".gj-ph-qulib{border-radius:13px;background:#1e1c2b;border:1px solid rgba(255,255,255,.08);padding:10px;display:flex;align-items:center;gap:10px}" +
  ".gj-ph-qulib img{width:34px;height:34px;object-fit:contain;flex:none}" +
  ".gj-ph-qulib strong{display:block;font-size:11.5px;font-weight:600;color:#fff;line-height:1.2}" +
  ".gj-ph-qulib span{display:block;font-size:9.5px;color:rgba(255,255,255,.72);line-height:1.25;margin-top:2px}" +
  ".gj-ph-foot{text-align:center;display:flex;flex-direction:column;gap:2px;padding-bottom:2px}" +
  ".gj-ph-foot em{font-style:normal;font-size:11px;font-weight:500;color:rgba(255,255,255,.86)}" +
  ".gj-ph-foot small{font-size:8.5px;color:rgba(255,255,255,.58);letter-spacing:.08em;text-transform:uppercase}" +
  // dedicated QuPeduli sub-brand section
  ".gj-qupeduli{padding:clamp(60px,10vh,110px) 0}" +
  ".gj-qup-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:32px;flex-wrap:wrap}" +
  ".gj-qup-sub{max-width:380px}" +
  ".gj-qup-grid{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:18px;align-items:stretch}" +
  ".gj-qup-hero{position:relative;border-radius:16px;padding:26px;background:radial-gradient(circle at 75% 24%,#ffec94,#f8be24);color:#141414;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;gap:10px;min-height:330px;opacity:0;transform:translate3d(0,40px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".gj-qup-hero.gj-in{opacity:1;transform:none}" +
  ".gj-qup-pill{height:22px;padding:0 10px;border-radius:999px;background:#141414;color:#fff;font-size:10px;font-weight:600;display:inline-flex;align-items:center}" +
  ".gj-qup-hero h3{font-size:clamp(22px,2.2vw,30px);font-weight:600;letter-spacing:-.03em;line-height:1.12;max-width:65%}" +
  ".gj-qup-hero p{font-size:12px;line-height:1.45;color:rgba(20,20,20,.78);max-width:60%}" +
  ".gj-qup-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;position:relative;z-index:2}" +
  ".gj-qup-chips span{font-size:10px;font-weight:600;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.55);color:#141414}" +
  ".gj-qup-hero .gj-btn{margin-top:auto;position:relative;z-index:2;background:#141414;color:#fff}" +
  ".gj-qup-donor{position:absolute;right:-6px;bottom:0;height:88%;width:auto;max-width:52%;object-fit:contain;object-position:100% 100%;pointer-events:none;filter:drop-shadow(0 16px 28px rgba(0,0,0,.22))}" +
  ".gj-qup-list{display:flex;flex-direction:column;gap:12px;opacity:0;transform:translate3d(0,40px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".gj-qup-list.gj-in{opacity:1;transform:none}" +
  ".gj-qup-item{flex:1;display:flex;align-items:center;gap:14px;padding:14px;border-radius:14px;background:var(--card);border:1px solid var(--line);transition:transform .3s " + EASE + "}" +
  ".gj-qup-thumb{width:76px;height:76px;border-radius:10px;overflow:hidden;flex:none;background:var(--bg)}" +
  ".gj-qup-thumb img{width:100%;height:100%;object-fit:cover;display:block}" +
  ".gj-qup-thumb.is-icon{padding:14px;background:#f2f1fa}" +
  ".dark .gj-qup-thumb.is-icon,.gj-dark .gj-qup-thumb.is-icon{background:#221f3a}" +
  ".gj-qup-thumb.is-icon img{object-fit:contain}" +
  ".gj-qup-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}" +
  ".gj-qup-meta{display:flex;align-items:center;justify-content:space-between;gap:8px}" +
  ".gj-qup-meta span{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--blue)}" +
  ".dark .gj-qup-meta span,.gj-dark .gj-qup-meta span{color:#aba6de}" +
  ".gj-qup-meta small{font-size:10px;color:var(--mute)}" +
  ".gj-qup-body h4{font-size:13.5px;font-weight:600;line-height:1.25;letter-spacing:-.01em}" +
  ".gj-qup-bar{height:5px;border-radius:999px;background:var(--line);overflow:hidden}" +
  ".gj-qup-bar i{display:block;height:100%;border-radius:999px;background:#5145b9}" +
  ".gj-qup-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:var(--mute)}" +
  ".gj-qup-foot b{color:var(--ink);font-weight:600}" +
  // live articles section (3-column editorial grid)
  ".gj-artikel{position:relative;z-index:2;padding:clamp(60px,10vh,110px) 0}" +
  ".gj-art-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:32px;flex-wrap:wrap}" +
  ".gj-art-sub{max-width:360px}" +
  ".gj-art-actions{margin-top:clamp(24px,4vh,34px);display:flex;justify-content:center}" +
  ".gj-art-cta{position:relative;z-index:3;height:44px;padding:0 26px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:13px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;transition:transform .35s " + EASE + ",box-shadow .35s " + EASE + "}" +
  ".gj-art-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;opacity:0;transform:translate3d(0,40px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".gj-art-grid.gj-in{opacity:1;transform:none}" +
  ".gj-art-card{border-radius:16px;background:var(--card);border:1px solid var(--line);overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:transform .45s " + EASE + ",border-color .25s ease}" +
  ".gj-art-media{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--foot)}" +
  ".gj-art-media img{width:100%;height:100%;object-fit:cover;transition:transform .8s " + EASE + "}" +
  ".gj-art-cat{position:absolute;left:12px;top:12px;height:22px;padding:0 10px;border-radius:999px;background:rgba(18,17,24,.82);backdrop-filter:blur(8px);color:#fff;font-size:10px;font-weight:600;display:inline-flex;align-items:center}" +
  ".gj-art-body{padding:18px;flex:1;display:flex;flex-direction:column;gap:8px}" +
  ".gj-art-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10.5px;color:var(--mute)}" +
  ".gj-art-body h3{font-size:15.5px;font-weight:600;line-height:1.3;letter-spacing:-.015em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
  ".gj-art-body p{font-size:12px;line-height:1.55;color:var(--mute);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}" +
  ".gj-art-foot{margin-top:auto;padding-top:10px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;font-weight:500;color:var(--ink)}" +
  ".gj-art-foot small{font-size:10.5px;font-weight:600;color:var(--blue)}" +
  // stage 3
  ".gj-lead{position:absolute;left:50%;top:22%;width:min(640px,90vw);display:flex;flex-direction:column;align-items:center;gap:14px;z-index:3}" +
  ".gj-lead .gj-eyebrow{margin-bottom:0}" +
  ".gj-lead .gj-small{max-width:360px}" +
  ".gj-wall{position:absolute;left:0;top:0;border-radius:12px;overflow:hidden;opacity:0;will-change:transform}" +
  ".gj-wall img{width:100%;height:100%;object-fit:cover}" +
  ".gj-orange{position:absolute;overflow:hidden;background:#3a3286;z-index:2;box-shadow:0 40px 70px -40px rgba(34,26,95,.65)}" +
  ".gj-orange>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 25%}" +
  ".gj-orange-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(25,25,25,0) 45%,rgba(25,25,25,.72) 100%);pointer-events:none}" +
  ".gj-orange-ui{position:absolute;inset:0;opacity:0;transition:opacity .5s " + EASE + "}" +
  ".gj-card-on .gj-orange-ui{opacity:1}" +
  ".gj-t10{left:14px;top:40px;--r:-10deg;height:24px;font-size:11px;padding:0 10px}" +
  ".gj-card-on .gj-t10{opacity:1;transform:rotate(var(--r))}" +
  ".gj-like{position:absolute;right:12px;top:12px;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 10px;border-radius:999px;background:#fff;color:#141414;font-size:10px;font-weight:500}" +
  ".gj-like.on{color:#e8203a}" +
  ".gj-by{position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;gap:8px;color:#fff}" +
  ".gj-by img{width:28px;height:28px;border-radius:8px;object-fit:cover;object-position:50% 20%}" +
  ".gj-by b{display:block;font-size:12px;font-weight:600}" +
  ".gj-by small{display:block;font-size:10px;opacity:.85}" +
  // pricing
  ".gj-price{padding:clamp(70px,12vh,130px) 0 clamp(40px,7vh,70px)}" +
  ".gj-price-grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:32px;align-items:center}" +
  ".gj-price-cta{margin-top:20px}" +
  ".gj-plans{display:flex;align-items:center;justify-content:center;gap:14px;min-height:clamp(210px,18vw,260px);opacity:0;transition:opacity .6s " + EASE + "}" +
  ".gj-plans.gj-in{opacity:1}" +
  ".gj-plan{position:relative;flex:1;min-width:0;max-width:205px;aspect-ratio:1/1.04;border-radius:14px;background:var(--card);padding:16px;display:flex;flex-direction:column;box-shadow:0 24px 38px -26px rgba(0,0,0,.32);transform:translate3d(0,48px,0) rotate(0deg);transition:transform 1s cubic-bezier(.34,1.3,.64,1)}" +
  ".gj-plan small{font-size:11px;font-weight:500}" +
  ".gj-plan b{font-size:clamp(28px,2.9vw,44px);line-height:1;font-weight:600;letter-spacing:-.04em;margin-top:8px;white-space:nowrap}" +
  ".gj-plan sup{font-size:.34em;vertical-align:.95em;margin:0 2px 0 0;letter-spacing:0}" +
  ".gj-plan b small{font-size:.3em;font-weight:500;letter-spacing:0;margin-left:2px}" +
  ".gj-plan em{margin-top:auto;font-style:normal;font-size:10px;line-height:1.3;color:var(--mute)}" +
  ".gj-p1{z-index:1}" +
  ".gj-p2{z-index:2;background:#5145b9;color:#fff;aspect-ratio:1/1.12}" +
  ".gj-p2 em{color:rgba(255,255,255,.85)}" +
  ".gj-p3{z-index:1}" +
  ".gj-in .gj-p1{transform:rotate(-3deg)}.gj-in .gj-p2{transform:translate3d(0,-10px,0) rotate(-1deg);transition-delay:.1s}.gj-in .gj-p3{transform:translate3d(0,6px,0) rotate(4deg);transition-delay:.2s}" +
  ".gj-pop-pill{position:absolute;right:12px;top:12px;height:20px;padding:0 9px;border-radius:999px;background:#ffda03;color:#141414;font-size:9.5px;font-weight:600;display:inline-flex;align-items:center;transform:rotate(8deg)}" +
  // lime marquee
  ".gj-lime-sec{padding:0 clamp(16px,8.75vw,126px) clamp(16px,2vh,24px)}" +
  ".gj-lime{position:relative;height:clamp(420px,58vh,500px);border-radius:16px;background:var(--lime);color:#141414;overflow:hidden}" +
  ".gj-water{position:absolute;left:-2%;top:6%;font-size:clamp(130px,22vw,320px);line-height:.8;font-weight:600;letter-spacing:-.06em;color:rgba(255,255,255,.22);pointer-events:none}" +
  ".gj-marquee{position:relative;padding-top:clamp(14px,2.4vh,22px);overflow:hidden}" +
  ".gj-mtrack{display:flex;width:max-content;will-change:transform}" +
  ".gj-mrun{display:inline-flex;align-items:flex-start;font-size:clamp(34px,4.45vw,64px);line-height:1.15;letter-spacing:-.04em;font-weight:500;white-space:nowrap}" +
  ".gj-mthumbs{position:relative;display:inline-flex;align-items:center;gap:6px;margin:.18em .3em 0;height:.82em}" +
  ".gj-mthumbs img,.gj-mthumbs i{width:.82em;height:.82em;border-radius:.14em;object-fit:cover;display:block}" +
  ".gj-mthumbs i{width:.42em;height:.42em;border-radius:50%}" +
  ".gj-mthumbs small{position:absolute;left:30%;top:100%;margin-top:4px;font-size:8px;line-height:1.2;letter-spacing:.06em;font-weight:600;white-space:nowrap;text-align:center}" +
  ".gj-pilebox{position:absolute;left:0;right:0;bottom:0;top:34%;cursor:crosshair}" +
  ".gj-hoop-hud{position:absolute;left:clamp(14px,2.4vw,28px);top:8px;z-index:4;display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:rgba(20,20,20,.9);color:#fff;font-size:11.5px;pointer-events:none}" +
  ".gj-hoop-score{display:inline-flex;align-items:center;gap:5px;font-weight:500}" +
  ".gj-hoop-score b{color:#e6fa6a;font-weight:700}" +
  ".gj-hoop-hud small{font-size:10.5px;color:rgba(255,255,255,.75)}" +
  ".gj-hoop-hud small.gj-swish-pop{color:#a6e8c1;font-weight:700}" +
  ".gj-hoop{position:absolute;right:32px;top:28%;width:122px;height:82px;pointer-events:none;z-index:2}" +
  ".gj-hoop-board{position:absolute;right:-8px;top:-66px;width:10px;height:74px;border-radius:4px;background:#fff;border:2px solid #141414;box-shadow:0 6px 16px rgba(0,0,0,.18)}" +
  ".gj-hoop-sq{position:absolute;right:0;bottom:8px;width:4px;height:28px;background:#5145b9;border-radius:2px}" +
  ".gj-hoop-rim{position:absolute;right:0;top:-3px;width:114px;height:7px;border-radius:999px;background:#ff5b0d;border:1.5px solid #141414;z-index:5;box-shadow:0 3px 8px rgba(0,0,0,.2)}" +
  ".gj-hoop-net{position:absolute;right:0;top:3px;width:114px;height:68px;z-index:4;transform-origin:top center;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))}" +
  ".gj-hoop.is-swish .gj-hoop-net{animation:gj-swish .42s cubic-bezier(.22,1,.36,1)}" +
  "@keyframes gj-swish{0%{transform:scaleY(1) scaleX(1)}35%{transform:scaleY(1.22) scaleX(.84)}70%{transform:scaleY(.92) scaleX(1.06)}100%{transform:scaleY(1) scaleX(1)}}" +
  ".gj-ball{position:absolute;left:0;top:0;z-index:3;width:72px;height:72px;border-radius:50%;background:#fff;color:#5145b9;display:grid;place-items:center;transform:translate3d(-100px,-200px,0);will-change:transform;box-shadow:0 6px 12px -8px rgba(0,0,0,.4);cursor:grab;touch-action:none;user-select:none}" +
  ".gj-ball img{width:42px;height:42px;object-fit:contain;pointer-events:none;user-select:none}" +
  ".gj-ball svg{pointer-events:none}" +
  ".gj-ball.is-grab{cursor:grabbing;z-index:6;box-shadow:0 16px 28px -10px rgba(0,0,0,.45)}" +
  // duo
  ".gj-duo{padding:clamp(16px,2vh,24px) 0 clamp(100px,16vh,160px)}" +
  ".gj-duo-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,1.9vw,27px);padding:0 clamp(16px,8.75vw,126px)}" +
  ".gj-meet,.gj-arch{position:relative;height:clamp(490px,45vw,650px);border-radius:16px;overflow:hidden;opacity:0;transform:translate3d(0,50px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".gj-meet.gj-in,.gj-arch.gj-in{opacity:1;transform:none}" +
  ".gj-meet{background:radial-gradient(circle at 80% 14%,rgba(167,159,248,.36),transparent 54%),linear-gradient(155deg,#3a3286,#5145b9);color:#fff}" +
  ".gj-arch{background:var(--card);color:var(--ink)}" +
  ".gj-duo-phones{position:relative;height:62%;padding:22px;overflow:hidden;transition:transform .8s " + EASE + "}" +
  ".gj-duo-pill{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.16);backdrop-filter:blur(8px);color:#fff;font-size:10px;font-weight:600;letter-spacing:.02em}" +
  ".gj-phone-back,.gj-phone-front{position:absolute;border-radius:22px;border:5px solid #161523;background:#fff;overflow:hidden;box-shadow:0 26px 48px -20px rgba(0,0,0,.55)}" +
  ".gj-phone-back{width:clamp(146px,15vw,210px);aspect-ratio:9/18;left:22%;top:64px;transform:rotate(-7deg);opacity:.94}" +
  ".gj-phone-front{width:clamp(160px,16.5vw,228px);aspect-ratio:9/18;left:46%;top:34px;transform:rotate(3deg)}" +
  ".gj-phone-back img,.gj-phone-front img{width:100%;height:100%;object-fit:cover;object-position:50% 0%;display:block}" +
  ".gj-qursus-ui{position:relative;margin:22px 22px 0;padding:12px;border-radius:14px;background:var(--bg);border:1px solid var(--line);display:flex;flex-direction:column;gap:10px;box-shadow:0 18px 36px -22px rgba(18,17,24,.18);transition:transform .8s " + EASE + "}" +
  ".gj-qursus-photo{position:relative;height:clamp(108px,13vw,182px);border-radius:10px;overflow:hidden}" +
  ".gj-qursus-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 24%;display:block}" +
  ".gj-qursus-live{position:absolute;left:10px;bottom:10px;height:22px;padding:0 9px;border-radius:999px;background:rgba(18,17,24,.8);backdrop-filter:blur(8px);color:#fff;font-size:10px;font-weight:600;display:inline-flex;align-items:center;gap:5px}" +
  ".gj-qursus-live::before{content:'';width:6px;height:6px;border-radius:50%;background:#34d399}" +
  ".gj-qursus-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}" +
  ".gj-qursus-steps span{text-align:center;padding:6px 4px;border-radius:8px;font-size:9.5px;font-weight:600;background:var(--card);color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".gj-qursus-steps span.done{background:#a6e8c1;color:#0f5b38}" +
  ".gj-qursus-steps span.on{background:#5145b9;color:#fff}" +
  ".gj-qursus-tags{display:flex;flex-wrap:wrap;gap:6px}" +
  ".gj-qursus-tags span{font-size:9.5px;font-weight:500;padding:4px 8px;border-radius:999px;border:1px solid var(--line);color:var(--mute)}" +
  ".gj-meet::after{content:'';position:absolute;inset:42% 0 0;background:linear-gradient(180deg,rgba(58,50,134,0),rgba(58,50,134,.96) 56%);pointer-events:none}" +
  ".gj-duo-copy{position:absolute;z-index:1;left:26px;right:26px;bottom:26px;display:flex;flex-direction:column;gap:10px;align-items:flex-start}" +
  ".gj-meet h3 span{color:#ffda03}" +
  ".gj-meet .gj-small{color:rgba(255,255,255,.82);max-width:340px}" +
  ".gj-arch .gj-small{color:var(--mute);max-width:340px}" +
  ".gj-arch .gj-btn{background:var(--ink);color:var(--bg)}" +
  ".gj-store-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px}" +
  ".gj-store-badge{display:inline-flex;height:40px;transition:transform .25s " + EASE + "}" +
  ".gj-store-badge img{height:40px;width:auto}" +
  // footer
  ".gj-foot{background:var(--foot);padding:clamp(50px,7vh,70px) 0 clamp(30px,5vh,46px)}" +
  ".gj-foot-grid{display:grid;grid-template-columns:1.4fr .8fr .8fr .6fr;gap:32px;position:relative}" +
  ".gj-foot-grid .gj-small{max-width:300px;margin-top:12px}" +
  ".gj-foot .gj-h4{font-size:clamp(17px,1.45vw,21px)}" +
  ".gj-foot-dots{font-size:9px;letter-spacing:.08em;vertical-align:3px;margin-left:8px;padding:3px 8px;border-radius:999px;background:var(--card);color:var(--blue);font-weight:600}" +
  ".gj-mail{display:inline-block;margin-top:8px;font-size:12.5px;font-weight:500;border-bottom:1px solid var(--line)}" +
  ".gj-contact-meta{display:block;margin-top:6px;font-size:11.5px;color:var(--mute)}" +
  ".gj-socials{display:flex;gap:8px;margin-top:18px}" +
  ".gj-socials a{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--mute);transition:color .3s ease,border-color .3s ease}" +
  ".gj-foot ul{display:flex;flex-direction:column;gap:11px;font-size:12.5px}" +
  ".gj-foot li{display:flex;align-items:center;gap:6px}" +
  ".gj-new,.gj-soon{height:16px;padding:0 7px;border-radius:999px;font-size:9px;display:inline-flex;align-items:center}" +
  ".gj-new{background:#5145b9;color:#fff}" +
  ".gj-soon{background:#f2f1fa;color:#5145b9}" +
  ".gj-copy{position:absolute;right:clamp(20px,7.1vw,102px);bottom:0;font-size:10.5px;color:var(--mute)}" +
  // hover — only where a mouse can hover
  "@media (hover:hover) and (pointer:fine){" +
  ".gj-link:hover::after,.gj-ghost:hover::after,.gj-textlink:hover::after{transform:scaleX(1);transform-origin:0 50%}" +
  ".gj-round:hover,.gj-arrows button:hover{transform:scale(1.1)}" +
  ".gj-btn:hover,.gj-art-cta:hover,.gj-store-badge:hover{transform:translate3d(0,-2px,0);box-shadow:0 12px 24px -12px rgba(0,0,0,.45)}" +
  ".gj-art-card:hover .gj-art-media img,.gj-photo:hover>img{transform:scale(1.05)}" +
  ".gj-art-card:hover{transform:translate3d(0,-4px,0);border-color:var(--blue)}" +
  ".gj-meet:hover .gj-duo-phones,.gj-arch:hover .gj-qursus-ui{transform:translate3d(0,-4px,0)}" +
  ".gj-b1:hover .gj-pile .gj-pcard:nth-child(1){transform:translate(-80%,-44%) rotate(-18deg)}" +
  ".gj-b1:hover .gj-pile .gj-pcard:nth-child(3){transform:translate(-18%,-58%) rotate(14deg)}" +
  ".gj-plan:hover{transform:translate3d(0,-10px,0) rotate(0deg)!important;transition-duration:.45s;transition-delay:0s!important}" +
  ".gj-socials a:hover{color:var(--ink);border-color:var(--ink)}" +
  ".gj-av:hover{transform:translate3d(0,calc(var(--y) - 6px),0) scale(1.08);transition:transform .35s " + EASE + "}" +
  "}" +
  // tablet / phone
  "@media (max-width:1023px){.gj-links{display:none}.gj-qup-grid{grid-template-columns:1fr}.gj-art-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gj-price-grid{grid-template-columns:1fr}.gj-foot-grid{grid-template-columns:1fr 1fr}.gj-copy{position:static;grid-column:1/-1}}" +
  "@media (max-width:767px){" +
  ".gj-nav{height:76px;margin-bottom:-76px;padding-top:16px}" +
  ".gj-show{top:84px}.gj-show .gj-btns{margin-top:18px}.gj-wrapp{margin-top:14px}" +
  ".gj-t3{left:12%;top:56%}.gj-t4{left:60%;top:62%}.gj-updown{display:none}" +
  ".gj-t1{left:8%}.gj-t2{left:auto;right:8%}" +
  ".gj-t6{left:6%;top:16%}.gj-t7{left:auto;right:6%;top:18%}" +
  ".gj-vision{top:96px}.gj-doodles{display:none}" +
  ".gj-folder-tab{font-size:12px}.gj-folder-bar{top:40px;height:46px;font-size:12px}" +
  ".gj-bento{grid-template-columns:1fr}.gj-col-r{padding-top:0}" +
  ".gj-qup-hero h3,.gj-qup-hero p{max-width:100%}.gj-qup-donor{opacity:.25}" +
  ".gj-art-grid{grid-template-columns:1fr}" +
  ".gj-art-actions{justify-content:stretch}" +
  ".gj-art-cta{width:100%}" +
  ".gj-duo-grid{grid-template-columns:1fr}" +
  ".gj-plans{flex-direction:column;align-items:stretch;gap:12px;min-height:0}.gj-plan,.gj-p2{max-width:none;aspect-ratio:auto;min-height:132px;transform:none!important}" +
  ".gj-ball{width:48px;height:48px}.gj-ball svg{width:24px;height:24px}.gj-ball img{width:28px;height:28px}" +
  ".gj-hoop{right:16px;width:84px}.gj-hoop-rim,.gj-hoop-net{width:76px}.gj-hoop-net{height:48px}.gj-hoop-board{top:-48px;height:56px}" +
  ".gj-hoop-hud{top:4px;padding:4px 10px;font-size:10.5px}.gj-hoop-hud small{display:none}" +
  ".gj-trust-head{flex-direction:column;align-items:flex-start}" +
  ".gj-slide-meta{display:none}" +
  ".gj-banner:has(.gj-dq-stage){height:clamp(340px,92vw,400px)}" +
  ".gj-dq-stage{padding:24px 20px 68px 66px;align-items:flex-end}" +
  ".gj-dq-bg{object-position:76% 36%!important}" +
  ".gj-dq-stage::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(12,15,22,.16) 0%,rgba(12,15,22,.78) 62%,rgba(12,15,22,.92) 100%);pointer-events:none;z-index:1}" +
  ".gj-dq-copy h3{font-size:20px}" +
  ".gj-dq-copy p{font-size:12px}" +
  "}" +
  // reduced motion: no time-based motion; scroll-linked stages follow the scrollbar only
  "@media (prefers-reduced-motion:reduce){" +
  ".gj-w,.gj-late,.gj-fade,.gj-tag,.gj-doodle,.gj-bcard,.gj-qup-hero,.gj-qup-list,.gj-art-grid,.gj-banner,.gj-banner img,.gj-plan,.gj-meet,.gj-arch,.gj-plans,.gj-show,.gj-vision{transition:none!important}" +
  ".gj-w{opacity:1;filter:none;transform:none}" +
  ".gj-late,.gj-fade,.gj-bcard,.gj-qup-hero,.gj-qup-list,.gj-art-grid,.gj-banner,.gj-meet,.gj-arch,.gj-plans{opacity:1;filter:none;transform:none}" +
  ".gj-show:not(.gj-in),.gj-vision:not(.gj-in){opacity:0!important;visibility:hidden!important;pointer-events:none!important}" +
  ".gj-logos-track{animation:none}" +
  "}" +
  ".gj-reduce .gj-w{transition:none;opacity:1;filter:none;transform:none}" +
  ".gj-reduce .gj-show:not(.gj-in),.gj-reduce .gj-vision:not(.gj-in){opacity:0;visibility:hidden;pointer-events:none}"
