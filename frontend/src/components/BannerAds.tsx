import { Ad } from '../types'
import { adsApi } from '../lib/api'
import { useSettings } from '../contexts/SettingsContext'

interface BannerAdsProps {
  ads: Ad[]
}

export default function BannerAds({ ads }: BannerAdsProps) {
  const { settings } = useSettings()

  // Don't show ads if disabled in settings
  if (!settings.enable_ads) return null

  if (ads.length === 0) return null

  // Filter banner ads only
  const bannerAds = ads.filter(ad => ad.type === 'BANNER')

  // Resolve image source: imageUrl takes priority, fallback to linkUrl if it's an image
  const isImageUrl = (url: string) => /\.(gif|jpg|jpeg|png|webp|svg|bmp)(\?.*)?$/i.test(url)

  const getImageSrc = (ad: Ad): string | null => {
    if (ad.imageUrl) return ad.imageUrl
    if (ad.linkUrl && isImageUrl(ad.linkUrl)) return ad.linkUrl
    return null
  }

  const getClickUrl = (ad: Ad): string | null => {
    if (ad.imageUrl && ad.linkUrl) return ad.linkUrl
    if (!ad.imageUrl && ad.linkUrl && isImageUrl(ad.linkUrl)) return null
    return ad.linkUrl || null
  }

  const handleAdClick = async (ad: Ad) => {
    try {
      await adsApi.click(ad.id)
    } catch (error) {
      // Silent fail
    }
    
    const clickUrl = getClickUrl(ad)
    if (clickUrl) {
      window.open(clickUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Group banners by size for proper layout
  // If no bannerSize set, use smart default based on total banner count
  const groupBannersBySize = (banners: Ad[]) => {
    const ccBanners = banners.filter(b => b.bannerSize === 'cc')
    const xsBanners = banners.filter(b => b.bannerSize === 'xs')
    const smBanners = banners.filter(b => b.bannerSize === 'sm' || b.bannerSize === 'md' || b.bannerSize === 'lg' || b.bannerSize === 'xl')
    // Banners without bannerSize: treat as SM (default size)
    const unsizedBanners = banners.filter(b => !b.bannerSize)
    return { ccBanners, xsBanners, smBanners: [...smBanners, ...unsizedBanners] }
  }

  return (
    <div className="w-full">
      {/* Banner Ads Section */}
      {bannerAds.length > 0 && (() => {
        const { ccBanners, xsBanners, smBanners } = groupBannersBySize(bannerAds)
        
        return (
          <div className="bg-lz-bg py-0 overflow-hidden">
            <div className="w-full mx-auto">
              {/* CC Banners - 2 per row (50%) */}
              {ccBanners.length > 0 && (
                <div className="flex flex-wrap justify-center w-full">
                  {ccBanners.map((ad) => {
                    const imgSrc = getImageSrc(ad)
                    return (
                      <div 
                        key={ad.id}
                        onClick={() => handleAdClick(ad)}
                        className="cursor-pointer hover:opacity-90 transition-opacity duration-200 overflow-hidden"
                        style={{ width: '50%', height: '120px' }}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={ad.name}
                            className="w-full h-full object-fill block"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-blue-900 text-white/80 px-4 text-center flex items-center justify-center border-b border-white/5">
                            <div className="text-sm font-medium truncate">{ad.name}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* SM Banners - 3 per row (33.333%) */}
              {smBanners.length > 0 && (
                <div className="flex flex-wrap justify-center w-full">
                  {smBanners.map((ad) => {
                    const imgSrc = getImageSrc(ad)
                    return (
                      <div 
                        key={ad.id}
                        onClick={() => handleAdClick(ad)}
                        className="cursor-pointer hover:opacity-90 transition-opacity duration-200 overflow-hidden"
                        style={{ width: '33.3333%', height: '111px' }}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={ad.name}
                            className="w-full h-full object-fill block"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-blue-900 text-white/80 px-4 text-center flex items-center justify-center border-b border-white/5">
                            <div className="text-sm font-medium truncate">{ad.name}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* XS Banners - 5 per row (20%) */}
              {xsBanners.length > 0 && (
                <div className="flex flex-wrap justify-center w-full">
                  {xsBanners.map((ad) => {
                    const imgSrc = getImageSrc(ad)
                    return (
                      <div 
                        key={ad.id}
                        onClick={() => handleAdClick(ad)}
                        className="cursor-pointer hover:opacity-90 transition-opacity duration-200 overflow-hidden"
                        style={{ width: '20%', height: '85px' }}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={ad.name}
                            className="w-full h-full object-fill block"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-indigo-900 to-blue-900 text-white/70 px-3 text-center flex items-center justify-center border-b border-white/5">
                            <div className="text-xs font-medium truncate">{ad.name}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Text ads are rendered separately via TextAds component */}
    </div>
  )
}

// Separate TextAds component for positioning below categories
export function TextAds({ ads }: BannerAdsProps) {
  const { settings } = useSettings()

  if (!settings.enable_ads) return null

  const textAds = ads.filter(ad => ad.type === 'TEXT')
  if (textAds.length === 0) return null

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

  // Extract raw CSS rules from customCss (handles both raw props and .class { } blocks)
  const extractCssRules = (css: string): string => {
    let raw = css.trim()
    // If it looks like a class block: .name { rules }, extract just the rules
    const blockMatch = raw.match(/^\.[^{]+\{([\s\S]*)\}\s*$/)
    if (blockMatch) {
      raw = blockMatch[1].trim()
    }
    return raw
  }

  const fontSizeMap: Record<string, string> = {
    xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '18px',
  }
  const fontWeightMap: Record<string, number> = {
    normal: 500, medium: 600, semibold: 700, bold: 800,
  }
  const textStrokeMap: Record<string, string> = {
    normal: '0', medium: '0', semibold: '0.1px currentColor', bold: '0.2px currentColor',
  }

  return (
    <div className="text-ads-container">
      {textAds.map((ad) => {
        const adClass = `text-ad-custom-${ad.id}`
        const cssRules = ad.customCss ? extractCssRules(ad.customCss) : ''
        const adFontSize = fontSizeMap[ad.fontSize || 'md'] || '14px'
        const adFontWeight = fontWeightMap[ad.fontWeight || 'bold'] || 800
        const adTextStroke = textStrokeMap[ad.fontWeight || 'bold'] || '0.2px currentColor'

        return (
          <span key={ad.id}>
            {cssRules ? (
              <style dangerouslySetInnerHTML={{ __html: `.${adClass} { background-color: ${ad.backgroundColor || '#00ff00'}; color: ${ad.textColor || '#000000'}; ${cssRules} }` }} />
            ) : null}
            <a
              href={ad.linkUrl || '#'}
              onClick={(e) => {
                e.preventDefault()
                handleAdClick(ad)
              }}
              className={`text-ad-item ${cssRules ? adClass : ''}`}
              style={{
                fontSize: adFontSize,
                fontWeight: adFontWeight,
                WebkitTextStroke: adTextStroke,
                ...(cssRules ? {} : {
                  backgroundColor: ad.backgroundColor || '#00ff00',
                  color: ad.textColor || '#000000',
                }),
              }}
            >
              <span className="text-ad-star">{ad.textIcon || '★'}</span>
              <span className="text-ad-title" style={{ fontWeight: adFontWeight, WebkitTextStroke: adTextStroke }}>{ad.textTitle || ad.name}</span>
              {ad.textContent && (
                <span className="text-ad-content" style={{ fontWeight: adFontWeight, WebkitTextStroke: adTextStroke }}> - {ad.textContent}</span>
              )}
            </a>
          </span>
        )
      })}
    </div>
  )
}
