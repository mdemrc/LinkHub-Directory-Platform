import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Category, Link as LinkType } from '../types'
import { categoriesApi, linksApi } from '../lib/api'
import LinkItem from '../components/LinkItem'
import FlagIcon from '../components/FlagIcon'
import DynamicIcon from '../components/DynamicIcon'
import { getLanguageName } from '../data/languages'
import { FiSearch } from 'react-icons/fi'
import SEO from '../components/SEO'

interface SubcategoryGroup {
  id: number
  name: string
  slug: string
  icon?: string
  countryCode?: string | null
  showOnParent?: boolean
  displayLimit?: number | null
  links: LinkType[]
}

interface CountryGroup {
  countryCode: string
  countryName: string
  links: LinkType[]
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()

  const [category, setCategory] = useState<Category | null>(null)
  const [subcategoryGroups, setSubcategoryGroups] = useState<SubcategoryGroup[]>([])
  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [countryDisplayLimit, setCountryDisplayLimit] = useState<number | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return

      setIsLoading(true)
      try {
        const catRes = await categoriesApi.getBySlug(slug)
        const cat = catRes.data
        setCategory(cat)

        if (cat.displayMode === 'COUNTRY') {
          const [linksRes, parentRes] = await Promise.all([
            linksApi.getByCategory(slug),
            linksApi.getByParent(slug),
          ])
          const countries = linksRes.data?.countries || []
          const categoryLimit = linksRes.data?.displayLimit || null
          const allSubs = (parentRes.data?.subcategories || []) as SubcategoryGroup[]
          const parentPageSubs = allSubs.filter(s => !s.countryCode && s.showOnParent && s.links.length > 0)

          setCountryDisplayLimit(categoryLimit)
          setExpandedGroups(new Set())
          if (countries.length > 0) {
            setCountryGroups(countries)
            setSubcategoryGroups(parentPageSubs)
          } else {
            setSubcategoryGroups(allSubs)
            setCountryGroups([])
          }
        } else {
          const linksRes = await linksApi.getByParent(slug)
          const parentLimit = linksRes.data?.category?.displayLimit || null
          setSubcategoryGroups(linksRes.data?.subcategories || [])
          setCountryGroups([])
          setCountryDisplayLimit(parentLimit)
          setExpandedGroups(new Set())
        }
      } catch (error) {
        console.error('Failed to fetch category:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategory()
  }, [slug])

  const allLinks = [
    ...countryGroups.flatMap(g => g.links),
    ...subcategoryGroups.flatMap(g => g.links)
  ]

