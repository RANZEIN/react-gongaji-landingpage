"use client"

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  BAND_BOT_ASSETS,
  BAND_TOP_ASSETS,
  CAROUSEL_ITEMS,
  DECK1_ASSETS,
  DECK2_CARDS,
  GATEWAY_SLIDES,
  GONGAJI_LINKS,
  GONGAJI_LOGO,
  NAV_ITEMS,
  TRUST_ITEMS,
  WALL_ASSETS,
} from "@/data/gongaji"

// Gongaji Ecosystem Showcase — kinetic scroll-driven landing page adapted from
// the Easel Showcase choreography for the Gongaji ecosystem (Gongaji App, Qursus, QuPeduli).

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
/** stage 3: the portrait wall, 5 columns × 3 rows around the banner */
export function wallPose(k: number, w: number, h: number) {
  const u = unitWH(w, h)
  const cols = w < 768 ? 3 : 5
  const c = k % cols
  const r = Math.floor(k / cols)
  const pitch = w < 768 ? w * 0.33 : 246 * u
  return { x: w / 2 + (c - (cols - 1) / 2) * pitch, y: h * [0.21, 0.53, 0.86][r] }
}

// The lime band's doodles: circles under gravity, bouncing off the box and each other.
export type Ball = { x: number; y: number; vx: number; vy: number; a: number; r: number }
export function stepBalls(bs: Ball[], W: number, H: number, dt: number, g = 2600) {
  for (const b of bs) {
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
    b.a += (b.vx * dt * 180) / (Math.PI * b.r)
  }
  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      const p = bs[i]
      const q = bs[j]
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
}
export const settled = (bs: Ball[]) => bs.every((b) => Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6)
// #endregion

// line-art doodles: one path set per icon, drawn on a 24-unit grid
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
  "M5 19l4-12 4 8 3-5 3 9z",
  "M12 5v14 M5 12h14 M7 7l10 10 M17 7L7 17",
  "M8 4h8l3 6-7 10L5 10z M5 10h14 M10 4l2 6 2-6",
  "M4 16c4-8 12-8 16 0 M8 16a4 4 0 0 0 8 0",
  "M6 6h12v12H6z M9 9h6v6H9z",
]

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
    <svg viewBox="38 33 358 82" height={24} role="img" aria-label="Gongaji" className="ea-brand-svg">
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
/** words that blur in one after another when an ancestor gets .ea-in; "\n" breaks the line */
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
          <span key={pi + "-" + wi} className={"ea-w" + (cls ? " " + cls : "")} style={{ ["--i" as string]: i++ } as CSSProperties}>
            {w}
          </span>,
          " ",
        )
      })
  })
  return <>{out}</>
}

export interface EaselShowcaseTemplateProps {
  /** height of the hero and of every pinned stage; a definite length (never a percentage) */
  height?: string
  /** contact address for every call to action */
  email?: string
  /** where the pictures live; defaults to /assets/ */
  assetBase?: string
  className?: string
  style?: CSSProperties
}

