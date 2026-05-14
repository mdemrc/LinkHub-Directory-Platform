import { useState, useEffect } from 'react'
import { adsApi } from '../lib/api'
import { FiExternalLink, FiImage, FiEdit2, FiTrash2, FiEye, FiMousePointer, FiSearch, FiType, FiCalendar, FiCode, FiArrowUp, FiArrowDown, FiMonitor, FiChevronDown, FiChevronUp, FiMove } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminCheckbox, AdminTextarea } from './components/AdminInput'

interface Ad {
  id: number
  name: string
  type: string
  position: string
  imageUrl: string | null
  linkUrl: string
  htmlContent: string | null
  textContent: string | null
  textTitle: string | null
  textIcon: string | null
  customCss: string | null
  fontSize: string | null
  fontWeight: string | null
  backgroundColor: string | null
  textColor: string | null
  borderColor: string | null
  bannerSize: string | null
  width: number | null
  height: number | null
  startDate: string | null
  endDate: string | null
  durationType: string | null
  isPurchased?: boolean
  order: number
  isActive: boolean
  viewCount: number
  clickCount: number
  createdAt: string
}

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [dragAd, setDragAd] = useState<number | null>(null)

  // Filters
  const [filterPosition, setFilterPosition] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    linkUrl: '',
    htmlContent: '',
    textContent: '',
    textTitle: '',
    textIcon: '★',
    customCss: '',
    fontSize: 'md',
    fontWeight: 'normal',
    backgroundColor: '',
    textColor: '',
    borderColor: '',
    bannerSize: 'md' as string,
    type: 'BANNER' as string,
    position: 'HEADER_TOP' as string,
    order: 0,
    startDate: '',
    endDate: '',
    durationType: '',
    isActive: true,
  })

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      const response = await adsApi.getAll()
      setAds(response.data)
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingAd) {
        await adsApi.update(editingAd.id, formData)
      } else {
        await adsApi.create(formData)
      }
      fetchAds()
      closeModal()
    } catch (error) {
      console.error('Failed to save ad:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad?')) return
    try {
      await adsApi.delete(id)
      fetchAds()
    } catch (error) {
      console.error('Failed to delete ad:', error)
    }
  }

  const handleReorder = async (adId: number, direction: 'up' | 'down') => {
    try {
      const response = await adsApi.reorder(adId, direction)
      setAds(response.data)
    } catch (error) {
      console.error('Failed to reorder ad:', error)
    }
  }

  const openModal = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad)
      setFormData({
        name: ad.name,
        imageUrl: ad.imageUrl || '',
        linkUrl: ad.linkUrl,
        htmlContent: ad.htmlContent || '',
        textContent: ad.textContent || '',
        textTitle: ad.textTitle || '',
        textIcon: ad.textIcon || '★',
        customCss: ad.customCss || '',
        fontSize: ad.fontSize || 'md',
        fontWeight: ad.fontWeight || 'normal',
        backgroundColor: ad.backgroundColor || '',
        textColor: ad.textColor || '',
        borderColor: ad.borderColor || '',
        bannerSize: ad.bannerSize || 'md',
        type: ad.type,
        position: ad.position,
        order: ad.order,
        startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
        endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
        durationType: ad.durationType || '',
        isActive: ad.isActive,
      })
    } else {
      setEditingAd(null)
      setFormData({
        name: '',
        imageUrl: '',
        linkUrl: '',
        htmlContent: '',
        textContent: '',
        textTitle: '',
        textIcon: '★',
        customCss: '',
        fontSize: 'md',
        fontWeight: 'normal',
        backgroundColor: '',
        textColor: '',
        borderColor: '',
        bannerSize: 'md',
        type: 'BANNER',
        position: 'HEADER_TOP',
        order: 0,
        startDate: '',
        endDate: '',
        durationType: '',
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAd(null)
  }

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      HEADER_TOP: 'Banner Big',
      HEADER_BOTTOM: 'Banner Medium',
      SIDEBAR_LEFT: 'Left Side',
      SIDEBAR_RIGHT: 'Right Side',
      CONTENT_TOP: 'Ad-Text Top',
      CONTENT_INLINE: 'Banner Small',
      FOOTER: 'Footer',
    }
    return labels[position] || position
  }

  // Filter ads
  const filteredAds = ads.filter((ad) => {
    if (filterPosition && ad.position !== filterPosition) return false
    if (filterType && ad.type !== filterType) return false
    const isExpired = ad.endDate && new Date(ad.endDate) < new Date()
    if (filterStatus === 'active' && (!ad.isActive || isExpired)) return false
    if (filterStatus === 'inactive' && (ad.isActive && !isExpired)) return false
    if (filterStatus === 'expired' && !isExpired) return false
    if (searchQuery && !ad.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Active (non-expired) ads grouped by position for preview
  const activeAds = ads.filter(ad => {
    if (!ad.isActive) return false
    if (ad.endDate && new Date(ad.endDate) < new Date()) return false
    return true
  }).sort((a, b) => a.order - b.order)

  const adsByPosition = (pos: string) => activeAds.filter(a => a.position === pos)
  const isImageUrl = (url: string) => /\.(gif|jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(url)
  const getImgSrc = (ad: Ad) => ad.imageUrl || (ad.linkUrl && isImageUrl(ad.linkUrl) ? ad.linkUrl : null)

  const extractCssRules = (css: string): string => {
    let raw = css.trim()
    const blockMatch = raw.match(/^\.[^{]+\{([\s\S]*)\}\s*$/)
    if (blockMatch) raw = blockMatch[1].trim()
    return raw
  }

  const handlePositionChange = async (adId: number, newPosition: string) => {
    try {
      await adsApi.update(adId, { position: newPosition })
      fetchAds()
    } catch (error) {
      console.error('Failed to move ad:', error)
    }
  }

  const handlePreviewSwap = async (adId: number, direction: 'up' | 'down') => {
    const ad = ads.find(a => a.id === adId)
    if (!ad) return
    const posAds = adsByPosition(ad.position)
    const idx = posAds.findIndex(a => a.id === adId)
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= posAds.length) return
    const target = posAds[targetIdx]
    try {
      await Promise.all([
        adsApi.update(adId, { order: target.order }),
        adsApi.update(target.id, { order: ad.order }),
      ])
      fetchAds()
    } catch (error) {
      console.error('Failed to swap ads:', error)
    }
  }



  // Preview ad slot renderer
  const PreviewAdSlot = ({ ad, small }: { ad: Ad; small?: boolean }) => {
    const imgSrc = getImgSrc(ad)
    const h = small ? 'h-10' : 'h-14'
    const posAds = adsByPosition(ad.position)
    const idx = posAds.findIndex(a => a.id === ad.id)
    const canUp = idx > 0
    const canDown = idx < posAds.length - 1
    const adClass = `preview-ad-${ad.id}`
    const cssRules = ad.customCss ? extractCssRules(ad.customCss) : ''

    return (
      <div
        draggable
        onDragStart={() => setDragAd(ad.id)}
        onDragEnd={() => setDragAd(null)}
        className={`relative group cursor-move border border-transparent hover:border-lz-accent/40 rounded overflow-hidden transition-all ${dragAd === ad.id ? 'opacity-40' : ''}`}
        title={`${ad.name} (${ad.type}) — Drag to move`}
      >
        {ad.type === 'BANNER' && imgSrc ? (
          <img src={imgSrc} alt={ad.name} className={`w-full ${h} object-cover block`} />
        ) : ad.type === 'TEXT' ? (
          <>
            {cssRules ? (
              <style dangerouslySetInnerHTML={{ __html: `.${adClass} { background-color: ${ad.backgroundColor || '#00ff00'}; color: ${ad.textColor || '#000'}; ${cssRules} }` }} />
            ) : null}
            <div
              className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-center truncate ${cssRules ? adClass : ''}`}
              style={cssRules ? undefined : { backgroundColor: ad.backgroundColor || '#00ff00', color: ad.textColor || '#000' }}
            >
              {ad.textIcon || '★'} {ad.textTitle || ad.name}
            </div>
          </>
        ) : (
          <div className={`w-full ${h} bg-gradient-to-r from-indigo-900/50 to-blue-900/50 flex items-center justify-center`}>
            <span className="text-[10px] text-white/50 truncate px-2">{ad.name}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
          {canUp && (
            <button onClick={(e) => { e.stopPropagation(); handlePreviewSwap(ad.id, 'up') }} className="p-1 bg-white/20 rounded text-white hover:bg-white/30" title="Move up">
              <FiArrowUp size={10} />
            </button>
          )}
          <button onClick={() => openModal(ad)} className="p-1 bg-white/20 rounded text-white hover:bg-white/30" title="Edit">
            <FiEdit2 size={10} />
          </button>
          <span className="text-[8px] text-white/70">#{ad.order}</span>
          {canDown && (
            <button onClick={(e) => { e.stopPropagation(); handlePreviewSwap(ad.id, 'down') }} className="p-1 bg-white/20 rounded text-white hover:bg-white/30" title="Move down">
              <FiArrowDown size={10} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Droppable position area
  const PositionZone = ({ position, label, children, className = '' }: { position: string; label: string; children?: React.ReactNode; className?: string }) => {
    const posAds = adsByPosition(position)
    return (
      <div
        className={`border border-dashed border-white/10 rounded-lg p-2 min-h-[40px] transition-colors ${className} ${dragAd !== null ? 'border-lz-accent/30 bg-lz-accent/5' : ''}`}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-lz-accent/50') }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('border-lz-accent/50') }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-lz-accent/50')
          if (dragAd !== null) {
            const draggedAd = ads.find(a => a.id === dragAd)
            if (draggedAd && draggedAd.position !== position) {
              handlePositionChange(dragAd, position)
            }
          }
        }}
      >
        <div className="text-[8px] uppercase tracking-wider text-lz-muted/50 mb-1 font-medium">{label}</div>
        {children || (
          posAds.length > 0 ? (
            <div className="space-y-1">
              {posAds.map(ad => <PreviewAdSlot key={ad.id} ad={ad} small />)}
            </div>
          ) : (
            <div className="text-[9px] text-center text-white/20 py-2">Empty</div>
          )
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Advertisements"
        description={`Manage site advertisements and banners (${filteredAds.length} of ${ads.length})`}
        action={{ label: 'Add Ad', onClick: () => openModal() }}
      />

      {/* Site Preview Toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-white/[0.03] border border-white/10 rounded-xl text-sm font-medium text-lz-muted hover:text-white hover:border-white/20 transition-all w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <FiMonitor size={16} />
          Site Ad Preview — Live Layout
        </span>
        {showPreview ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      {/* Site Preview */}
      {showPreview && (
        <div className="mb-6 bg-[#0a0d14] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-lz-muted uppercase tracking-wider font-medium">
              <FiMove className="inline mr-1" size={10} /> Drag ads between zones to move them
            </span>
            <span className="text-[10px] text-lz-muted">{activeAds.length} active ads</span>
          </div>

          {/* Banner Big */}
          <div className="border-b border-white/5">
            <PositionZone position="HEADER_TOP" label="Banner Big (Full Width)">
              {(() => {
                const posAds = adsByPosition('HEADER_TOP')
                const banners = posAds.filter(a => a.type === 'BANNER')
                const texts = posAds.filter(a => a.type === 'TEXT')
                return (
                  <>
                    {banners.length > 0 && (
                      <div className="flex flex-wrap gap-px mb-1">
                        {banners.map(ad => (
                          <div key={ad.id} className="flex-1 min-w-[80px]">
                            <PreviewAdSlot ad={ad} />
                          </div>
                        ))}
                      </div>
                    )}
                    {texts.length > 0 && (
                      <div className="space-y-px">
                        {texts.map(ad => <PreviewAdSlot key={ad.id} ad={ad} />)}
                      </div>
                    )}
                    {posAds.length === 0 && <div className="text-[9px] text-center text-white/20 py-3">Banner Big — Empty</div>}
                  </>
                )
              })()}
            </PositionZone>
          </div>

          {/* Navbar placeholder */}
          <div className="px-3 py-1.5 bg-[#0f1218] border-b border-white/5 flex items-center gap-3">
            <span className="text-lz-accent text-[10px] font-bold">🔗 LinkHub</span>
            <span className="text-[9px] text-white/30">Home</span>
            <span className="text-[9px] text-white/30">Forums</span>
            <span className="text-[9px] text-white/30">Advertising</span>
          </div>

          {/* Ad-Text Top */}
          <div className="border-b border-white/5">
            <PositionZone position="CONTENT_TOP" label="Ad-Text Top" />
          </div>

          {/* Banner Medium */}
          <div className="border-b border-white/5">
            <PositionZone position="HEADER_BOTTOM" label="Banner Medium" />
          </div>

          {/* Main layout: Left Side | Content + Banner Small | Right Side */}
          <div className="flex border-b border-white/5">
            <div className="w-28 flex-shrink-0 border-r border-white/5">
              <PositionZone position="SIDEBAR_LEFT" label="Left Side (Banner + Text)" className="rounded-none border-none min-h-[120px]" />
            </div>
            <div className="flex-1 p-3">
              <div className="border border-dashed border-white/5 rounded p-3 text-center min-h-[60px] flex items-center justify-center">
                <span className="text-[10px] text-white/15">Page Content Area</span>
              </div>
              {/* Banner Small */}
              <div className="mt-2">
                <PositionZone position="CONTENT_INLINE" label="Banner Small" className="rounded-none border-none" />
              </div>
            </div>
            <div className="w-32 flex-shrink-0 border-l border-white/5">
              <PositionZone position="SIDEBAR_RIGHT" label="Right Side (Banner + Text)" className="rounded-none border-none min-h-[120px]" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <div className="flex-1 min-w-[180px] relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lz-muted" size={16} />
          <input
            type="text"
            placeholder="Search ads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white placeholder-lz-muted text-sm focus:outline-none focus:border-lz-accent/50 transition-colors"
          />
        </div>
        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className="px-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white text-sm focus:outline-none focus:border-lz-accent/50 transition-colors min-w-[150px]"
        >
          <option value="">All Positions</option>
          <option value="HEADER_TOP">Banner Big</option>
          <option value="HEADER_BOTTOM">Banner Medium</option>
          <option value="CONTENT_INLINE">Banner Small</option>
          <option value="CONTENT_TOP">Ad-Text Top</option>
          <option value="SIDEBAR_LEFT">Left Side</option>
          <option value="SIDEBAR_RIGHT">Right Side</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white text-sm focus:outline-none focus:border-lz-accent/50 transition-colors min-w-[120px]"
        >
          <option value="">All Types</option>
          <option value="BANNER">Banner</option>
          <option value="TEXT">Text</option>
          <option value="HTML">HTML</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white text-sm focus:outline-none focus:border-lz-accent/50 transition-colors min-w-[120px]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {filteredAds.map((ad) => {
          const isExpired = ad.endDate && new Date(ad.endDate) < new Date()
          const isPermanent = ad.durationType === 'PERMANENT' || (!ad.endDate && !ad.startDate && ad.isActive)

          return (
          <div
            key={ad.id}
            className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors group"
          >
            {/* Preview - Different for BANNER vs TEXT */}
            {ad.type === 'TEXT' ? (
              <div className="px-3 py-2 bg-lz-dark/50 flex items-center gap-2">
                <FiType className="text-lz-accent flex-shrink-0" size={14} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white font-medium truncate">{ad.textTitle || ad.name}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isPermanent && (
                    <span className="px-1 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded text-[9px] font-bold uppercase">
                      ∞
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                      isExpired
                        ? 'bg-gray-500/20 text-gray-400'
                        : ad.isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {isExpired ? 'Exp' : ad.isActive ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-24 bg-lz-dark/50 flex items-center justify-center relative overflow-hidden">
                {(ad.imageUrl || (ad.linkUrl && /\.(gif|jpg|jpeg|png|webp|svg)$/i.test(ad.linkUrl))) ? (
                  <img
                    src={ad.imageUrl || ad.linkUrl}
                    alt={ad.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <FiImage className="text-lz-muted/30" size={32} />
                )}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  {isPermanent && (
                    <span className="px-1 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full text-[9px] font-bold">
                      ∞
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full ${
                      isExpired
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        : ad.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isExpired ? 'Expired' : ad.isActive ? 'Active' : 'Off'}
                  </span>
                </div>
              </div>
            )}

            {/* Content - Compact */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-medium text-white text-xs truncate flex-1">{ad.name}</h3>
                {ad.isPurchased && (
                  <span className="flex-shrink-0 px-1 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold uppercase">
                    PAID
                  </span>
                )}
              </div>
              <p className="text-[10px] text-lz-muted mt-0.5 truncate">
                {getPositionLabel(ad.position)} • {ad.type}
                {ad.bannerSize && ` • ${ad.bannerSize.toUpperCase()}`}
              </p>

              {/* Stats + Actions row */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-3 text-[10px] text-lz-muted">
                  <span className="flex items-center gap-1"><FiEye size={10} />{ad.viewCount || 0}</span>
                  <span className="flex items-center gap-1"><FiMousePointer size={10} />{ad.clickCount || 0}</span>
                  <span>#{ad.order}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => handleReorder(ad.id, 'up')} className="p-1 text-lz-muted hover:text-white hover:bg-white/5 rounded transition-colors" title="Move up">
                    <FiArrowUp size={12} />
                  </button>
                  <button onClick={() => handleReorder(ad.id, 'down')} className="p-1 text-lz-muted hover:text-white hover:bg-white/5 rounded transition-colors" title="Move down">
                    <FiArrowDown size={12} />
                  </button>
                  <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-lz-muted hover:text-white hover:bg-white/5 rounded transition-colors">
                    <FiExternalLink size={12} />
                  </a>
                  <button onClick={() => openModal(ad)} className="p-1 text-lz-muted hover:text-white hover:bg-white/5 rounded transition-colors">
                    <FiEdit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(ad.id)} className="p-1 text-lz-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredAds.length === 0 && (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl">
          <FiImage className="mx-auto text-lz-muted/30 mb-4" size={56} />
          <p className="text-lz-muted">
            {ads.length === 0 ? 'No advertisements yet' : 'No ads match your filters'}
          </p>
          <p className="text-sm text-lz-muted/60 mt-1">
            {ads.length === 0
              ? 'Create your first ad to monetize your site'
              : 'Try adjusting your filter criteria'}
          </p>
        </div>
      )}

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAd ? 'Edit Advertisement' : 'Create Advertisement'}
        size={formData.type === 'TEXT' ? 'xl' : 'lg'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AdminInput
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Header Banner"
            help={{
              content: 'Internal name to identify this ad. Optional — auto-generated if empty.',
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <AdminSelect
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'BANNER', label: 'Banner' },
                { value: 'TEXT', label: 'Text' },
                { value: 'HTML', label: 'HTML' },
              ]}
              help={{
                content: 'Banner: Image-based ad. Text: Simple text link with styling. HTML: Custom HTML code (advanced).',
              }}
            />
            <AdminSelect
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              options={[
                { value: 'HEADER_TOP', label: 'Banner Big' },
                { value: 'HEADER_BOTTOM', label: 'Banner Medium' },
                { value: 'CONTENT_INLINE', label: 'Banner Small' },
                { value: 'CONTENT_TOP', label: 'Ad-Text Top' },
                { value: 'SIDEBAR_LEFT', label: 'Left Side (Banner + Text)' },
                { value: 'SIDEBAR_RIGHT', label: 'Right Side (Banner + Text)' },
              ]}
              help={{
                content: 'Where the ad appears on the page. Header Top is most visible, Content Inline blends with content.',
              }}
            />
          </div>

          {/* Banner fields */}
          {formData.type === 'BANNER' && (
            <>
              <AdminInput
                label="Banner Image URL (GIF/PNG/JPG)"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://i.imgur.com/example.gif"
                hint="Paste the direct image/GIF link here (e.g. from imgur, imgbb)"
                help={{
                  content: 'The banner image that will be displayed. Upload your image to an image host and paste the direct link here.',
                  link: { url: 'https://imgbb.com/', label: 'Free image hosting' },
                }}
              />
              <AdminInput
                label="Click Destination URL"
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://example.com"
                required
                help={{
                  content: 'Where users will be redirected when they click the banner ad. This is NOT the image URL.',
                }}
              />
              
              {/* Banner Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  Banner Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'xs', label: 'XS', desc: '468×60' },
                    { value: 'sm', label: 'Small', desc: '440×111' },
                    { value: 'cc', label: 'CC', desc: '920×111' },
                  ].map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, bannerSize: size.value })}
                      className={`flex-1 px-3 py-2 rounded-lg border text-center transition-colors ${
                        formData.bannerSize === size.value
                          ? 'bg-lz-accent/20 border-lz-accent/50 text-lz-accent'
                          : 'bg-lz-dark/50 border-lz-border/50 text-lz-muted hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-medium">{size.label}</div>
                      <div className="text-[10px] opacity-60">{size.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Text Ad fields */}
          {formData.type === 'TEXT' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Left side - Form fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <AdminInput
                      label="Icon"
                      value={formData.textIcon}
                      onChange={(e) => setFormData({ ...formData, textIcon: e.target.value })}
                      placeholder="★"
                      help={{ content: '★ ⚡ 🔥 💥 ⭐ 💎 🚀' }}
                    />
                  </div>
                  <div className="col-span-3">
                    <AdminInput
                      label="Ad Title"
                      value={formData.textTitle}
                      onChange={(e) => setFormData({ ...formData, textTitle: e.target.value })}
                      placeholder="e.g. Best VPN Service"
                    />
                  </div>
                </div>
                <AdminTextarea
                  label="Ad Content"
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                />
                <AdminInput
                  label="Link URL"
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />

                {/* Compact styling options */}
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 space-y-3">
                  <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <FiType size={12} />
                    Styling
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={formData.fontSize}
                      onChange={(e) => setFormData({ ...formData, fontSize: e.target.value })}
                      className="px-2 py-1.5 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-xs"
                    >
                      <option value="xs">XS</option>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">XL</option>
                    </select>
                    <select
                      value={formData.fontWeight}
                      onChange={(e) => setFormData({ ...formData, fontWeight: e.target.value })}
                      className="px-2 py-1.5 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-xs"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="semibold">Semibold</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Text</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={formData.textColor || '#ffffff'}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer border border-lz-border/50 flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={formData.textColor || '#ffffff'}
                          onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                          className="w-full min-w-0 px-1 py-1 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-[10px] font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">BG</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={formData.backgroundColor || '#1a1d24'}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer border border-lz-border/50 flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={formData.backgroundColor || '#1a1d24'}
                          onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                          className="w-full min-w-0 px-1 py-1 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-[10px] font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">Border</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={formData.borderColor || '#2a2d34'}
                          onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer border border-lz-border/50 flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={formData.borderColor || '#2a2d34'}
                          onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                          className="w-full min-w-0 px-1 py-1 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-[10px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom CSS */}
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/5 space-y-2">
                  <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <FiCode size={12} />
                    Custom CSS
                  </h4>
                  <textarea
                    value={formData.customCss}
                    onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                    placeholder={`/* Custom styles */\ntext-shadow: 0 0 10px #fff;\nletter-spacing: 2px;\nanimation: blink 1s infinite;`}
                    rows={4}
                    className="w-full px-2 py-1.5 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-xs font-mono resize-none"
                  />
                  <p className="text-[10px] text-gray-500">
                    CSS properties: text-shadow, letter-spacing, animation, text-decoration, etc.
                  </p>
                </div>
              </div>

              {/* Right side - Live Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <FiEye size={14} />
                  Live Preview
                </label>
                <div className="p-4 bg-lz-dark rounded-lg border border-lz-border/30 min-h-[200px]">
                  {/* Preview - Inline Text Ad Style */}
                  <div className="flex flex-col items-center gap-2">
                    {formData.customCss ? (
                      <style dangerouslySetInnerHTML={{ __html: `.admin-text-ad-preview { background-color: ${formData.backgroundColor || '#00ff00'}; color: ${formData.textColor || '#000000'}; ${
                        (() => {
                          let raw = formData.customCss.trim()
                          const blockMatch = raw.match(/^\.[^{]+\{([\s\S]*)\}\s*$/)
                          if (blockMatch) raw = blockMatch[1].trim()
                          return raw
                        })()
                      } }` }} />
                    ) : null}
                    <a
                      href={formData.linkUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center px-4 py-1 rounded transition-all hover:brightness-110 ${formData.customCss ? 'admin-text-ad-preview' : ''}`}
                      style={formData.customCss ? undefined : {
                        backgroundColor: formData.backgroundColor || '#00ff00',
                        color: formData.textColor || '#000000',
                      }}
                    >
                      <span className="mr-2 text-sm">{formData.textIcon || '★'}</span>
                      <span className={`font-bold uppercase tracking-wide ${
                        formData.fontSize === 'xs' ? 'text-xs' :
                        formData.fontSize === 'sm' ? 'text-sm' :
                        formData.fontSize === 'lg' ? 'text-lg' :
                        formData.fontSize === 'xl' ? 'text-xl' : 'text-base'
                      }`}>
                        {formData.textTitle || 'AD TITLE'}
                      </span>
                      {formData.textContent && (
                        <span className="ml-2 text-sm opacity-90">
                          - {formData.textContent}
                        </span>
                      )}
                    </a>
                  </div>
                  
                  {/* Preview info */}
                  <p className="text-[10px] text-center text-lz-muted mt-3">
                    This is how your text ad will appear
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* HTML Ad fields */}
          {formData.type === 'HTML' && (
            <>
              <AdminTextarea
                label="HTML Content"
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                placeholder="<div>Your custom HTML...</div>"
                rows={6}
                required
                help={{
                  content: 'Custom HTML code for advanced ad layouts. Be careful with scripts.',
                }}
              />
              <AdminInput
                label="Link URL"
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://..."
                hint="Optional - for tracking purposes"
              />
            </>
          )}

          {/* Duration section */}
          <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5 space-y-4">
            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <FiCalendar size={14} />
              Ad Duration
            </h4>
            
            {/* Quick duration presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: '1_WEEK', label: '1 Week' },
                { value: '1_MONTH', label: '1 Month' },
                { value: '3_MONTHS', label: '3 Months' },
                { value: '6_MONTHS', label: '6 Months' },
                { value: '1_YEAR', label: '1 Year' },
                { value: 'PERMANENT', label: 'Permanent' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    const startDate = new Date().toISOString().split('T')[0]
                    let endDate = ''
                    
                    if (preset.value !== 'PERMANENT') {
                      const end = new Date()
                      switch (preset.value) {
                        case '1_WEEK': end.setDate(end.getDate() + 7); break
                        case '1_MONTH': end.setMonth(end.getMonth() + 1); break
                        case '3_MONTHS': end.setMonth(end.getMonth() + 3); break
                        case '6_MONTHS': end.setMonth(end.getMonth() + 6); break
                        case '1_YEAR': end.setFullYear(end.getFullYear() + 1); break
                      }
                      endDate = end.toISOString().split('T')[0]
                    }
                    
                    setFormData({
                      ...formData,
                      durationType: preset.value,
                      startDate,
                      endDate,
                    })
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    formData.durationType === preset.value
                      ? 'bg-lz-accent/20 border-lz-accent/50 text-lz-accent'
                      : 'bg-lz-dark/50 border-lz-border/50 text-lz-muted hover:text-white hover:border-white/20'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            <div className="grid grid-cols-2 gap-4">
              <AdminInput
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value, durationType: 'CUSTOM' })}
                help={{
                  content: 'When the ad starts showing. Leave empty to start immediately.',
                }}
              />
              <AdminInput
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value, durationType: 'CUSTOM' })}
                help={{
                  content: 'When the ad stops showing. Leave empty for no end date (permanent).',
                }}
              />
            </div>
          </div>

          <AdminInput
            label="Order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            help={{
              content: 'Display order when multiple ads are in the same position. Lower numbers appear first.',
            }}
          />

          <AdminCheckbox
            label="Active"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            help={{
              content: 'Inactive ads are not shown on the site. Use this to pause campaigns.',
            }}
          />

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSaving} className="flex-1">
              {editingAd ? 'Save Changes' : 'Create Ad'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
