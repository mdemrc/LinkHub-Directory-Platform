import { useState, useEffect, useRef } from 'react'
import { Link, Category } from '../types'
import { linksApi, categoriesApi } from '../lib/api'
import { FiExternalLink, FiSearch } from 'react-icons/fi'
import { countries } from '../data/countries'
import FlagIcon from '../components/FlagIcon'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminTable, { ActionButtons } from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminTextarea, AdminCheckbox } from './components/AdminInput'

// ISO country list for searchable dropdown
const COUNTRIES = [
  { code: 'GLOBAL', name: 'Global / International', flag: '🌐' },
  { code: 'GB', name: 'United Kingdom (English)', flag: '🇬🇧' },
  ...countries.filter(c => c.code !== 'INTL' && c.code !== 'GLOBAL' && c.code !== 'GB')
]

export default function AdminLinks() {
  const [links, setLinks] = useState<Link[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<number | ''>('')
  const [filterFlag, setFilterFlag] = useState<string>('')
  const [parentCategoryId, setParentCategoryId] = useState<number | ''>()

  // Derived category lists
  const parentCategories = categories.filter(c => !c.parentId)
  const subcategories = parentCategoryId
    ? parentCategories.find(c => c.id === parentCategoryId)?.children || []
    : []

  // Country searchable dropdown state
  const [countrySearch, setCountrySearch] = useState('')
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const countryDropdownRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    mirrorUrl: '',
    description: '',
    categoryId: 0,
    countryCode: '',
    countryName: '',
    status: 'UNKNOWN' as 'ONLINE' | 'OFFLINE' | 'UNKNOWN',
    isPinned: false,
    pinnedColor: '',
    textColor: '',
    customCss: '',
    isScam: false,
    isActive: true,
    isPermanentOnline: false,
    order: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [filterCategory, search])

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchData = async () => {
    try {
      const categoriesRes = await categoriesApi.getAll(true)
      const catData = Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : categoriesRes.data?.value || categoriesRes.data || []
      setCategories(catData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const fetchLinks = async () => {
    setIsLoading(true)
    try {
      const params: any = {}
      if (filterCategory) params.categoryId = filterCategory
      if (search) params.search = search

      const response = await linksApi.getAll(params)
      setLinks(response.data.links || response.data)
    } catch (error) {
      console.error('Failed to fetch links:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingLink) {
        await linksApi.update(editingLink.id, formData)
      } else {
        await linksApi.create(formData as any)
      }
      fetchLinks()
      closeModal()
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to save link'
      alert(msg)
      console.error('Failed to save link:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return
    try {
      await linksApi.delete(id)
      fetchLinks()
    } catch (error) {
      console.error('Failed to delete link:', error)
    }
  }

  const openModal = (link?: Link) => {
    if (link) {
      setEditingLink(link)
      setFormData({
        title: link.title,
        url: link.url,
        mirrorUrl: link.mirrorUrl || '',
        description: link.description || '',
        categoryId: link.categoryId,
        countryCode: link.countryCode || '',
        countryName: link.countryName || '',
        status: link.status,
        isPinned: link.isPinned,
        pinnedColor: link.pinnedColor || '',
        textColor: link.textColor || '',
        customCss: link.customCss || '',
        isScam: link.isScam,
        isActive: link.isActive,
        isPermanentOnline: link.isPermanentOnline || false,
        order: link.order,
      })
      // Detect parent category for cascading dropdown
      const parentCat = parentCategories.find(p => p.id === link.categoryId)
      if (parentCat) {
        setParentCategoryId(parentCat.id)
      } else {
        const foundParent = parentCategories.find(p => p.children?.some(ch => ch.id === link.categoryId))
        setParentCategoryId(foundParent?.id || '')
      }
      const country = COUNTRIES.find(c => c.code === link.countryCode)
      setCountrySearch(country ? country.name : link.countryName || '')
    } else {
      setEditingLink(null)
      setFormData({
        title: '',
        url: '',
        mirrorUrl: '',
        description: '',
        categoryId: 0,
        countryCode: '',
        countryName: '',
        status: 'ONLINE',
        isPinned: false,
        pinnedColor: '',
        textColor: '',
        customCss: '',
        isScam: false,
        isActive: true,
        isPermanentOnline: false,
        order: 0,
      })
      setParentCategoryId('')
      setCountrySearch('')
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingLink(null)
  }

  const StatusDot = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      ONLINE: 'bg-emerald-500',
      OFFLINE: 'bg-red-500',
      UNKNOWN: 'bg-amber-500',
    }
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || colors.UNKNOWN}`} />
        <span className="text-xs text-lz-muted capitalize">{status.toLowerCase()}</span>
      </div>
    )
  }

  const FlagBadge = ({
    label,
    color,
  }: {
    label: string
    color: 'yellow' | 'red' | 'gray'
  }) => {
    const colorClasses = {
      yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    }
    return (
      <span className={`px-2 py-0.5 text-[10px] font-medium border rounded ${colorClasses[color]}`}>
        {label}
      </span>
    )
  }

  const columns = [
    {
      key: 'status',
      label: 'Status',
      width: '90px',
      render: (link: Link) => <StatusDot status={link.status} />,
    },
    {
      key: 'title',
      label: 'Link',
      render: (link: Link) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">{link.title}</span>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lz-muted hover:text-lz-accent transition-colors flex-shrink-0"
            >
              <FiExternalLink size={14} />
            </a>
          </div>
          <p className="text-xs text-lz-muted truncate max-w-[350px]">{link.url}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (link: Link) => {
        const parent = parentCategories.find(p => p.children?.some(ch => ch.id === link.categoryId))
        const isDirectParent = parentCategories.some(p => p.id === link.categoryId)
        return (
          <div className="text-sm">
            {parent && !isDirectParent ? (
              <>
                <span className="text-gray-400">{parent.name}</span>
                <span className="text-gray-500 mx-1">→</span>
                <span className="text-gray-300">{link.category?.name}</span>
              </>
            ) : (
              <span className="text-gray-300">{link.category?.name || '—'}</span>
            )}
          </div>
        )
      },
    },
    {
      key: 'clicks',
      label: 'Clicks',
      width: '80px',
      render: (link: Link) => (
        <span className="text-sm font-mono text-lz-muted">{link.clickCount}</span>
      ),
    },
    {
      key: 'flags',
      label: 'Flags',
      width: '240px',
      render: (link: Link) => (
        <div className="flex flex-wrap gap-1.5">
          {link.countryCode && (() => {
            const country = COUNTRIES.find(c => c.code === link.countryCode)
            return (
              <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium border rounded bg-blue-500/10 text-blue-300 border-blue-500/20">
                <FlagIcon code={link.countryCode} size={14} />
                {link.countryName || country?.name || link.countryCode}
              </span>
            )
          })()}
          {link.isPinned && <FlagBadge label="PINNED" color="yellow" />}
          {link.isScam && <FlagBadge label="SCAM" color="red" />}
          {!link.isActive && <FlagBadge label="INACTIVE" color="gray" />}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      align: 'right' as const,
      render: (link: Link) => (
        <ActionButtons onEdit={() => openModal(link)} onDelete={() => handleDelete(link.id)} />
      ),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Links"
        description={`Manage all links (${links.length} total)`}
        action={{ label: 'Add Link', onClick: () => openModal() }}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lz-muted" size={16} />
          <input
            type="text"
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white placeholder-lz-muted text-sm focus:outline-none focus:border-lz-accent/50 transition-colors"
          />
        </div>
        <div className="flex gap-3 flex-col sm:flex-row">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : '')}
            className="px-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white text-sm focus:outline-none focus:border-lz-accent/50 transition-colors w-full sm:w-auto sm:min-w-[150px]"
          >
            <option value="">All Categories</option>
            {parentCategories.map((cat) => (
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
          <select
            value={filterFlag}
            onChange={(e) => setFilterFlag(e.target.value)}
            className="px-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white text-sm focus:outline-none focus:border-lz-accent/50 transition-colors w-full sm:w-auto sm:min-w-[150px]"
          >
            <option value="">All Flags</option>
            <option value="pinned">Pinned</option>
            <option value="scam">Scam</option>
            <option value="inactive">Inactive</option>
            <option value="---" disabled>──────────</option>
            {[...new Set(links.filter(l => l.countryCode).map(l => l.countryCode))].map(code => {
              const country = COUNTRIES.find(c => c.code === code)
              return (
                <option key={code} value={`country:${code}`}>
                  [{code}] {country?.name || code}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filterFlag ? links.filter(link => {
          if (filterFlag === 'pinned') return link.isPinned
          if (filterFlag === 'scam') return link.isScam
          if (filterFlag === 'inactive') return !link.isActive
          if (filterFlag.startsWith('country:')) return link.countryCode === filterFlag.replace('country:', '')
          return true
        }) : links}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No links found. Create your first link to get started."
      />

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingLink ? 'Edit Link' : 'Create Link'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AdminInput
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Hacker News"
            help={{
              content: 'The display name of the link that users will see. Keep it short and descriptive.',
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <AdminInput
                label="URL"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                help={{
                  content: 'The main URL of the website. Use the public HTTPS address.',
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <AdminInput
                label="Mirror URL"
                value={formData.mirrorUrl}
                onChange={(e) => setFormData({ ...formData, mirrorUrl: e.target.value })}
                placeholder="https://mirror.example.com"
                hint="Optional mirror / fallback URL"
                help={{
                  content: 'Alternative URL shown when the primary site is unreachable. Leave empty if no mirror exists.',
                }}
              />
            </div>
          </div>

          <AdminTextarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the link..."
            rows={3}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminSelect
              label="Category"
              value={String(parentCategoryId)}
              onChange={(e) => {
                const pid = e.target.value ? Number(e.target.value) : ''
                setParentCategoryId(pid)
                setFormData({ ...formData, categoryId: pid || 0 })
              }}
              options={[
                { value: '', label: 'Select category' },
                ...parentCategories.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                })),
              ]}
              required
              help={{
                content: 'The main category this link belongs to.',
              }}
            />

            {subcategories.length > 0 && (
              <AdminSelect
                label="Subcategory"
                value={String(formData.categoryId)}
                onChange={(e) => {
                  const subId = Number(e.target.value)
                  setFormData({ ...formData, categoryId: subId || (typeof parentCategoryId === 'number' ? parentCategoryId : 0) })
                }}
                options={[
                  { value: String(parentCategoryId), label: '— None (use parent category) —' },
                  ...subcategories.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  })),
                ]}
                help={{
                  content: 'Optional. If not selected, the link will be placed under the parent category directly.',
                }}
              />
            )}

            {/* Country Searchable Dropdown */}
            <div className="relative" ref={countryDropdownRef}>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Country / Language
              </label>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value)
                  setIsCountryDropdownOpen(true)
                }}
                onFocus={() => setIsCountryDropdownOpen(true)}
                placeholder="Search country..."
                className="w-full px-3 py-2 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white placeholder-lz-muted text-sm focus:outline-none focus:border-lz-accent/50 transition-colors"
              />
              {isCountryDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1a1d27] border border-lz-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {COUNTRIES.filter(c =>
                    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                    c.code.toLowerCase().includes(countrySearch.toLowerCase())
                  ).map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          countryCode: country.code,
                          countryName: country.name,
                        })
                        setCountrySearch(country.name)
                        setIsCountryDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${
                        formData.countryCode === country.code ? 'bg-lz-accent/10 text-lz-accent' : 'text-gray-300'
                      }`}
                    >
                      <FlagIcon code={country.code} size={16} />
                      <span>{country.name}</span>
                      <span className="text-xs text-lz-muted ml-auto">{country.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminSelect
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'UNKNOWN', label: '🟡 Unknown' },
                { value: 'ONLINE', label: '🟢 Online' },
                { value: 'OFFLINE', label: '🔴 Offline' },
              ]}
              help={{
                content: 'Current operational status. Online = working, Offline = not accessible, Unknown = not checked.',
              }}
            />
          </div>

          <AdminInput
            label="Order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
            help={{
              content: 'Display order within the category. Lower numbers appear first. Use Link Order page for drag-drop sorting.',
            }}
          />

          <div className="flex flex-wrap gap-6 p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <AdminCheckbox
              label="Pinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              help={{
                content: 'Pinned links appear at the top of their category with a special indicator.',
              }}
            />
            {formData.isPinned && (
              <div className="w-full space-y-3 pl-2 border-l-2 border-yellow-500/30">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Star:</span>
                    <input
                      type="color"
                      value={formData.pinnedColor || '#EAB308'}
                      onChange={(e) => setFormData({ ...formData, pinnedColor: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer border border-lz-border/50"
                    />
                    <input
                      type="text"
                      value={formData.pinnedColor || '#EAB308'}
                      onChange={(e) => setFormData({ ...formData, pinnedColor: e.target.value })}
                      placeholder="#EAB308"
                      className="w-20 px-2 py-1 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Text:</span>
                    <input
                      type="color"
                      value={formData.textColor || '#EF4444'}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer border border-lz-border/50"
                    />
                    <input
                      type="text"
                      value={formData.textColor || ''}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      placeholder="default"
                      className="w-20 px-2 py-1 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-xs"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-1">Custom CSS (inline styles):</span>
                  <input
                    type="text"
                    value={formData.customCss || ''}
                    onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                    placeholder="e.g. text-shadow: 0 0 8px #ff0; font-style: italic"
                    className="w-full px-2 py-1.5 bg-lz-dark/50 border border-lz-border/50 rounded text-white text-xs font-mono"
                  />
                </div>
              </div>
            )}
            <AdminCheckbox
              label="Scam"
              checked={formData.isScam}
              onChange={(e) => setFormData({ ...formData, isScam: e.target.checked })}
              help={{
                content: 'Mark this link as a known scam. It will show a warning to users.',
              }}
            />
            <AdminCheckbox
              label="Active"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              help={{
                content: 'Inactive links are hidden from the public site but kept in the database.',
              }}
            />
            <AdminCheckbox
              label="Permanent Online"
              checked={formData.isPermanentOnline}
              onChange={(e) => setFormData({ ...formData, isPermanentOnline: e.target.checked })}
              help={{
                content: 'When enabled, this link will always show as ONLINE regardless of checker results. Use for sites that block automated checks or have custom verification.',
              }}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSaving} className="flex-1">
              {editingLink ? 'Save Changes' : 'Create Link'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
