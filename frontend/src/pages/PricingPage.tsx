import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AdPricing, AdSettings } from '../types'
import { adPricingApi } from '../lib/api'
import { FiChevronDown, FiArrowRight, FiZap, FiMail, FiMonitor, FiCheck, FiTrendingUp, FiSend, FiShield, FiEye, FiMessageCircle, FiAlertTriangle } from 'react-icons/fi'
import SEO from '../components/SEO'
import DynamicIcon from '../components/DynamicIcon'
import { useSettings } from '../contexts/SettingsContext'

type Duration = 'WEEK' | 'MONTH' | '2_MONTHS' | '3_MONTHS' | '6_MONTHS' | 'YEAR'

const DURATION_LABELS: Record<Duration, string> = {
  WEEK: '1 Week', MONTH: '1 Month', '2_MONTHS': '2 Months',
  '3_MONTHS': '3 Months', '6_MONTHS': '6 Months', YEAR: '1 Year',
}

const DURATION_MONTHS: Record<Duration, number> = {
  WEEK: 0, MONTH: 1, '2_MONTHS': 2, '3_MONTHS': 3, '6_MONTHS': 6, YEAR: 12,
}

const ALL_DURATIONS: Duration[] = ['WEEK', 'MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', 'YEAR']

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

const BANNER_SIZES: Record<string, string> = {
  xs: '468×60', sm: '440×111', cc: '920×120',
}

// Unified accent for all regular cards — muted and clean
const DEFAULT_ACCENT = {
  grad: 'from-white/10 to-white/5', text: 'text-white', bg: 'rgba(255,255,255,0.015)',
  border: 'border-white/[0.06]', borderHover: 'border-white/[0.10]',
  badge: 'bg-white/[0.06] text-gray-400', btn: 'from-white/10 to-white/5',
  btnHover: 'hover:from-white/15 hover:to-white/10',
  check: 'rgba(255,255,255,0.06)', shadow: 'rgba(0,0,0,0.15)',
}

function getPrice(item: AdPricing, d: Duration): number {
  return ({ WEEK: item.priceWeek, MONTH: item.priceMonth, '2_MONTHS': item.price2Months, '3_MONTHS': item.price3Months, '6_MONTHS': item.price6Months, YEAR: item.priceYear } as Record<Duration, number>)[d] || 0
}

function getAvailDurations(item: AdPricing): Duration[] {
  return ALL_DURATIONS.filter(d => getPrice(item, d) > 0)
}

