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
import { Link, Category } from '../types'
import { linksApi, categoriesApi } from '../lib/api'
import { FiMenu, FiExternalLink, FiSave, FiMapPin } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminButton from './components/AdminButton'

interface SortableItemProps {
  link: Link
}

function SortableItem({ link }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-500'
      case 'OFFLINE':
        return 'bg-red-500'
      default:
        return 'bg-amber-500'
    }
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

      {/* Status */}
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusColor(link.status)}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {link.isPinned && (
            <FiMapPin size={14} className="text-amber-400 flex-shrink-0" title="Pinned" />
          )}
          <span className="font-medium text-white truncate">{link.title}</span>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lz-muted hover:text-lz-accent transition-colors flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <FiExternalLink size={12} />
          </a>
        </div>
        <p className="text-xs text-lz-muted truncate">{link.url}</p>
      </div>

      {/* Order Number */}
      <span className="text-xs font-mono text-lz-muted px-2 py-1 bg-white/5 rounded">
        #{link.order}
      </span>
    </div>
  )
}

export default function AdminLinkOrder() {
  const [categories, setCategories] = useState<Category[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchLinks()
    }
  }, [selectedCategory])

  const fetchInitialData = async () => {
    try {
      const categoriesRes = await categoriesApi.getAll(true)
      const catData = Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : categoriesRes.data?.value || categoriesRes.data || []
      setCategories(catData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLinks = async () => {
    if (!selectedCategory) return
    setIsLoading(true)
    try {
      const response = await linksApi.getAll({ categoryId: selectedCategory })
      const data = response.data.links || response.data
      // Sort by order
      setLinks(data.sort((a: Link, b: Link) => a.order - b.order))
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        // Update order values
        return newItems.map((item, index) => ({ ...item, order: index }))
      })
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Send reorder request
      const orders = links.map((link, index) => ({
        id: link.id,
        order: index,
      }))
      await linksApi.reorder(orders)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Link Order"
        description="Drag and drop to reorder links within categories"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : '')}
          className="px-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white text-sm focus:outline-none focus:border-lz-accent/50 transition-colors min-w-[180px]"
        >
          <option value="">Select Category</option>
          {categories.filter(c => !c.parentId).map((cat) => (
            <optgroup key={cat.id} label={cat.name}>
              <option value={cat.id}>{cat.name} (All)</option>
              {cat.children?.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {hasChanges && (
          <AdminButton
            onClick={handleSave}
            loading={isSaving}
            icon={<FiSave size={16} />}
            className="ml-auto"
          >
            Save Order
          </AdminButton>
        )}
      </div>

      {/* Links List */}
      {selectedCategory ? (
        isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : links.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {links.map((link) => (
                  <SortableItem key={link.id} link={link} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl">
            <p className="text-lz-muted">No links in this category</p>
          </div>
        )
      ) : (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl">
          <p className="text-lz-muted">Select a category to manage link order</p>
        </div>
      )}
    </div>
  )
}
