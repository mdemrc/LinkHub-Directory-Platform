import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Ad, AdPosition } from '../types'
import { adsApi } from '../lib/api'
import { FiMenu, FiImage, FiSave, FiExternalLink, FiEye, FiType } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminButton from './components/AdminButton'

const positions: { value: AdPosition; label: string }[] = [
  { value: 'HEADER_TOP', label: 'Banner Big' },
  { value: 'HEADER_BOTTOM', label: 'Banner Medium' },
  { value: 'CONTENT_INLINE', label: 'Banner Small' },
  { value: 'CONTENT_TOP', label: 'Ad-Text Top' },
  { value: 'SIDEBAR_LEFT', label: 'Left Side' },
  { value: 'SIDEBAR_RIGHT', label: 'Right Side' },
  { value: 'FOOTER', label: 'Footer' },
]

type AdTypeFilter = 'ALL' | 'BANNER' | 'TEXT'

interface SortableAdProps {
  ad: Ad
}

function SortableAd({ ad }: SortableAdProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ad.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg group ${
        isDragging ? 'opacity-50 shadow-lg border-lz-accent/30' : ''
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-lz-muted hover:text-white cursor-grab active:cursor-grabbing"
      >
        <FiMenu size={16} />
      </button>

      {/* Image/Text Preview */}
      <div className="w-24 h-14 bg-lz-dark rounded overflow-hidden flex-shrink-0">
        {ad.type === 'TEXT' ? (
          <div 
            className="w-full h-full flex items-center justify-center text-xs font-medium px-1 text-center"
            style={{ 
              backgroundColor: ad.backgroundColor || '#1a1a2e',
              color: ad.textColor || '#ffffff'
            }}
          >
            {ad.textTitle || ad.name}
          </div>
        ) : (ad.imageUrl || (ad.linkUrl && /\.(gif|jpg|jpeg|png|webp|svg)$/i.test(ad.linkUrl))) ? (
          <img
            src={ad.imageUrl || ad.linkUrl!}
            alt={ad.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lz-muted">
            <FiImage size={20} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{ad.name}</span>
          {ad.linkUrl && (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lz-muted hover:text-lz-accent transition-colors flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <FiExternalLink size={12} />
            </a>
          )}
        </div>
        <p className="text-xs text-lz-muted">{ad.type}</p>
      </div>

      {/* Status */}
      <span
        className={`px-2 py-0.5 text-xs rounded ${
          ad.isActive
            ? 'bg-green-500/20 text-green-500'
            : 'bg-red-500/20 text-red-500'
        }`}
      >
        {ad.isActive ? 'Active' : 'Inactive'}
      </span>

      {/* Order Number */}
      <span className="text-xs font-mono text-lz-muted px-2 py-1 bg-white/5 rounded">
        #{ad.order}
      </span>
    </div>
  )
}

export default function AdminAdOrder() {
  const [ads, setAds] = useState<Ad[]>([])
  const [selectedPosition, setSelectedPosition] = useState<AdPosition>('HEADER_TOP')
  const [selectedType, setSelectedType] = useState<AdTypeFilter>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchAds()
  }, [selectedPosition, selectedType])

  const fetchAds = async () => {
    setIsLoading(true)
    try {
      const response = await adsApi.getAll()
      const now = new Date()
      // Filter by position, type, active, and not expired
      const filteredAds = response.data
        .filter((ad: Ad) => {
          if (ad.position !== selectedPosition) return false
          if (selectedType !== 'ALL' && ad.type !== selectedType) return false
          if (!ad.isActive) return false
          if (ad.endDate && new Date(ad.endDate) < now) return false
          return true
        })
        .sort((a: Ad, b: Ad) => a.order - b.order)
      setAds(filteredAds)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setAds((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        return newItems.map((item, index) => ({ ...item, order: index }))
      })
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update each ad's order
      await Promise.all(
        ads.map((ad, index) =>
          adsApi.update(ad.id, { order: index })
        )
      )
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Ad Order & Preview"
        description="Drag and drop to reorder advertisements by position"
      />

      {/* Position Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {positions.map((pos) => (
          <button
            key={pos.value}
            onClick={() => setSelectedPosition(pos.value)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedPosition === pos.value
                ? 'bg-lz-accent/10 text-lz-accent border border-lz-accent/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            {pos.label}
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedType('ALL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedType === 'ALL'
              ? 'bg-lz-accent/20 text-lz-accent border border-lz-accent/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
        >
          All Ads
        </button>
        <button
          onClick={() => setSelectedType('BANNER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedType === 'BANNER'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
        >
          <FiImage size={16} />
          Banner Ads
        </button>
        <button
          onClick={() => setSelectedType('TEXT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedType === 'TEXT'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
          }`}
        >
          <FiType size={16} />
          Text Ads
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <AdminButton
          variant="secondary"
          icon={<FiEye size={16} />}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </AdminButton>

        {hasChanges && (
          <AdminButton
            onClick={handleSave}
            loading={isSaving}
            icon={<FiSave size={16} />}
          >
            Save Order
          </AdminButton>
        )}
      </div>

      {/* Preview */}
      {showPreview && ads.length > 0 && (
        <div className="mb-6 p-4 bg-lz-dark border border-lz-border rounded-xl">
          <h3 className="text-sm font-medium text-white mb-3">Preview ({selectedPosition} - {selectedType})</h3>
          
          <div className="space-y-2">
            {ads.filter(ad => ad.isActive).map((ad) => (
              <div key={ad.id}>
                {ad.type === 'TEXT' ? (
                  <div
                    className="w-full px-4 py-2 flex items-center rounded"
                    style={{ 
                      backgroundColor: ad.backgroundColor || '#1a1a2e',
                      borderLeft: ad.borderColor ? `3px solid ${ad.borderColor}` : undefined
                    }}
                  >
                    <span 
                      className="mr-2 text-sm"
                      style={{ color: ad.textColor || '#ffffff' }}
                    >
                      ★
                    </span>
                    <span 
                      className="font-bold text-sm"
                      style={{ color: ad.textColor || '#ffffff' }}
                    >
                      {ad.textTitle || ad.name}
                    </span>
                    {ad.textContent && (
                      <span 
                        className="ml-2 text-sm opacity-80"
                        style={{ color: ad.textColor || '#ffffff' }}
                      >
                        - {ad.textContent}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden border border-white/10 max-w-sm">
                    {ad.imageUrl ? (
                      <img
                        src={ad.imageUrl}
                        alt={ad.name}
                        className="w-full h-auto object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-6 text-center">
                        <div className="text-sm font-bold">{ad.name}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ads List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ads.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ads.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ads.map((ad) => (
                <SortableAd key={ad.id} ad={ad} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl">
          <FiImage className="mx-auto text-lz-muted/30 mb-4" size={48} />
          <p className="text-lz-muted">No ads in this position</p>
          <p className="text-sm text-lz-muted/60 mt-1">
            Add ads to {selectedPosition} from the Advertisements page
          </p>
        </div>
      )}
    </div>
  )
}
