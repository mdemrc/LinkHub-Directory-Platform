import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { adPricingApi, categoriesApi, statsApi } from '../lib/api'
import { Category } from '../types'
import CaptchaWidget from '../components/CaptchaWidget'
import { FiArrowLeft, FiCreditCard, FiImage, FiType, FiAlertCircle, FiLoader, FiEye, FiMonitor, FiExternalLink, FiLink, FiCheckCircle, FiXCircle, FiClock, FiBell, FiRefreshCw } from 'react-icons/fi'
import SEO from '../components/SEO'

// ── Types ──────────────────────────────────────────────────
interface CryptoInfo {
  code: string
  name: string
  icon: string
}

interface OrderState {
  adType: 'BANNER' | 'TEXT'
  adPosition?: string
  bannerSize?: string
  duration: string
  durationLabel: string
  price: number
  displayName?: string
  previewLabel?: string
}

const POS_LABELS: Record<string, string> = {
  HEADER_BIG: 'Header Big Banner',
  HEADER_MEDIUM: 'Header Medium Banner',
  HEADER_SMALL: 'Header Small Banner',
  HEADER_DOWN_BIG: 'Header Down Big',
  HEADER_DOWN_MEDIUM: 'Header Down Medium',
  HEADER_DOWN_SMALL: 'Header Down Small',
  SIDEBAR_LEFT: 'Left Sidebar',
  SIDEBAR_RIGHT: 'Right Sidebar',
  CONTENT_TOP: 'Top Text',
  CONTENT_INLINE: 'Promoted Text',
}

const BANNER_DIMS: Record<string, { w: number; h: number; label: string }> = {
  xs: { w: 468, h: 60, label: '468×60' },
  sm: { w: 440, h: 111, label: '440×111' },
  cc: { w: 920, h: 120, label: '920×120' },
}

const POS_SIZE: Record<string, string> = {
  HEADER_BIG: 'cc', HEADER_MEDIUM: 'sm', HEADER_SMALL: 'xs',
  HEADER_DOWN_BIG: 'cc', HEADER_DOWN_MEDIUM: 'sm', HEADER_DOWN_SMALL: 'xs',
}

function tryHostname(url: string): string {
  try { return new URL(url).hostname } catch { return 'your-site.com' }
}

