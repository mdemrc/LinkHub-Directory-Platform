import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi, statsApi } from '../lib/api'
import { Category } from '../types'
import {
  FiEye, FiImage, FiType, FiMonitor, FiLink, FiCheckCircle,
  FiXCircle, FiClock, FiBell, FiRefreshCw, FiArrowLeft,
  FiZap, FiArrowRight, FiChevronDown, FiMaximize,
  FiEdit3, FiTarget,
} from 'react-icons/fi'
import SEO from '../components/SEO'

// ── Constants ──────────────────────────────────────────────

// Simplified preview-only position options
const PREVIEW_BANNER_POS: [string, string][] = [
  ['HEADER', 'Header'],
  ['HEADER_DOWN', 'Header Down'],
  ['SIDEBAR_LEFT', 'Left Sidebar'],
  ['SIDEBAR_RIGHT', 'Right Sidebar'],
]
const PREVIEW_TEXT_POS: [string, string][] = [
  ['CONTENT_TOP', 'Top Text'],
  ['SIDEBAR_LEFT', 'Left Sidebar'],
  ['SIDEBAR_RIGHT', 'Right Sidebar'],
]

const BANNER_DIMS: Record<string, { w: number; h: number; label: string }> = {
  xs: { w: 468, h: 60, label: '468×60' },
  sm: { w: 440, h: 111, label: '440×111' },
  cc: { w: 920, h: 120, label: '920×120' },
}

const SIZE_LABELS: [string, string][] = [
  ['cc', 'Big (920×120)'],
  ['sm', 'Medium (440×111)'],
  ['xs', 'Small (468×60)'],
]

function tryHostname(url: string): string {
  try { return new URL(url).hostname } catch { return 'your-site.com' }
}

