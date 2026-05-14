import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Category, Ad } from '../types'
import { categoriesApi, adsApi, adPricingApi } from '../lib/api'
import { useSettings } from '../contexts/SettingsContext'
import LeftSidebar from '../components/LeftSidebar'
import RightSidebar from '../components/RightSidebar'
import NavHeader from '../components/NavHeader'
import BannerAds, { TextAds } from '../components/BannerAds'
import Footer from '../components/Footer'
import AnnouncementPopup from '../components/AnnouncementPopup'
import LiveChatWidget from '../components/LiveChatWidget'

export default function MainLayout() {
  const { settings } = useSettings()
  const [categories, setCategories] = useState<Category[]>([])
  const [sidebarLeftAds, setSidebarLeftAds] = useState<Ad[]>([])
  const [sidebarRightAds, setSidebarRightAds] = useState<Ad[]>([])
  const [headerTopAds, setHeaderTopAds] = useState<Ad[]>([])
  const [headerBottomAds, setHeaderBottomAds] = useState<Ad[]>([])
  const [contentTopAds, setContentTopAds] = useState<Ad[]>([])
  const [contentInlineAds, setContentInlineAds] = useState<Ad[]>([])
  const [footerAds, setFooterAds] = useState<Ad[]>([])
  const [pinnedBadgeSize, setPinnedBadgeSize] = useState(14)
  const [flagSize, setFlagSize] = useState(14)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const siteName = settings.site_name || 'LinkHub'

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    description: settings.site_description || 'Premium Link Directory',
    ...(settings.contact_email && { email: settings.contact_email }),
    ...(settings.logo_url && { logo: settings.logo_url }),
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: settings.site_description || 'Premium Link Directory',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await categoriesApi.getNavigation()
        const catData = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.value || catRes.data || []
        setCategories(catData)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }

      try {
        const adSettingsRes = await adPricingApi.getSettings()
        if (adSettingsRes.data?.pinnedBadgeSize) {
          setPinnedBadgeSize(adSettingsRes.data.pinnedBadgeSize)
        }
        if (adSettingsRes.data?.flagSize) {
          setFlagSize(adSettingsRes.data.flagSize)
        }
      } catch {}

      try {
        const [headerTopRes, headerBottomRes, sidebarLeftRes, sidebarRightRes, contentTopRes, contentInlineRes, footerRes] = await Promise.all([
          adsApi.getByPosition('HEADER_TOP', true),
          adsApi.getByPosition('HEADER_BOTTOM'),
          adsApi.getByPosition('SIDEBAR_LEFT'),
          adsApi.getByPosition('SIDEBAR_RIGHT'),
          adsApi.getByPosition('CONTENT_TOP'),
          adsApi.getByPosition('CONTENT_INLINE'),
          adsApi.getByPosition('FOOTER')
        ])
        
        const parseAds = (res: any) => {
          const data = Array.isArray(res.data) ? res.data : res.data?.value || res.data || []
          return data.filter((ad: Ad) => ad.isActive)
        }
        
        setHeaderTopAds(parseAds(headerTopRes))
        setHeaderBottomAds(parseAds(headerBottomRes))
        setSidebarLeftAds(parseAds(sidebarLeftRes))
        setSidebarRightAds(parseAds(sidebarRightRes))
        setContentTopAds(parseAds(contentTopRes))
        setContentInlineAds(parseAds(contentInlineRes))
        setFooterAds(parseAds(footerRes))
      } catch (error) {
        // Ads are optional
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-lz-bg text-lz-text flex flex-col" style={{ '--pinned-badge-size': `${pinnedBadgeSize}px`, '--flag-size': `${flagSize}px` } as React.CSSProperties}>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
        {settings.google_analytics_id && (
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`} />
        )}
        {settings.google_analytics_id && (
          <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${settings.google_analytics_id}');`}</script>
        )}
      </Helmet>

      {/* Announcement Popup */}
      <AnnouncementPopup />

      {/* === All Banners above navbar (Big → Medium → Small) === */}
      <BannerAds ads={headerTopAds} />

      {headerBottomAds.length > 0 && (
        <BannerAds ads={headerBottomAds} />
      )}

      {contentInlineAds.length > 0 && (
        <BannerAds ads={contentInlineAds} />
      )}
      
      {/* Navigation Header */}
      <NavHeader categories={categories} />

      {/* Text Ads - shown below navbar */}
      <TextAds ads={headerTopAds} />
      {headerBottomAds.length > 0 && <TextAds ads={headerBottomAds} />}
      {contentInlineAds.length > 0 && <TextAds ads={contentInlineAds} />}

      {/* Content Top Ads */}
      {contentTopAds.length > 0 && (
        <div className="w-full">
          <BannerAds ads={contentTopAds} />
          <TextAds ads={contentTopAds} />
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <LeftSidebar ads={sidebarLeftAds} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-lz-bg-light">
          <Outlet />
        </main>

        {/* Right Sidebar - Hidden on mobile and tablet */}
        <div className="hidden xl:block">
          <RightSidebar ads={sidebarRightAds} />
        </div>
      </div>

      {/* Footer Ads */}
      {footerAds.length > 0 && (
        <>
          <BannerAds ads={footerAds} />
          <TextAds ads={footerAds} />
        </>
      )}

      {/* Footer */}
      <Footer />

      {/* Live Chat Widget */}
      <LiveChatWidget />
    </div>
  )
}