  const filteredLinks = searchQuery
    ? allLinks.filter(l =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : null

  const hasData = countryGroups.length > 0 || subcategoryGroups.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-bold text-white mb-2">Category Not Found</h1>
        <p className="text-lz-text-muted text-sm">The requested category does not exist.</p>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-3">
      <SEO
        title={category.name}
        description={`Browse ${category.name} links - verified and trusted websites in the ${category.name} category.`}
        keywords={`${category.name}, links, directory, verified`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: category.name, url: `/category/${category.slug}` }
        ]}
      />
      {/* Search within category */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-lz-text-muted" size={14} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search in ${category.name}...`}
          className="w-full sm:max-w-xs pl-8 pr-3 py-1.5 bg-lz-bg border border-lz-border rounded text-xs text-white placeholder-lz-text-muted focus:outline-none focus:border-lz-accent"
        />
      </div>

      {/* Search Results */}
      {filteredLinks ? (
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-white mb-3">
            Search Results: {filteredLinks.length} links
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredLinks.map((link) => (
              <LinkItem key={link.id} link={link} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Country groups (from getByCategory - e.g. Forums) */}
          {countryGroups.length > 0 && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {countryGroups.map((group) => {
                const key = `country-${group.countryCode}`
                const limit = countryDisplayLimit
                const isExpanded = expandedGroups.has(key)
                const visibleLinks = (limit && !isExpanded) ? group.links.slice(0, limit) : group.links
                const hasMore = limit ? group.links.length > limit : false

                return (
                  <div key={key} className="min-w-0">
                    <div className="flex items-center gap-2 mb-2.5 pb-1.5 border-b border-lz-accent/10">
                      <FlagIcon code={group.countryCode} size={20} className="flex-shrink-0" />
                      <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                        {getLanguageName(group.countryCode, group.countryName)}
                      </h3>
                    </div>
                    <div>
                      {visibleLinks.map((link) => (
                        <LinkItem key={link.id} link={link} hideFlag />
                      ))}
                    </div>
                    {hasMore && !isExpanded && (
                      <button
                        onClick={() => setExpandedGroups(prev => new Set([...prev, key]))}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-lz-accent/70 hover:text-lz-accent transition-colors group/more"
                      >
                        <span className="w-4 h-[1px] bg-lz-accent/20 group-hover/more:bg-lz-accent/40 transition-colors" />
                        +{group.links.length - limit!} more
                        <span className="text-lz-accent/30 group-hover/more:text-lz-accent/60 transition-colors">▼</span>
                      </button>
                    )}
                    {hasMore && isExpanded && (
                      <button
                        onClick={() => setExpandedGroups(prev => { const next = new Set(prev); next.delete(key); return next })}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-400 transition-colors group/less"
                      >
                        <span className="w-4 h-[1px] bg-gray-600 group-hover/less:bg-gray-500 transition-colors" />
                        Show less
                        <span className="text-gray-600 group-hover/less:text-gray-500 transition-colors">▲</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Language subcategories (countryCode set - e.g. English, Spanish under Exchangers) */}
          {subcategoryGroups.filter(g => g.countryCode).length > 0 && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {subcategoryGroups.filter(g => g.countryCode).map((group) => {
                const key = `lang-${group.id}`
                const limit = group.displayLimit || countryDisplayLimit
                const isExpanded = expandedGroups.has(key)
                const visibleLinks = (limit && !isExpanded) ? group.links.slice(0, limit) : group.links
                const hasMore = limit ? group.links.length > limit : false

                return (
                  <div key={key} className="min-w-0">
                    <div className="flex items-center gap-2 mb-2.5 pb-1.5 border-b border-lz-accent/10">
                      <FlagIcon code={group.countryCode!} size={20} className="flex-shrink-0" />
                      <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                        {getLanguageName(group.countryCode!, group.name)}
                      </h3>
                    </div>
                    <div>
                      {visibleLinks.map((link) => (
                        <LinkItem key={link.id} link={link} hideFlag />
                      ))}
                    </div>
                    {hasMore && !isExpanded && (
                      <button
                        onClick={() => setExpandedGroups(prev => new Set([...prev, key]))}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-lz-accent/70 hover:text-lz-accent transition-colors group/more"
                      >
                        <span className="w-4 h-[1px] bg-lz-accent/20 group-hover/more:bg-lz-accent/40 transition-colors" />
                        +{group.links.length - limit!} more
                        <span className="text-lz-accent/30 group-hover/more:text-lz-accent/60 transition-colors">▼</span>
                      </button>
                    )}
                    {hasMore && isExpanded && (
                      <button
                        onClick={() => setExpandedGroups(prev => { const next = new Set(prev); next.delete(key); return next })}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-400 transition-colors group/less"
                      >
                        <span className="w-4 h-[1px] bg-gray-600 group-hover/less:bg-gray-500 transition-colors" />
                        Show less
                        <span className="text-gray-600 group-hover/less:text-gray-500 transition-colors">▲</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Regular subcategories (no countryCode) - vertical column layout */}
          {subcategoryGroups.filter(g => !g.countryCode).length > 0 && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {subcategoryGroups.filter(g => !g.countryCode).map((group) => {
                const key = `sub-${group.id}`
                const limit = group.displayLimit || countryDisplayLimit
                const isExpanded = expandedGroups.has(key)
                const visibleLinks = (limit && !isExpanded) ? group.links.slice(0, limit) : group.links
                const hasMore = limit ? group.links.length > limit : false

                return (
                  <div key={key} className="min-w-0">
                    <div className="flex items-center gap-2 mb-2.5 pb-1.5 border-b border-lz-accent/10">
                      {group.icon && <DynamicIcon name={group.icon} size={14} className="flex-shrink-0 text-lz-accent/70" />}
                      <h3 className="text-sm font-bold text-white tracking-tight leading-tight">{group.name}</h3>
                      <span className="text-[10px] font-medium text-lz-accent/40 bg-lz-accent/[0.06] px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">{group.links.length}</span>
                    </div>
                    <div>
                      {visibleLinks.map((link) => (
                        <LinkItem key={link.id} link={link} />
                      ))}
                    </div>
                    {hasMore && !isExpanded && (
                      <button
                        onClick={() => setExpandedGroups(prev => new Set([...prev, key]))}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-lz-accent/70 hover:text-lz-accent transition-colors group/more"
                      >
                        <span className="w-4 h-[1px] bg-lz-accent/20 group-hover/more:bg-lz-accent/40 transition-colors" />
                        +{group.links.length - limit!} more
                        <span className="text-lz-accent/30 group-hover/more:text-lz-accent/60 transition-colors">▼</span>
                      </button>
                    )}
                    {hasMore && isExpanded && (
                      <button
                        onClick={() => setExpandedGroups(prev => { const next = new Set(prev); next.delete(key); return next })}
                        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-400 transition-colors group/less"
                      >
                        <span className="w-4 h-[1px] bg-gray-600 group-hover/less:bg-gray-500 transition-colors" />
                        Show less
                        <span className="text-gray-600 group-hover/less:text-gray-500 transition-colors">▲</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!hasData && !filteredLinks && (
        <div className="text-center py-12">
          <p className="text-lz-text-muted text-sm">No links in this category yet.</p>
        </div>
      )}
    </div>
  )
}
