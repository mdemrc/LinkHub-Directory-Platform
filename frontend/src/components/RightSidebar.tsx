import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiBell, FiClock, FiLink, FiCheckCircle, FiXCircle, FiChevronRight, FiRefreshCw, FiX } from 'react-icons/fi'
import { statsApi, announcementsApi, adsApi } from '../lib/api'
import { Ad, Announcement } from '../types'

interface Stats {
  totalLinks: number
  onlineLinks: number
  offlineLinks: number
}

interface RightSidebarProps {
  lastUpdate?: Date
  ads?: Ad[]
}

export default function RightSidebar({ lastUpdate, ads = [] }: RightSidebarProps) {
  const [stats, setStats] = useState<Stats>({
    totalLinks: 0,
    onlineLinks: 0,
    offlineLinks: 0,
  })
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, annRes] = await Promise.all([
        statsApi.getOverview(),
        announcementsApi.getActive().catch(() => ({ data: [] }))
      ])
      setStats(statsRes.data)
      const annData = Array.isArray(annRes.data) ? annRes.data : annRes.data?.value || []
      setAnnouncements(annData)
    } catch (error) {
      console.error('Failed to fetch sidebar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdClick = async (ad: Ad) => {
    try {
      await adsApi.click(ad.id)
    } catch (error) {
      // Silent fail
    }
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const extractCssRules = (css: string): string => {
    let raw = css.trim()
    const blockMatch = raw.match(/^\.[^{]+\{([\s\S]*)\}\s*$/)
    if (blockMatch) raw = blockMatch[1].trim()
    return raw
  }

  const unreadCount = announcements.length

  return (
    <aside className="w-56 flex-shrink-0 bg-lz-sidebar border-l border-lz-border hidden xl:block">
      <div className="sticky top-0 p-3 space-y-3">
        {/* Notification Bell + Last Update */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 bg-lz-bg border border-lz-border rounded flex items-center justify-center hover:border-lz-accent/50 transition-colors"
            >
              <FiBell size={16} className="text-lz-text-muted" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-lz-text-muted">
            <FiClock size={12} />
            <span>
              {(lastUpdate || new Date()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Notifications dropdown */}
        {showNotifications && announcements.length > 0 && (
          <div className="border border-lz-border rounded bg-lz-bg p-2 space-y-2 max-h-48 overflow-y-auto">
            <h4 className="text-[10px] uppercase tracking-wider text-lz-text-muted">
              Notifications
            </h4>
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-2 rounded border border-lz-border/50 bg-lz-sidebar"
              >
                <p className="text-[11px] font-medium text-white">{ann.title}</p>
                <p className="text-[10px] text-lz-text-muted mt-0.5 line-clamp-2">
                  {ann.content}
                </p>
                {ann.content && ann.content.length > 80 && (
                  <button
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="text-[10px] text-lz-accent hover:text-cyan-300 mt-1 transition-colors"
                  >
                    Show more
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Announcement Detail Modal */}
        {selectedAnnouncement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <div className="absolute inset-0 bg-black/70" />
            <div
              className="relative bg-lz-bg border border-lz-border rounded-lg p-5 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-bold text-white pr-4">{selectedAnnouncement.title}</h3>
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="text-lz-text-muted hover:text-white transition-colors flex-shrink-0"
                >
                  <FiX size={16} />
                </button>
              </div>
              <p className="text-xs text-lz-text-muted whitespace-pre-wrap leading-relaxed">
                {selectedAnnouncement.content}
              </p>
            </div>
          </div>
        )}

        {/* Statistics Card */}
        <div className="border border-lz-border rounded p-2.5 bg-lz-bg">
          <h4 className="text-[10px] uppercase tracking-wider text-lz-text-muted mb-2">
            Statistics
          </h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <div className="w-4 h-4 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-lz-text-muted flex items-center gap-1">
                  <FiLink size={11} className="text-lz-accent" />
                  Total
                </span>
                <span className="text-white font-medium">{stats.totalLinks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lz-text-muted flex items-center gap-1">
                  <FiCheckCircle size={11} className="text-green-500" />
                  Online
                </span>
                <span className="text-green-500 font-medium">{stats.onlineLinks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lz-text-muted flex items-center gap-1">
                  <FiXCircle size={11} className="text-red-500" />
                  Offline
                </span>
                <span className="text-red-500 font-medium">{stats.offlineLinks}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Ads */}
        {ads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-lz-text-muted">
              Sponsored
            </h4>
            {ads.map((ad) => (
              <div
                key={ad.id}
                onClick={() => handleAdClick(ad)}
                className="cursor-pointer"
              >
                {ad.type === 'BANNER' && (ad.imageUrl || (ad.linkUrl && /\.(gif|jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(ad.linkUrl))) ? (
                  <img
                    src={ad.imageUrl || ad.linkUrl}
                    alt={ad.name}
                    className="w-full rounded border border-lz-border hover:border-lz-accent/50 transition-colors"
                  />
                ) : ad.type === 'TEXT' ? (
                  (() => {
                    const adClass = `sidebar-ad-${ad.id}`
                    const cssRules = ad.customCss ? extractCssRules(ad.customCss) : ''
                    return (
                      <>
                        {cssRules && (
                          <style dangerouslySetInnerHTML={{ __html: `.${adClass} { background-color: ${ad.backgroundColor || 'transparent'}; color: ${ad.textColor || '#ffffff'}; ${cssRules} }` }} />
                        )}
                        <div 
                          className={`p-3 rounded-lg border border-lz-border hover:border-lz-accent/50 transition-colors overflow-hidden ${cssRules ? adClass : ''}`}
                          style={cssRules ? { borderColor: ad.borderColor || undefined } : {
                            backgroundColor: ad.backgroundColor || 'transparent',
                            borderColor: ad.borderColor || undefined,
                          }}
                        >
                          <span 
                            className="block break-words overflow-hidden leading-snug"
                            style={{
                              fontSize: ({ xs: '11px', sm: '12px', md: '13px', lg: '15px', xl: '17px' } as Record<string,string>)[ad.fontSize || 'md'] || '13px',
                              fontWeight: ({ normal: 700, medium: 800, semibold: 900, bold: 900 } as Record<string,number>)[ad.fontWeight || 'bold'] || 900,
                              WebkitTextStroke: ({ normal: '0.3px currentColor', medium: '0.5px currentColor', semibold: '0.8px currentColor', bold: '1px currentColor' } as Record<string,string>)[ad.fontWeight || 'bold'] || '1px currentColor',
                              ...(cssRules ? {} : { color: ad.textColor || '#ffffff' }),
                            }}
                          >
                            {ad.textIcon && <span className="mr-1">{ad.textIcon}</span>}
                            {ad.textTitle}
                          </span>
                          {ad.textContent && (
                            <p 
                              className="mt-1 opacity-90 break-words overflow-hidden line-clamp-4 leading-relaxed"
                              style={{
                                fontSize: ({ xs: '9px', sm: '10px', md: '11px', lg: '13px', xl: '15px' } as Record<string,string>)[ad.fontSize || 'md'] || '11px',
                                fontWeight: ({ normal: 700, medium: 800, semibold: 900, bold: 900 } as Record<string,number>)[ad.fontWeight || 'bold'] || 900,
                                WebkitTextStroke: ({ normal: '0.3px currentColor', medium: '0.5px currentColor', semibold: '0.8px currentColor', bold: '1px currentColor' } as Record<string,string>)[ad.fontWeight || 'bold'] || '1px currentColor',
                                ...(cssRules ? {} : { color: ad.textColor || '#ffffff' }),
                              }}
                            >
                              {ad.textContent}
                            </p>
                          )}
                          <div 
                            className="flex items-center gap-1 mt-1.5 text-[11px]"
                            style={cssRules ? undefined : { color: ad.textColor || '#ffffff' }}
                          >
                            <span>Visit</span>
                            <FiChevronRight size={10} />
                          </div>
                        </div>
                      </>
                    )
                  })()
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Empty ad slot placeholder */}
        {ads.length === 0 && (
          <div className="border border-dashed border-lz-border/50 rounded p-3 text-center">
            <p className="text-[10px] text-lz-text-muted">Ad Space</p>
            <a href="/advertising" className="text-[10px] text-lz-accent hover:underline">
              Advertise Here
            </a>
          </div>
        )}

        {/* Version + Changelog */}
        <div className="text-[10px] text-lz-text-muted border-t border-lz-border pt-2">
          <div className="flex items-center gap-1">
            <FiRefreshCw size={10} />
            <span>v2.0.0</span>
          </div>
          <Link to="/changelog" className="text-lz-accent hover:underline">
            Changelog
          </Link>
        </div>
      </div>
    </aside>
  )
}
