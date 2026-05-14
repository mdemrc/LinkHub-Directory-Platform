import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FiHelpCircle, FiChevronDown, FiSearch, FiMessageCircle } from 'react-icons/fi'
import { faqApi } from '../lib/api'
import { FaqItem } from '../types'
import SEO from '../components/SEO'

export default function FaqPage() {
  const { t } = useTranslation()
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await faqApi.getActive()
        setFaqs(response.data || [])
      } catch (error) {
        console.error('Failed to fetch FAQs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFaqs()
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(faqs.map(f => f.category).filter(Boolean))),
    [faqs]
  )

  const filteredFaqs = useMemo(() => {
    let items = faqs
    if (selectedCategory) {
      items = items.filter(f => f.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      )
    }
    return items
  }, [faqs, selectedCategory, searchQuery])

  const groupedFaqs = useMemo(() => {
    return filteredFaqs.reduce((acc, faq) => {
      const cat = faq.category || 'General'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(faq)
      return acc
    }, {} as Record<string, FaqItem[]>)
  }, [filteredFaqs])

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => setExpandedIds(new Set(filteredFaqs.map(f => f.id)))
  const collapseAll = () => setExpandedIds(new Set())

  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-0 max-w-4xl mx-auto">
      <SEO
        title="FAQ"
        description="Frequently asked questions about LinkHub - how it works, submissions, advertising, and more."
        keywords="FAQ, frequently asked questions, help, support"
        jsonLd={faqJsonLd}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'FAQ', url: '/faq' }
        ]}
      />

      {/* Hero */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute inset-0 w-16 h-16 bg-lz-accent/20 rounded-2xl blur-xl" />
          <div className="relative w-14 h-14 bg-gradient-to-br from-lz-accent to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-lz-accent/25">
            <FiHelpCircle className="text-white" size={26} />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {t('page.faq', 'Frequently Asked Questions')}
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
          Find answers to common questions about LinkHub, advertising, and more.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search questions..."
          className="w-full pl-11 pr-4 py-3 bg-[#161b22] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/25 transition-all"
        />
      </div>

      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
              selectedCategory === null
                ? 'bg-lz-accent text-white shadow-md shadow-lz-accent/25'
                : 'bg-[#161b22] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat || null)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-lz-accent text-white shadow-md shadow-lz-accent/25'
                  : 'bg-[#161b22] border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      {filteredFaqs.length > 0 && (
        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-xs text-gray-500">
            {filteredFaqs.length} question{filteredFaqs.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <button onClick={expandAll} className="text-xs text-gray-400 hover:text-lz-accent transition-colors">
              Expand All
            </button>
            <span className="text-white/10">|</span>
            <button onClick={collapseAll} className="text-xs text-gray-400 hover:text-lz-accent transition-colors">
              Collapse All
            </button>
          </div>
        </div>
      )}

      {/* FAQ Content */}
      {Object.keys(groupedFaqs).length === 0 ? (
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-10 sm:p-14 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiSearch className="text-gray-500" size={28} />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {searchQuery ? 'No results found' : 'No FAQs Available'}
          </h2>
          <p className="text-sm text-gray-400">
            {searchQuery
              ? 'Try searching with different keywords.'
              : 'Check back later for frequently asked questions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedFaqs).map(([category, items]) => (
            <div key={category}>
              {!selectedCategory && categories.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-lz-accent to-cyan-500 rounded-full" />
                  <h2 className="text-base sm:text-lg font-bold text-white">{category}</h2>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
              )}

              <div className="space-y-2.5">
                {items.map(faq => {
                  const isOpen = expandedIds.has(faq.id)
                  return (
                    <div
                      key={faq.id}
                      className={`rounded-xl overflow-hidden transition-all duration-200 ${
                        isOpen
                          ? 'bg-[#161b22] border border-lz-accent/30 shadow-lg shadow-lz-accent/5'
                          : 'bg-[#161b22] border border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <button
                        onClick={() => toggleExpand(faq.id)}
                        className="w-full px-5 sm:px-6 py-4 flex items-center gap-4 text-left group"
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isOpen
                            ? 'bg-lz-accent text-white'
                            : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300'
                        }`}>
                          <FiChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                        <span className={`text-sm sm:text-[15px] font-medium transition-colors ${
                          isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'
                        }`}>
                          {faq.question}
                        </span>
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-5 sm:px-6 pb-5 pl-[4.25rem]">
                            <div className="pt-1 border-t border-white/5">
                              <p className="pt-3 text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-10 sm:mt-14 relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-lz-accent/10 via-purple-500/10 to-cyan-500/10" />
        <div className="absolute inset-0 border border-white/10 rounded-2xl" />
        <div className="relative p-7 sm:p-10 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FiMessageCircle className="text-lz-accent" size={22} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-md mx-auto">
            Can't find the answer you're looking for? Feel free to reach out to us.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-lz-accent hover:bg-lz-accent/80 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-lz-accent/25 hover:shadow-lg hover:shadow-lz-accent/30"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
