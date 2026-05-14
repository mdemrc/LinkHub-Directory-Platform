import { useState } from 'react'
import { Category, Link as LinkType } from '../types'
import LinkCard from './LinkCard'
import DynamicIcon from './DynamicIcon'
import { FiChevronDown, FiChevronUp, FiGrid, FiList } from 'react-icons/fi'

interface CategoryCardProps {
  category: Category
  links: LinkType[]
  defaultExpanded?: boolean
}

export default function CategoryCard({ category, links, defaultExpanded = true }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const onlineCount = links.filter(l => l.status === 'ONLINE').length

  return (
    <div className="bg-lz-card border border-lz-border rounded-lg overflow-hidden">
      {/* Category Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-lz-darker cursor-pointer hover:bg-lz-card/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {category.icon && (
            <DynamicIcon name={category.icon} size={18} className="text-lz-accent" />
          )}
          <h3 className="text-sm font-semibold text-white">
            {category.name}
          </h3>
          <span className="text-xs text-lz-muted">
            ({onlineCount}/{links.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle - only show when expanded */}
          {isExpanded && (
            <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-lz-accent text-white' 
                    : 'text-lz-muted hover:text-white'
                }`}
              >
                <FiGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-lz-accent text-white' 
                    : 'text-lz-muted hover:text-white'
                }`}
              >
                <FiList size={14} />
              </button>
            </div>
          )}
          
          <button className="p-1 text-lz-muted hover:text-white transition-colors">
            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Links */}
      {isExpanded && (
        <div className={`p-4 ${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 gap-3' 
            : 'space-y-3'
        }`}>
          {links.length > 0 ? (
            links.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))
          ) : (
            <p className="text-sm text-lz-muted text-center py-4">
              No links in this category yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
