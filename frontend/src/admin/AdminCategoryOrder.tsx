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
import { Category } from '../types'
import { categoriesApi, linksApi } from '../lib/api'
import { FiMenu, FiSave, FiEye, FiEyeOff, FiChevronDown, FiChevronRight, FiLoader } from 'react-icons/fi'
import { getLanguageName } from '../data/languages'

import AdminPageHeader from './components/AdminPageHeader'
import AdminButton from './components/AdminButton'
import DynamicIcon from '../components/DynamicIcon'
import FlagIcon from '../components/FlagIcon'

// --- Sortable item for top-level categories ---
function SortableCategoryItem({
  category,
  index,
  isExpanded,
  onToggleExpand,
  subCategories,
  onSubDragEnd,
  subSensors,
}: {
  category: Category
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  subCategories: Category[]
  onSubDragEnd: (parentId: number, event: DragEndEvent) => void
  subSensors: ReturnType<typeof useSensors>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasSubs = subCategories.length > 0

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <div
        className={`flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg group ${
          isDragging ? 'shadow-lg border-lz-accent/30' : ''
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

        {/* Expand toggle */}
        {hasSubs ? (
          <button
            onClick={onToggleExpand}
            className="p-1 rounded text-lz-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Icon */}
        {category.icon ? (
          <DynamicIcon name={category.icon} size={20} className="text-lz-accent flex-shrink-0" />
        ) : (
          <span className="w-5 h-5 rounded bg-white/5 flex-shrink-0" />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{category.name}</span>
            <span className="text-xs text-lz-muted">/{category.slug}</span>
            {!category.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Inactive</span>
            )}
            {category.showInNav && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-lz-accent/10 text-lz-accent">Nav</span>
            )}
          </div>
          {hasSubs && (
            <p className="text-xs text-lz-muted mt-0.5">{subCategories.length} subcategories</p>
          )}
        </div>

        {/* Order badge */}
        <span className="text-xs font-mono text-lz-muted px-2 py-1 bg-white/5 rounded">
          #{index}
        </span>
      </div>

      {/* Subcategories (nested sortable) */}
      {isExpanded && hasSubs && (
        <div className="ml-10 mt-1 mb-2 space-y-1">
          <DndContext
            sensors={subSensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => onSubDragEnd(category.id, e)}
          >
            <SortableContext
              items={subCategories.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {subCategories.map((sub, subIdx) => (
                <SortableSubItem key={sub.id} sub={sub} index={subIdx} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

// --- Sortable item for subcategories ---
function SortableSubItem({ sub, index }: { sub: Category; index: number }) {
  const isVirtual = sub.id < 0
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sub.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 p-2.5 bg-white/[0.015] border border-white/[0.04] rounded-lg ${
        isDragging ? 'opacity-50 shadow-lg border-lz-accent/30' : ''
      } ${isVirtual ? 'border-dashed border-amber-500/20' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-lz-muted hover:text-white cursor-grab active:cursor-grabbing"
      >
        <FiMenu size={13} />
      </button>

      {sub.countryCode ? (
        <FlagIcon code={sub.countryCode} size={16} />
      ) : sub.icon ? (
        <DynamicIcon name={sub.icon} size={16} className="text-lz-accent flex-shrink-0" />
      ) : null}

      <span className="text-sm text-white truncate flex-1">
        {sub.countryCode ? getLanguageName(sub.countryCode, sub.name) : sub.name}
      </span>

      {isVirtual && (
        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">New</span>
      )}

      {!sub.isActive && !isVirtual && (
        <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-400">Off</span>
      )}

      <span className="text-[10px] font-mono text-lz-muted px-1.5 py-0.5 bg-white/5 rounded">
        #{index}
      </span>
    </div>
  )
}

// --- Preview component ---
function CategoryPreview({ categories }: { categories: Category[] }) {
  const activeCategories = categories.filter((c) => c.isActive)

  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-xl overflow-hidden">
      {/* Fake navigation bar */}
      <div className="border-b border-white/10 px-4 py-2.5 flex items-center gap-1 overflow-x-auto">
        {activeCategories.map((cat) =>
          cat.showInNav ? (
            <span
              key={cat.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/[0.04] whitespace-nowrap"
            >
              {cat.icon && <DynamicIcon name={cat.icon} size={13} className="text-lz-accent/60" />}
              {cat.name}
            </span>
          ) : null
        )}
      </div>

      {/* Category content previews */}
      <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto">
        {activeCategories.map((cat) => {
          const subs = (cat.children || [])
            .filter((s) => s.isActive)
            .sort((a, b) => a.order - b.order)

          if (subs.length === 0) {
            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  {cat.icon && <DynamicIcon name={cat.icon} size={16} className="text-lz-accent" />}
                  <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  <span className="text-[10px] text-lz-muted bg-white/5 px-1.5 py-0.5 rounded">
                    {cat.displayMode === 'COUNTRY' ? 'Country' : 'Subcategory'}
                  </span>
                </div>
                <div className="px-3 py-4 bg-white/[0.02] rounded-lg text-center">
                  <p className="text-xs text-lz-muted">No subcategories</p>
                </div>
              </div>
            )
          }

          const isCountryMode = cat.displayMode === 'COUNTRY' || subs.some((s) => s.countryCode)

          return (
            <div key={cat.id} className="space-y-2">
              <div className="flex items-center gap-2">
                {cat.icon && <DynamicIcon name={cat.icon} size={16} className="text-lz-accent" />}
                <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                <span className="text-[10px] text-lz-muted bg-white/5 px-1.5 py-0.5 rounded">
                  {isCountryMode ? 'Country' : 'Subcategory'}
                </span>
              </div>

              {/* Subcategory columns - mimic BoardPage layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {subs.map((sub) => (
                  <div key={sub.id} className="min-w-0">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-lz-accent/10">
                      {sub.countryCode ? (
                        <FlagIcon code={sub.countryCode} size={18} className="flex-shrink-0" />
                      ) : sub.icon ? (
                        <DynamicIcon name={sub.icon} size={14} className="text-lz-accent/70 flex-shrink-0" />
                      ) : null}
                      <h4 className="text-xs font-bold text-white truncate leading-tight">
                        {sub.countryCode ? getLanguageName(sub.countryCode, sub.name) : sub.name}
                      </h4>
                      <span className="text-[9px] text-lz-accent/40 bg-lz-accent/[0.06] px-1 py-0.5 rounded-full flex-shrink-0">
                        {sub._count?.links ?? 0}
                      </span>
                    </div>
                    {/* Fake link placeholders */}
                    {Array.from({ length: Math.min(sub._count?.links ?? 2, 3) }).map((_, i) => (
                      <div key={i} className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 flex-shrink-0" />
                        <span className="h-2.5 bg-white/[0.06] rounded flex-1" style={{ maxWidth: `${60 + Math.random() * 40}%` }} />
                      </div>
                    ))}
                    {(sub._count?.links ?? 0) > 3 && (
                      <p className="text-[9px] text-lz-muted mt-1">+{(sub._count?.links ?? 0) - 3} more</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Main page ---
export default function AdminCategoryOrder() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [countryLoading, setCountryLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Separate sensors instance for nested sortable to avoid conflicts
  const subSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll(true)
      const data: Category[] = Array.isArray(res.data) ? res.data : res.data?.value || res.data || []

      // For COUNTRY mode categories, fetch actual countries from links
      const countryModeCats = data.filter((c: Category) => !c.parentId && c.displayMode === 'COUNTRY')
      if (countryModeCats.length > 0) {
        setCountryLoading(true)
        await Promise.all(
          countryModeCats.map(async (cat: Category) => {
            try {
              const linkRes = await linksApi.getByCategory(cat.slug)
              const countries: { countryCode: string; countryName: string; links: unknown[] }[] = linkRes.data?.countries || []
              if (countries.length === 0) return

              const existingCodes = new Set((cat.children || []).map((c: Category) => c.countryCode).filter(Boolean))

              // Create virtual children for countries not yet in subcategories
              let nextVirtualId = -(cat.id * 10000)
              const virtualChildren: Category[] = countries
                .filter((c) => !existingCodes.has(c.countryCode))
                .map((c, i) => ({
                  id: nextVirtualId - i,
                  name: c.countryName || getLanguageName(c.countryCode),
                  slug: `${cat.slug}-${c.countryCode.toLowerCase()}`,
                  countryCode: c.countryCode,
                  parentId: cat.id,
                  order: (cat.children?.length || 0) + i,
                  isActive: true,
                  showInNav: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  _count: { links: c.links.length },
                } as Category))

              if (virtualChildren.length > 0) {
                cat.children = [...(cat.children || []), ...virtualChildren]
              }
            } catch {
              // Ignore fetch errors for individual categories
            }
          })
        )
        setCountryLoading(false)
      }

      setCategories(data)
      // Auto-expand categories with children
      const withChildren = data.filter((c: Category) => !c.parentId && ((c.children && c.children.length > 0)))
      setExpandedCategories(new Set(withChildren.map((c: Category) => c.id)))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const topLevel = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.order - b.order)

  const getSubcategories = (parentId: number) =>
    (categories.find((c) => c.id === parentId)?.children || []).sort((a, b) => a.order - b.order)

  // Handle top-level category drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = topLevel.findIndex((c) => c.id === active.id)
    const newIndex = topLevel.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(topLevel, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }))

    // Update categories state
    setCategories((prev) => {
      const childCategories = prev.filter((c) => c.parentId)
      const updatedParents = reordered.map((r) => {
        const original = prev.find((c) => c.id === r.id)!
        return { ...original, order: r.order }
      })
      return [...updatedParents, ...childCategories]
    })
    setHasChanges(true)
  }

  // Handle subcategory drag within a parent
  const handleSubDragEnd = (parentId: number, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const subs = getSubcategories(parentId)
    const oldIndex = subs.findIndex((s) => s.id === active.id)
    const newIndex = subs.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(subs, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }))

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === parentId) {
          return { ...c, children: reordered }
        }
        return c
      })
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // First, create real categories for any virtual (negative ID) items
      const createdIdMap = new Map<number, number>() // virtualId → realId

      for (const cat of topLevel) {
        const subs = getSubcategories(cat.id)
        const virtualSubs = subs.filter((s) => s.id < 0)

        for (const vs of virtualSubs) {
          try {
            const res = await categoriesApi.create({
              name: vs.name,
              slug: vs.slug,
              parentId: cat.id,
              order: vs.order,
              showInNav: false,
              isActive: true,
              countryCode: vs.countryCode || undefined,
            })
            createdIdMap.set(vs.id, res.data.id)
          } catch (error) {
            console.error('Failed to create country subcategory:', error)
          }
        }
      }

      // Refetch if we created new categories
      if (createdIdMap.size > 0) {
        const res = await categoriesApi.getAll(true)
        const data = Array.isArray(res.data) ? res.data : res.data?.value || res.data || []

        // Apply current order to the fresh data
        const orderMap = new Map<number, number>()
        topLevel.forEach((cat, idx) => {
          orderMap.set(cat.id, idx)
          getSubcategories(cat.id).forEach((sub, subIdx) => {
            const realId = sub.id < 0 ? createdIdMap.get(sub.id) : sub.id
            if (realId) orderMap.set(realId, subIdx)
          })
        })

        // Reorder with real IDs
        const orders: { id: number; order: number }[] = []
        for (const [id, order] of orderMap) {
          orders.push({ id, order })
        }
        await categoriesApi.reorder(orders)
        setCategories(data)
      } else {
        // No virtual items, just reorder
        const orders: { id: number; order: number }[] = []
        topLevel.forEach((cat, idx) => {
          orders.push({ id: cat.id, order: idx })
          const subs = getSubcategories(cat.id)
          subs.forEach((sub, subIdx) => {
            orders.push({ id: sub.id, order: subIdx })
          })
        })
        await categoriesApi.reorder(orders)
      }

      setHasChanges(false)
      // Refetch to get clean state
      await fetchCategories()
    } catch (error) {
      console.error('Failed to save order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
        title="Category Order"
        description="Drag and drop to reorder categories and subcategories"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white/5 text-gray-300 hover:text-white hover:bg-white/10"
        >
          {showPreview ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>

        <span className="text-xs text-lz-muted">
          {topLevel.length} categories · {categories.filter((c) => c.parentId).length} subcategories
          {countryLoading && <span className="ml-2 text-amber-400"><FiLoader className="inline animate-spin" size={12} /> Loading countries...</span>}
        </span>

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

      <div className={showPreview ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : ''}>
        {/* Sortable list */}
        <div>
          <h3 className="text-xs font-semibold text-lz-muted/60 uppercase tracking-wider mb-3">
            Drag to Reorder
          </h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={topLevel.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {topLevel.map((cat, idx) => (
                  <SortableCategoryItem
                    key={cat.id}
                    category={cat}
                    index={idx}
                    isExpanded={expandedCategories.has(cat.id)}
                    onToggleExpand={() => toggleExpand(cat.id)}
                    subCategories={getSubcategories(cat.id)}
                    onSubDragEnd={handleSubDragEnd}
                    subSensors={subSensors}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div>
            <h3 className="text-xs font-semibold text-lz-muted/60 uppercase tracking-wider mb-3">
              Live Preview
            </h3>
            <CategoryPreview categories={topLevel} />
          </div>
        )}
      </div>
    </div>
  )
}
