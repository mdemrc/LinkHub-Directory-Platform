import { useTranslation } from 'react-i18next'
import { Ad, StatsOverview } from '../types'
import { FiClock, FiLink, FiCheckCircle, FiXCircle, FiTrendingUp } from 'react-icons/fi'

interface SidebarProps {
  stats: StatsOverview | null
  ads: Ad[]
}

export default function Sidebar({ stats, ads }: SidebarProps) {
  const { t } = useTranslation()

  const handleAdClick = async (ad: Ad) => {
    // Track ad click
    try {
      // adsApi.click(ad.id) - fire and forget
      if (ad.linkUrl) {
        window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Failed to track ad click:', error)
    }
  }

  return (
    <aside className="hidden lg:block w-72 p-4 space-y-4">
      {/* Link Order Info */}
      <div className="bg-lz-card border border-lz-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FiLink size={16} className="text-lz-accent" />
          {t('sidebar.linkOrder')}
        </h3>
        <ul className="space-y-2 text-sm text-lz-muted">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            Premium Links
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lz-success"></span>
            {t('sidebar.added')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            {t('sidebar.reported')}
          </li>
        </ul>
      </div>

      {/* Sidebar Ads */}
      {ads.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-lz-muted font-semibold">
            {t('sidebar.ads')}
          </h3>
          {ads.map((ad) => (
            <div
              key={ad.id}
              onClick={() => handleAdClick(ad)}
              className="bg-lz-card border border-lz-border rounded-lg overflow-hidden cursor-pointer hover:border-lz-accent transition-colors"
            >
              <img
                src={ad.imageUrl}
                alt={ad.name}
                className="w-full h-auto object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="bg-lz-card border border-lz-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FiTrendingUp size={16} className="text-lz-accent" />
            {t('sidebar.statistics')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-lz-muted flex items-center gap-2">
                <FiLink size={14} />
                {t('common.total')} Links
              </span>
              <span className="text-sm font-medium text-white">
                {stats.totalLinks}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-lz-muted flex items-center gap-2">
                <FiCheckCircle size={14} className="text-lz-success" />
                {t('common.online')}
              </span>
              <span className="text-sm font-medium text-lz-success">
                {stats.onlineLinks}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-lz-muted flex items-center gap-2">
                <FiXCircle size={14} className="text-red-500" />
                Offline
              </span>
              <span className="text-sm font-medium text-red-500">
                {stats.offlineLinks}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="bg-lz-card border border-lz-border rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-lz-muted">
          <FiClock size={14} />
          <span>{t('sidebar.lastUpdate')}</span>
        </div>
        <p className="mt-1 text-sm text-white">
          {new Date().toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </aside>
  )
}
