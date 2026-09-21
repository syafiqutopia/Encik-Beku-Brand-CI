import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * Encik Beku — Catalogue flip-book
 *
 * The Service Catalogue as a book the visitor turns a page at a time: a
 * two-page spread on a wide frame, one page on a narrow one. The same
 * component the website uses, packaged for Framer.
 *
 * Paste this file into a Framer code file (Assets ▸ Code ▸ New file) and drop
 * the component on the canvas. It has no dependencies to install: the turning
 * is StPageFlip, fetched from a CDN the first time it is needed.
 *
 * By default it reads the catalogue pages from the live Encik Beku site, so it
 * works as soon as it is placed. Point Base URL somewhere else, or hand it a
 * list of images, to show a different booklet.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 640
 */
export default function CatalogueFlipbook(props) {
    const {
        baseUrl,
        pageCount,
        images,
        startPage,
        showCover,
        flippingTime,
        shadowOpacity,
        singlePageBelow,
        showControls,
        previousLabel,
        nextLabel,
        tint,
        ink,
        paper,
        style,
    } = props

    const hostRef = useRef(null)
    const flipRef = useRef(null)
    const pageEls = useRef([])
    const flipping = useRef(false)
    const lockUntil = useRef(0)
    const stillRef = useRef(false)
    const pageRef = useRef(startPage)
    const [index, setIndex] = useState(startPage)
    const [portrait, setPortrait] = useState(false)
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [failed, setFailed] = useState(false)

    const onCanvas = RenderTarget.current() === RenderTarget.canvas

    // An explicit list wins; otherwise the pages are numbered off the base URL,
    // the way the site names them: p01.jpg … p34.jpg.
    const urls = useMemo(() => {
        const picked = (images || [])
            .map((i) => (typeof i === "string" ? i : i && i.src))
            .filter(Boolean)
        if (picked.length) return picked
        const base = String(baseUrl || "").replace(/\/+$/, "")
        const n = Math.max(1, Math.round(pageCount || 1))
        return Array.from(
            { length: n },
            (_, i) => `${base}/p${String(i + 1).padStart(2, "0")}.jpg`
        )
    }, [images, baseUrl, pageCount])

    const total = urls.length

    // Only the pages around the one in view are fetched - opening the book
    // should not cost every page in it. A page fetched once keeps its src.
    const loadAround = useCallback((i) => {
        const pages = pageEls.current
        for (
            let k = Math.max(0, i - 3);
            k <= Math.min(pages.length - 1, i + 4);
            k++
        ) {
            const img = pages[k] && pages[k].firstChild
            if (img && !img.getAttribute("src")) img.setAttribute("src", urls[k])
        }
    }, [urls])

    // Framer resizes a component constantly on the canvas, and the book has to
    // be rebuilt to refit. Debounced, and only when the size really moved.
    useEffect(() => {
        const host = hostRef.current
        if (!host || typeof ResizeObserver === "undefined") return
        let timer = null
        const ro = new ResizeObserver((entries) => {
            const r = entries[0].contentRect
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                setBox((prev) =>
                    Math.abs(prev.w - r.width) > 2 ||
                    Math.abs(prev.h - r.height) > 2
                        ? { w: r.width, h: r.height }
                        : prev
                )
            }, 220)
        })
        ro.observe(host)
        const r = host.getBoundingClientRect()
        setBox({ w: r.width, h: r.height })
        return () => {
            if (timer) clearTimeout(timer)
            ro.disconnect()
        }
    }, [])

    useEffect(() => {
        let alive = true
        const host = hostRef.current
        if (!host || !box.w || !box.h) return

        loadStPageFlip().then(
            (PageFlip) => {
                if (!alive || !PageFlip || !hostRef.current) return
                try {
                    // The book's box is worked out here rather than left to
                    // the library, which sizes a page from the container's
                    // width but clamps its height to whatever the container
                    // measures at that moment. Given only a width, that is the
                    // bare minimum height and the whole book comes out thumbnail
                    // sized, so both are set, in the page's proportions.
                    const single = box.w < (singlePageBelow || 0)
                    const cols = single ? 1 : 2
                    const bookW = Math.max(
                        40,
                        Math.floor(Math.min(box.w, box.h * cols * PAGE))
                    )
                    const bookH = Math.floor(bookW / (cols * PAGE))

                    // destroy() removes the element it was given, so the book gets
                    // its own div rather than one React is holding on to.
                    const el = document.createElement("div")
                    el.style.width = bookW + "px"
                    el.style.height = bookH + "px"
                    hostRef.current.appendChild(el)

                    // Every page is its own element with its own <img>: a page that
                    // has not arrived yet is blank paper, and can never be drawn as
                    // the page it is replacing.
                    const pages = urls.map(() => {
                        const pg = document.createElement("div")
                        pg.style.cssText = `background:${paper};overflow:hidden`
                        const img = document.createElement("img")
                        img.alt = ""
                        img.decoding = "async"
                        img.style.cssText =
                            "display:block;width:100%;height:100%;object-fit:fill"
                        pg.appendChild(img)
                        el.appendChild(pg)
                        return pg
                    })
                    pageEls.current = pages

                    // Reduced motion, or a turn set to nothing, means the pages
                    // change without animating. The library refuses a flipping time
                    // of zero, so it keeps a real one and the turn is made with its
                    // un-animated methods instead.
                    const instant = !!(
                        flippingTime < 50 ||
                        (typeof window !== "undefined" &&
                            window.matchMedia &&
                            window.matchMedia("(prefers-reduced-motion: reduce)")
                                .matches)
                    )
                    stillRef.current = instant

                    const flip = new PageFlip(el, {
                        width: 595,
                        height: 842,
                        size: "stretch",
                        // The library reads one page when the book is narrower than
                        // twice minWidth. Rather than leave that to a threshold it
                        // also applies as a minimum width, the mode is decided here
                        // and these two numbers are set to agree with it.
                        usePortrait: single,
                        minWidth: single ? bookW : Math.max(20, Math.floor(bookW / 2) - 1),
                        maxWidth: 4000,
                        minHeight: 40,
                        maxHeight: 5600,
                        showCover: !!showCover,
                        autoSize: false,
                        // Survives a rebuild after the frame is resized: the reader
                        // stays on the spread they were reading.
                        startPage: Math.min(Math.max(0, pageRef.current), total - 1),
                        flippingTime: Math.max(50, Math.round(flippingTime) || 600),
                        maxShadowOpacity: shadowOpacity,
                        mobileScrollSupport: false,
                        // On the Framer canvas a drag is the designer moving the
                        // frame, not a reader turning a page.
                        useMouseEvents: !onCanvas && !instant,
                    })

                    const sync = () => {
                        if (!alive) return
                        const i = flip.getCurrentPageIndex()
                        pageRef.current = i
                        loadAround(i)
                        setIndex(i)
                        setPortrait(flip.getOrientation() === "portrait")
                    }
                    flip.on("flip", sync)
                    flip.on("changeOrientation", sync)
                    flip.on("changeState", (e) => {
                        flipping.current = e.data === "flipping"
                    })

                    flip.loadFromHTML(pages)
                    flipRef.current = flip
                    sync()
                } catch (e) {
                    if (alive) setFailed(true)
                }
            },
            () => {
                if (alive) setFailed(true)
            }
        )

        return () => {
            alive = false
            const flip = flipRef.current
            flipRef.current = null
            pageEls.current = []
            if (flip) {
                try {
                    flip.destroy()
                } catch (e) {
                    /* already gone */
                }
            }
            if (hostRef.current) hostRef.current.innerHTML = ""
        }
    }, [
        urls,
        box.w,
        box.h,
        showCover,
        singlePageBelow,
        flippingTime,
        shadowOpacity,
        paper,
        onCanvas,
        total,
        loadAround,
    ])

    // "Opens at", changed on the Framer canvas, should move the book there
    // rather than wait for a reload.
    useEffect(() => {
        const flip = flipRef.current
        const to = Math.min(Math.max(0, startPage), total - 1)
        pageRef.current = to
        if (!flip) return
        flip.turnToPage(to)
        loadAround(to)
        setIndex(to)
    }, [startPage, total, loadAround])

    // A click while a page is still turning is dropped, not queued: queued
    // clicks keep the book moving after the reader has stopped. The lock is
    // kept here rather than read from the library, whose "turn finished" state
    // can arrive long before the page has visibly landed. The library's own
    // state still counts, so a click cannot cut across a page being dragged.
    const turn = useCallback((d) => {
        const flip = flipRef.current
        const now = Date.now()
        if (!flip || flipping.current || now < lockUntil.current) return
        lockUntil.current = now + Math.max(120, flippingTime)
        if (stillRef.current) {
            d > 0 ? flip.turnToNextPage() : flip.turnToPrevPage()
            const i = flip.getCurrentPageIndex()
            pageRef.current = i
            loadAround(i)
            setIndex(i)
            return
        }
        d > 0 ? flip.flipNext() : flip.flipPrev()
    }, [loadAround, flippingTime])

    const count = label(index, portrait, total, showCover)
    const btn = {
        appearance: "none",
        border: `1px solid ${withAlpha(ink, 0.35)}`,
        borderRadius: 8,
        background: "transparent",
        color: ink,
        font: "500 14px/1 Inter, system-ui, sans-serif",
        padding: "10px 16px",
        cursor: "pointer",
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                gap: 12,
                overflow: "hidden",
                background: tint,
                ...style,
            }}
        >
            <div
                ref={hostRef}
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            />
            {failed ? (
                <p
                    style={{
                        margin: 0,
                        textAlign: "center",
                        color: ink,
                        font: "400 13px/1.4 Inter, system-ui, sans-serif",
                    }}
                >
                    The book could not be shown here.
                </p>
            ) : null}
            {showControls ? (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        flex: "0 0 auto",
                    }}
                >
                    <button
                        type="button"
                        style={{ ...btn, opacity: index <= 0 ? 0.4 : 1 }}
                        disabled={index <= 0}
                        onClick={() => turn(-1)}
                    >
                        {previousLabel}
                    </button>
                    <p
                        style={{
                            margin: 0,
                            minWidth: 150,
                            textAlign: "center",
                            color: withAlpha(ink, 0.86),
                            font: "400 13px/1 Inter, system-ui, sans-serif",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {count}
                    </p>
                    <button
                        type="button"
                        style={{
                            ...btn,
                            opacity: index >= total - 1 ? 0.4 : 1,
                        }}
                        disabled={index >= total - 1}
                        onClick={() => turn(1)}
                    >
                        {nextLabel}
                    </button>
                </div>
            ) : null}
        </div>
    )
}

