import { useState, useEffect } from 'react'
import { Category, Link as LinkType } from '../types'
import { categoriesApi, linksApi } from '../lib/api'
import LinkItem from '../components/LinkItem'
import FlagIcon from '../components/FlagIcon'
import DynamicIcon from '../components/DynamicIcon'
import { getLanguageName } from '../data/languages'
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

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategoryGroups, setSubcategoryGroups] = useState<SubcategoryGroup[]>([])
  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [countryDisplayLimit, setCountryDisplayLimit] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await categoriesApi.getNavigation()
        const catData = Array.isArray(catRes.data)
          ? catRes.data
          : catRes.data?.value || catRes.data || []
        setCategories(catData)

        if (catData.length > 0) {
          const firstCat = catData[0]
          setActiveCategory(firstCat)
          await loadCategoryLinks(firstCat)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const loadCategoryLinks = async (cat: Category) => {
    try {
      if (cat.displayMode === 'COUNTRY') {
        const [res, parentRes] = await Promise.all([
          linksApi.getByCategory(cat.slug),
          linksApi.getByParent(cat.slug),
        ])
        const countries = res.data?.countries || []
        const categoryLimit = res.data?.displayLimit || null
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
        const res = await linksApi.getByParent(cat.slug)
        const parentLimit = res.data?.category?.displayLimit || null
        setSubcategoryGroups(res.data?.subcategories || [])
        setCountryGroups([])
        setCountryDisplayLimit(parentLimit)
        setExpandedGroups(new Set())
      }
    } catch (error) {
      console.error('Failed to load category links:', error)
      setSubcategoryGroups([])
      setCountryGroups([])
    }
  }

  const handleCategoryClick = async (cat: Category) => {
    if (activeCategory?.id === cat.id) return
    setActiveCategory(cat)
    setIsLoading(true)
    await loadCategoryLinks(cat)
    setIsLoading(false)
  }

  const hasData = countryGroups.length > 0 || subcategoryGroups.length > 0

  if (isLoading && !activeCategory) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-3">
      <SEO
        description="Browse and discover trusted links across categories. Your premium link directory for verified websites."
        keywords="link directory, verified links, trusted websites, web directory"
      />
      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-lz-border">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeCategory?.id === cat.id
                ? 'bg-lz-accent text-white'
                : 'text-lz-text-muted hover:text-white hover:bg-lz-bg'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && hasData && (
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

          {/* Language subcategories (countryCode set) */}
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

          {/* Regular subcategories (no countryCode) - vertical column layout like country groups */}
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

      {!isLoading && !hasData && activeCategory && (
        <div className="text-center py-12">
          <p className="text-lz-text-muted text-sm">
            No links found in this category.
          </p>
        </div>
      )}

      {categories.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-lz-text-muted text-sm">
            No categories available yet.
          </p>
        </div>
      )}
    </div>
  )
}