// ── Live Site Preview (responsive scale) ───────────────────
function LiveSitePreview({
  adType, adPosition, bannerSize, bannerUrl, adTitle, adLink,
}: {
  adType: 'BANNER' | 'TEXT'; adPosition: string; bannerSize: string
  bannerUrl: string; adTitle: string; adLink: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [innerHeight, setInnerHeight] = useState(600)
  const [wrapWidth, setWrapWidth] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState({ totalLinks: 0, onlineLinks: 0, offlineLinks: 0 })
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => { setImgError(false); setImgLoaded(false) }, [bannerUrl])

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        const [cats, st] = await Promise.all([
          categoriesApi.getNavigation().catch(() => ({ data: [] })),
          statsApi.getOverview().catch(() => ({ data: { totalLinks: 0, onlineLinks: 0, offlineLinks: 0 } })),
        ])
        const catData = Array.isArray(cats.data) ? cats.data : cats.data?.value || []
        setCategories(catData)
        setStats(st.data)
      } catch (e) { console.error(e) }
    }
    fetchSiteData()
  }, [])

  // Track container width for responsive scaling
  useEffect(() => {
    if (!wrapRef.current) return
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setWrapWidth(entries[0].contentRect.width)
    })
    obs.observe(wrapRef.current)
    return () => obs.disconnect()
  }, [])

  // Track inner content height
  useEffect(() => {
    if (!innerRef.current) return
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setInnerHeight(entries[0].contentRect.height)
    })
    obs.observe(innerRef.current)
    return () => obs.disconnect()
  }, [])

  const INNER_W = 920
  // Scale to fill container width (with some padding for browser chrome)
  const scale = wrapWidth > 0 ? Math.min(wrapWidth / INNER_W, 1) : 0.5
  const isHeader = adPosition === 'HEADER' || adPosition === 'HEADER_DOWN'
  const dims = isHeader ? BANNER_DIMS[bannerSize] || BANNER_DIMS.cc : null
  const isAboveNav = adPosition === 'HEADER'
  const isBelowNav = adPosition === 'HEADER_DOWN'

  const hasContent = adType === 'BANNER' ? (bannerUrl && !imgError) : (adTitle || adLink)

  const UserAdZone = () => {
    const isSidebar = adPosition === 'SIDEBAR_LEFT' || adPosition === 'SIDEBAR_RIGHT'

    if (!hasContent) {
      return (
        <div className="relative border-2 border-dashed border-lz-accent/25 bg-lz-accent/[0.03] rounded-sm">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
            <span className="inline-flex items-center gap-0.5 text-[7px] font-bold text-white bg-lz-accent/60 px-2 py-[2px] rounded-full whitespace-nowrap">
              <FiEye size={7} /> YOUR AD
            </span>
          </div>
          <div className="flex items-center justify-center py-4" style={{ minHeight: isSidebar ? 80 : (dims ? dims.h : 50) }}>
            <div className="text-center px-2">
              {adType === 'BANNER'
                ? <FiImage size={16} className="text-lz-accent/25 mx-auto mb-1" />
                : <FiType size={16} className="text-lz-accent/25 mx-auto mb-1" />}
              <span className="text-[9px] text-lz-accent/35 block leading-tight">
                {adType === 'BANNER'
                  ? `Enter Banner URL to preview${dims ? ` (${dims.label})` : ''}`
                  : 'Enter Ad Title to preview'}
              </span>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative ring-2 ring-lz-accent/50 rounded-sm bg-lz-accent/[0.04] shadow-[0_0_16px_rgba(0,212,255,0.12)]">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-0.5 text-[7px] font-bold text-white bg-lz-accent px-2 py-[2px] rounded-full whitespace-nowrap shadow-lg">
            <FiEye size={7} /> YOUR AD
          </span>
        </div>
        <div className={isSidebar ? 'pt-2' : 'pt-2.5'}>
          {adType === 'BANNER' ? (
            <div className="relative" style={!isSidebar && dims ? { maxWidth: dims.w, margin: '0 auto' } : undefined}>
              <img
                src={bannerUrl}
                alt="Your banner"
                className={`w-full h-auto object-contain transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={dims ? { maxHeight: dims.h } : undefined}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
              {!imgLoaded && (
                <div className="flex items-center justify-center py-3">
                  <div className="w-4 h-4 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0f0f23] py-1.5 px-3 text-center border-y border-lz-border">
              <span className="text-amber-400 mr-1 text-xs">★</span>
              <span className="font-bold text-white text-xs uppercase tracking-wide">
                {adTitle || 'YOUR AD TITLE'}
              </span>
              {adLink && (
                <span className="text-gray-400 text-xs ml-1.5">- {tryHostname(adLink)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const EmptyZone = ({ label }: { label: string }) => (
    <div className="border border-dashed border-lz-border/30 rounded-sm bg-white/[0.01]">
      <div className="flex items-center justify-center py-2 opacity-20">
        <span className="text-[8px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )

  return (
    <div ref={wrapRef} className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#060810] shadow-2xl shadow-black/60">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/[0.025] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f56]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#ffbd2e]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1.5 px-5 py-1 bg-white/[0.04] rounded-lg text-[9px] text-white/20 font-mono">
            <span>🔒</span> LinkHub.cc
          </div>
        </div>
        <div className="flex items-center gap-1 text-[8px] text-white/15">
          <div className="w-1.5 h-1.5 rounded-full bg-lz-accent/50 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Scaled real site layout */}
      <div style={{ height: Math.max(innerHeight * scale, 200), overflow: 'hidden', position: 'relative' }}>
        <div
          ref={innerRef}
          style={{ width: INNER_W, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          className="bg-lz-bg text-lz-text"
        >
          {/* Header Top Banner */}
          {isAboveNav ? <UserAdZone /> : <EmptyZone label="Header Banner" />}

          {/* Header Down Banner (still above nav — lower area of header) */}
          {isBelowNav ? <UserAdZone /> : <EmptyZone label="Header Down Banner" />}

          {/* NAV */}
          <div className="bg-lz-header border-b border-lz-border">
            <div className="flex items-center h-10">
              <div className="flex items-center gap-2.5 px-3 h-full w-52 flex-shrink-0 border-r border-lz-border">
                <div className="w-7 h-7 bg-gradient-to-br from-[#00d4ff] to-[#0088cc] rounded-lg flex items-center justify-center shadow-lg shadow-lz-accent/10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div className="flex items-baseline">
                  <span className="text-base font-extrabold text-white">LINK</span>
                  <span className="text-base font-extrabold text-lz-accent">ZONE</span>
                </div>
              </div>
              <div className="flex items-center gap-1 px-3 h-full text-xs font-medium text-white bg-lz-accent border-r border-lz-border">Home</div>
              {categories.slice(0, 4).map(cat => (
                <div key={cat.id} className="flex items-center gap-1 px-3 h-full text-xs font-medium text-gray-400 border-r border-lz-border whitespace-nowrap">
                  {cat.name}
                </div>
              ))}
              <div className="flex items-center gap-1 px-3 h-full text-xs font-medium text-gray-400 border-r border-lz-border">Shop</div>
              <div className="flex items-center gap-1 px-3 h-full text-xs font-medium text-lz-accent border-r border-lz-border">Advertising</div>
            </div>
          </div>

          {/* Top Text */}
          {adPosition === 'CONTENT_TOP' ? <UserAdZone /> : <EmptyZone label="Top Text" />}

          {/* THREE COLUMN LAYOUT */}
          <div className="flex flex-1">
            <div className="w-52 flex-shrink-0 bg-lz-sidebar border-r border-lz-border">
              <div className="p-3 space-y-2">
                <h4 className="text-[10px] uppercase tracking-wider text-gray-500">Sponsored</h4>
                {adPosition === 'SIDEBAR_LEFT' ? (
                  <UserAdZone />
                ) : (
                  <div className="border border-dashed border-lz-border/50 rounded p-3 text-center">
                    <p className="text-[10px] text-gray-500">Ad Space</p>
                    <span className="text-[10px] text-lz-accent">Advertise Here</span>
                  </div>
                )}
              </div>
            </div>

            <main className="flex-1 min-w-0 bg-lz-bg-light">
              <div className="p-4 space-y-3">
                <div className="h-6 bg-white/[0.05] rounded w-48" />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded">
                    <div className="w-8 h-8 rounded bg-white/[0.06] flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-white/[0.06] rounded" style={{ width: `${100 + i * 30}px` }} />
                      <div className="h-2 bg-white/[0.03] rounded" style={{ width: `${150 + i * 20}px` }} />
                    </div>
                    <div className="w-12 h-4 rounded bg-green-500/10 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </main>

            <div className="w-56 flex-shrink-0 bg-lz-sidebar border-l border-lz-border">
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 bg-lz-bg border border-lz-border rounded flex items-center justify-center">
                    <FiBell size={16} className="text-gray-500" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <FiClock size={12} />
                    <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="border border-lz-border rounded p-2.5 bg-lz-bg">
                  <h4 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Statistics</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><FiLink size={11} className="text-lz-accent" />Total</span>
                      <span className="text-white font-medium">{stats.totalLinks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><FiCheckCircle size={11} className="text-green-500" />Online</span>
                      <span className="text-green-500 font-medium">{stats.onlineLinks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1"><FiXCircle size={11} className="text-red-500" />Offline</span>
                      <span className="text-red-500 font-medium">{stats.offlineLinks}</span>
                    </div>
                  </div>
                </div>

                {adPosition === 'SIDEBAR_RIGHT' ? (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase tracking-wider text-gray-500">Sponsored</h4>
                    <UserAdZone />
                  </div>
                ) : (
                  <div className="border border-dashed border-lz-border/50 rounded p-3 text-center">
                    <p className="text-[10px] text-gray-500">Ad Space</p>
                    <span className="text-[10px] text-lz-accent">Advertise Here</span>
                  </div>
                )}

                <div className="text-[10px] text-gray-500 border-t border-lz-border pt-2">
                  <div className="flex items-center gap-1"><FiRefreshCw size={10} /><span>v2.0.0</span></div>
                  <span className="text-lz-accent">Changelog</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-lz-bg border-t border-lz-border py-3 text-center">
            <span className="text-xs text-gray-600">© LinkHub 2024 — All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ControlCard removed — compact inline controls used instead

// ── Main Page Component ────────────────────────────────────
export default function LivePreviewPage() {
  const [adType, setAdType] = useState<'BANNER' | 'TEXT'>('BANNER')
  const [adPosition, setAdPosition] = useState('HEADER')
  const [bannerSize, setBannerSize] = useState('cc')
  const [bannerUrl, setBannerUrl] = useState('')
  const [adTitle, setAdTitle] = useState('')
  const [adLink, setAdLink] = useState('')

  const isHeaderPos = adPosition === 'HEADER' || adPosition === 'HEADER_DOWN'

  useEffect(() => {
    if (adType === 'TEXT') {
      const textKeys = PREVIEW_TEXT_POS.map(([k]) => k)
      if (!textKeys.includes(adPosition)) setAdPosition('CONTENT_TOP')
    } else {
      const bannerKeys = PREVIEW_BANNER_POS.map(([k]) => k)
      if (!bannerKeys.includes(adPosition)) setAdPosition('HEADER')
    }
  }, [adType, adPosition])

  const positions = adType === 'TEXT' ? PREVIEW_TEXT_POS : PREVIEW_BANNER_POS

  const hasContent = adType === 'BANNER' ? !!bannerUrl : !!(adTitle || adLink)

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      <SEO title="Live Ad Preview" description="Preview how your ad will look on LinkHub before purchasing." />

      {/* ── Compact Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/advertising" className="text-gray-500 hover:text-lz-accent transition-colors">
            <FiArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 bg-gradient-to-br from-lz-accent/15 to-violet-500/10 border border-lz-accent/15 rounded-xl flex items-center justify-center">
            <FiEye className="text-lz-accent" size={16} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight leading-tight">Live Ad Preview</h1>
            <p className="text-[11px] text-gray-500">See your ad placement in real-time</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded-full ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase">Live</span>
          </span>
        </div>
        <Link
          to="/advertising"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lz-accent to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-lz-accent/10"
        >
          <FiZap size={12} /> View Plans
        </Link>
      </div>

      {/* ── Controls Bar ── */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.008] p-4 mb-4 space-y-3">
        {/* Row 1: Type + Position + Size */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Ad Type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Ad Type</label>
            <div className="flex rounded-xl border border-white/[0.08] overflow-hidden">
              {(['BANNER', 'TEXT'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAdType(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all
                    ${adType === t
                      ? 'bg-lz-accent/15 text-lz-accent'
                      : 'bg-white/[0.02] text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {t === 'BANNER' ? <FiImage size={13} /> : <FiType size={13} />}
                  {t === 'BANNER' ? 'Banner' : 'Text'}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Position</label>
            <div className="relative">
              <select
                value={adPosition}
                onChange={e => setAdPosition(e.target.value)}
                className="appearance-none bg-lz-bg border border-lz-border text-white text-xs font-medium rounded-xl px-4 py-2 pr-8 focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20 outline-none cursor-pointer min-w-[160px]"
              >
                {positions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <FiChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Banner Size — only for Header / Header Down */}
          {adType === 'BANNER' && isHeaderPos && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">Size</label>
              <div className="relative">
                <select
                  value={bannerSize}
                  onChange={e => setBannerSize(e.target.value)}
                  className="appearance-none bg-lz-bg border border-lz-border text-white text-xs font-medium rounded-xl px-4 py-2 pr-8 focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20 outline-none cursor-pointer min-w-[160px]"
                >
                  {SIZE_LABELS.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <FiChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Content */}
        <div>
          {adType === 'BANNER' ? (
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap flex items-center gap-1.5">
                <FiEdit3 size={10} className="text-lz-accent/40" /> Content
              </label>
              <div className="relative flex-1">
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="w-full px-3 py-2 rounded-xl bg-lz-bg border border-lz-border text-white text-sm placeholder:text-gray-600 focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20 outline-none transition-all pr-10"
                />
                <FiImage size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" />
              </div>
              {isHeaderPos && (
                <span className="text-[10px] text-gray-600 whitespace-nowrap flex items-center gap-1">
                  <FiMaximize size={9} /> {BANNER_DIMS[bannerSize].label}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap flex items-center gap-1.5">
                <FiEdit3 size={10} className="text-lz-accent/40" /> Content
              </label>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={adTitle}
                  onChange={e => setAdTitle(e.target.value)}
                  placeholder="Ad title"
                  maxLength={60}
                  className="w-full px-3 py-2 rounded-xl bg-lz-bg border border-lz-border text-white text-sm placeholder:text-gray-600 focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20 outline-none transition-all"
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="url"
                  value={adLink}
                  onChange={e => setAdLink(e.target.value)}
                  placeholder="https://your-site.com"
                  className="w-full px-3 py-2 rounded-xl bg-lz-bg border border-lz-border text-white text-sm placeholder:text-gray-600 focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20 outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview Toolbar ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold text-white/25 uppercase tracking-widest flex items-center gap-2">
            <FiMonitor size={12} /> Site Preview
          </h2>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold
            ${hasContent
              ? 'bg-lz-accent/10 text-lz-accent border border-lz-accent/20'
              : 'bg-white/[0.03] text-gray-600 border border-white/[0.06]'
            }`}>
            <FiTarget size={10} />
            {positions.find(([k]) => k === adPosition)?.[1] || adPosition}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 text-[10px] font-medium ${hasContent ? 'text-emerald-400' : 'text-gray-600'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${hasContent ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          {hasContent ? 'Preview active' : 'Enter content to preview'}
        </div>
      </div>

      {/* ── Full-Width Preview ── */}
      <LiveSitePreview
        adType={adType}
        adPosition={adPosition}
        bannerSize={bannerSize}
        bannerUrl={bannerUrl}
        adTitle={adTitle}
        adLink={adLink}
      />

      {/* ── Footer ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px] text-gray-600 py-4 mt-3">
        <span className="flex items-center gap-1.5">
          <FiEye size={11} className="text-lz-accent/40" />
          Your ad glows cyan in the target zone
        </span>
        <span className="hidden sm:inline text-white/10">•</span>
        <span className="flex items-center gap-1.5">
          <FiZap size={11} className="text-amber-500/40" />
          No purchase needed to preview
        </span>
        <span className="hidden sm:inline text-white/10">•</span>
        <Link
          to="/advertising"
          className="flex items-center gap-1.5 text-lz-accent hover:text-cyan-300 font-medium transition-colors"
        >
          Ready to advertise? View Plans <FiArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}