// ── Live Ad Preview ────────────────────────────────────────
// Realistic scaled-down replica of the live site showing only the user's ad
function LiveAdPreview({
  adType,
  adPosition,
  bannerSize,
  bannerUrl,
  adTitle,
  adLink,
}: {
  adType: 'BANNER' | 'TEXT'
  adPosition?: string
  bannerSize?: string
  bannerUrl: string
  adTitle: string
  adLink: string
}) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [innerHeight, setInnerHeight] = useState(600)
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

  useEffect(() => {
    if (!innerRef.current) return
    const obs = new ResizeObserver(entries => {
      if (entries[0]) setInnerHeight(entries[0].contentRect.height)
    })
    obs.observe(innerRef.current)
    return () => obs.disconnect()
  }, [])

  const SCALE = 0.37
  const INNER_W = 920
  const sizeKey = adPosition ? POS_SIZE[adPosition] : (bannerSize || null)
  const dims = sizeKey ? BANNER_DIMS[sizeKey] : null
  const isAboveNav = adPosition?.startsWith('HEADER_') && !adPosition?.startsWith('HEADER_DOWN_')
  const isBelowNav = adPosition?.startsWith('HEADER_DOWN_')
  const isTopText = adPosition === 'CONTENT_TOP'
  const isPromotedInline = adPosition === 'CONTENT_INLINE'

  // Whether the user has entered content to preview
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
              {adType === 'BANNER' ? <FiImage size={16} className="text-lz-accent/25 mx-auto mb-1" /> : <FiType size={16} className="text-lz-accent/25 mx-auto mb-1" />}
              <span className="text-[9px] text-lz-accent/35 block leading-tight">
                {adType === 'BANNER'
                  ? `Enter Banner Image URL to preview${dims ? ` (${dims.label})` : ''}`
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
          ) : adPosition === 'CONTENT_INLINE' ? (
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #1a0a00 0%, #2d1000 50%, #1a0a00 100%)' }}>
              <div className="relative py-2 px-3 text-center">
                <span className="text-orange-400 mr-1 text-xs">🔥</span>
                <span className="font-bold text-orange-300 text-xs uppercase tracking-wide">
                  {adTitle || 'YOUR PROMOTED AD'}
                </span>
                {adLink && (
                  <span className="text-orange-400/50 text-xs ml-1.5">- {tryHostname(adLink)}</span>
                )}
              </div>
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
    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#060810] shadow-2xl shadow-black/60">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.025] border-b border-white/[0.06]">
        <div className="flex gap-1">
          <div className="w-[7px] h-[7px] rounded-full bg-[#ff5f56]" />
          <div className="w-[7px] h-[7px] rounded-full bg-[#ffbd2e]" />
          <div className="w-[7px] h-[7px] rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1.5 px-4 py-0.5 bg-white/[0.04] rounded-md text-[8px] text-white/25 font-mono">
            <span>🔗</span> LinkHub.cc
          </div>
        </div>
      </div>

      {/* Scaled real site layout */}
      <div style={{ height: Math.max(innerHeight * SCALE, 200), overflow: 'hidden', position: 'relative' }}>
        <div
          ref={innerRef}
          style={{ width: INNER_W, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
          className="bg-lz-bg text-lz-text"
        >
          {/* ── HEADER TOP BANNER ── */}
          {isAboveNav ? <UserAdZone /> : <EmptyZone label="Header Banner" />}

          {/* ── HEADER DOWN BANNER (still above nav — lower area of header) ── */}
          {isBelowNav ? <UserAdZone /> : <EmptyZone label="Header Down Banner" />}

          {/* ── NAV HEADER ── */}
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
              <div className="flex items-center gap-1 px-3 h-full text-xs font-medium text-white bg-lz-accent border-r border-lz-border">
                Home
              </div>
              {categories.slice(0, 4).map(cat => (
                <div key={cat.id} className="flex items-center gap-1 px-3 h-full text-xs font-medium text-gray-400 border-r border-lz-border whitespace-nowrap">
                  {cat.name}
                </div>
              ))}
              <div className="flex items-center gap-1 px-3 h-full text-xs font-medium text-gray-400 border-r border-lz-border">Shop</div>
              <div className="flex items-center gap-1 px-3 h-full text-xs font-medium text-lz-accent border-r border-lz-border">Advertising</div>
            </div>
          </div>

          {/* ── TOP TEXT ── */}
          {isTopText ? <UserAdZone /> : <EmptyZone label="Top Text" />}

          {/* ── THREE COLUMN LAYOUT ── */}
          <div className="flex flex-1">
            {/* Left Sidebar */}
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

            {/* Main Content */}
            <main className="flex-1 min-w-0 bg-lz-bg-light">
              <div className="p-4 space-y-3">
                {/* Category header */}
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-white/[0.06] rounded w-24" />
                  <span className="text-[9px] text-lz-accent/40 font-bold bg-lz-accent/10 px-1.5 py-[1px] rounded">{isPromotedInline ? '6' : '5'}</span>
                </div>

                {/* Link listings */}
                <div className="border border-white/[0.06] rounded overflow-hidden">
                  {/* Promoted inline — pinned #1 in category */}
                  {isPromotedInline && (
                    <div className="relative">
                      <div className="absolute -top-1.5 left-3 z-10">
                        <span className="inline-flex items-center gap-0.5 text-[7px] font-bold text-white bg-lz-accent px-2 py-[2px] rounded-full whitespace-nowrap shadow-lg">
                          <FiEye size={7} /> YOUR AD
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2.5 py-2 px-3 border-b border-lz-accent/20"
                        style={{ background: 'linear-gradient(90deg, rgba(0,120,255,0.12) 0%, rgba(0,80,200,0.06) 100%)' }}
                      >
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-4 h-3 rounded-[2px] bg-white/10" />
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-lz-accent truncate">
                          {adTitle || 'YourSite'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Regular listings */}
                  {['ChangeNow', 'Coinfinity', 'CoinSpot', 'Swapzone', 'MorphToken'].map((name, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-2 px-3 border-b border-white/[0.04] last:border-b-0">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-4 h-3 rounded-[2px] bg-white/[0.06]" />
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < 3 ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-[11px] text-gray-400 font-medium">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </main>

            {/* Right Sidebar */}
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

// ── Order Page ─────────────────────────────────────────────
export default function AdOrderPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as OrderState | null

  const [cryptos, setCryptos] = useState<CryptoInfo[]>([])
  const [minAmounts, setMinAmounts] = useState<Record<string, number>>({})
  const [cryptoEnabled, setCryptoEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMinAmounts, setIsLoadingMinAmounts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Form state
  const [adTitle, setAdTitle] = useState('')
  const [adLink, setAdLink] = useState('')
  const [adBannerUrl, setAdBannerUrl] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoInfo | null>(null)

  const getMinAmount = (code: string) => {
    const min = minAmounts[code]
    // Add 5% buffer to match backend validation and account for rate fluctuations
    return min ? Math.ceil(min * 1.05) : 0
  }

  const selectedMinAmount = selectedCrypto ? getMinAmount(selectedCrypto.code) : 0
  const meetsMinimum = !selectedCrypto || (state?.price ?? 0) >= selectedMinAmount

  useEffect(() => {
    if (!state) { navigate('/advertising'); return }
    const fetchData = async () => {
      try {
        const cryptosRes = await adPricingApi.getCryptos()
        setCryptos(cryptosRes.data.cryptos || [])
        setCryptoEnabled(cryptosRes.data.enabled || false)
        if (cryptosRes.data.cryptos?.length > 0) setSelectedCrypto(cryptosRes.data.cryptos[0])
      } catch (e) { console.error(e) }
      finally { setIsLoading(false) }
    }
    fetchData()
  }, [state, navigate])

  useEffect(() => {
    const fetchMinAmounts = async () => {
      if (!cryptoEnabled || cryptos.length === 0) return
      setIsLoadingMinAmounts(true)
      try {
        const res = await adPricingApi.getCryptoMinAmounts()
        setMinAmounts(res.data.minAmounts || {})
      } catch (e) { console.error(e) }
      finally { setIsLoadingMinAmounts(false) }
    }
    fetchMinAmounts()
  }, [cryptoEnabled, cryptos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setPaymentError(null)
    if (!adTitle || !adLink || !contactInfo) { setFormError('Please fill all required fields.'); return }
    if (state!.adType === 'BANNER' && !adBannerUrl) { setFormError('Please provide a banner image URL.'); return }
    if (cryptoEnabled && !selectedCrypto) { setFormError('Please select a cryptocurrency.'); return }
    if (cryptoEnabled && selectedCrypto && !meetsMinimum) {
      setFormError(`The minimum payment for ${selectedCrypto.code.toUpperCase()} is $${selectedMinAmount}. Please choose a longer duration or a different cryptocurrency.`)
      return
    }

    setIsSubmitting(true)
    try {
      const orderData = {
        adType: state!.adType,
        adPosition: state!.adPosition,
        bannerSize: state!.bannerSize,
        adTitle,
        adLink,
        adBannerUrl: state!.adType === 'BANNER' ? adBannerUrl : undefined,
        duration: state!.duration,
        price: state!.price,
        contactInfo,
        paymentMethod: selectedCrypto?.code?.toUpperCase() || 'MANUAL',
        captchaToken: captchaToken || undefined,
      }

      const orderRes = await adPricingApi.createOrder(orderData)
      const orderId = orderRes.data.id

      if (cryptoEnabled && selectedCrypto) {
        try {
          const paymentRes = await adPricingApi.createPayment(orderId, selectedCrypto.code)
          navigate('/payment', { state: { order: paymentRes.data.order, payment: paymentRes.data.payment } })
        } catch (payErr: any) {
          const errMsg = payErr.response?.data?.error || 'Payment creation failed. Please try a different cryptocurrency.'
          setPaymentError(errMsg)
        }
      } else {
        navigate('/advertising')
      }
    } catch (error: any) {
      setFormError(error.response?.data?.error || 'Failed to create order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!state) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const positionLabel = state.previewLabel || (state.adPosition ? POS_LABELS[state.adPosition] || state.adPosition : 'Site')
  const planName = state.displayName || (state.adType === 'BANNER' ? 'Banner Ad' : 'Text Ad')
  const bannerDims = state.bannerSize ? BANNER_DIMS[state.bannerSize] : null

  return (
    <div className="py-5 px-4 max-w-[1200px] mx-auto">
      <SEO title="Order Advertisement" description="Place your ad order on LinkHub." noindex={true} />

      {/* Back */}
      <button onClick={() => navigate('/advertising')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-4 transition-colors text-sm">
        <FiArrowLeft size={14} /> Back to advertising
      </button>

      {/* Plan summary bar */}
      <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-white/[0.06] mb-5"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.03) 0%, transparent 50%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lz-accent/10 border border-lz-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
            {state.adType === 'BANNER' ? <FiImage className="text-lz-accent" size={18} /> : <FiType className="text-lz-accent" size={18} />}
          </div>
          <div>
            <h1 className="text-base font-bold text-white">{planName}</h1>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>{state.durationLabel}</span>
              <span className="text-white/10">•</span>
              <span className="flex items-center gap-1"><FiMonitor size={10} />{positionLabel}</span>
              {bannerDims && (
                <>
                  <span className="text-white/10">•</span>
                  <span>{bannerDims.label}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-2xl font-extrabold text-lz-accent">${state.price.toFixed(2)}</div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Left: Form */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ad Details Section */}
            <div className="rounded-xl border border-white/[0.06] overflow-hidden"
              style={{ background: 'linear-gradient(165deg, rgba(15,25,40,0.8) 0%, rgba(10,15,28,0.9) 100%)' }}>
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <h2 className="text-sm font-bold text-white">Ad Details</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Ad Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Ad Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={e => setAdTitle(e.target.value)}
                    placeholder={state.adType === 'TEXT' ? 'Your promoted text title' : 'Advertisement name'}
                    className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.06] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-lz-accent/40 transition-colors"
                    required
                  />
                </div>

                {/* Target URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Target URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    value={adLink}
                    onChange={e => setAdLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.06] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-lz-accent/40 transition-colors"
                    required
                  />
                  <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                    <FiExternalLink size={9} /> Destination when users click your ad
                  </p>
                </div>

                {/* Banner URL (only for BANNER type) */}
                {state.adType === 'BANNER' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Banner Image URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={adBannerUrl}
                      onChange={e => setAdBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.png"
                      className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.06] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-lz-accent/40 transition-colors"
                      required
                    />
                    <p className="text-[10px] text-gray-600 mt-1">
                      Direct link to your banner image (PNG, JPG, GIF)
                      {bannerDims && <span className="text-lz-accent/50 ml-1">Recommended: {bannerDims.label}px</span>}
                    </p>
                    {/* Inline preview of banner */}
                    {adBannerUrl && (
                      <div className="mt-2.5 p-2.5 bg-[#060810] rounded-lg border border-white/[0.04]">
                        <p className="text-[10px] text-gray-500 mb-1.5">Banner preview:</p>
                        <img
                          src={adBannerUrl}
                          alt="Banner preview"
                          className="max-h-24 rounded border border-white/[0.06]"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Contact */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Contact Info <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={e => setContactInfo(e.target.value)}
                    placeholder="Email, Telegram, Jabber or Tox"
                    className="w-full px-3.5 py-2.5 bg-[#080d18] border border-white/[0.06] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-lz-accent/40 transition-colors"
                    required
                  />
                  <p className="text-[10px] text-gray-600 mt-1">For payment confirmation & communication</p>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="rounded-xl border border-white/[0.06] overflow-hidden"
              style={{ background: 'linear-gradient(165deg, rgba(15,25,40,0.8) 0%, rgba(10,15,28,0.9) 100%)' }}>
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <h2 className="text-sm font-bold text-white">Payment</h2>
              </div>
              <div className="p-5 space-y-4">
                {cryptoEnabled && cryptos.length > 0 ? (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      Select Cryptocurrency <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {cryptos.map(crypto => {
                        const minAmount = getMinAmount(crypto.code)
                        const isAvailable = state.price >= minAmount || minAmount === 0
                        return (
                          <button
                            key={crypto.code}
                            type="button"
                            onClick={() => setSelectedCrypto(crypto)}
                            disabled={!isAvailable && minAmount > 0}
                            className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all ${
                              !isAvailable && minAmount > 0
                                ? 'bg-red-500/5 border-red-500/20 text-gray-600 cursor-not-allowed opacity-60'
                                : selectedCrypto?.code === crypto.code
                                  ? 'bg-lz-accent/10 border-lz-accent/40 text-white ring-1 ring-lz-accent/20'
                                  : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/[0.12]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <img
                                src={crypto.icon}
                                alt={crypto.name}
                                className="w-4 h-4"
                                onError={e => { (e.target as HTMLImageElement).src = `https://nowpayments.io/images/coins/${crypto.code}.svg` }}
                              />
                              <span className="font-medium text-xs">{crypto.code.toUpperCase()}</span>
                            </div>
                            {isLoadingMinAmounts ? (
                              <FiLoader className="animate-spin text-gray-600" size={10} />
                            ) : minAmount > 0 ? (
                              <span className={`text-[10px] ${isAvailable ? 'text-gray-600' : 'text-red-400'}`}>Min: ${minAmount}</span>
                            ) : (
                              <span className="text-[10px] text-gray-600">Min: —</span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {selectedCrypto && !meetsMinimum && selectedMinAmount > 0 && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                        <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={14} />
                        <p className="text-xs text-red-400">
                          Minimum payment for {selectedCrypto.code.toUpperCase()} is <strong>${selectedMinAmount}</strong>.
                          Your order is ${state.price.toFixed(2)}. Select a longer duration or different crypto.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-lg">
                    <p className="text-xs text-amber-400">
                      Crypto payments are currently unavailable. Your order will be processed manually.
                    </p>
                  </div>
                )}

                <CaptchaWidget onVerify={setCaptchaToken} />

                {/* Form/Payment error messages */}
                {(formError || paymentError) && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <FiAlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-red-400">{formError || paymentError}</p>
                      {paymentError && (
                        <p className="text-xs text-red-400/60 mt-1">Try selecting a different cryptocurrency or increasing your order duration.</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFormError(null); setPaymentError(null) }}
                      className="text-red-400/50 hover:text-red-400 flex-shrink-0"
                    >
                      <FiXCircle size={14} />
                    </button>
                  </div>
                )}

                {/* Total + Submit */}
                <div className="border-t border-white/[0.04] pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total</span>
                    <span className="text-2xl font-extrabold text-white">${state.price.toFixed(2)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || (cryptoEnabled && (!selectedCrypto || !meetsMinimum))}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lz-accent to-blue-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCreditCard size={16} />
                        {cryptoEnabled && selectedCrypto ? `Pay with ${selectedCrypto.code.toUpperCase()}` : 'Submit Order'}
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-600 text-center">
                    {cryptoEnabled ? "You'll be redirected to complete payment" : "You'll receive payment instructions via your contact method"}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Live Preview */}
        <div className="hidden md:block w-72 lg:w-80 xl:w-[340px] flex-shrink-0 sticky top-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <FiMonitor size={13} className="text-lz-accent/50" />
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Live Preview</span>
          </div>

          <LiveAdPreview
            adType={state.adType}
            adPosition={state.adPosition}
            bannerSize={state.bannerSize}
            bannerUrl={adBannerUrl}
            adTitle={adTitle}
            adLink={adLink}
          />

          <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-lz-accent animate-pulse" />
              <span className="text-[10px] text-lz-accent font-medium">
                {positionLabel}
              </span>
            </div>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              {state.adType === 'BANNER'
                ? 'Enter your Banner Image URL in the form to see a live preview of your ad in its position.'
                : 'Enter your Ad Title in the form to see a live preview of your text ad in its position.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* ── Have a Question? ── */}
      <div className="mt-6 flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lz-accent/10 border border-lz-accent/15 flex items-center justify-center flex-shrink-0">
            <FiAlertCircle size={14} className="text-lz-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Have a question?</p>
            <p className="text-[10px] text-gray-500">We're here to help with your order.</p>
          </div>
        </div>
        <a
          href="/contact"
          className="flex items-center gap-1.5 px-4 py-2 bg-lz-accent/10 hover:bg-lz-accent/15 border border-lz-accent/20 text-lz-accent text-xs font-bold rounded-lg transition-all whitespace-nowrap"
        >
          <FiExternalLink size={11} /> Contact Us
        </a>
      </div>
    </div>
  )
}