function fmtPrice(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`
}

// Helper to generate glow keyframes CSS for a specific color
function generateGlowCss(color: string, id: number): string {
  const r = parseInt(color.slice(1,3), 16)
  const g = parseInt(color.slice(3,5), 16)
  const b = parseInt(color.slice(5,7), 16)
  return `
    @keyframes card-glow-${id} {
      0%, 100% { box-shadow: 0 0 15px rgba(${r},${g},${b},0.35), 0 0 30px rgba(${r},${g},${b},0.15), 0 4px 20px rgba(${r},${g},${b},0.1); }
      33% { box-shadow: 0 0 25px rgba(${r},${g},${b},0.5), 0 0 55px rgba(${r},${g},${b},0.25), 0 4px 25px rgba(${r},${g},${b},0.15); }
      66% { box-shadow: 0 0 18px rgba(${r},${g},${b},0.4), 0 0 40px rgba(${r},${g},${b},0.2), 0 4px 22px rgba(${r},${g},${b},0.12); }
    }
    @keyframes card-bar-${id} {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes card-border-${id} {
      0%, 100% { border-color: rgba(${r},${g},${b},0.25); }
      33% { border-color: rgba(${r},${g},${b},0.4); }
      66% { border-color: rgba(${r},${g},${b},0.3); }
    }
  `
}

function getAccentForItem(item: AdPricing) {
  if (!item.glowEnabled || !item.glowColor) return DEFAULT_ACCENT

  const c = item.glowColor
  return {
    grad: `from-[${c}]/60 to-[${c}]/40`,
    text: 'text-white',
    bg: `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},0.04)`,
    border: `border-[${c}]/15`,
    borderHover: `border-[${c}]/25`,
    badge: `bg-[${c}]/10 text-white`,
    btn: `from-[${c}] to-[${c}]`,
    btnHover: `hover:from-[${c}]/80 hover:to-[${c}]/80`,
    check: `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},0.10)`,
    shadow: `rgba(${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)},0.08)`,
  }
}

export default function PricingPage() {
  const navigate = useNavigate()
  const { settings: siteSettings, isLoading: settingsLoading } = useSettings()
  const [pricing, setPricing] = useState<AdPricing[]>([])
  const [settings, setSettings] = useState<AdSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [durations, setDurations] = useState<Record<number, Duration>>({})

  const isContactMode = siteSettings.advertising_page_mode === 'contact'

  useEffect(() => {
    if (isContactMode) {
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const [pRes, sRes] = await Promise.all([adPricingApi.getAll(), adPricingApi.getSettings()])
        setPricing(pRes.data)
        setSettings(sRes.data)
        const defs: Record<number, Duration> = {}
        pRes.data.forEach((item: AdPricing) => {
          const avail = getAvailDurations(item)
          defs[item.id] = avail.includes('MONTH') ? 'MONTH' : avail[0]
        })
        setDurations(defs)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [isContactMode])

  const handleOrder = (item: AdPricing) => {
    const dur = durations[item.id]
    if (!dur) return
    navigate('/advertising/order', {
      state: {
        adType: item.type,
        adPosition: item.position || undefined,
        bannerSize: item.bannerSize || undefined,
        duration: dur,
        durationLabel: DURATION_LABELS[dur],
        price: getPrice(item, dur),
        displayName: item.displayName || (item.type === 'BANNER' ? 'Banner Ad' : 'Text Ad'),
        previewLabel: item.previewLabel || (item.position ? POS_LABELS[item.position] : undefined),
      }
    })
  }

  if (loading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Contact-only mode
  if (isContactMode) {
    return (
      <div className="relative">
        <SEO
          title="Contact"
          description="Get in touch with us through our official channels."
          keywords="contact, telegram, jabber, xmpp"
          breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Contact', url: '/advertising' }]}
        />
        <div className="max-w-xl mx-auto px-4 pt-10 pb-16">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-lz-accent/10 border border-lz-accent/20 rounded-2xl flex items-center justify-center">
              <FiMessageCircle size={24} className="text-lz-accent" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Get in Touch</h1>
            <p className="text-sm text-gray-500">Reach out to us through our official channels below.</p>
          </div>

          {/* Contact Cards */}
          <div className="space-y-3">
            {/* Telegram */}
            {siteSettings.telegram_url && (
              <a
                href={siteSettings.telegram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#229ED9]/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#229ED9]/15 transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#229ED9]">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#229ED9] transition-colors">Telegram</h3>
                  <p className="text-xs text-gray-500 truncate">{siteSettings.telegram_url}</p>
                </div>
                <FiArrowRight size={16} className="text-gray-600 group-hover:text-[#229ED9] transition-colors flex-shrink-0" />
              </a>
            )}

            {/* Jabber / XMPP */}
            {siteSettings.jabber_url && (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <FiMessageCircle size={22} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">Jabber / XMPP</h3>
                  <p className="text-xs text-gray-400 font-mono select-all">{siteSettings.jabber_url as string}</p>
                </div>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <FiAlertTriangle size={16} className="text-amber-400/70" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-400/80 uppercase tracking-wider mb-1.5">Important Notice</h4>
                <p className="text-[12px] text-gray-400 leading-relaxed">
                  If you'd like to get in touch, please use only the official contact details listed on our website to ensure you're communicating with us directly and to avoid any potential impersonation or scams.
                </p>
              </div>
            </div>
          </div>

          {/* No contact info fallback */}
          {!siteSettings.telegram_url && !siteSettings.jabber_url && (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <FiMessageCircle size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">No contact information configured yet.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const glowItems = pricing.filter(p => p.glowEnabled && p.glowColor)

  return (
    <div className="relative">
      <style>{`
        @keyframes pricing-fire-flicker {
          0%, 100% { opacity: 0.85; transform: scaleY(1) translateY(0) rotate(-2deg); }
          15% { opacity: 1; transform: scaleY(1.15) translateY(-2px) rotate(1deg); }
          30% { opacity: 0.9; transform: scaleY(0.9) translateY(0.5px) rotate(-1deg); }
          50% { opacity: 1; transform: scaleY(1.2) translateY(-2.5px) rotate(2deg); }
          70% { opacity: 0.85; transform: scaleY(0.95) translateY(0) rotate(-1.5deg); }
          85% { opacity: 1; transform: scaleY(1.1) translateY(-1.5px) rotate(1deg); }
        }
        @keyframes pricing-fire-ember {
          0% { opacity: 0; transform: translateY(0) scale(0.8); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-12px) scale(0.3); }
        }
        ${glowItems.map(item => generateGlowCss(item.glowColor!, item.id)).join('\n')}
        @keyframes gold-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gold-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(218,170,60,0.15), 0 0 40px rgba(218,170,60,0.05), inset 0 1px 0 rgba(255,215,100,0.06); }
          50% { box-shadow: 0 0 30px rgba(218,170,60,0.25), 0 0 60px rgba(218,170,60,0.1), inset 0 1px 0 rgba(255,215,100,0.1); }
        }
        @keyframes gold-border {
          0%, 100% { border-color: rgba(218,170,60,0.2); }
          50% { border-color: rgba(218,170,60,0.35); }
        }
      `}</style>
      <SEO
        title="Advertising"
        description="Advertise on LinkHub - flexible pricing for banners, text ads, and sponsored listings."
        keywords="advertising, pricing, banner ads, text ads"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Advertising', url: '/advertising' }]}
      />

      {/* ── Main Content ── */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4 pb-6">
        {pricing.length > 0 ? (
          <>
            {/* Cards Grid */}
            <div className={`grid gap-3 ${
              pricing.length === 1 ? 'max-w-xs mx-auto' :
              pricing.length === 2 ? 'sm:grid-cols-2 max-w-lg mx-auto' :
              pricing.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
              pricing.length <= 6 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
              'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {pricing.map((item) => {
                const hasGlow = item.glowEnabled && item.glowColor
                const badgeType = item.badgeType || ''
                const isPopular = badgeType === 'popular'
                const isPremium = badgeType === 'premium'
                const isCustomBadge = badgeType === 'custom'
                const hasBadge = isPopular || isPremium || isCustomBadge
                const a = hasGlow ? getAccentForItem(item) : DEFAULT_ACCENT
                const glowColor = item.glowColor || '#ff6b00'
                const r = parseInt(glowColor.slice(1,3), 16)
                const g = parseInt(glowColor.slice(3,5), 16)
                const b = parseInt(glowColor.slice(5,7), 16)
                const badgeText = item.badgeText || (isPopular ? 'Popular' : isPremium ? 'Premium' : 'Special')
                const badgeIcon = item.badgeIcon || ''
                const badgeColor = item.badgeColor || ''
                const dur = durations[item.id]
                const price = dur ? getPrice(item, dur) : 0
                const months = dur ? DURATION_MONTHS[dur] : 0
                const origMonthly = months > 1 ? item.priceMonth * months : 0
                const savings = origMonthly > 0 ? Math.round(origMonthly - price) : 0
                const pct = origMonthly > 0 ? Math.round((savings / origMonthly) * 100) : 0
                const avail = getAvailDurations(item)
                const features: string[] = Array.isArray(item.features) ? item.features : []
                const name = item.displayName || (item.type === 'BANNER' ? 'Banner Ad' : 'Text Ad')
                const desc = item.description || (item.bannerSize ? `Size ${BANNER_SIZES[item.bannerSize] || item.bannerSize}` : '')
                const posLabel = item.previewLabel || (item.position ? POS_LABELS[item.position] : '')

                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col rounded-xl overflow-visible transition-all duration-300 ease-out
                      hover:-translate-y-0.5 focus-within:-translate-y-0.5
                      ${isPopular ? 'ring-1 ring-emerald-500/30' : ''}`}
                    style={{
                      ...(hasGlow ? { animation: `card-glow-${item.id} 2s ease-in-out infinite` } : {}),
                      boxShadow: isPopular && !hasGlow
                        ? `0 4px 20px ${a.shadow}, 0 0 0 1px rgba(255,255,255,0.04)`
                        : '0 1px 8px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.03)',
                    }}
                    tabIndex={0}
                  >
                    {/* Badge */}
                    {hasBadge && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                        {hasGlow ? (
                          <span
                            className="inline-flex items-center gap-1 px-3 py-0.5 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-lg relative overflow-hidden"
                            style={{
                              background: badgeColor || `linear-gradient(90deg, ${glowColor}, ${glowColor}cc, ${glowColor})`,
                              backgroundSize: '200% 100%',
                              animation: !badgeColor ? `card-bar-${item.id} 2.5s linear infinite` : undefined,
                              boxShadow: `0 2px 12px rgba(${r},${g},${b},0.5), 0 0 20px rgba(${r},${g},${b},0.2)`,
                            }}
                          >
                            {badgeIcon && (isPremium ? (
                              <span style={{ animation: 'pricing-fire-flicker 1s ease-in-out infinite', display: 'inline-block', filter: `drop-shadow(0 0 2px rgba(${r},${g},${b},0.6))` }}><DynamicIcon name={badgeIcon} size={10} className="text-white" /></span>
                            ) : (
                              <DynamicIcon name={badgeIcon} size={10} className="text-white" />
                            ))}{' '}{badgeText}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-sm"
                            style={{ backgroundColor: badgeColor || (isPopular ? 'rgba(16,185,129,0.9)' : 'rgba(99,102,241,0.8)') }}
                          >
                            {badgeIcon && <DynamicIcon name={badgeIcon} size={10} className="text-white" />} {badgeText}
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={`relative flex flex-col flex-1 rounded-xl overflow-hidden border ${hasGlow ? '' : a.border}`}
                      style={{
                        background: `linear-gradient(170deg, ${a.bg} 0%, rgba(8,12,24,0.97) 40%, rgba(8,12,24,0.99) 100%)`,
                        ...(hasGlow ? { animation: `card-border-${item.id} 2s ease-in-out infinite`, borderWidth: '1px', borderStyle: 'solid' } : {}),
                      }}
                    >
                      {/* Top accent bar */}
                      {hasGlow ? (
                        <div className="h-[2px] relative">
                          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${glowColor}, ${glowColor}cc, ${glowColor})`, backgroundSize: '200% 100%', animation: `card-bar-${item.id} 3s linear infinite` }} />
                        </div>
                      ) : (
                        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      )}

                      {/* Badges + Name */}
                      <div className="px-3.5 pt-3 pb-1.5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {hasGlow ? (
                            <span className="text-[8px] font-bold px-1.5 py-[2px] rounded uppercase tracking-wide inline-flex items-center gap-0.5" style={{ backgroundColor: `rgba(${r},${g},${b},0.15)`, color: glowColor }}>
                              {badgeIcon && <DynamicIcon name={badgeIcon} size={8} />} {item.type}
                            </span>
                          ) : (
                            <span className={`text-[8px] font-bold px-1.5 py-[2px] rounded uppercase tracking-wide ${a.badge}`}>
                              {item.type}
                            </span>
                          )}
                          {posLabel && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] text-white/25 bg-white/[0.03] px-1.5 py-[2px] rounded">
                              <FiMonitor size={7} className="opacity-50" />{posLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="text-[13px] font-bold text-white leading-snug">{name}</h3>
                        {desc && <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{desc}</p>}
                      </div>

                      {/* Price + Duration */}
                      <div className="px-3.5 pb-2">
                        <div className="flex items-baseline gap-1 mb-1.5">
                          {savings > 0 && (
                            <span className="text-sm font-semibold text-gray-500 line-through mr-1">{fmtPrice(origMonthly)}</span>
                          )}
                          <span className="text-xl font-extrabold tracking-tight text-white" style={hasGlow ? { color: glowColor } : undefined}>{fmtPrice(price)}</span>
                          {dur && <span className="text-[10px] text-gray-600">/ {DURATION_LABELS[dur].toLowerCase()}</span>}
                          {savings > 0 && (
                            <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded ring-1 ring-emerald-500/20 ml-auto whitespace-nowrap">
                              -{pct}%
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <select
                            value={dur || ''}
                            onChange={e => setDurations(p => ({ ...p, [item.id]: e.target.value as Duration }))}
                            className="w-full px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-white text-[11px] font-medium appearance-none cursor-pointer focus:outline-none focus:border-white/[0.12] transition-colors pr-7"
                          >
                            {avail.map(d => <option key={d} value={d}>{DURATION_LABELS[d]}</option>)}
                          </select>
                          <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={10} />
                        </div>
                      </div>

                      {/* Features */}
                      {features.length > 0 ? (
                        <div className="px-3.5 pb-2 flex-1">
                          <div className="border-t border-white/[0.05] pt-2 space-y-1">
                            {features.map((f, fi) => (
                              <div key={fi} className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: a.check }}>
                                  <FiCheck className={hasGlow ? '' : 'text-emerald-400'} style={hasGlow ? { color: glowColor } : undefined} size={8} strokeWidth={3} />
                                </div>
                                <span className="text-[11px] text-gray-400 leading-snug">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}

                      {/* CTA */}
                      <div className="px-3.5 pb-3 mt-auto">
                        <button
                          onClick={() => handleOrder(item)}
                          disabled={!dur}
                          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2
                            text-white text-[11px] font-bold rounded-lg transition-all duration-200 disabled:opacity-40 active:scale-[0.97]`}
                          style={hasGlow ? {
                            background: `linear-gradient(135deg, ${glowColor}, ${glowColor}cc)`,
                            boxShadow: `0 2px 8px rgba(${r},${g},${b},0.3)`,
                          } : {
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                          onMouseEnter={e => {
                            if (hasGlow) (e.target as HTMLElement).style.opacity = '0.85'
                          }}
                          onMouseLeave={e => {
                            if (hasGlow) (e.target as HTMLElement).style.opacity = '1'
                          }}
                        >
                          Order Now <FiArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── How It Works ── */}
            <div className="mt-6 pt-5 border-t border-white/[0.04]">
              <h2 className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">How it works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { step: '01', icon: FiMonitor, title: 'Choose a Plan', desc: 'Select the ad type, position, and duration that fits your goal.' },
                  { step: '02', icon: FiSend, title: 'Submit & Pay', desc: 'Fill in your ad details, pay with cryptocurrency, and you\'re set.' },
                  { step: '03', icon: FiZap, title: 'Go Live', desc: 'Once approved, your ad goes live across the site and reaches all visitors instantly.' },
                ].map((s) => (
                  <div key={s.step} className="relative group/step flex gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] flex items-center justify-center">
                        <s.icon size={14} className="text-white/40 group-hover/step:text-lz-accent/60 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] font-bold text-lz-accent/40 tracking-widest">{s.step}</span>
                        <h3 className="text-[12px] font-bold text-white/80">{s.title}</h3>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Special Advertising CTA ── */}
            <div
              className="mt-6 rounded-xl p-[1px] relative overflow-hidden"
              style={{ animation: 'gold-glow 3s ease-in-out infinite', background: 'linear-gradient(135deg, rgba(218,170,60,0.3), rgba(180,140,40,0.1) 30%, rgba(218,170,60,0.2) 50%, rgba(180,140,40,0.1) 70%, rgba(218,170,60,0.3))' }}
            >
              {/* Shimmer overlay on border */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,220,100,0.15) 25%, rgba(255,240,160,0.25) 50%, rgba(255,220,100,0.15) 75%, transparent 100%)', backgroundSize: '200% 100%', animation: 'gold-shimmer 4s linear infinite' }}
              />
              <div
                className="rounded-[11px] p-4 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(30,25,15,0.98) 0%, rgba(15,12,8,0.99) 50%, rgba(25,20,10,0.98) 100%)' }}
              >
                {/* Inner gold ambient light */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(218,170,60,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(218,170,60,0.04) 0%, transparent 60%)' }} />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(218,170,60,0.15), rgba(180,140,40,0.08))', border: '1px solid rgba(218,170,60,0.25)' }}>
                    <FiZap className="text-amber-300" size={18} style={{ filter: 'drop-shadow(0 0 4px rgba(218,170,60,0.4))' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold" style={{ color: 'rgb(235,210,140)' }}>Special Advertising</h3>
                    <p className="text-[11px] truncate" style={{ color: 'rgba(218,190,120,0.45)' }}>Premium placements, long-term deals, and exclusive homepage spots available upon request.</p>
                  </div>
                  <a
                    href={(settings as any)?.specialAdLink || '/contact'}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, rgb(218,170,60), rgb(200,155,45))', color: 'rgb(20,15,5)', boxShadow: '0 2px 12px rgba(218,170,60,0.25), 0 0 20px rgba(218,170,60,0.1)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgb(235,190,70), rgb(218,170,60)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(218,170,60,0.35), 0 0 30px rgba(218,170,60,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgb(218,170,60), rgb(200,155,45))'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(218,170,60,0.25), 0 0 20px rgba(218,170,60,0.1)' }}
                  >
                    <FiMail size={13} /> Contact Us
                  </a>
                </div>
              </div>
            </div>

            {/* ── Live Preview CTA ── */}
            <div className="mt-3 rounded-xl p-4 border border-white/[0.06] bg-white/[0.015]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lz-accent/10 border border-lz-accent/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiEye className="text-lz-accent" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">Want to see how your ad will look?</h3>
                  <p className="text-[11px] text-gray-400 truncate">Preview your ad before ordering. Choose a position, add your content, and see exactly how it appears on the site.</p>
                </div>
                <Link
                  to="/advertising/preview"
                  className="flex items-center gap-1.5 px-4 py-2 bg-lz-accent hover:bg-cyan-400 text-black text-xs font-bold rounded-lg transition-all whitespace-nowrap flex-shrink-0"
                >
                  <FiEye size={13} /> Live Preview
                </Link>
              </div>
            </div>

            {/* ── Bottom Info Bar ── */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px] text-gray-500 py-3">
              <span className="flex items-center gap-1.5">
                <FiShield size={11} className="text-emerald-500/50" />
                Secure crypto payments via NowPayments
              </span>
              <span className="hidden sm:inline text-white/10">•</span>
              <span className="flex items-center gap-1.5">
                <FiTrendingUp size={11} className="text-lz-accent/40" />
                <span><span className="text-emerald-400 font-semibold">6+ month</span> plans get priority positioning</span>
              </span>
              <span className="hidden sm:inline text-white/10">•</span>
              <a href="/contact" className="text-lz-accent hover:underline font-medium">Questions? Contact us →</a>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-white/10 rounded-2xl py-20 text-center max-w-md mx-auto">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] rounded-2xl flex items-center justify-center">
              <FiZap size={22} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Coming Soon</h3>
            <p className="text-sm text-gray-500 mb-4">Advertising plans are being prepared.</p>
            <a href="/contact" className="inline-flex items-center gap-1.5 text-xs text-lz-accent hover:underline font-medium">
              <FiMail size={12} /> Get notified when available
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
