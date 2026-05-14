import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScamReport } from '../types'
import { scamApi } from '../lib/api'
import { FiAlertTriangle, FiSearch, FiShield, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi'
import SEO from '../components/SEO'

export default function ScamPage() {
  const { t } = useTranslation()
  const [scamReports, setScamReports] = useState<ScamReport[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchScamReports = async () => {
      try {
        const response = await scamApi.getAll()
        const data = response.data?.scams || response.data || []
        setScamReports(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch scam reports:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchScamReports()
  }, [])

  // Get unique categories for tabs
  const categories = ['all', ...new Set(scamReports.map(r => r.category).filter(Boolean))]

  const filteredReports = scamReports.filter(report => {
    const matchesSearch = searchQuery
      ? report.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.siteUrl?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      : true
    const matchesCategory = activeTab === 'all' || report.category === activeTab
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <SEO
        title="Scam Reports"
        description="Check reported scam websites. Stay safe with our community-verified scam database."
        keywords="scam reports, fake websites, fraud alerts, scam database"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Scam Reports', url: '/scam' }
        ]}
      />
      {/* Warning Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600/20 via-red-900/10 to-transparent border border-red-500/30 rounded-2xl p-6 sm:p-10 mb-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-600/20 border border-red-500/40 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FiAlertTriangle className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" size={48} />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              {t('page.scam') || 'Scam & Phishing Database'}
            </h1>
            <p className="text-red-200/80 text-base sm:text-lg max-w-2xl leading-relaxed">
              Our safety community monitors and reports fraudulent activity across the web. 
              Always verify the sites you visit and never share private keys or sensitive data.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/20 text-xs font-semibold text-red-300">
                <FiShield size={14} /> Total Blacklisted: {scamReports.length}
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/20 text-xs font-semibold text-emerald-300">
                <FiCheckCircle size={14} /> Verified Scams: {scamReports.filter(r => r.isVerified).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-lz-card border border-lz-border p-4 rounded-xl mb-8 flex flex-col xl:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 group">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-lz-muted group-focus-within:text-red-500 transition-colors" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search site name, URL or description..."
            className="w-full pl-12 pr-4 py-3 bg-lz-bg border border-lz-border rounded-lg text-white placeholder-lz-muted focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-medium"
          />
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === category
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 translate-y-[-1px]'
                  : 'bg-lz-bg border border-lz-border text-lz-muted hover:text-white hover:border-lz-muted/50'
              }`}
            >
              {category === 'all' ? 'All Sites' : category}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === category ? 'bg-white/20' : 'bg-red-500/10 text-red-500'}`}>
                {category === 'all' 
                  ? scamReports.length 
                  : scamReports.filter(r => r.category === category).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Database View */}
      {filteredReports.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="group bg-lz-card border border-lz-border hover:border-red-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/10 flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-lz-border/50 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform duration-300">
                    <FiShield size={22} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {report.isVerified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full tracking-wider uppercase">
                        <FiCheckCircle size={10} /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-lz-bg text-lz-muted border border-lz-border rounded-full tracking-wider uppercase">
                        Reported
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full tracking-wider uppercase">
                      {report.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors truncate">
                  {report.siteName}
                </h3>
                <p className="text-xs text-red-500/80 font-mono flex items-center gap-1 line-through truncate opacity-70">
                  {report.siteUrl || 'No URL listed'}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1">
                <div className="flex items-start gap-3 text-lz-muted h-full">
                  <FiFileText className="flex-shrink-0 mt-1 text-lz-muted/40" size={16} />
                  <p className="text-[13px] leading-relaxed line-clamp-4 italic text-lz-muted/80">
                    {report.reason || 'No specific details provided for this entry.'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0 mt-auto">
                <div className="flex items-center justify-between pt-4 border-t border-lz-border/30">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-lz-muted tracking-wide uppercase">
                    <FiClock size={12} />
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-lz-card border border-lz-border border-dashed rounded-2xl py-20 px-6 text-center">
          <div className="w-20 h-20 bg-lz-bg border border-lz-border rounded-full flex items-center justify-center mx-auto mb-6">
            <FiSearch className="text-lz-muted/30" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
          <p className="text-lz-muted max-w-sm mx-auto">
            {searchQuery 
              ? `No entries match "${searchQuery}". Try searching for another name or URL.` 
              : 'Our blacklist is currently clear for this category. Stay safe!'}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-6 text-red-500 hover:text-red-400 font-bold underline underline-offset-4"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Report Action Section */}
      <div className="mt-16 bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:border-red-500/40">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Spotted a Scam?</h2>
          <p className="text-lz-muted text-sm max-w-lg">
            Help protect the community by reporting fraudulent sites, phishing lists, or exit scams. 
            Our team reviews every report for verification.
          </p>
        </div>
        <a
          href="/contact"
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-base font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-600/20"
        >
          <FiAlertTriangle size={20} className="group-hover:animate-bounce" />
          Report New Entry
          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>
  )
}

