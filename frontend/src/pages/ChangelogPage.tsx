import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Changelog } from '../types'
import { changelogApi } from '../lib/api'
import { FiCalendar, FiTag, FiCheck, FiClock, FiGitCommit, FiChevronRight } from 'react-icons/fi'
import SEO from '../components/SEO'

type StatusFilter = 'ALL' | 'PUBLISHED' | 'COMMITTED' | 'PLANNED'

export default function ChangelogPage() {
  const { t } = useTranslation()
  const [changelog, setChangelog] = useState<Changelog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await changelogApi.getAll()
        setChangelog(response.data)
      } catch (error) {
        console.error('Failed to fetch changelog:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChangelog()
  }, [])

  const filteredChangelog = statusFilter === 'ALL'
    ? changelog
    : changelog.filter(e => e.status === statusFilter)

  const statusConfig: Record<string, { icon: typeof FiCheck; color: string; bg: string; border: string; label: string }> = {
    PUBLISHED: { icon: FiCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', label: 'Published' },
    COMMITTED: { icon: FiGitCommit, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', label: 'Committed' },
    PLANNED: { icon: FiClock, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', label: 'Planned' },
  }

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status]
    if (!cfg) return null
    const Icon = cfg.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${cfg.bg} ${cfg.color} border ${cfg.border} text-xs font-medium rounded-full`}>
        <Icon size={11} />
        {cfg.label}
      </span>
    )
  }

  const getTimelineDotColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-emerald-500 shadow-emerald-500/40'
      case 'COMMITTED': return 'bg-blue-500 shadow-blue-500/40'
      case 'PLANNED': return 'bg-amber-500 shadow-amber-500/40'
      default: return 'bg-gray-500'
    }
  }

  const getCardAccent = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'border-l-emerald-500/60'
      case 'COMMITTED': return 'border-l-blue-500/60'
      case 'PLANNED': return 'border-l-amber-500/60'
      default: return 'border-l-gray-500/60'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-lz-muted">Loading changelog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <SEO
        title="Changelog"
        description="See what's new on LinkHub. Latest updates, features, and improvements."
        keywords="changelog, updates, new features, improvements"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Changelog', url: '/changelog' }
        ]}
      />
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lz-accent/10 border border-lz-accent/20 rounded-full text-lz-accent text-xs font-medium mb-4">
          <FiTag size={12} />
          What's New
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">{t('page.changelog')}</h1>
        <p className="text-lz-muted max-w-md mx-auto">
          Stay up to date with the latest changes and improvements to LinkHub.
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex justify-center gap-2 mb-10">
        {(['ALL', 'PUBLISHED', 'COMMITTED', 'PLANNED'] as StatusFilter[]).map((filter) => {
          const count = filter === 'ALL' ? changelog.length : changelog.filter(e => e.status === filter).length
          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                statusFilter === filter
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-lz-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {filter === 'ALL' ? 'All' : statusConfig[filter]?.label || filter}
              <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Changelog List */}
      <div className="relative">
        {/* Continuous timeline line */}
        {filteredChangelog.length > 1 && (
          <div className="absolute left-[9px] top-3 bottom-3 w-px bg-gradient-to-b from-lz-border via-lz-border/50 to-transparent" />
        )}

        <div className="space-y-6">
          {filteredChangelog.map((entry) => (
            <div key={entry.id} className="relative pl-10 group">
              {/* Timeline dot */}
              <div className={`absolute left-0 top-6 w-[18px] h-[18px] rounded-full ${getTimelineDotColor(entry.status)} shadow-lg ring-4 ring-[#0d1117] z-10 transition-transform group-hover:scale-110`} />

              <div className={`bg-lz-card/80 backdrop-blur-sm border border-white/[0.06] border-l-[3px] ${getCardAccent(entry.status)} rounded-xl p-5 transition-all duration-200 hover:border-white/10 hover:bg-lz-card`}>
                {/* Top row: version + status */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="px-2.5 py-0.5 bg-lz-accent/15 text-lz-accent text-xs font-bold rounded-md tracking-wide font-mono">
                    v{entry.version}
                  </span>
                  {getStatusBadge(entry.status)}
                  {(entry.publishedAt || entry.createdAt) && (
                    <span className="flex items-center gap-1.5 text-xs text-lz-muted ml-auto">
                      <FiCalendar size={11} />
                      {new Date(entry.publishedAt || entry.createdAt!).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-base font-semibold text-white mb-3">{entry.title}</h2>

                {/* Changes List */}
                {entry.changes && entry.changes.length > 0 && (
                  <ul className="space-y-1.5">
                    {entry.changes.map((change, changeIdx) => (
                      <li key={changeIdx} className="flex items-start gap-2 text-sm text-gray-400">
                        <FiChevronRight size={14} className="text-lz-accent/60 mt-0.5 flex-shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredChangelog.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <FiTag size={24} className="text-lz-muted" />
          </div>
          <p className="text-lz-muted">
            {statusFilter === 'ALL' ? 'No changelog entries yet.' : `No ${statusConfig[statusFilter]?.label.toLowerCase() || ''} entries.`}
          </p>
        </div>
      )}
    </div>
  )
}