CatalogueFlipbook.defaultProps = {
    baseUrl:
        "https://utopiagrowth.github.io/Encik-Beku-Brand-CI/website/img/catalogue",
    pageCount: 34,
    images: [],
    startPage: 0,
    showCover: true,
    flippingTime: 600,
    shadowOpacity: 0.35,
    singlePageBelow: 760,
    showControls: true,
    previousLabel: "Previous",
    nextLabel: "Next",
    tint: "transparent",
    ink: "#1B3F83",
    paper: "#FFFFFF",
}

addPropertyControls(CatalogueFlipbook, {
    baseUrl: {
        type: ControlType.String,
        title: "Base URL",
        description:
            "Folder holding the pages, named p01.jpg, p02.jpg … Ignored when Images below are set.",
    },
    pageCount: {
        type: ControlType.Number,
        title: "Pages",
        min: 1,
        max: 500,
        step: 1,
        displayStepper: true,
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        description: "Use your own pages instead of the Base URL.",
    },
    startPage: {
        type: ControlType.Number,
        title: "Opens at",
        min: 0,
        max: 499,
        step: 1,
        displayStepper: true,
    },
    showCover: {
        type: ControlType.Boolean,
        title: "Cover",
        enabledTitle: "Alone",
        disabledTitle: "Paired",
        description: "A cover stands on its own, the way a real book opens.",
    },
    singlePageBelow: {
        type: ControlType.Number,
        title: "One page",
        unit: "px",
        min: 0,
        max: 2000,
        step: 10,
        description: "Below this frame width the book shows a single page.",
    },
    flippingTime: {
        type: ControlType.Number,
        title: "Turn",
        unit: "ms",
        min: 0,
        max: 3000,
        step: 50,
    },
    shadowOpacity: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: false,
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Controls",
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    previousLabel: {
        type: ControlType.String,
        title: "Previous",
        hidden: (p) => !p.showControls,
    },
    nextLabel: {
        type: ControlType.String,
        title: "Next",
        hidden: (p) => !p.showControls,
    },
    tint: { type: ControlType.Color, title: "Background" },
    ink: { type: ControlType.Color, title: "Controls" },
    paper: {
        type: ControlType.Color,
        title: "Paper",
        description: "Shows through until a page has loaded.",
    },
})

