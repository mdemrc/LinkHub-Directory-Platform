import { useState, useMemo, useRef, useEffect } from 'react'
import { allIcons, iconCategories, iconMap } from '../../lib/iconRegistry'
import { FiSearch, FiX, FiChevronDown, FiHelpCircle } from 'react-icons/fi'

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  label?: string
}

function isFontAwesomeClass(v: string): boolean {
  return v.startsWith('fa-') || v.startsWith('fa ') || v.startsWith('fas ') || v.startsWith('far ') || v.startsWith('fab ')
}

export default function IconPicker({ value, onChange, label = 'Icon' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [faInput, setFaInput] = useState('')
  const [showFaTooltip, setShowFaTooltip] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 480 })
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value && isFontAwesomeClass(value)) setFaInput(value)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && searchRef.current) setTimeout(() => searchRef.current?.focus(), 50)
  }, [isOpen])

  const updateDropdownPos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const w = Math.min(480, window.innerWidth - 32)
      let left = rect.left
      if (left + w > window.innerWidth - 16) left = window.innerWidth - 16 - w
      if (left < 16) left = 16
      setDropdownPos({ top: rect.bottom + 4, left, width: w })
    }
  }

  const handleToggle = () => {
    if (!isOpen) updateDropdownPos()
    setIsOpen(!isOpen)
  }

  const filteredIcons = useMemo(() => {
    let icons = allIcons
    if (activeCategory !== 'All') icons = icons.filter((i) => i.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      icons = icons.filter((i) => i.name.toLowerCase().includes(q))
    }
    return icons
  }, [search, activeCategory])

  const isFaValue = value && isFontAwesomeClass(value)
  const SelectedIcon = !isFaValue && value ? iconMap[value] : null

  const handleSelect = (name: string) => {
    onChange(name)
    setFaInput('')
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange('')
    setFaInput('')
    setIsOpen(false)
    setSearch('')
  }

  const handleFaApply = () => {
    const trimmed = faInput.trim()
    if (trimmed && isFontAwesomeClass(trimmed)) {
      onChange(trimmed)
      setIsOpen(false)
    }
  }

  return (
    <div ref={pickerRef} className="relative">
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="block text-xs font-medium text-gray-300">{label}</label>
          <div className="relative">
            <button type="button" onMouseEnter={() => setShowFaTooltip(true)} onMouseLeave={() => setShowFaTooltip(false)}
              className="text-gray-500 hover:text-lz-accent transition-colors">
              <FiHelpCircle size={13} />
            </button>
            {showFaTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 rounded-lg border border-white/10 bg-[#12151c] px-3 py-2.5 shadow-xl text-[11px] text-gray-300 leading-relaxed">
                <p className="font-semibold text-white mb-1">Font Awesome Support</p>
                <p className="mb-1.5">You can type a Font Awesome class directly instead of picking from the grid.</p>
                <p className="text-gray-400">Examples:</p>
                <code className="block mt-1 text-[10px] text-cyan-300 bg-black/30 rounded px-2 py-1">fa-solid fa-circle-user</code>
                <code className="block mt-0.5 text-[10px] text-cyan-300 bg-black/30 rounded px-2 py-1">fa-brands fa-telegram</code>
                <code className="block mt-0.5 text-[10px] text-cyan-300 bg-black/30 rounded px-2 py-1">fa-regular fa-star</code>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 rotate-45 bg-[#12151c] border-r border-b border-white/10" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button ref={triggerRef} type="button" onClick={handleToggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-lz-bg border border-white/10 rounded-lg text-sm text-white hover:border-lz-accent/50 focus:outline-none focus:border-lz-accent transition-colors">
        {isFaValue ? (
          <>
            <i className={`${value} text-lz-accent`} style={{ fontSize: 18 }} />
            <span className="flex-1 text-left truncate font-mono text-xs text-gray-300">{value}</span>
          </>
        ) : SelectedIcon ? (
          <>
            <SelectedIcon size={18} className="text-lz-accent shrink-0" />
            <span className="flex-1 text-left truncate">{value}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-500">Select an icon...</span>
        )}
        <FiChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div ref={dropdownRef} className="fixed z-[9999] bg-lz-bg border border-white/10 rounded-lg shadow-2xl overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>

          {/* Font Awesome input */}
          <div className="px-3 pt-3 pb-2 border-b border-white/5">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Font Awesome Class</label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <i className="fa-solid fa-font absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]" />
                <input type="text" value={faInput}
                  onChange={(e) => setFaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFaApply() } }}
                  placeholder="fa-solid fa-circle-user"
                  className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white placeholder-gray-600 font-mono focus:outline-none focus:border-lz-accent/50" />
              </div>
              <button type="button" onClick={handleFaApply}
                disabled={!faInput.trim() || !isFontAwesomeClass(faInput.trim())}
                className="px-3 py-1.5 rounded bg-lz-accent/20 text-lz-accent text-xs font-medium hover:bg-lz-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                Apply
              </button>
            </div>
            {faInput.trim() && isFontAwesomeClass(faInput.trim()) && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <span className="text-gray-500">Preview:</span>
                <i className={`${faInput.trim()} text-lz-accent`} style={{ fontSize: 20 }} />
              </div>
            )}
          </div>

          {/* Divider label */}
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Or pick a Feather icon</span>
          </div>

          {/* Search Bar */}
          <div className="px-2 pb-1.5">
            <div className="relative">
              <FiSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full pl-8 pr-8 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-lz-accent/50" />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-0.5 px-2 py-1.5 border-b border-white/5 overflow-x-auto scrollbar-thin">
            <button type="button" onClick={() => setActiveCategory('All')}
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${activeCategory === 'All' ? 'bg-lz-accent text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              All
            </button>
            {iconCategories.map((cat) => (
              <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${activeCategory === cat ? 'bg-lz-accent text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Icon Grid */}
          <div className="max-h-[220px] overflow-y-auto p-2">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">No icons found for "{search}"</div>
            ) : (
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5">
                {filteredIcons.map((icon) => {
                  const Icon = icon.component
                  const isSelected = value === icon.name || value === `Fi${icon.name}`
                  return (
                    <button key={icon.name} type="button" onClick={() => handleSelect(icon.name)} title={icon.name}
                      className={`flex items-center justify-center p-1.5 rounded transition-colors ${isSelected ? 'bg-lz-accent/20 ring-1 ring-lz-accent text-lz-accent' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                      <Icon size={18} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5 text-[10px] text-gray-500">
            <span>{filteredIcons.length} icons</span>
            {value && (
              <button type="button" onClick={handleClear} className="text-red-400 hover:text-red-300 transition-colors">
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
