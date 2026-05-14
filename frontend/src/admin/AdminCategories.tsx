import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Category } from '../types'
import { categoriesApi } from '../lib/api'
import { FiPlus, FiTrash2, FiEdit2, FiFlag, FiChevronRight, FiChevronDown, FiArrowUp, FiArrowDown } from 'react-icons/fi'
import { countries } from '../data/countries'
import { getLanguageName, countryLanguages } from '../data/languages'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import { StatusBadge, ActionButtons } from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminCheckbox } from './components/AdminInput'
import DynamicIcon from '../components/DynamicIcon'
import IconPicker from './components/IconPicker'
import FlagIcon from '../components/FlagIcon'

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newSubName, setNewSubName] = useState('')
  const [isAddingSub, setIsAddingSub] = useState(false)
  const [isCountrySub, setIsCountrySub] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const countryInputRef = useRef<HTMLInputElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    description: '',
    order: 0,
    showInNav: true,
    showOnParent: false,
    isActive: true,
    parentId: null as number | null,
    displayMode: 'SUBCATEGORY' as 'SUBCATEGORY' | 'COUNTRY',
    displayLimit: null as number | null,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(target)) {
        // Also check if the click is inside the portal dropdown
        const portalDropdown = document.querySelector('.fixed.z-\\[9999\\]')
        if (!portalDropdown || !portalDropdown.contains(target)) {
          setIsCountryDropdownOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll(true)
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.value || response.data || []
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData)
      } else {
        await categoriesApi.create(formData)
      }
      fetchCategories()
      closeModal()
    } catch (error) {
      console.error('Failed to save category:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await categoriesApi.delete(id)
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug || '',
        icon: category.icon || '',
        description: category.description || '',
        order: category.order,
        showInNav: category.showInNav,
        showOnParent: (category as any).showOnParent || false,
        isActive: category.isActive,
        parentId: category.parentId || null,
        displayMode: (category as any).displayMode || 'SUBCATEGORY',
        displayLimit: (category as any).displayLimit || null,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        slug: '',
        icon: '',
        description: '',
        order: categories.length,
        showInNav: true,
        showOnParent: false,
        isActive: true,
        parentId: null,
        displayMode: 'SUBCATEGORY',
        displayLimit: null,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setNewSubName('')
    setIsAddingSub(false)
    setIsCountrySub(false)
    setSelectedCountryCode('')
    setCountrySearch('')
  }

  const handleAddSubcategory = async () => {
    if (!editingCategory) return

    if (isCountrySub) {
      if (!selectedCountryCode) return
      const country = countries.find(c => c.code === selectedCountryCode)
      if (!country) return
      setIsAddingSub(true)
      try {
        const slug = `${editingCategory.slug}-${country.code.toLowerCase()}`
        const subCount = editingCategory.children?.length || 0
        const languageName = getLanguageName(country.code, country.name)
        await categoriesApi.create({
          name: languageName,
          slug,
          parentId: editingCategory.id,
          order: subCount,
          showInNav: false,
          isActive: true,
          countryCode: country.code,
        })
        setSelectedCountryCode('')
        setCountrySearch('')
        await fetchCategories()
        const res = await categoriesApi.getAll(true)
        const allCats = Array.isArray(res.data) ? res.data : res.data?.value || res.data || []
        const updated = allCats.find((c: Category) => c.id === editingCategory.id)
        if (updated) setEditingCategory(updated)
      } catch (error) {
        console.error('Failed to add country subcategory:', error)
      } finally {
        setIsAddingSub(false)
      }
    } else {
      if (!newSubName.trim()) return
      setIsAddingSub(true)
      try {
        const slug = newSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        const subCount = editingCategory.children?.length || 0
        await categoriesApi.create({
          name: newSubName.trim(),
          slug: `${editingCategory.slug}-${slug}`,
          parentId: editingCategory.id,
          order: subCount,
          showInNav: false,
          isActive: true,
        })
        setNewSubName('')
        await fetchCategories()
        const res = await categoriesApi.getAll(true)
        const allCats = Array.isArray(res.data) ? res.data : res.data?.value || res.data || []
        const updated = allCats.find((c: Category) => c.id === editingCategory.id)
        if (updated) setEditingCategory(updated)
      } catch (error) {
        console.error('Failed to add subcategory:', error)
      } finally {
        setIsAddingSub(false)
      }
    }
  }

  const handleDeleteSubcategory = async (subId: number) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return
    try {
      await categoriesApi.delete(subId)
      await fetchCategories()
      const res = await categoriesApi.getAll(true)
      const allCats = Array.isArray(res.data) ? res.data : res.data?.value || res.data || []
      const updated = allCats.find((c: Category) => c.id === editingCategory?.id)
      if (updated) setEditingCategory(updated)
    } catch (error) {
      console.error('Failed to delete subcategory:', error)
    }
  }

  const handleMoveSubcategory = async (subId: number, direction: 'up' | 'down') => {
    if (!editingCategory?.children) return
    const subs = [...editingCategory.children]
    const idx = subs.findIndex(s => s.id === subId)
    if (idx < 0) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === subs.length - 1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const orders = subs.map((s, i) => {
      if (i === idx) return { id: s.id, order: swapIdx }
      if (i === swapIdx) return { id: s.id, order: idx }
      return { id: s.id, order: i }
    })

    try {
      await categoriesApi.reorder(orders)
      await fetchCategories()
      const res = await categoriesApi.getAll(true)
      const allCats = Array.isArray(res.data) ? res.data : res.data?.value || res.data || []
      const updated = allCats.find((c: Category) => c.id === editingCategory.id)
      if (updated) setEditingCategory(updated)
    } catch (error) {
      console.error('Failed to reorder subcategories:', error)
    }
  }

  const toggleExpand = (catId: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const topLevelCategories = categories.filter(c => !c.parentId)

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Manage site categories (navigation tabs)"
        action={{ label: 'Add Category', onClick: () => openModal() }}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : topLevelCategories.length === 0 ? (
        <div className="text-center py-20 text-lz-muted">No categories found. Create your first category to get started.</div>
      ) : (
        <div className="bg-[#161921] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-lz-muted/60 uppercase tracking-wider w-[60px]">#</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-lz-muted/60 uppercase tracking-wider w-[70px]">Icon</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-lz-muted/60 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-lz-muted/60 uppercase tracking-wider w-[80px]">Nav</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold text-lz-muted/60 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold text-lz-muted/60 uppercase tracking-wider w-[100px]"></th>
              </tr>
            </thead>
            <tbody>
              {topLevelCategories.map((cat) => {
                const isExpanded = expandedCategories.has(cat.id)
                const hasChildren = cat.children && cat.children.length > 0
                return (
                  <React.Fragment key={cat.id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-lz-muted font-mono text-xs">{cat.order}</span>
                      </td>
                      <td className="px-4 py-3">
                        {cat.icon ? (
                          <DynamicIcon name={cat.icon} size={24} className="text-lz-accent" />
                        ) : (
                          <span className="text-lz-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {hasChildren && (
                            <button
                              onClick={() => toggleExpand(cat.id)}
                              className="p-0.5 rounded hover:bg-white/10 text-lz-muted hover:text-white transition-colors"
                            >
                              {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                            </button>
                          )}
                          <div>
                            <p className="font-medium text-white">{cat.name}</p>
                            <p className="text-xs text-lz-muted mt-0.5">
                              /{cat.slug} · {cat._count?.links ?? 0} links
                              {hasChildren && (
                                <span className="ml-1 text-cyan-400">
                                  ({cat.children!.length} subcategories)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${cat.showInNav ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {cat.showInNav ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={cat.isActive} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButtons onEdit={() => openModal(cat)} onDelete={() => handleDelete(cat.id)} />
                      </td>
                    </tr>
                    {isExpanded && cat.children && cat.children.map((sub) => (
                      <tr key={sub.id} className="border-b border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="text-lz-muted font-mono text-xs">{sub.order}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {sub.countryCode ? (
                            <FlagIcon code={sub.countryCode} size={18} />
                          ) : sub.icon ? (
                            <DynamicIcon name={sub.icon} size={18} className="text-lz-accent" />
                          ) : (
                            <span className="text-lz-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 pl-6">
                            <span className="text-lz-muted text-[10px]">↳</span>
                            <div>
                              <p className="text-sm text-white">{sub.name}</p>
                              <p className="text-xs text-lz-muted">
                                /{sub.slug} · {sub._count?.links ?? 0} links
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs ${sub.showInNav ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {sub.showInNav ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge active={sub.isActive} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <ActionButtons onEdit={() => openModal(sub)} onDelete={() => handleDelete(sub.id)} />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size={editingCategory && !editingCategory.parentId ? 'xl' : 'md'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Country subcategory indicator */}
          {editingCategory?.countryCode && (
            <div className="flex items-center gap-2 px-3 py-2 bg-lz-accent/10 border border-lz-accent/20 rounded-lg">
              <FlagIcon code={editingCategory.countryCode} size={18} />
              <span className="text-sm text-lz-accent font-medium">Country Subcategory: {editingCategory.name}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminInput
              label="Name"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                setFormData({ ...formData, name, slug })
              }}
              placeholder="e.g. directory Links"
              required
            />
            <AdminInput
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="directory-links"
              required
            />
          </div>

          {!editingCategory?.countryCode && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <IconPicker
                  label="Icon"
                  value={formData.icon}
                  onChange={(icon) => setFormData({ ...formData, icon })}
                />
                <AdminInput
                  label="Order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  help={{
                    content: 'Lower numbers appear first in navigation and on the home page.'
                  }}
                />
              </div>

              <AdminInput
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category..."
              />
            </>
          )}

          {editingCategory?.countryCode && (
            <AdminInput
              label="Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            />
          )}

          <AdminSelect
            label="Parent Category"
            value={formData.parentId?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? parseInt(e.target.value) : null })}
            options={[
              { value: '', label: 'None (top-level category)' },
              ...categories
                .filter(c => !c.parentId && c.id !== editingCategory?.id)
                .map(c => ({ value: c.id.toString(), label: c.name }))
            ]}
          />

          {!formData.parentId && (
            <AdminSelect
              label="Display Mode"
              value={formData.displayMode}
              onChange={(e) => setFormData({ ...formData, displayMode: e.target.value as 'SUBCATEGORY' | 'COUNTRY' })}
              options={[
                { value: 'SUBCATEGORY', label: 'Subcategories (links grouped by subcategory)' },
                { value: 'COUNTRY', label: 'Country / Language (links grouped by country)' },
              ]}
              help={{
                content: 'Subcategory mode shows links under subcategory columns. Country mode shows links grouped by country flags (for forums).'
              }}
            />
          )}

          <div className="flex flex-wrap gap-6 p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <AdminCheckbox
              label="Show in Navigation"
              checked={formData.showInNav}
              onChange={(e) => setFormData({ ...formData, showInNav: e.target.checked })}
            />
            {formData.parentId && (
              <AdminCheckbox
                label="Show on Parent Page"
                checked={formData.showOnParent}
                onChange={(e) => setFormData({ ...formData, showOnParent: e.target.checked })}
              />
            )}
            <AdminCheckbox
              label="Active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
          </div>

          {/* Display Limit */}
          <AdminInput
            label="Display Limit"
            type="number"
            value={formData.displayLimit ?? ''}
            onChange={(e) => setFormData({ ...formData, displayLimit: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="No limit (show all)"
            help={{ content: 'Max number of links to show before a "Show more" button. Leave empty to show all links. Useful for country groups with many entries (e.g. Russian forums).' }}
          />

          {/* Subcategories Section - only for top-level categories being edited */}
          {editingCategory && !formData.parentId && (
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Subcategories</h3>
                <span className="text-xs text-lz-muted">{editingCategory.children?.length || 0} subcategories</span>
              </div>

              {/* Subcategory list */}
              {editingCategory.children && editingCategory.children.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {editingCategory.children.map((sub, idx) => (
                    <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-lz-muted font-mono w-5 text-center flex-shrink-0">{idx + 1}</span>
                        {sub.countryCode ? (
                          <FlagIcon code={sub.countryCode} size={16} />
                        ) : sub.icon ? (
                          <DynamicIcon name={sub.icon} size={16} className="text-lz-accent flex-shrink-0" />
                        ) : null}
                        <span className="text-sm text-white truncate">{sub.name}</span>
                        {sub.countryCode && (
                          <span className="text-[10px] text-lz-muted flex-shrink-0 bg-white/5 px-1.5 py-0.5 rounded">{sub.countryCode}</span>
                        )}
                        <span className="text-xs text-lz-muted flex-shrink-0">· {sub._count?.links ?? 0} links</span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveSubcategory(sub.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-lz-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <FiArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSubcategory(sub.id, 'down')}
                          disabled={idx === editingCategory.children!.length - 1}
                          className="p-1 rounded text-lz-muted hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <FiArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { closeModal(); setTimeout(() => openModal(sub), 150) }}
                          className="p-1.5 rounded text-lz-muted hover:text-cyan-400 hover:bg-white/5 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubcategory(sub.id)}
                          className="p-1.5 rounded text-lz-muted hover:text-red-400 hover:bg-white/5 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-center text-sm text-lz-muted">
                  No subcategories yet
                </div>
              )}

              {/* Add new subcategory */}
              <div className="px-4 py-3 bg-white/[0.02] border-t border-white/10">
                {/* Country subcategory toggle */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setIsCountrySub(false); setSelectedCountryCode(''); setCountrySearch('') }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      !isCountrySub ? 'bg-lz-accent/20 text-lz-accent' : 'text-lz-muted hover:text-white'
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCountrySub(true); setNewSubName('') }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      isCountrySub ? 'bg-lz-accent/20 text-lz-accent' : 'text-lz-muted hover:text-white'
                    }`}
                  >
                    <FiFlag size={11} />
                    Country / Language
                  </button>
                </div>

                {isCountrySub ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1" ref={countryDropdownRef}>
                      <input
                        ref={countryInputRef}
                        type="text"
                        value={countrySearch}
                        onChange={(e) => { setCountrySearch(e.target.value); setIsCountryDropdownOpen(true) }}
                        onFocus={() => {
                          setIsCountryDropdownOpen(true)
                          if (countryInputRef.current) {
                            const rect = countryInputRef.current.getBoundingClientRect()
                            setDropdownPos({ top: rect.top, left: rect.left, width: rect.width })
                          }
                        }}
                        placeholder="Search country / language..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-lz-muted focus:outline-none focus:border-lz-accent/50"
                      />
                      {isCountryDropdownOpen && ReactDOM.createPortal(
                        <div
                          className="fixed z-[9999] bg-[#1a1d27] border border-lz-border rounded-lg shadow-2xl max-h-48 overflow-y-auto"
                          style={{ top: dropdownPos.top - 4, left: dropdownPos.left, width: dropdownPos.width, transform: 'translateY(-100%)' }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {countries
                            .filter(c => c.code !== 'INTL' && c.code !== 'OTHER')
                            .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()) || getLanguageName(c.code).toLowerCase().includes(countrySearch.toLowerCase()))
                            .map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountryCode(country.code)
                                  setCountrySearch(`${country.flag} ${getLanguageName(country.code, country.name)}`)
                                  setIsCountryDropdownOpen(false)
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${
                                  selectedCountryCode === country.code ? 'bg-lz-accent/10 text-lz-accent' : 'text-gray-300'
                                }`}
                              >
                                <span>{country.flag}</span>
                                <span>{getLanguageName(country.code, country.name)}</span>
                                <span className="text-xs text-lz-muted ml-auto">{country.name} ({country.code})</span>
                              </button>
                            ))}
                        </div>,
                        document.body
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      disabled={!selectedCountryCode || isAddingSub}
                      className="flex items-center gap-1.5 px-3 py-2 bg-lz-accent/20 text-lz-accent rounded-lg text-sm font-medium hover:bg-lz-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiPlus size={14} />
                      {isAddingSub ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1" ref={countryDropdownRef}>
                      <input
                        type="text"
                        value={newSubName}
                        onChange={(e) => { setNewSubName(e.target.value); setIsCountryDropdownOpen(true) }}
                        onFocus={() => { if (newSubName.trim()) setIsCountryDropdownOpen(true) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setIsCountryDropdownOpen(false); handleAddSubcategory() } }}
                        placeholder="New subcategory name..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-lz-muted focus:outline-none focus:border-lz-accent/50"
                      />
                      {isCountryDropdownOpen && newSubName.trim() && (() => {
                        const allLangs = Object.entries(countryLanguages)
                          .filter(([code]) => code !== 'INTL' && code !== 'OTHER' && code !== 'GLOBAL')
                          .map(([code, lang]) => ({ code, lang }))
                        const uniqueLangs = [...new Set(allLangs.map(l => l.lang))].sort()
                        const filtered = uniqueLangs.filter(l => l.toLowerCase().includes(newSubName.toLowerCase()))
                        return filtered.length > 0 ? (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1a1d27] border border-lz-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {filtered.map((lang) => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => {
                                  setNewSubName(lang)
                                  setIsCountryDropdownOpen(false)
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors text-gray-300 ${
                                  newSubName === lang ? 'bg-lz-accent/10 text-lz-accent' : ''
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        ) : null
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      disabled={!newSubName.trim() || isAddingSub}
                      className="flex items-center gap-1.5 px-3 py-2 bg-lz-accent/20 text-lz-accent rounded-lg text-sm font-medium hover:bg-lz-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FiPlus size={14} />
                      {isAddingSub ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              loading={isSaving}
              className="flex-1"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