/* ── the book's proportions ─────────────────────────────────────── */
const PAGE = 595 / 842 // the catalogue's page, and A4: width over height

/* ── the library ────────────────────────────────────────────────────
   StPageFlip 2.0.7 (MIT), fetched once and shared by every copy of the
   component on the page. Loaded at runtime rather than imported so the
   component behaves the same on the canvas, in preview and on a published
   site, where the page is server-rendered first. */
const LIB = "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.js"
let pending = null

function loadStPageFlip() {
    if (typeof window === "undefined") return Promise.resolve(null)
    if (window.St && window.St.PageFlip) return Promise.resolve(window.St.PageFlip)
    if (!pending) {
        pending = new Promise((resolve, reject) => {
            const s = document.createElement("script")
            s.src = LIB
            s.async = true
            s.onload = () =>
                window.St && window.St.PageFlip
                    ? resolve(window.St.PageFlip)
                    : reject(new Error("page-flip loaded without St.PageFlip"))
            s.onerror = () => {
                pending = null
                reject(new Error("page-flip could not be fetched"))
            }
            document.head.appendChild(s)
        })
    }
    return pending
}

/* ── helpers ─────────────────────────────────────────────────────── */

// Which pages are on screen: a lone cover, then spreads, then a lone last page.
function label(i, portrait, total, showCover) {
    if (!total) return ""
    if (portrait) return `Page ${i + 1} of ${total}`
    if (showCover && i === 0) return `Cover · ${total} pages`
    const left = showCover ? (i % 2 ? i : i - 1) : i - (i % 2)
    const right = left + 1
    if (left < 0) return `Page 1 of ${total}`
    return right >= total
        ? `Page ${left + 1} of ${total}`
        : `Pages ${left + 1}–${right + 1} of ${total}`
}

// Framer hands colours through as any CSS colour, including rgba() and var().
function withAlpha(color, alpha) {
    const hex = String(color || "").trim()
    const m = /^#([0-9a-f]{6})$/i.exec(hex)
    if (!m) return hex
    const n = parseInt(m[1], 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
