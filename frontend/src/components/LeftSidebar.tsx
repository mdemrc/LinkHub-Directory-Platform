import { Ad } from '../types'
import { adsApi } from '../lib/api'

interface LeftSidebarProps {
  ads: Ad[]
}

export default function LeftSidebar({ ads }: LeftSidebarProps) {
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

  return (
    <aside className="w-52 flex-shrink-0 bg-lz-sidebar border-r border-lz-border overflow-hidden">
      <div className="sticky top-0 p-3 space-y-3 w-full">
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
                className="cursor-pointer hover:opacity-90 transition-opacity"
              >
                {ad.type === 'BANNER' && (ad.imageUrl || (ad.linkUrl && /\.(gif|jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(ad.linkUrl))) ? (
                  <img
                    src={ad.imageUrl || ad.linkUrl}
                    alt={ad.name}
                    className="w-full h-auto rounded border border-lz-border hover:border-lz-accent/50 transition-colors"
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
                        </div>
                      </>
                    )
                  })()
                ) : (
                  <div className="text-[10px] text-lz-highlight p-1.5 rounded border border-lz-border bg-lz-bg">
                    ⭐ {ad.name}
                  </div>
                )}
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
      </div>
    </aside>
  )
}