export default function EaselShowcaseTemplate({
  height = "100svh",
  email = GONGAJI_LINKS.email,
  assetBase = "/assets/",
  className,
  style,
}: EaselShowcaseTemplateProps) {
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
  const [arc, setArc] = useState(0)
  const [liked, setLiked] = useState(false)
  const [dark, setDark] = useState(false)
  const gateVideoRef = useRef(null as HTMLVideoElement | null)

  useEffect(() => {
    const vid = gateVideoRef.current
    if (!watchVideo || !vid) return
    vid.muted = true
    vid.play().catch(() => {})
  }, [watchVideo])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    let reduced = mq.matches
    const onMq = () => {
      reduced = mq.matches
      root.classList.toggle("ea-reduce", reduced)
      kick()
    }
    root.classList.toggle("ea-reduce", reduced)
    root.classList.add("ea-ready")
    const t0 = performance.now()
    let raf = 0
    let lastT = t0

    // physics state for the lime pile
    const sim = { on: false, bs: [] as Ball[], W: 0, H: 0, started: false }
    const startPile = () => {
      const box = pile.current
      if (!box || sim.started) return
      sim.started = true
      sim.W = box.clientWidth
      sim.H = box.clientHeight
      const n = balls.current.length
      const r = sim.W < 500 ? 24 : 36
      sim.bs = balls.current.map((_, i) => ({
        x: r + sim.W * 0.04 + ((i * 0.618 * sim.W * 0.3) % (sim.W * 0.3)),
        y: -60 - i * 70 - (i % 3) * 30,
        vx: (i % 2 ? 1 : -1) * (40 + (i * 37) % 90),
        vy: 0,
        a: (i * 47) % 360,
        r,
      }))
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
      flag(navRef.current, "ea-solid", root.getBoundingClientRect().top < -40)

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
          const foot = ht.querySelector(".ea-hero-foot") as HTMLElement | null
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
        flag(pn1, "ea-tags1", t > 2.3 && p < 0.2)
        flag(pn1, "ea-tags2", p > 0.68)
        flag(showText.current, "ea-in", p > 0.4)
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
        const words = pn2.querySelectorAll(".ea-sw")
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
        flag(vision.current, "ea-in", p > 0.66)
        flag(pn2, "ea-doodled", p > 0.7)
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
        flag(pn3, "ea-card-on", p > 0.52)
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
        for (let k = 0; k < sub; k++) stepBalls(sim.bs, sim.W, sim.H, dt / sub)
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

    // a cursor shove through the pile wakes it up again
    const onPile = (e: PointerEvent) => {
      const box = pile.current
      if (!box || !sim.started || reduced) return
      const rb = box.getBoundingClientRect()
      const mx = e.clientX - rb.left
      const my = e.clientY - rb.top
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
    const pileEl = pile.current
    pileEl?.addEventListener("pointermove", onPile)

    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) if (e.isIntersecting) (e.target as HTMLElement).classList.add("ea-in")
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
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
    const heroIn = window.setTimeout(() => heroText.current?.classList.add("ea-in"), reduced ? 0 : 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(heroIn)
      io.disconnect()
      pileEl?.removeEventListener("pointermove", onPile)
      window.removeEventListener("scroll", kick)
      window.removeEventListener("resize", onResize)
      mq.removeEventListener("change", onMq)
    }
  }, [])

  const stage = (n: number) => ({ height: "calc(" + height + " * " + n + ")" })
  const activeSlide = GATEWAY_SLIDES[slide]

  return (
    <div ref={rootRef} className={"ea-root" + (dark ? " ea-dark" : "") + (className ? " " + className : "")} style={style}>
      <style>{CSS}</style>

      <header ref={navRef} className="ea-nav">
        <a className="ea-brand" href="#top" aria-label="Gongaji — Beranda">
          <GongajiBrandLogo dark={dark} />
        </a>
        <nav className="ea-links" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} className="ea-link" href={item.href}>
              {"live" in item && item.live && <i className="ea-dot" aria-hidden="true" />}
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ea-tools">
          <a className="ea-round" href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer" aria-label="Download Gongaji di Google Play">
            <Svg d={ICON.download} size={15} />
          </a>
          <button
            type="button"
            className="ea-round"
            aria-label={dark ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
            aria-pressed={dark}
            onClick={() => setDark((d) => !d)}
          >
            <Svg d={ICON.sun} size={15} />
          </button>
        </div>
      </header>

      {/* ---------- stage 1: hero → ekosistem showcase ---------- */}
      <section ref={s1} id="top" className="ea-stage" style={stage(3.4)} aria-label="Pembuka Gongaji">
        <div ref={pin1} className="ea-pin" style={{ height }}>
          <div ref={heroText} className="ea-hero">
            <h1 className="ea-h1">
              <Words parts={["Jalani hari bersama", "\n", "Al-Qur’an."]} />
            </h1>
            <div className="ea-hero-foot">
              <p className="ea-fade" style={{ ["--d" as string]: "1.9s" } as CSSProperties}>
                Gongaji menemani kamu membaca Al-Qur’an, belajar bersama pengajar lewat Qursus, dan menghadirkan kebaikan lewat QuPeduli.
              </p>
              <div className="ea-btns ea-fade" style={{ ["--d" as string]: "2.05s" } as CSSProperties}>
                <a className="ea-btn" href="#download">
                  Download Gongaji
                </a>
                <a className="ea-ghost" href="#ekosistem">
                  Jelajahi Ekosistem
                </a>
              </div>
            </div>
          </div>
          <span className="ea-tag ea-t1 ea-blue">@gongaji.app</span>
          <span className="ea-tag ea-t2 ea-mint">@qursus</span>

          <div ref={showText} id="ekosistem" className="ea-show">
            <p className="ea-eyebrow">
              <Words parts={["EKOSISTEM GONGAJI · #JADILEBIHMUDAH"]} />
            </p>
            <h2 className="ea-h2 ea-big">
              <Words parts={["Baca, belajar,", "\n", ["& berbagi kebaikan", "ea-red"], "\n", "dalam satu langkah."]} at={4} />
            </h2>
            <p className="ea-body ea-wrapp">
              <Words parts={["Gongaji App untuk kebiasaan tilawah harian, Qursus bersama mentor, dan QuPeduli untuk program sosial transparan."]} at={12} />
            </p>
            <div className="ea-btns ea-late">
              <a className="ea-btn" href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Pelajari Qursus
              </a>
              <a className="ea-ghost" href="#fitur">
                Lihat Fitur
              </a>
            </div>
          </div>
          <span className="ea-tag ea-t3 ea-redtag">@qupeduli</span>
          <span className="ea-tag ea-t4 ea-ink">50rb+ unduhan</span>
          <div className="ea-updown" aria-hidden="true">
            <Svg d={ICON.up} size={12} />
            <Svg d={ICON.down} size={12} />
          </div>

          <div className="ea-deck" aria-hidden="true">
            {DECK1_ASSETS.map((item, i) => {
              if (item.kind === "tilawah") {
                return (
                  <div key={item.kind + "-" + i} ref={(el) => { deck.current[i] = el }} className="ea-card ea-c1 ea-s1 ea-s1-indigo">
                    <div className="ea-s1-top">
                      <span className="ea-s1-pill">{item.badge}</span>
                      <img src={asset(item.icon)} alt="" width={38} height={38} className="ea-s1-ico" />
                    </div>
                    <div className="ea-s1-copy">
                      <b>{item.title}</b>
                      <small>{item.sub}</small>
                    </div>
                    <div className="ea-s1-foot">
                      <div className="ea-s1-bar"><i style={{ width: "72%" }} /></div>
                      <span>{item.meta}</span>
                    </div>
                  </div>
                )
              }
              if (item.kind === "cutout") {
                const bgCls =
                  item.theme === "periwinkle"
                    ? "ea-s1-periwinkle"
                    : item.theme === "sunburst"
                      ? "ea-s1-sunburst"
                      : item.theme === "rose"
                        ? "ea-s1-rose"
                        : "ea-s1-mint"
                return (
                  <div key={item.path + "-" + i} ref={(el) => { deck.current[i] = el }} className={"ea-card ea-c1 " + bgCls}>
                    <img src={asset(item.path)} alt="" width={240} height={254} className={item.float ? "ea-s1-mcut" : "ea-s1-cut"} draggable={false} />
                    <div className={"ea-s1-phead " + (item.darkText ? "ea-s1-pdark" : "")}>
                      <span className={"ea-s1-pill " + (item.inkPill ? "ea-s1-pill-ink" : "")}>{item.badge}</span>
                      {item.sub ? <small>{item.sub}</small> : null}
                    </div>
                  </div>
                )
              }
              if (item.kind === "features") {
                return (
                  <div key={item.kind + "-" + i} ref={(el) => { deck.current[i] = el }} className="ea-card ea-c1 ea-s1 ea-s1-teal">
                    <div className="ea-s1-top">
                      <span className="ea-s1-pill">{item.badge}</span>
                    </div>
                    <div className="ea-s1-tiles">
                      {item.icons.map((ic) => (
                        <span key={ic} className="ea-s1-tile">
                          <img src={asset(ic)} alt="" width={34} height={34} className="ea-s1-timg" />
                        </span>
                      ))}
                    </div>
                    <div className="ea-s1-copy ea-s1-copy-sm">
                      <b>{item.title}</b>
                      <small>{item.sub}</small>
                    </div>
                  </div>
                )
              }
              if (item.kind === "qulib") {
                return (
                  <div key={item.kind + "-" + i} ref={(el) => { deck.current[i] = el }} className="ea-card ea-c1 ea-s1 ea-s1-dark">
                    <div className="ea-s1-top">
                      <span className="ea-s1-pill ea-s1-pill-gold">{item.badge}</span>
                      <img src={asset(item.icon)} alt="" width={38} height={38} className="ea-s1-ico" />
                    </div>
                    <div className="ea-s1-copy">
                      <b>{item.title}</b>
                      <small>{item.sub}</small>
                    </div>
                    <div className="ea-s1-chips">
                      {item.chips.map((c) => (
                        <span key={c}>{c}</span>
                      ))}
                    </div>
                  </div>
                )
              }
              return (
                <div key={item.kind + "-" + i} ref={(el) => { deck.current[i] = el }} className="ea-card ea-c1 ea-s1-app">
                  <div className="ea-s1-apphead">
                    <span className="ea-s1-pill ea-s1-pill-indigo">{item.badge}</span>
                    <span className="ea-s1-pill ea-s1-pill-gold">{item.rating}</span>
                  </div>
                  <div className="ea-s1-phone">
                    <img src={asset(item.path)} alt="" width={216} height={240} className="ea-s1-screen" draggable={false} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- gateway banner ---------- */}
      <section className="ea-sec ea-gate" aria-label="Sorotan Ekosistem">
        <div className="ea-wrap">
          <div data-rv className="ea-gate-head">
            <p className="ea-eyebrow">
              <Words parts={["EKOSISTEM DALAM AKSI"]} />
            </p>
            <h2 className="ea-h2">
              <Words parts={["Satu perjalanan,", "\n", "banyak cara bertumbuh."]} at={3} />
            </h2>
            <span className="ea-tag ea-ink ea-pop ea-t5">#JadiLebihMudah</span>
          </div>
          <div className="ea-banner" data-rv>
            {watchVideo ? (
              <video
                ref={gateVideoRef}
                src={asset("02-gateway-banner/hero-video.mp4")}
                poster={asset("02-gateway-banner/slide-1-gongaji-app.webp")}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="ea-banner-vid"
              />
            ) : (
              GATEWAY_SLIDES.map((item, i) => (
                <img
                  key={item.path}
                  src={asset(item.path)}
                  alt={i === slide ? item.alt : ""}
                  className={i === slide ? "on" : ""}
                  width={1400}
                  height={560}
                  draggable={false}
                />
              ))
            )}
            <div className="ea-banner-scrim" aria-hidden="true" />
            <span className="ea-switch" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="ea-slide-meta">
              <b>{watchVideo ? "Video Ekosistem Gongaji" : activeSlide.badge}</b>
              <small>{watchVideo ? "Membaca, belajar, dan berbagi bersama Al-Qur’an" : activeSlide.caption}</small>
            </span>
            <span className="ea-more" aria-hidden="true">
              <Svg d={ICON.dots} size={18} stroke={3} />
            </span>
            <button type="button" className="ea-watch" onClick={() => setWatchVideo((v) => !v)} aria-pressed={watchVideo}>
              <Svg d={watchVideo ? ICON.pause : ICON.play} size={9} fill="currentColor" stroke={0} />
              {watchVideo ? "Tutup Video" : "Tonton Video"}
            </button>
            <div className="ea-arrows">
              <button
                type="button"
                aria-label="Sorotan sebelumnya"
                onClick={() => {
                  setWatchVideo(false)
                  setSlide((s) => (s + GATEWAY_SLIDES.length - 1) % GATEWAY_SLIDES.length)
                }}
              >
                <Svg d={ICON.left} size={12} stroke={2} />
              </button>
              <button
                type="button"
                aria-label="Sorotan berikutnya"
                onClick={() => {
                  setWatchVideo(false)
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
      <section className="ea-sec ea-trust" aria-label="Pencapaian Gongaji">
        <div className="ea-wrap" data-rv>
          <div className="ea-trust-head">
            <div>
              <h2 className="ea-h3">
                <Words parts={["Perjalanan baik", ["yang terus bertumbuh.", "ea-grey"]]} />
              </h2>
              <p className="ea-small ea-late">
                50 ribu+ download · 10 ribu+ pengguna aktif bulanan · Ribuan aktivitas tilawah setiap hari (Data internal Gongaji App, September 2026).
              </p>
            </div>
            <div className="ea-mini-arrows" aria-hidden="true">
              <Svg d={ICON.left} size={11} stroke={2} />
              <Svg d={ICON.right} size={11} stroke={2} />
            </div>
          </div>
        </div>
        <div className="ea-logos" aria-label="Sorotan angka ekosistem Gongaji">
          <div className="ea-logos-track">
            {[0, 1].map((rep) =>
              TRUST_ITEMS.map((item, i) => (
                <span key={rep + item} className="ea-logo-item" aria-hidden={rep === 1}>
                  <Svg d={[ICON.download, ICON.user, ICON.spark, ICON.heart, ICON.grid, ICON.book, ICON.globe][i]} size={18} />
                  {item}
                </span>
              )),
            )}
          </div>
        </div>
      </section>

      {/* ---------- stage 2: inked paragraph → staircase → folder ---------- */}
      <section ref={s2} className="ea-stage" style={stage(3.8)} aria-label="Filosofi Gongaji">
        <div ref={pin2} className="ea-pin" style={{ height }}>
          <div ref={whether} className="ea-whether">
            <p className="ea-ink-text">
              {"Dari pemula yang baru mengenal huruf hijaiyah".split(" ").map((w, i) => (
                <span key={"a" + i} className="ea-sw">
                  {w}{" "}
                </span>
              ))}
              <br />
              {"/ hingga yang ingin bacaannya lebih".split(" ").map((w, i) => (
                <span key={"b" + i} className="ea-sw">
                  {w}{" "}
                </span>
              ))}{" "}
              <span className="ea-sw ea-mintw">tartil </span>
              <span className="ea-sw">dan terarah </span>
              <span className="ea-chip ea-sw">
                <img src={asset("03-filosofi-deck/chip-1-quran.webp")} alt="" width={44} height={44} />
              </span>{" "}
              <span className="ea-sw">Gongaji </span>
              <br />
              {"menghubungkan tilawah harian dengan".split(" ").map((w, i) => (
                <span key={"c" + i} className="ea-sw">
                  {w}{" "}
                </span>
              ))}{" "}
              <span className="ea-chip ea-sw">
                <img src={asset("03-filosofi-deck/chip-2-mentor.webp")} alt="" width={44} height={44} />
              </span>{" "}
              <span className="ea-sw">mentor </span>
              <span className="ea-sw">dan kebaikan.</span>
            </p>
            <div className="ea-iconrow" aria-hidden="true">
              <Svg d={ICON.book} size={14} />
              <Svg d={ICON.grid} size={14} />
              <Svg d={ICON.heart} size={14} />
            </div>
            <span className="ea-tag ea-ink ea-t6">Pemula 1 – Mahir 2</span>
            <span className="ea-tag ea-blue ea-t7">25+ fitur ibadah</span>
          </div>

          <div ref={folder} className="ea-folder" aria-hidden="true">
            <div className="ea-folder-tab">
              <span>Ekosistem</span>
              <b>
                <i className="ea-dot" /> Gongaji
              </b>
            </div>
            <div className="ea-folder-bar">
              <span>Baca · Belajar · Berbagi</span>
            </div>
          </div>

          <div ref={vision} className="ea-vision">
            <span className="ea-eye">
              <GongajiMarkIcon size={20} />
            </span>
            <h2 className="ea-h2 ea-mid">
              <Words parts={["Teknologi yang membuat", "\n", "Al-Qur’an terasa lebih dekat."]} />
            </h2>
            <p className="ea-small ea-wrapv">
              <Words parts={["Kami membangun Gongaji agar siapa pun dapat membaca, belajar, dan berbagi kebaikan tanpa bingung mulai dari mana."]} at={7} />
            </p>
            <a className="ea-textlink ea-late" href="#fitur">
              Lihat fitur utama
            </a>
          </div>
          <div className="ea-doodles" aria-hidden="true">
            {DOODLES.slice(0, 9).map((d, i) => (
              <span key={i} className="ea-doodle" style={{ ["--i" as string]: i } as CSSProperties}>
                <Svg d={d} size={40} stroke={1.3} />
              </span>
            ))}
          </div>

          <div className="ea-deck" aria-hidden="true">
            {DECK2_CARDS.map((card, j) => {
              if (card.kind === "info") {
                return (
                  <div key="info" ref={(el) => { deck2.current[j] = el }} className="ea-card ea-info">
                    <span className="ea-info-dot" />
                    <b>
                      Qursus
                      <br />
                      by Gongaji
                    </b>
                    <small>5 Level · 3 Bulan / Level</small>
                    <p>Kelas live online 5–8 orang bersama mentor bersertifikat, dengan kelas ikhwan dan akhwat terpisah.</p>
                  </div>
                )
              }
              if (card.kind === "tilawah") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="ea-card ea-c2 ea-s2 ea-s2-purple">
                    <div className="ea-s2-top">
                      <span className="ea-s2-pill">{card.badge}</span>
                      <img src={asset(card.icon)} alt="" width={44} height={44} className="ea-s2-ico" />
                    </div>
                    <div className="ea-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                    <div className="ea-s2-foot">
                      <div className="ea-s2-bar">
                        <i style={{ width: "72%" }} />
                      </div>
                      <span>{card.meta}</span>
                    </div>
                  </div>
                )
              }
              if (card.kind === "murottal") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="ea-card ea-c2 ea-s2 ea-s2-lav">
                    <div className="ea-s2-top">
                      <span className="ea-s2-pill ea-s2-pill-dark">{card.badge}</span>
                      <img src={asset(card.icon)} alt="" width={44} height={44} className="ea-s2-ico" />
                    </div>
                    <div className="ea-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                    <div className="ea-s2-foot">
                      <div className="ea-s2-wave">
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
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="ea-card ea-c2 ea-s2-photo">
                    <img src={asset(card.photo)} alt="" width={230} height={230} draggable={false} />
                    <div className="ea-s2-scrim" />
                    <span className="ea-s2-pill ea-s2-pill-gold ea-s2-photo-badge">{card.badge}</span>
                    <div className="ea-s2-photo-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                  </div>
                )
              }
              if (card.kind === "features") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="ea-card ea-c2 ea-s2 ea-s2-teal">
                    <div className="ea-s2-grid">
                      {card.icons.map((ic) => (
                        <span key={ic} className="ea-s2-tile">
                          <img src={asset(ic)} alt="" width={34} height={34} />
                        </span>
                      ))}
                    </div>
                    <div className="ea-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                  </div>
                )
              }
              if (card.kind === "rapor") {
                return (
                  <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="ea-card ea-c2 ea-s2 ea-s2-white">
                    <div className="ea-s2-top">
                      <span className="ea-s2-pill ea-s2-pill-dark">{card.badge}</span>
                      <span className="ea-s2-mint">5 Level</span>
                    </div>
                    <div className="ea-s2-levels">
                      {card.levels.map((lv, li) => (
                        <span key={lv} className={li === 2 ? "on" : li < 2 ? "done" : ""}>
                          {lv}
                        </span>
                      ))}
                    </div>
                    <div className="ea-s2-copy">
                      <b>{card.title}</b>
                      <small>{card.sub}</small>
                    </div>
                  </div>
                )
              }
              return (
                <div key={card.kind} ref={(el) => { deck2.current[j] = el }} className="ea-card ea-c2 ea-s2 ea-s2-gold">
                  <div className="ea-s2-top">
                    <span className="ea-s2-pill ea-s2-pill-ink">{card.badge}</span>
                    <img src={asset(card.icon)} alt="" width={44} height={44} className="ea-s2-ico" />
                  </div>
                  <div className="ea-s2-copy">
                    <b>{card.title}</b>
                    <small>{card.sub}</small>
                  </div>
                  <div className="ea-s2-foot">
                    <span className="ea-s2-ver">{card.meta}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <span className="ea-tag ea-orange ea-t8">@qupeduli</span>
        </div>
      </section>

      {/* ---------- drifting feature icons & mentor bands ---------- */}
      <section ref={bands} className="ea-bands" aria-label="Fitur dan Pengajar Gongaji">
        <div ref={bandA} className="ea-band ea-band-a" aria-hidden="true">
          {BAND_TOP_ASSETS.map((item, i) => (
            <span
              key={item.path + i}
              className="ea-av ea-av-icon"
              style={{ ["--y" as string]: ((i * 37) % 5) * 12 - 24 + "px", backgroundColor: item.bg } as CSSProperties}
            >
              <img src={asset(item.path)} alt="" width={88} height={88} />
            </span>
          ))}
        </div>
        <div className="ea-bands-mid" data-rv>
          <span className="ea-spark" aria-hidden="true">
            <GongajiMarkIcon size={18} />
          </span>
          <h2 className="ea-h2 ea-center">
            <Words parts={["25+ fitur ibadah &", "\n", "pengajar bersertifikat"]} />
          </h2>
          <p className="ea-small ea-center">
            <Words parts={["Dari target tilawah, murottal 11 qari, 300+ buku di Qu-Lib, hingga kelas Qursus."]} at={6} />
          </p>
        </div>
        <div ref={bandB} className="ea-band ea-band-b" aria-hidden="true">
          {BAND_BOT_ASSETS.map((item, i) => (
            <span
              key={item.path + i}
              className={"ea-av" + (item.kind === "icon" ? " ea-av-icon" : " ea-av-portrait")}
              style={{ ["--y" as string]: ((i * 53) % 5) * 12 - 24 + "px", backgroundColor: item.bg } as CSSProperties}
            >
              <img src={asset(item.path)} alt="" width={88} height={88} />
            </span>
          ))}
        </div>
      </section>

      {/* ---------- ecosystem bento ---------- */}
      <section id="fitur" className="ea-sec ea-story" aria-label="Pilar Ekosistem Gongaji">
        <div className="ea-wrap">
          <div data-rv className="ea-center-head">
            <p className="ea-eyebrow">
              <Words parts={["PILAR EKOSISTEM", ["GONGAJI", "ea-bluew"]]} />
            </p>
            <h2 className="ea-h2 ea-center">
              <Words parts={["Setiap langkah", "\n", "punya arti"]} at={3} />
            </h2>
          </div>
          <div className="ea-bento">
            <div className="ea-col">
              <article className="ea-bcard ea-b1" data-rv>
                <span className="ea-label">
                  <Svg d={ICON.download} size={10} stroke={2} /> Gongaji App · 4,8★ &amp; 4,9★
                </span>
                <div className="ea-pile" aria-hidden="true">
                  <div className="ea-pcard ea-pc1">
                    <div className="ea-pc-top">
                      <span className="ea-pc-pill">TARGET</span>
                      <img src={asset("05-bento-pilar/tafsir.webp")} alt="" width={24} height={24} className="ea-pc-ico" />
                    </div>
                    <div className="ea-pc-mid">
                      <strong>30 Hari</strong>
                      <span>Khatam · Hari ke-12</span>
                    </div>
                    <div>
                      <div className="ea-pc-bar"><i style={{ width: "72%" }} /></div>
                      <span className="ea-pc-meta">Al-Baqarah : 142</span>
                    </div>
                  </div>
                  <div className="ea-pcard ea-pc2">
                    <div className="ea-pc-top">
                      <span className="ea-pc-pill ea-pc-pill-w">BANDUNG</span>
                      <img src={asset("05-bento-pilar/jadwal-sholat.webp")} alt="" width={24} height={24} className="ea-pc-ico" />
                    </div>
                    <div className="ea-pc-mid">
                      <strong>04:03</strong>
                      <span>Subuh · Quran Booster</span>
                    </div>
                    <div className="ea-pc-chips">
                      <span>Tilawah</span>
                      <span>Hafalan</span>
                    </div>
                  </div>
                  <div className="ea-pcard ea-pc3">
                    <div className="ea-pc-top">
                      <span className="ea-pc-pill ea-pc-pill-y">MUROTTAL</span>
                      <img src={asset("05-bento-pilar/dzikir.webp")} alt="" width={24} height={24} className="ea-pc-ico" />
                    </div>
                    <div className="ea-pc-mid">
                      <strong>11 Qari</strong>
                      <span>Tikrar &amp; Ayat Terakhir</span>
                    </div>
                    <div className="ea-pc-bars">
                      <i style={{ height: "42%" }} />
                      <i style={{ height: "85%" }} />
                      <i style={{ height: "62%" }} />
                      <i style={{ height: "100%" }} />
                      <i style={{ height: "70%" }} />
                      <i style={{ height: "48%" }} />
                    </div>
                  </div>
                  <span className="ea-tag ea-blue ea-t9">25+ fitur</span>
                </div>
                <h3 className="ea-h4">01 — Gongaji App: Bangun Kebiasaan Tilawah</h3>
                <p className="ea-small">
                  Target khatam santai atau 30 hari, penanda ayat terakhir, murottal 11 qari, hafalan metode tikrar, hingga jadwal shalat &amp; arah kiblat.
                </p>
                <a className="ea-chipbtn" href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer">
                  Unduh di Google Play
                </a>
              </article>
              <article className="ea-bcard ea-img" data-rv>
                <div className="ea-photo">
                  <img src={asset("05-bento-pilar/card2-qursus.webp")} alt="Pengajar Qursus mendampingi peserta secara daring" width={1600} height={900} style={{ objectPosition: "50% 25%" }} />
                  <div className="ea-ph-badge" aria-hidden="true">
                    <strong>Kelas Live · 5–8 Peserta</strong>
                    <span>Pemula 1 – Mahir 2 · Rapor &amp; Sertifikat</span>
                  </div>
                </div>
                <h3 className="ea-h4">02 — Qursus: Belajar Ngaji Lebih Terarah</h3>
                <p className="ea-small">
                  Kelas live grup kecil 5–8 peserta berjenjang dari Pemula 1 hingga Mahir 2, dipisah ikhwan dan akhwat, lengkap dengan rapor dan sertifikat.
                </p>
                <a className="ea-chipbtn" href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                  Pelajari Qursus
                </a>
              </article>
            </div>
            <div className="ea-col ea-col-r">
              <article id="qupeduli" className="ea-bcard ea-img" data-rv>
                <div className="ea-photo ea-quph">
                  <img src={asset("05-bento-pilar/card3-qupeduli.webp")} alt="Program penyaluran mushaf dan donasi QuPeduli by Gongaji" width={1600} height={1000} style={{ objectPosition: "35% 30%" }} />
                  <div className="ea-qu-card" aria-hidden="true">
                    <div className="ea-qu-top">
                      <img src={asset("05-bento-pilar/donasi.webp")} alt="" width={22} height={22} />
                      <span>Terverifikasi</span>
                    </div>
                    <strong>Mushaf Santri Garut</strong>
                    <div className="ea-qu-bar"><i style={{ width: "64%" }} /></div>
                    <small>Rp38,5 jt / Rp60 jt · 412 donatur</small>
                  </div>
                </div>
                <h3 className="ea-h4">03 — QuPeduli: Kebaikan dari Rasa Percaya</h3>
                <p className="ea-small">
                  Platform donasi online, sedekah, dan wakaf bersama Yayasan Quran Bina Bangsa (Qubba Foundation) dengan rincian dana &amp; laporan penyaluran terbuka.
                </p>
                <a className="ea-chipbtn" href="#artikel">
                  Lihat Program Aktif
                </a>
              </article>
              <article className="ea-bcard ea-phone-wrap" data-rv>
                <span className="ea-pen" aria-hidden="true">
                  <Svg d={ICON.book} size={13} />
                </span>
                <div className="ea-phone">
                  <div className="ea-ph-status">
                    <span>04:03 · Subuh</span>
                    <span>Bandung</span>
                  </div>
                  <div className="ea-ph-hero">
                    <small>Quran Booster</small>
                    <b>#JadiLebihMudah</b>
                    <div className="ea-ph-pills">
                      <span>Tilawah · Juz 12</span>
                      <span>Hafalan · Tikrar</span>
                    </div>
                  </div>
                  <div className="ea-ph-qulib">
                    <img src={asset("05-bento-pilar/tafsir.webp")} alt="" width={34} height={34} aria-hidden="true" />
                    <div>
                      <strong>Qu-Lib · 300+ Buku</strong>
                      <span>Tafsir, Sirah &amp; Referensi Islami</span>
                    </div>
                  </div>
                  <div className="ea-ph-foot">
                    <em>Baca. Belajar. Berbagi.</em>
                    <small>Yayasan Quran Bina Bangsa</small>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- articles & campaigns carousel ---------- */}
      <section id="artikel" className="ea-sec ea-market" aria-label="Artikel dan Program QuPeduli">
        <div className="ea-wrap">
          <div className="ea-market-grid">
            <div data-rv className="ea-market-head">
              <p className="ea-eyebrow">
                <Words parts={["WAWASAN &", ["PROGRAM", "ea-purplew"]]} />
              </p>
              <h2 className="ea-h2">
                <Words parts={["Artikel &", "\n", "Program Kebaikan"]} at={2} />
              </h2>
              <p className="ea-small ea-wrapm">
                <Words parts={["Panduan praktis membaca Al-Qur’an, tilawah harian, serta campaign QuPeduli yang sedang berjalan."]} at={5} />
              </p>
              <div className="ea-mini-arrows ea-arc-arrows">
                <button type="button" aria-label="Item sebelumnya" onClick={() => setArc((a) => Math.max(0, a - 1))} disabled={arc === 0}>
                  <Svg d={ICON.left} size={11} stroke={2} />
                </button>
                <button
                  type="button"
                  aria-label="Item berikutnya"
                  onClick={() => setArc((a) => Math.min(CAROUSEL_ITEMS.length - 4, a + 1))}
                  disabled={arc >= CAROUSEL_ITEMS.length - 4}
                >
                  <Svg d={ICON.right} size={11} stroke={2} />
                </button>
              </div>
            </div>
            <div className="ea-market-right" data-rv>
              <a className="ea-viewall" href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Buka Qursus
              </a>
              <div className="ea-rail">
                <div className="ea-rail-track" style={{ ["--ci" as string]: arc } as CSSProperties}>
                  {CAROUSEL_ITEMS.map((item, i) => (
                    <figure key={item.title} className="ea-arc" style={{ ["--i" as string]: i } as CSSProperties}>
                      <div>
                        <img
                          src={asset(item.path)}
                          alt={item.title}
                          width={220}
                          height={220}
                          className={item.cls}
                        />
                      </div>
                      <figcaption>
                        <span className="ea-arc-tag">{item.tag}</span>
                        {item.title}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
              <div className="ea-progress" aria-hidden="true">
                <i style={{ ["--ci" as string]: arc } as CSSProperties} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- stage 3: banner → mentor & learner wall ---------- */}
      <section ref={s3} id="qursus" className="ea-stage" style={stage(3)} aria-label="Pengajar dan Peserta Qursus">
        <div ref={pin3} className="ea-pin" style={{ height }}>
          <div ref={appRow} className="ea-lead">
            <p className="ea-eyebrow">
              PENGAJAR <span className="ea-orangew">QURSUS</span>
            </p>
            <h2 className="ea-h2 ea-center">
              Kamu tidak belajar
              <br />
              sendirian.
            </h2>
            <p className="ea-small ea-center">
              Ustadz &amp; Ustadzah Qursus mendampingi setiap kelas, mendengarkan bacaanmu, dan mencatat perkembanganmu.
            </p>
          </div>
          {WALL_ASSETS.map((item, i) =>
            item.path ? (
              <div
                key={item.path + i}
                ref={(el) => { wall.current[i] = el }}
                className="ea-wall"
                style={{ backgroundColor: item.bg }}
                aria-hidden="true"
              >
                <img src={asset(item.path)} alt="" width={195} height={210} className="ea-portrait" />
              </div>
            ) : null,
          )}
          <div ref={banner} className="ea-orange">
            <img src={asset("07-mentor-wall/mentor-center.webp")} alt="Pengajar Qursus tersenyum saat membimbing kelas daring" width={1600} height={900} />
            <div className="ea-orange-scrim" aria-hidden="true" />
            <div className="ea-orange-ui">
              <span className="ea-tag ea-redtag ea-t10">@qursus.gongaji</span>
              <button type="button" className={"ea-like" + (liked ? " on" : "")} aria-pressed={liked} onClick={() => setLiked((l) => !l)}>
                <Svg d={ICON.heart} size={10} fill={liked ? "currentColor" : "none"} stroke={2} />
                {liked ? "Disukai" : "Suka"}
              </button>
              <div className="ea-by">
                <img src={asset("07-mentor-wall/dian.webp")} alt="" width={28} height={28} />
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
      <section id="pricing" className="ea-sec ea-price" aria-label="Biaya Qursus">
        <div className="ea-wrap ea-price-grid">
          <div data-rv>
            <span className="ea-eye">
              <Svg d={ICON.spark} size={15} />
            </span>
            <h2 className="ea-h3">
              <Words parts={["Biaya Qursus"]} />
            </h2>
            <p className="ea-small ea-wrapp">
              <Words
                parts={["Harga sama untuk semua level dari Pemula 1 hingga Mahir 2. Termasuk kelas live 3 bulan, evaluasi, rapor, dan sertifikat."]}
                at={2}
              />
            </p>
          </div>
          <div className="ea-plans" data-rv>
            <div className="ea-plan ea-p1">
              <small>Bayar Penuh</small>
              <b>
                <sup>Rp</sup>699<small>rb</small>
              </b>
              <em>Per level · Hemat Rp51.000</em>
            </div>
            <div className="ea-plan ea-p2">
              <small>Bertahap</small>
              <span className="ea-pop-pill">Populer</span>
              <b>
                <sup>Rp</sup>750<small>rb</small>
              </b>
              <em>Dicicil selama 3 bulan</em>
            </div>
            <div className="ea-plan ea-p3">
              <small>Beasiswa</small>
              <b>
                <sup>Rp</sup>0<small>/batch</small>
              </b>
              <em>Jalur beasiswa Pemula 1–3</em>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- lime marquee + falling doodles ---------- */}
      <section ref={limeRef} className="ea-sec ea-lime-sec" aria-label="Ajakan Ekosistem Gongaji">
        <div className="ea-lime">
          <span className="ea-water" aria-hidden="true">
            GONGAJI
          </span>
          <div className="ea-marquee">
            <div ref={limeTrack} className="ea-mtrack">
              {[0, 1].map((rep) => (
                <span key={rep} className="ea-mrun" aria-hidden={rep === 1}>
                  Baca. Belajar. Berbagi.
                  <span className="ea-mthumbs">
                    <i style={{ background: "#5145B9" }} />
                    <img src={asset("08-lime-marquee/thumb-1-app-home.webp")} alt="" width={44} height={44} />
                    <img src={asset("08-lime-marquee/thumb-2-app-quran.webp")} alt="" width={44} height={44} />
                    <small>#JADILEBIHMUDAH</small>
                  </span>
                  50rb+ Download di Android &amp; iOS
                  <span className="ea-mthumbs">
                    <img src={asset("08-lime-marquee/thumb-3-teaching-smile.webp")} alt="" width={44} height={44} />
                  </span>
                  Qursus 5 Level Pemula–Mahir
                  <span className="ea-mthumbs">
                    <img src={asset("08-lime-marquee/thumb-4-qursus-murid.webp")} alt="" width={44} height={44} />
                  </span>
                  QuPeduli · Qubba Foundation
                  <span className="ea-mthumbs">
                    <img src={asset("08-lime-marquee/thumb-5-teaching-mushaf.webp")} alt="" width={44} height={44} />
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div ref={pile} className="ea-pilebox" aria-hidden="true">
            {DOODLES.map((d, i) => (
              <span key={i} ref={(el) => { balls.current[i] = el }} className="ea-ball">
                <Svg d={d} size={34} stroke={1.4} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- duo: download Gongaji App + daftar Qursus ---------- */}
      <section id="download" className="ea-sec ea-duo" aria-label="Mulai Bersama Gongaji">
        <div className="ea-wrap ea-duo-grid">
          <article className="ea-meet" data-rv>
            <img src={asset("09-download-cta/card-download.webp")} alt="Aplikasi dan pembelajaran Al-Qur'an Gongaji" width={590} height={650} />
            <div>
              <Svg d={ICON.download} size={14} />
              <h3 className="ea-h3">
                Unduh
                <br />
                <span>Gongaji App</span>
              </h3>
              <p className="ea-small">Tersedia gratis di Google Play (4,8★) dan App Store (4,9★). Mulai kebiasaan tilawahmu hari ini.</p>
              <div className="ea-store-row">
                <a className="ea-store-badge" href={GONGAJI_LINKS.playStore} target="_blank" rel="noopener noreferrer" aria-label="Download Gongaji di Google Play">
                  <img src={asset("09-download-cta/badge-google-play.svg")} alt="" height={40} />
                </a>
                <a className="ea-store-badge" href={GONGAJI_LINKS.appStore} target="_blank" rel="noopener noreferrer" aria-label="Download Gongaji di App Store">
                  <img src={asset("09-download-cta/badge-app-store.svg")} alt="" height={40} />
                </a>
              </div>
            </div>
          </article>
          <article className="ea-arch" data-rv>
            <img src={asset("09-download-cta/card-qursus.webp")} alt="Dashboard murid Qursus by Gongaji" width={575} height={650} />
            <div>
              <Svg d={ICON.spark} size={14} />
              <h3 className="ea-h3">
                Mulai Belajar
                <br />
                di Qursus
              </h3>
              <p className="ea-small">Ikuti asesmen awal, pilih jadwal kelas live kecil bersama pengajar bersertifikat, dan pantau rapor progresmu.</p>
              <a className="ea-btn" href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Daftar Qursus
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="ea-foot">
        <div className="ea-wrap ea-foot-grid">
          <div>
            <h2 className="ea-h4">
              Baca. Belajar. Berbagi. <span className="ea-foot-dots">#JadiLebihMudah</span>
            </h2>
            <p className="ea-small">
              Membantu siapa pun membaca, belajar, dan berbagi kebaikan bersama Al-Qur’an. QuPeduli dikelola oleh Yayasan Quran Bina Bangsa (Qubba Foundation).
            </p>
            <a className="ea-mail" href={mail}>
              {email}
            </a>
            <span className="ea-contact-meta">
              {GONGAJI_LINKS.whatsapp} · {GONGAJI_LINKS.instagram}
            </span>
            <div className="ea-socials">
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
              <i className="ea-dot" />{" "}
              <a href={GONGAJI_LINKS.qursus} target="_blank" rel="noopener noreferrer">
                Qursus
              </a>{" "}
              <span className="ea-new">Live</span>
            </li>
            <li>
              <a href="#qupeduli">QuPeduli</a>
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
              <i className="ea-dot" /> <a href="#pricing">Biaya &amp; Beasiswa</a>
            </li>
            <li>
              <a href="#artikel">
                Artikel Islami <span className="ea-soon">10+</span>
              </a>
            </li>
          </ul>
          <ul>
            <li>Qubba Foundation</li>
            <li>
              <a href={mail}>Kontak Kami</a>
            </li>
            <li>
              Kemitraan <span className="ea-soon">Mitra</span>
            </li>
          </ul>
          <p className="ea-copy">© 2026 Gongaji. Semua hak dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}

const EASE = "cubic-bezier(.22,1,.36,1)"

const CSS =
  ".ea-root{--bg:#f6f6f5;--ink:#141414;--mute:#666666;--soft:#bdbdbd;--card:#ffffff;--line:#e3e3e1;--foot:#efefee;--red:#5145b9;--blue:#5145b9;--mint:#a6e8c1;--purple:#736ac8;--lime:#e6fa6a;--orange:#5145b9;--sun:#ffda03;" +
  "position:relative;width:100%;overflow:clip;background:var(--bg);color:var(--ink);font-family:'Instrument Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;font-weight:400;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;letter-spacing:-.01em;line-height:1.4;transition:background-color .4s ease,color .4s ease}" +
  ".dark .ea-root,.ea-root.ea-dark{--bg:#0f0f10;--ink:#f1f1ef;--mute:#a3a3a0;--soft:#4a4a4c;--card:#19191b;--line:#2b2b2d;--foot:#151517;--red:#aba6de;--blue:#6c60d8;--orange:#5145b9}" +
  ".ea-root *,.ea-root *::before,.ea-root *::after{box-sizing:border-box}" +
  ".ea-root :focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:8px}" +
  ".ea-root img{max-width:none}" +
  ".ea-root :where(img){display:block;user-select:none;-webkit-user-drag:none}" +
  ".ea-root :where(a){color:inherit;text-decoration:none}" +
  ".ea-root :where(button){font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}" +
  ".ea-root :where(h1,h2,h3,h4,p,ul,figure){margin:0;padding:0}" +
  ".ea-root :where(ul){list-style:none}" +
  ".ea-wrap{width:100%;max-width:1440px;margin:0 auto;padding:0 clamp(20px,7.1vw,102px)}" +
  // nav
  ".ea-nav{position:sticky;top:0;z-index:40;height:110px;margin-bottom:-110px;display:flex;align-items:center;gap:24px;padding:30px clamp(20px,5.6vw,80px) 0;pointer-events:none}" +
  ".ea-nav>*{pointer-events:auto}" +
  ".ea-nav::before{content:'';position:absolute;left:0;right:0;top:0;bottom:12px;z-index:-1;background:rgba(246,246,245,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 1px 0 var(--line);opacity:0;transition:opacity .35s ease}" +
  ".dark .ea-nav::before,.ea-dark .ea-nav::before{background:rgba(15,15,16,.8)}" +
  ".ea-nav.ea-solid::before{opacity:1}" +
  ".ea-brand{display:inline-flex;align-items:center;margin-right:auto}" +
  ".ea-brand-svg{height:24px;width:auto;display:block}" +
  ".ea-links{display:flex;align-items:center;gap:clamp(18px,2.4vw,34px);font-size:13px;font-weight:500}" +
  ".ea-link{position:relative;display:inline-flex;align-items:center;gap:6px;padding:4px 0}" +
  ".ea-link::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s " + EASE + "}" +
  ".ea-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--blue);box-shadow:inset 0 0 0 2px var(--blue),inset 0 0 0 3px var(--bg)}" +
  ".ea-tools{display:flex;gap:8px;margin-left:clamp(12px,3vw,48px)}" +
  ".ea-round{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--card);box-shadow:0 1px 0 var(--line);transition:transform .3s " + EASE + "}" +
  // shared type
  ".ea-h1{font-size:clamp(38px,5.6vw,80px);line-height:1.05;letter-spacing:-.045em;font-weight:500;text-align:center}" +
  ".ea-h2{font-size:clamp(34px,4.6vw,66px);line-height:1.06;letter-spacing:-.04em;font-weight:500}" +
  ".ea-h2.ea-big{font-size:clamp(36px,4.85vw,70px)}" +
  ".ea-h2.ea-mid{font-size:clamp(28px,3vw,44px)}" +
  ".ea-h3{font-size:clamp(26px,2.65vw,38px);line-height:1.1;letter-spacing:-.035em;font-weight:500}" +
  ".ea-h4{font-size:17px;line-height:1.25;letter-spacing:-.02em;font-weight:600}" +
  ".ea-center{text-align:center}" +
  ".ea-eyebrow{font-size:10px;letter-spacing:.32em;font-weight:600;text-transform:uppercase;margin-bottom:16px}" +
  ".ea-body{font-size:13px;line-height:1.7}" +
  ".ea-small{font-size:12.5px;line-height:1.6;color:var(--mute)}" +
  ".ea-red{color:var(--red)}" +
  ".ea-grey{color:var(--mute)}" +
  ".ea-bluew{color:var(--blue)}" +
  ".ea-purplew{color:var(--purple)}" +
  ".ea-orangew{color:var(--orange)}" +
  // word reveal
  ".ea-w{display:inline-block;opacity:0;filter:blur(8px);transform:translate3d(0,.25em,0);transition:opacity .7s " + EASE + ",filter .7s " + EASE + ",transform .7s " + EASE + ";transition-delay:calc(var(--i) * 70ms)}" +
  ".ea-in .ea-w{opacity:1;filter:blur(0);transform:none}" +
  ".ea-late{opacity:0;transform:translate3d(0,14px,0);transition:opacity .7s " + EASE + " .55s,transform .7s " + EASE + " .55s}" +
  ".ea-in .ea-late,.ea-in.ea-late{opacity:1;transform:none}" +
  ".ea-fade{opacity:0;transform:translate3d(0,14px,0);transition:opacity .8s " + EASE + " var(--d),transform .8s " + EASE + " var(--d)}" +
  ".ea-in .ea-fade{opacity:1;transform:none}" +
  // buttons, tags
  ".ea-btns{display:flex;align-items:center;gap:22px}" +
  ".ea-btn{display:inline-flex;align-items:center;height:40px;padding:0 22px;border-radius:999px;background:var(--ink);color:var(--bg);font-size:12px;font-weight:500;white-space:nowrap;transition:transform .35s " + EASE + ",box-shadow .35s " + EASE + "}" +
  ".ea-btn-w{background:#fff;color:#141414}" +
  ".ea-ghost,.ea-textlink{font-size:12px;font-weight:500;position:relative}" +
  ".ea-ghost::after,.ea-textlink::after{content:'';position:absolute;left:0;right:0;bottom:-3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:100% 50%;transition:transform .45s " + EASE + "}" +
  ".ea-tag{position:absolute;z-index:30;display:inline-flex;align-items:center;height:30px;padding:0 13px;border-radius:999px;font-size:13px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;opacity:0;transform:translate3d(0,8px,0) scale(.6) rotate(var(--r,0deg));transition:opacity .45s " + EASE + ",transform .6s cubic-bezier(.34,1.56,.64,1);pointer-events:none}" +
  ".ea-tag::after{content:'';position:absolute;left:50%;bottom:-5px;width:10px;height:10px;margin-left:-5px;background:inherit;transform:rotate(45deg);border-radius:2px;z-index:-1}" +
  ".ea-blue{background:#5145b9;color:#fff}" +
  ".ea-mint{background:#a6e8c1;color:#0f5b38}" +
  ".ea-redtag{background:#ffda03;color:#141414}" +
  ".ea-ink{background:#141414;color:#fff}" +
  ".ea-orange{background:#5145b9;color:#fff}" +
  ".ea-pop.ea-tag{position:absolute}" +
  ".ea-in .ea-pop,.ea-tags1 .ea-t1,.ea-tags1 .ea-t2,.ea-tags2 .ea-t3,.ea-tags2 .ea-t4{opacity:1;transform:translate3d(0,0,0) scale(1) rotate(var(--r,0deg))}" +
  // pinned stages
  ".ea-stage{position:relative}" +
  ".ea-pin{position:sticky;top:0;overflow-x:clip;overflow-y:visible;min-height:520px}" +
  ".ea-deck{position:absolute;inset:0;pointer-events:none}" +
  ".ea-card{position:absolute;left:0;top:0;border-radius:16px;overflow:hidden;background:var(--card);box-shadow:0 30px 54px -26px rgba(18,17,24,.46),0 0 0 1px rgba(18,17,24,.06);will-change:transform;backface-visibility:hidden;opacity:0}" +
  ".ea-ready .ea-card{opacity:1}" +
  ".ea-card img{width:100%;height:100%;object-fit:cover}" +
  ".ea-shot{object-position:50% 8%!important}" +
  ".ea-portrait{object-position:50% 18%!important}" +
  ".ea-c1{width:260px;height:282px}" +
  ".ea-s1{padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:10px}" +
  ".ea-s1-indigo{background:radial-gradient(circle at 82% 16%,rgba(167,159,248,.34),transparent 54%),linear-gradient(150deg,#3a3088,#5145b9);color:#fff}" +
  ".ea-s1-periwinkle{background:radial-gradient(circle at 55% 32%,#d4d0fa,#958de2);color:#171333}" +
  ".ea-s1-sunburst{background:radial-gradient(circle at 55% 32%,#ffec94,#f8be24);color:#141414}" +
  ".ea-s1-rose{background:radial-gradient(circle at 55% 32%,#ff9bb0,#da4d6e);color:#fff}" +
  ".ea-s1-dark{background:radial-gradient(circle at 80% 18%,rgba(124,113,232,.36),transparent 54%),#171528;color:#fff;border:1px solid rgba(255,255,255,.1)}" +
  ".ea-s1-teal{background:linear-gradient(150deg,#0fa39d,#06767d);color:#fff}" +
  ".ea-s1-mint{background:radial-gradient(circle at 55% 34%,#c6f6db,#6fd49c);color:#0f3923}" +
  ".ea-s1-app{background:radial-gradient(circle at 86% 14%,rgba(166,232,193,.48),transparent 46%),radial-gradient(circle at 18% 82%,rgba(171,166,222,.5),transparent 52%),#f3f2fc;color:#141414;padding:12px 12px 0;display:flex;flex-direction:column;justify-content:space-between;gap:8px}" +
  ".ea-s1-cut{position:absolute!important;left:45%;bottom:0;transform:translateX(-50%);width:86%!important;height:82%!important;object-fit:contain!important;object-position:50% 100%!important;filter:drop-shadow(0 12px 24px rgba(0,0,0,.22))}" +
  ".ea-s1-mcut{position:absolute!important;left:50%;bottom:10px;transform:translateX(-50%);width:88%!important;height:78%!important;object-fit:contain!important;object-position:50% 50%!important;filter:drop-shadow(0 14px 26px rgba(100,14,38,.28))}" +
  ".ea-s1-phead{position:relative;z-index:2;padding:14px;display:flex;flex-direction:column;align-items:flex-start;gap:4px}" +
  ".ea-s1-phead small{font-size:10px;font-weight:600;opacity:.88}" +
  ".ea-s1-pdark small{color:#171333;opacity:.86}" +
  ".ea-s1-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}" +
  ".ea-s1-ico{width:38px!important;height:38px!important;object-fit:contain!important;flex:none}" +
  ".ea-s1-pill{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);color:#fff;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}" +
  ".ea-s1-pill-ink{background:#141414;color:#fff;text-transform:none;letter-spacing:-.01em}" +
  ".ea-s1-pill-indigo{background:#5145b9;color:#fff;text-transform:none;letter-spacing:-.01em}" +
  ".ea-s1-pill-gold{background:#ffda03;color:#141414;text-transform:none;letter-spacing:-.01em}" +
  ".ea-s1-copy{display:flex;flex-direction:column;gap:4px}" +
  ".ea-s1-copy b{font-size:18px;font-weight:600;letter-spacing:-.025em;line-height:1.12}" +
  ".ea-s1-copy-sm b{font-size:15.5px}" +
  ".ea-s1-copy small{font-size:10.5px;color:rgba(255,255,255,.84);line-height:1.3}" +
  ".ea-s1-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
  ".ea-s1-tile{height:54px;border-radius:12px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.22);display:grid;place-items:center}" +
  ".ea-s1-timg{width:34px!important;height:34px!important;object-fit:contain!important}" +
  ".ea-s1-foot{display:flex;flex-direction:column;gap:6px}" +
  ".ea-s1-foot span{font-size:11px;font-weight:500;color:rgba(255,255,255,.88)}" +
  ".ea-s1-bar{height:6px;border-radius:999px;background:rgba(255,255,255,.24);overflow:hidden}" +
  ".ea-s1-bar i{display:block;height:100%;border-radius:999px;background:#ffda03}" +
  ".ea-s1-chips{display:flex;flex-direction:column;gap:6px}" +
  ".ea-s1-chips span{font-size:11px;font-weight:600;padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.08);color:#fff}" +
  ".ea-s1-apphead{display:flex;align-items:center;justify-content:space-between;gap:6px}" +
  ".ea-s1-phone{flex:1;min-height:0;border-radius:20px 20px 0 0;border:4px solid #161523;border-bottom:0;background:#fff;overflow:hidden;box-shadow:0 16px 32px -12px rgba(0,0,0,.45)}" +
  ".ea-s1-screen{width:100%!important;height:100%!important;object-fit:cover!important;object-position:50% 0%!important;display:block}" +
  ".ea-c2{width:230px;height:230px;border-radius:14px}" +
  ".ea-hero{position:absolute;left:0;right:0;top:clamp(120px,20.5vh,180px);display:flex;flex-direction:column;align-items:center;z-index:2;will-change:transform}" +
  ".ea-hero-foot{position:absolute;top:calc(80vh - clamp(120px,20.5vh,180px));left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center;padding:0 20px}" +
  ".ea-hero-foot p{font-size:13px;color:var(--ink)!important;max-width:460px}" +
  ".ea-t1{left:calc(50% - clamp(160px,25vw,360px));top:calc(clamp(120px,20.5vh,180px) + clamp(118px,16.5vh,152px));--r:-6deg}" +
  ".ea-t2{left:calc(50% + clamp(120px,24vw,350px));top:calc(clamp(120px,20.5vh,180px) + clamp(120px,17vh,160px));--r:8deg}" +
  ".ea-show{position:absolute;left:clamp(20px,7.1vw,102px);top:clamp(96px,13vh,112px);max-width:min(620px,92vw);z-index:2}" +
  ".ea-show .ea-btns{margin-top:clamp(22px,8vh,80px)}" +
  ".ea-wrapp{max-width:320px;margin-top:22px}" +
  ".ea-t3{left:calc(47% - 100px);top:calc(53% - 40px);--r:-4deg}" +
  ".ea-t4{left:calc(78%);top:58%;--r:5deg}" +
  ".ea-updown{position:absolute;right:clamp(20px,6.2vw,90px);top:48%;display:flex;flex-direction:column;gap:6px;color:var(--mute);z-index:2}" +
  // gateway
  ".ea-sec{position:relative}" +
  ".ea-gate{position:relative;padding:clamp(110px,15vh,150px) 0 0}" +
  ".ea-gate-head{position:relative;margin-bottom:28px}" +
  ".ea-t5{right:9%;bottom:6px;--r:9deg}" +
  ".ea-banner{position:relative;height:clamp(300px,36vw,520px);border-radius:16px;overflow:hidden;background:#3a3286;opacity:0;transform:translate3d(0,40px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".ea-banner.ea-in{opacity:1;transform:none}" +
  ".ea-banner img,.ea-banner-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%;opacity:0;transform:scale(1.04);transition:opacity .8s ease,transform 1.4s " + EASE + "}" +
  ".ea-banner img.on,.ea-banner-vid{opacity:1;transform:none}" +
  ".ea-banner-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,17,17,.12) 0%,rgba(17,17,17,.08) 45%,rgba(17,17,17,.65) 100%);pointer-events:none}" +
  ".ea-switch{position:absolute;left:24px;top:24px;display:flex;flex-direction:column;gap:6px;z-index:2}" +
  ".ea-switch i{width:34px;height:34px;border-radius:10px;background:#fff}" +
  ".ea-switch i+i{background:#5145b9}" +
  ".ea-slide-meta{position:absolute;left:24px;bottom:64px;z-index:2;color:#fff;display:flex;flex-direction:column;gap:2px}" +
  ".ea-slide-meta b{font-size:15px;font-weight:600;letter-spacing:-.01em}" +
  ".ea-slide-meta small{font-size:12px;color:rgba(255,255,255,.8)}" +
  ".ea-more{position:absolute;right:22px;top:16px;color:#fff;opacity:.8;z-index:2}" +
  ".ea-watch{position:absolute;left:24px;bottom:22px;z-index:2;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 16px;border-radius:999px;background:#fff;color:#141414;font-size:12.5px;font-weight:500}" +
  ".ea-arrows{position:absolute;right:22px;bottom:20px;z-index:2;display:flex;gap:6px}" +
  ".ea-arrows button{width:36px;height:36px;border-radius:50%;background:#fff;color:#141414;display:grid;place-items:center;transition:transform .3s " + EASE + "}" +
  // trusted
  ".ea-trust{padding:clamp(80px,13vh,130px) 0 clamp(40px,7vh,70px)}" +
  ".ea-trust-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px}" +
  ".ea-trust-head .ea-small{margin-top:10px}" +
  ".ea-mini-arrows{display:flex;gap:12px;color:var(--mute)}" +
  ".ea-mini-arrows button:disabled{opacity:.3;cursor:default}" +
  ".ea-logos{margin-top:clamp(36px,6vh,60px);overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}" +
  ".ea-logos-track{display:flex;width:max-content;animation:ea-marq 28s linear infinite}" +
  ".ea-logo-item{display:inline-flex;align-items:center;gap:8px;padding:0 clamp(28px,3.4vw,50px);font-size:clamp(17px,1.6vw,23px);font-weight:600;letter-spacing:-.02em;color:var(--mute);opacity:.8;white-space:nowrap}" +
  "@keyframes ea-marq{to{transform:translate3d(-50%,0,0)}}" +
  // whether
  ".ea-whether{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px;z-index:1}" +
  ".ea-ink-text{font-size:clamp(26px,3.9vw,56px);line-height:1.2;letter-spacing:-.04em;font-weight:500;text-align:center;max-width:1240px;margin-top:16vh}" +
  ".ea-sw{opacity:.18;transition:opacity .15s linear}" +
  ".ea-mintw{color:#5145b9}" +
  ".dark .ea-mintw,.ea-dark .ea-mintw{color:#aba6de}" +
  ".ea-chip{display:inline-block;vertical-align:-.12em;width:.85em;height:.85em;border-radius:.2em;overflow:hidden}" +
  ".ea-chip img{width:100%;height:100%;object-fit:cover}" +
  ".ea-iconrow{display:flex;gap:10px;margin-top:5vh;color:var(--ink)}" +
  ".ea-iconrow svg{width:22px;height:22px;padding:4px;border-radius:6px;background:var(--card)}" +
  ".ea-t6{left:14%;top:37%;--r:-5deg;opacity:1;transform:rotate(var(--r))}" +
  ".ea-t7{left:80%;top:38%;--r:7deg;opacity:1;transform:rotate(var(--r))}" +
  ".ea-t8{left:62%;top:44%;--r:-6deg}" +
  ".ea-doodled .ea-t8{opacity:0}" +
  ".ea-pin:not(.ea-doodled) .ea-t8{opacity:0}" +
  ".ea-info{width:230px;height:280px;padding:22px 20px;display:flex;flex-direction:column;gap:6px;background:var(--card);color:var(--ink)}" +
  ".ea-info b{font-size:15px;line-height:1.15;font-weight:600;letter-spacing:-.02em;padding-right:26px}" +
  ".ea-info small{font-size:10px;color:var(--mute)}" +
  ".ea-info p{margin-top:auto;font-size:11.5px;line-height:1.5;color:var(--mute)}" +
  ".ea-info-dot{position:absolute;right:18px;top:18px;width:22px;height:22px;border-radius:50%;background:var(--blue);box-shadow:inset 0 0 0 6px var(--blue),inset 0 0 0 8px var(--card)}" +
  // stage 2 folder cards (230x230 bespoke cards)
  ".ea-s2{padding:16px;display:flex;flex-direction:column;justify-content:space-between;gap:10px}" +
  ".ea-s2-purple{background:linear-gradient(145deg,#5145b9,#3a3286);color:#fff}" +
  ".ea-s2-lav{background:#f2f1fa;color:#141414}" +
  ".dark .ea-s2-lav,.ea-dark .ea-s2-lav{background:#221f3a;color:#f1f1ef}" +
  ".ea-s2-teal{background:linear-gradient(145deg,#009e97,#007d8a);color:#fff}" +
  ".ea-s2-white{background:var(--card);color:var(--ink);border:1px solid var(--line)}" +
  ".ea-s2-gold{background:linear-gradient(145deg,#ffda03,#f2b800);color:#141414}" +
  ".ea-s2-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}" +
  ".ea-s2-ico{width:42px!important;height:42px!important;object-fit:contain!important;flex:none}" +
  ".ea-s2-pill{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;background:rgba(255,255,255,.18);color:inherit;font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}" +
  ".ea-s2-pill-dark{background:rgba(81,69,185,.12);color:#5145b9}" +
  ".dark .ea-s2-pill-dark,.ea-dark .ea-s2-pill-dark{background:rgba(171,166,222,.16);color:#aba6de}" +
  ".ea-s2-pill-gold{background:#ffda03;color:#141414}" +
  ".ea-s2-pill-ink{background:#141414;color:#fff}" +
  ".ea-s2-mint{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;background:#a6e8c1;color:#0f5b38;font-size:9px;font-weight:600}" +
  ".ea-s2-copy{display:flex;flex-direction:column;gap:2px}" +
  ".ea-s2-copy b{font-size:15px;line-height:1.15;font-weight:600;letter-spacing:-.02em}" +
  ".ea-s2-copy small{font-size:10.5px;line-height:1.35;opacity:.78}" +
  ".ea-s2-foot{display:flex;flex-direction:column;gap:5px}" +
  ".ea-s2-foot span{font-size:9.5px;font-weight:500;opacity:.85}" +
  ".ea-s2-bar{height:5px;width:100%;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden}" +
  ".ea-s2-bar i{display:block;height:100%;border-radius:999px;background:#ffda03}" +
  ".ea-s2-wave{display:flex;align-items:flex-end;gap:4px;height:24px}" +
  ".ea-s2-wave i{flex:1;border-radius:999px;background:#5145b9;opacity:.78}" +
  ".dark .ea-s2-wave i,.ea-dark .ea-s2-wave i{background:#aba6de}" +
  ".ea-s2-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:108px}" +
  ".ea-s2-tile{width:50px;height:50px;border-radius:10px;background:rgba(255,255,255,.18);display:grid;place-items:center;padding:6px}" +
  ".ea-s2-tile img{width:100%!important;height:100%!important;object-fit:contain!important}" +
  ".ea-s2-levels{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}" +
  ".ea-s2-levels span{height:26px;border-radius:7px;display:grid;place-items:center;font-size:9.5px;font-weight:600;background:rgba(128,128,128,.12);color:var(--mute)}" +
  ".ea-s2-levels span.done{background:#a6e8c1;color:#0f5b38}" +
  ".ea-s2-levels span.on{background:#5145b9;color:#fff}" +
  ".ea-s2-ver{display:inline-flex;align-items:center;padding:4px 8px;border-radius:8px;background:rgba(20,20,20,.1);font-size:9.5px;font-weight:600}" +
  ".ea-s2-photo img{object-position:50% 20%}" +
  ".ea-s2-scrim{position:absolute;inset:35% 0 0;background:linear-gradient(180deg,rgba(17,17,17,0),rgba(17,17,17,.82) 78%);pointer-events:none}" +
  ".ea-s2-photo-badge{position:absolute;left:14px;top:14px;z-index:1}" +
  ".ea-s2-photo-copy{position:absolute;left:14px;right:14px;bottom:14px;z-index:1;color:#fff;display:flex;flex-direction:column;gap:2px}" +
  ".ea-s2-photo-copy b{font-size:15px;line-height:1.15;font-weight:600}" +
  ".ea-s2-photo-copy small{font-size:10px;opacity:.85}" +
  ".ea-folder{position:absolute;opacity:0;border-radius:16px;z-index:0;background:var(--card);box-shadow:0 30px 60px -40px rgba(0,0,0,.35)}" +
  ".ea-folder-tab{position:absolute;left:0;top:0;right:0;height:56px;display:flex;justify-content:space-between;align-items:center;padding:0 16px 0 22px;font-size:clamp(14px,1.35vw,19px);font-weight:500;color:var(--ink)}" +
  ".ea-folder-tab b{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:999px;background:var(--card);font-size:10px;font-weight:500}" +
  ".ea-folder-bar{position:absolute;left:0;right:0;top:58px;height:64px;background:#5145b9;color:#fff;border-radius:14px 14px 0 0;clip-path:polygon(0 0,62% 0,68% 42%,100% 42%,100% 100%,0 100%);padding:16px 22px;font-size:clamp(14px,1.35vw,19px);font-weight:500}" +
  ".ea-vision{position:absolute;left:clamp(20px,7.1vw,102px);top:clamp(140px,19vh,170px);max-width:min(560px,88vw);z-index:2}" +
  ".ea-eye{display:inline-grid;place-items:center;margin-bottom:12px;color:var(--blue)}" +
  ".ea-wrapv{margin-top:12px;max-width:340px}" +
  ".ea-textlink{display:inline-block;margin-top:22px}" +
  ".ea-doodles{position:absolute;left:clamp(30px,6vw,90px);top:62%;width:min(420px,60vw);height:30%;z-index:1}" +
  ".ea-doodle{position:absolute;color:var(--ink);opacity:0;transform:scale(.3) rotate(-30deg);transition:opacity .5s " + EASE + ",transform .7s cubic-bezier(.34,1.56,.64,1);transition-delay:calc(var(--i) * 60ms)}" +
  ".ea-doodled .ea-doodle{opacity:1;transform:none}" +
  ".ea-doodle:nth-child(1){left:20%;top:0}.ea-doodle:nth-child(2){left:0;top:38%}.ea-doodle:nth-child(3){left:17%;top:36%}.ea-doodle:nth-child(4){left:36%;top:42%}.ea-doodle:nth-child(5){left:61%;top:40%}" +
  ".ea-doodle:nth-child(6){left:4%;top:76%}.ea-doodle:nth-child(7){left:22%;top:78%}.ea-doodle:nth-child(8){left:44%;top:80%}.ea-doodle:nth-child(9){left:66%;top:6%}" +
  // bands
  ".ea-bands{position:relative;padding:clamp(60px,10vh,110px) 0;overflow:hidden}" +
  ".ea-band{display:flex;gap:clamp(14px,2.2vw,32px);width:max-content;will-change:transform}" +
  ".ea-av{width:clamp(56px,6.1vw,88px);height:clamp(56px,6.1vw,88px);border-radius:14px;overflow:hidden;flex:none;transform:translate3d(0,var(--y),0);box-shadow:0 10px 24px -14px rgba(0,0,0,.4)}" +
  ".ea-av img{width:100%;height:100%;object-fit:cover}" +
  ".ea-av-icon{padding:10px}" +
  ".ea-av-icon img{object-fit:contain}" +
  ".ea-av-portrait img{object-position:50% 18%}" +
  ".ea-bands-mid{display:flex;flex-direction:column;align-items:center;gap:14px;padding:clamp(60px,9vh,100px) 20px}" +
  ".ea-bands-mid .ea-small{max-width:340px}" +
  ".ea-spark{color:var(--blue)}" +
  // story / bento
  ".ea-story{padding:clamp(60px,9vh,100px) 0}" +
  ".ea-center-head{display:flex;flex-direction:column;align-items:center;margin-bottom:clamp(40px,8vh,90px)}" +
  ".ea-bento{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1116px;margin:0 auto}" +
  ".ea-col{display:flex;flex-direction:column;gap:16px}" +
  ".ea-col-r{padding-top:clamp(0px,6vw,85px)}" +
  ".ea-bcard{position:relative;border-radius:16px;background:var(--card);padding:22px;display:flex;flex-direction:column;gap:8px;opacity:0;transform:translate3d(0,50px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".ea-bcard.ea-in{opacity:1;transform:none}" +
  ".ea-bcard .ea-chipbtn{align-self:flex-start;margin-top:6px;height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--line);display:inline-flex;align-items:center;font-size:11px;font-weight:500}" +
  ".ea-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:500;color:var(--blue)}" +
  ".ea-b1 .ea-pile{position:relative;height:clamp(220px,22vw,300px);margin:6px 0 10px}" +
  ".ea-pile .ea-pcard{position:absolute;left:50%;top:50%;width:clamp(142px,14vw,196px);height:clamp(142px,14vw,196px);border-radius:14px;padding:13px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;box-shadow:0 20px 34px -20px rgba(0,0,0,.45);transition:transform .7s " + EASE + "}" +
  ".ea-pile .ea-pcard:nth-child(1){transform:translate(-66%,-46%) rotate(-12deg);z-index:1}" +
  ".ea-pile .ea-pcard:nth-child(2){transform:translate(-50%,-52%) rotate(-3deg);z-index:2}" +
  ".ea-pile .ea-pcard:nth-child(3){transform:translate(-34%,-56%) rotate(8deg);z-index:3}" +
  ".ea-pc1{background:#f5f4fd;color:#121118;border:1px solid rgba(81,69,185,.16)}" +
  ".ea-pc2{background:linear-gradient(150deg,#3a3286,#5145b9);color:#fff}" +
  ".ea-pc3{background:#171525;color:#fff;border:1px solid rgba(255,255,255,.1)}" +
  ".ea-pc-top{display:flex;align-items:center;justify-content:space-between;gap:6px}" +
  ".ea-pc-ico{width:26px;height:26px;object-fit:contain;flex:none}" +
  ".ea-pc-pill{font-size:8.5px;font-weight:700;letter-spacing:.08em;padding:3px 7px;border-radius:999px;background:rgba(81,69,185,.12);color:#5145b9}" +
  ".ea-pc-pill-w{background:rgba(255,255,255,.18);color:#fff}" +
  ".ea-pc-pill-y{background:rgba(255,218,3,.16);color:#ffda03}" +
  ".ea-pc-mid{display:flex;flex-direction:column;gap:2px}" +
  ".ea-pc-mid strong{font-size:clamp(14px,1.25vw,18px);font-weight:600;letter-spacing:-.02em;line-height:1.1}" +
  ".ea-pc-mid span{font-size:10px;opacity:.76;line-height:1.25}" +
  ".ea-pc-bar{height:5px;border-radius:999px;background:rgba(81,69,185,.16);overflow:hidden;margin-bottom:5px}" +
  ".ea-pc-bar i{display:block;height:100%;border-radius:999px;background:#5145b9}" +
  ".ea-pc-meta{display:block;font-size:9.5px;font-weight:500;color:#5145b9}" +
  ".ea-pc-chips{display:flex;gap:5px}" +
  ".ea-pc-chips span{flex:1;text-align:center;font-size:9.5px;font-weight:600;padding:4px 6px;border-radius:7px;background:rgba(255,255,255,.16);color:#fff}" +
  ".ea-pc-bars{display:flex;align-items:flex-end;gap:4px;height:22px}" +
  ".ea-pc-bars i{flex:1;border-radius:999px;background:#ffda03}" +
  ".ea-pc-bars i:nth-child(even){background:#a39cf4}" +
  ".ea-t9{left:62%;top:8%;--r:6deg;z-index:4}" +
  ".ea-b1.ea-in .ea-t9{opacity:1;transform:rotate(var(--r));transition-delay:.5s}" +
  ".ea-photo{position:relative;aspect-ratio:16/10;margin:-22px -22px 10px;border-radius:16px;overflow:hidden}" +
  ".ea-photo>img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s " + EASE + "}" +
  ".ea-quph{background:#f9cb2e}" +
  ".ea-ph-badge{position:absolute;left:12px;bottom:12px;display:flex;flex-direction:column;gap:2px;padding:7px 11px;border-radius:10px;background:rgba(18,17,24,.82);backdrop-filter:blur(8px);color:#fff;pointer-events:none}" +
  ".ea-ph-badge strong{font-size:11px;font-weight:600}" +
  ".ea-ph-badge span{font-size:9.5px;color:rgba(255,255,255,.82)}" +
  ".ea-qu-card{position:absolute;right:12px;top:12px;width:clamp(146px,15vw,186px);padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.95);color:#121118;box-shadow:0 14px 28px -16px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:5px;pointer-events:none}" +
  ".ea-qu-top{display:flex;align-items:center;justify-content:space-between;gap:6px}" +
  ".ea-qu-top img{width:20px;height:20px;object-fit:contain}" +
  ".ea-qu-top span{font-size:8.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:2px 6px;border-radius:999px;background:#e8f8ef;color:#0f6d3f}" +
  ".ea-qu-card strong{font-size:11.5px;font-weight:600;line-height:1.2}" +
  ".ea-qu-bar{height:5px;border-radius:999px;background:#ebe9f7;overflow:hidden}" +
  ".ea-qu-bar i{display:block;height:100%;border-radius:999px;background:#5145b9}" +
  ".ea-qu-card small{font-size:9px;color:#4a4858;line-height:1.25}" +
  ".ea-phone-wrap{min-height:clamp(330px,34vw,470px);align-items:center;justify-content:center;background:transparent}" +
  ".ea-pen{position:absolute;right:16px;top:16px;width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--bg);display:grid;place-items:center}" +
  ".ea-phone{width:clamp(224px,21vw,284px);aspect-ratio:3/4;border-radius:24px;background:#14131d;color:#fff;border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;justify-content:space-between;gap:8px;padding:15px;box-shadow:0 30px 60px -30px rgba(0,0,0,.65)}" +
  ".ea-ph-status{display:flex;align-items:center;justify-content:space-between;font-size:9.5px;color:rgba(255,255,255,.72);padding:0 2px}" +
  ".ea-ph-hero{border-radius:14px;background:linear-gradient(145deg,#3a3286,#5145b9);padding:12px;display:flex;flex-direction:column;gap:5px}" +
  ".ea-ph-hero small{font-size:8.5px;font-weight:600;color:rgba(255,255,255,.78);letter-spacing:.1em;text-transform:uppercase}" +
  ".ea-ph-hero b{font-size:clamp(15px,1.35vw,18px);font-weight:600;letter-spacing:-.02em;color:#ffda03;line-height:1.15}" +
  ".ea-ph-pills{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}" +
  ".ea-ph-pills span{font-size:9px;font-weight:500;padding:3px 7px;border-radius:999px;background:rgba(255,255,255,.16);color:#fff}" +
  ".ea-ph-qulib{border-radius:13px;background:#1e1c2b;border:1px solid rgba(255,255,255,.08);padding:10px;display:flex;align-items:center;gap:10px}" +
  ".ea-ph-qulib img{width:34px;height:34px;object-fit:contain;flex:none}" +
  ".ea-ph-qulib strong{display:block;font-size:11.5px;font-weight:600;color:#fff;line-height:1.2}" +
  ".ea-ph-qulib span{display:block;font-size:9.5px;color:rgba(255,255,255,.72);line-height:1.25;margin-top:2px}" +
  ".ea-ph-foot{text-align:center;display:flex;flex-direction:column;gap:2px;padding-bottom:2px}" +
  ".ea-ph-foot em{font-style:normal;font-size:11px;font-weight:500;color:rgba(255,255,255,.86)}" +
  ".ea-ph-foot small{font-size:8.5px;color:rgba(255,255,255,.58);letter-spacing:.08em;text-transform:uppercase}" +
  // archive / articles carousel
  ".ea-market{padding:clamp(60px,10vh,110px) 0}" +
  ".ea-market-grid{display:grid;grid-template-columns:minmax(0,.27fr) minmax(0,.73fr);gap:24px;align-items:start}" +
  ".ea-market-head{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr)}" +
  ".ea-wrapm{max-width:250px;margin-top:16px}" +
  ".ea-arc-arrows{margin-top:clamp(40px,17vh,150px)}" +
  ".ea-market-right{grid-column:2;margin-top:-50px;position:relative;opacity:0;transition:opacity .8s " + EASE + "}" +
  ".ea-market-right.ea-in{opacity:1}" +
  ".ea-viewall{position:absolute;right:0;top:-78px;height:26px;padding:0 16px;border-radius:999px;background:var(--blue);color:#fff;font-size:10.5px;font-weight:500;display:inline-flex;align-items:center}" +
  ".ea-rail{overflow:hidden}" +
  ".ea-rail-track{display:flex;gap:16px;transform:translate3d(calc(var(--ci) * (-1 * (var(--cw) + 16px))),0,0);transition:transform .8s " + EASE + ";--cw:clamp(140px,15.3vw,220px)}" +
  ".ea-arc{flex:none;width:var(--cw)}" +
  ".ea-arc div{width:var(--cw);height:var(--cw);border-radius:12px;overflow:hidden;opacity:0;filter:blur(10px);transform:scale(.94);transition:opacity .8s " + EASE + ",filter .8s " + EASE + ",transform .8s " + EASE + ";transition-delay:calc(var(--i) * 90ms)}" +
  ".ea-in .ea-arc div{opacity:1;filter:blur(0);transform:none}" +
  ".ea-arc img{width:100%;height:100%;object-fit:cover;transition:transform .8s " + EASE + "}" +
  ".ea-arc figcaption{margin-top:10px;font-size:12px;font-weight:600;letter-spacing:-.01em;display:flex;flex-direction:column;gap:2px}" +
  ".ea-arc-tag{font-size:10px;font-weight:500;color:var(--blue);text-transform:uppercase;letter-spacing:.08em}" +
  ".dark .ea-arc-tag,.ea-dark .ea-arc-tag{color:#aba6de}" +
  ".ea-progress{position:relative;height:2px;margin-top:22px;width:calc(var(--cw,clamp(140px,15.3vw,220px)))}" +
  ".ea-progress i{position:absolute;left:0;top:0;height:2px;width:clamp(140px,15.3vw,220px);background:var(--ink);transform:translate3d(calc(var(--ci) * 25%),0,0);transition:transform .8s " + EASE + "}" +
  // stage 3
  ".ea-lead{position:absolute;left:50%;top:22%;width:min(640px,90vw);display:flex;flex-direction:column;align-items:center;gap:14px;z-index:3}" +
  ".ea-lead .ea-eyebrow{margin-bottom:0}" +
  ".ea-lead .ea-small{max-width:360px}" +
  ".ea-wall{position:absolute;left:0;top:0;border-radius:12px;overflow:hidden;opacity:0;will-change:transform}" +
  ".ea-wall img{width:100%;height:100%;object-fit:cover}" +
  ".ea-orange{position:absolute;overflow:hidden;background:#3a3286;z-index:2;box-shadow:0 40px 70px -40px rgba(34,26,95,.65)}" +
  ".ea-orange>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 25%}" +
  ".ea-orange-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(25,25,25,0) 45%,rgba(25,25,25,.72) 100%);pointer-events:none}" +
  ".ea-orange-ui{position:absolute;inset:0;opacity:0;transition:opacity .5s " + EASE + "}" +
  ".ea-card-on .ea-orange-ui{opacity:1}" +
  ".ea-t10{left:14px;top:40px;--r:-10deg;height:24px;font-size:11px;padding:0 10px}" +
  ".ea-card-on .ea-t10{opacity:1;transform:rotate(var(--r))}" +
  ".ea-like{position:absolute;right:12px;top:12px;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 10px;border-radius:999px;background:#fff;color:#141414;font-size:10px;font-weight:500}" +
  ".ea-like.on{color:#e8203a}" +
  ".ea-by{position:absolute;left:12px;right:12px;bottom:12px;display:flex;align-items:center;gap:8px;color:#fff}" +
  ".ea-by img{width:28px;height:28px;border-radius:8px;object-fit:cover;object-position:50% 20%}" +
  ".ea-by b{display:block;font-size:12px;font-weight:600}" +
  ".ea-by small{display:block;font-size:10px;opacity:.85}" +
  // pricing
  ".ea-price{padding:clamp(70px,12vh,130px) 0 clamp(40px,7vh,70px)}" +
  ".ea-price-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}" +
  ".ea-plans{position:relative;height:clamp(220px,18vw,260px);opacity:0;transition:opacity .6s " + EASE + "}" +
  ".ea-plans.ea-in{opacity:1}" +
  ".ea-plan{position:absolute;top:10%;width:clamp(150px,13.5vw,195px);height:clamp(150px,13.5vw,195px);border-radius:14px;background:var(--card);padding:16px;display:flex;flex-direction:column;box-shadow:0 30px 40px -30px rgba(0,0,0,.35);transform:translate3d(0,60px,0) rotate(0deg);transition:transform 1s cubic-bezier(.34,1.3,.64,1)}" +
  ".ea-plan small{font-size:11px;font-weight:500}" +
  ".ea-plan b{font-size:clamp(34px,3.6vw,52px);line-height:1;font-weight:600;letter-spacing:-.04em;margin-top:8px}" +
  ".ea-plan sup{font-size:.34em;vertical-align:.95em;margin:0 2px 0 0;letter-spacing:0}" +
  ".ea-plan b small{font-size:.3em;font-weight:500;letter-spacing:0;margin-left:2px}" +
  ".ea-plan em{margin-top:auto;font-style:normal;font-size:9.5px;color:var(--mute)}" +
  ".ea-p1{left:6%;z-index:1}" +
  ".ea-p2{left:34%;top:0;z-index:2;background:#5145b9;color:#fff;height:clamp(165px,14.5vw,210px)}" +
  ".ea-p2 em{color:rgba(255,255,255,.85)}" +
  ".ea-p3{left:62%;top:14%;z-index:1}" +
  ".ea-in .ea-p1{transform:rotate(-3deg)}.ea-in .ea-p2{transform:rotate(-1deg);transition-delay:.1s}.ea-in .ea-p3{transform:rotate(5deg);transition-delay:.2s}" +
  ".ea-pop-pill{position:absolute;right:12px;top:12px;height:20px;padding:0 9px;border-radius:999px;background:#ffda03;color:#141414;font-size:9.5px;font-weight:600;display:inline-flex;align-items:center;transform:rotate(8deg)}" +
  // lime marquee
  ".ea-lime-sec{padding:0 clamp(16px,8.75vw,126px) clamp(16px,2vh,24px)}" +
  ".ea-lime{position:relative;height:clamp(420px,58vh,500px);border-radius:16px;background:var(--lime);color:#141414;overflow:hidden}" +
  ".ea-water{position:absolute;left:-2%;top:6%;font-size:clamp(130px,22vw,320px);line-height:.8;font-weight:600;letter-spacing:-.06em;color:rgba(255,255,255,.22);pointer-events:none}" +
  ".ea-marquee{position:relative;padding-top:clamp(14px,2.4vh,22px);overflow:hidden}" +
  ".ea-mtrack{display:flex;width:max-content;will-change:transform}" +
  ".ea-mrun{display:inline-flex;align-items:flex-start;font-size:clamp(34px,4.45vw,64px);line-height:1.15;letter-spacing:-.04em;font-weight:500;white-space:nowrap}" +
  ".ea-mthumbs{position:relative;display:inline-flex;align-items:center;gap:6px;margin:.18em .3em 0;height:.82em}" +
  ".ea-mthumbs img,.ea-mthumbs i{width:.82em;height:.82em;border-radius:.14em;object-fit:cover;display:block}" +
  ".ea-mthumbs i{width:.42em;height:.42em;border-radius:50%}" +
  ".ea-mthumbs small{position:absolute;left:30%;top:100%;margin-top:4px;font-size:8px;line-height:1.2;letter-spacing:.06em;font-weight:600;white-space:nowrap;text-align:center}" +
  ".ea-pilebox{position:absolute;left:0;right:0;bottom:0;top:34%;cursor:crosshair}" +
  ".ea-ball{position:absolute;left:0;top:0;width:72px;height:72px;border-radius:50%;background:#fff;color:#141414;display:grid;place-items:center;transform:translate3d(-100px,-200px,0);will-change:transform;box-shadow:0 6px 12px -8px rgba(0,0,0,.4)}" +
  // duo
  ".ea-duo{padding:clamp(16px,2vh,24px) 0 clamp(100px,16vh,160px)}" +
  ".ea-duo-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,1.9vw,27px);padding:0 clamp(16px,8.75vw,126px)}" +
  ".ea-meet,.ea-arch{position:relative;height:clamp(460px,45vw,650px);border-radius:16px;overflow:hidden;opacity:0;transform:translate3d(0,50px,0);transition:opacity .9s " + EASE + ",transform .9s " + EASE + "}" +
  ".ea-meet.ea-in,.ea-arch.ea-in{opacity:1;transform:none}" +
  ".ea-meet{background:#3a3286;color:#fff}" +
  ".ea-arch{background:var(--card);color:var(--ink)}" +
  ".ea-meet>img,.ea-arch>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.4s " + EASE + "}" +
  ".ea-arch>img{inset:-4% -6% auto auto;width:90%;height:74%;object-position:50% 20%}" +
  ".ea-meet::after{content:'';position:absolute;inset:38% 0 0;background:linear-gradient(180deg,rgba(58,50,134,0),rgba(58,50,134,.92) 68%);pointer-events:none}" +
  ".ea-meet>div,.ea-arch>div{position:absolute;z-index:1;left:26px;right:26px;bottom:26px;display:flex;flex-direction:column;gap:10px;align-items:flex-start}" +
  ".ea-meet h3 span{color:#ffda03}" +
  ".ea-meet .ea-small{color:rgba(255,255,255,.82);max-width:340px}" +
  ".ea-arch .ea-small{color:var(--mute);max-width:340px}" +
  ".ea-arch .ea-btn{background:var(--ink);color:var(--bg)}" +
  ".ea-store-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px}" +
  ".ea-store-badge{display:inline-flex;height:40px;transition:transform .25s " + EASE + "}" +
  ".ea-store-badge img{height:40px;width:auto}" +
  // footer
  ".ea-foot{background:var(--foot);padding:clamp(50px,7vh,70px) 0 clamp(30px,5vh,46px)}" +
  ".ea-foot-grid{display:grid;grid-template-columns:1.4fr .8fr .8fr .6fr;gap:32px;position:relative}" +
  ".ea-foot-grid .ea-small{max-width:300px;margin-top:12px}" +
  ".ea-foot .ea-h4{font-size:clamp(17px,1.45vw,21px)}" +
  ".ea-foot-dots{font-size:9px;letter-spacing:.08em;vertical-align:3px;margin-left:8px;padding:3px 8px;border-radius:999px;background:var(--card);color:var(--blue);font-weight:600}" +
  ".ea-mail{display:inline-block;margin-top:8px;font-size:12.5px;font-weight:500;border-bottom:1px solid var(--line)}" +
  ".ea-contact-meta{display:block;margin-top:6px;font-size:11.5px;color:var(--mute)}" +
  ".ea-socials{display:flex;gap:8px;margin-top:18px}" +
  ".ea-socials a{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;color:var(--mute);transition:color .3s ease,border-color .3s ease}" +
  ".ea-foot ul{display:flex;flex-direction:column;gap:11px;font-size:12.5px}" +
  ".ea-foot li{display:flex;align-items:center;gap:6px}" +
  ".ea-new,.ea-soon{height:16px;padding:0 7px;border-radius:999px;font-size:9px;display:inline-flex;align-items:center}" +
  ".ea-new{background:#5145b9;color:#fff}" +
  ".ea-soon{background:#f2f1fa;color:#5145b9}" +
  ".ea-copy{position:absolute;right:clamp(20px,7.1vw,102px);bottom:0;font-size:10.5px;color:var(--mute)}" +
  // hover — only where a mouse can hover
  "@media (hover:hover) and (pointer:fine){" +
  ".ea-link:hover::after,.ea-ghost:hover::after,.ea-textlink:hover::after{transform:scaleX(1);transform-origin:0 50%}" +
  ".ea-round:hover,.ea-arrows button:hover{transform:scale(1.1)}" +
  ".ea-btn:hover,.ea-store-badge:hover{transform:translate3d(0,-2px,0);box-shadow:0 12px 24px -12px rgba(0,0,0,.45)}" +
  ".ea-arc:hover img,.ea-photo:hover>img,.ea-meet:hover>img,.ea-arch:hover>img{transform:scale(1.05)}" +
  ".ea-b1:hover .ea-pile .ea-pcard:nth-child(1){transform:translate(-80%,-44%) rotate(-18deg)}" +
  ".ea-b1:hover .ea-pile .ea-pcard:nth-child(3){transform:translate(-18%,-58%) rotate(14deg)}" +
  ".ea-plan:hover{transform:translate3d(0,-10px,0) rotate(0deg)!important;transition-duration:.45s;transition-delay:0s!important}" +
  ".ea-socials a:hover{color:var(--ink);border-color:var(--ink)}" +
  ".ea-av:hover{transform:translate3d(0,calc(var(--y) - 6px),0) scale(1.08);transition:transform .35s " + EASE + "}" +
  "}" +
  // tablet / phone
  "@media (max-width:1023px){.ea-links{display:none}.ea-market-grid{grid-template-columns:1fr}.ea-market-right{grid-column:1;margin-top:0}.ea-viewall{position:static;margin-bottom:16px}.ea-price-grid{grid-template-columns:1fr}.ea-foot-grid{grid-template-columns:1fr 1fr}.ea-copy{position:static;grid-column:1/-1}}" +
  "@media (max-width:767px){" +
  ".ea-nav{height:76px;margin-bottom:-76px;padding-top:16px}" +
  ".ea-show{top:84px}.ea-show .ea-btns{margin-top:18px}.ea-wrapp{margin-top:14px}" +
  ".ea-t3{left:12%;top:56%}.ea-t4{left:60%;top:62%}.ea-updown{display:none}" +
  ".ea-t1{left:8%}.ea-t2{left:auto;right:8%}" +
  ".ea-t6{left:6%;top:16%}.ea-t7{left:auto;right:6%;top:18%}" +
  ".ea-vision{top:96px}.ea-doodles{display:none}" +
  ".ea-folder-tab{font-size:12px}.ea-folder-bar{top:40px;height:46px;font-size:12px}" +
  ".ea-bento{grid-template-columns:1fr}.ea-col-r{padding-top:0}" +
  ".ea-duo-grid{grid-template-columns:1fr}" +
  ".ea-plan{width:42%;height:auto;aspect-ratio:1}.ea-p1{left:0}.ea-p2{left:29%;height:auto}.ea-p3{left:58%}" +
  ".ea-ball{width:48px;height:48px}.ea-ball svg{width:24px;height:24px}" +
  ".ea-trust-head{flex-direction:column;align-items:flex-start}" +
  ".ea-slide-meta{display:none}" +
  "}" +
  // reduced motion: no time-based motion; scroll-linked stages follow the scrollbar only
  "@media (prefers-reduced-motion:reduce){" +
  ".ea-w,.ea-late,.ea-fade,.ea-tag,.ea-doodle,.ea-bcard,.ea-banner,.ea-banner img,.ea-arc div,.ea-plan,.ea-meet,.ea-arch,.ea-market-right,.ea-plans,.ea-rail-track,.ea-progress i{transition:none!important}" +
  ".ea-w{opacity:1;filter:none;transform:none}" +
  ".ea-late,.ea-fade,.ea-bcard,.ea-banner,.ea-meet,.ea-arch,.ea-market-right,.ea-plans,.ea-arc div{opacity:1;filter:none;transform:none}" +
  ".ea-logos-track{animation:none}" +
  "}" +
  ".ea-reduce .ea-w{transition:none;opacity:1;filter:none;transform:none}"
