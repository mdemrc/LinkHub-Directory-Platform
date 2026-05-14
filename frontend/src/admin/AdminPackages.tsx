import { useState, useEffect } from 'react'
import { packagesApi } from '../lib/api'
import {
  FiEdit2,
  FiTrash2,
  FiPackage,
  FiCheck,
} from 'react-icons/fi'
import AdminModal from './components/AdminModal'
import { AdminInput, AdminTextarea, AdminCheckbox } from './components/AdminInput'
import AdminButton from './components/AdminButton'
import AdminPageHeader from './components/AdminPageHeader'
import DynamicIcon from '../components/DynamicIcon'
import { Package, PackagePrice } from '../types'

interface PackageFormData {
  name: string
  slug: string
  icon: string
  size: string
  description: string
  subtitle: string
  features: string[]
  prices: PackagePrice[]
  maxSlots: number | null
  order: number
  isActive: boolean
}

const defaultPrice: PackagePrice = {
  duration: '30',
  label: '1 Month',
  price: 0,
  currency: 'USD',
}

const defaultFormData: PackageFormData = {
  name: '',
  slug: '',
  icon: '',
  size: '',
  description: '',
  subtitle: '',
  features: [''],
  prices: [{ ...defaultPrice }],
  maxSlots: null,
  order: 0,
  isActive: true,
}

function PackagePreview({ data }: { data: PackageFormData }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const currentPrice = data.prices[selectedIdx]

  const formatPrice = (price: PackagePrice) => {
    if (!price) return '$0'
    const symbol = price.currency === 'USD' ? '$' : price.currency === 'EUR' ? '€' : ''
    return `${symbol}${price.price} ${!symbol ? price.currency : ''}`
  }

  return (
    <div className="bg-[#0f1117] border border-lz-border rounded-2xl p-6 sticky top-0 overflow-hidden group">
      {/* Glow effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-lz-accent/10 blur-[100px] rounded-full" />
      
      <div className="flex items-center justify-between mb-6 relative">
        <h3 className="text-sm font-bold text-lz-accent/80 uppercase tracking-[0.2em]">Package Preview</h3>
        <div className="px-2 py-0.5 bg-lz-accent/10 border border-lz-accent/20 rounded text-[10px] font-bold text-lz-accent uppercase">Live View</div>
      </div>
      
      <div className="bg-lz-card border border-lz-border rounded-xl p-6 relative overflow-hidden shadow-2xl transition-all duration-300">
        {/* Icon & Size */}
        <div className="flex items-start justify-between mb-5">
          <div className="w-14 h-14 bg-lz-accent/20 border border-lz-accent/30 rounded-xl flex items-center justify-center">
            {data.icon ? (
              <DynamicIcon name={data.icon} size={28} className="text-lz-accent" />
            ) : (
              <FiPackage size={28} className="text-lz-muted" />
            )}
          </div>
          {data.size && (
            <span className="px-2.5 py-1 bg-lz-dark/50 border border-white/5 text-[10px] font-bold text-lz-muted uppercase tracking-tight rounded-md">
              {data.size}
            </span>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-1 leading-tight">{data.name || 'New Plan'}</h3>
          {data.subtitle && (
            <p className="text-xs font-semibold text-lz-accent uppercase tracking-wider">{data.subtitle}</p>
          )}
          {data.description && (
            <p className="text-sm text-lz-muted mt-4 leading-relaxed line-clamp-3">{data.description}</p>
          )}
        </div>

        {/* Price Selection */}
        {data.prices.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-1.5 mb-4">
              {data.prices.map((price, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 border ${
                    selectedIdx === idx
                      ? 'bg-lz-accent border-lz-accent text-white shadow-lg shadow-lz-accent/20'
                      : 'bg-lz-dark/50 border-white/5 text-lz-muted hover:text-white hover:border-lz-accent/30'
                  }`}
                >
                  {price.label || price.duration}
                </button>
              ))}
            </div>
            {currentPrice && (
              <div className="text-center py-4 bg-lz-dark/40 border border-white/5 rounded-2xl backdrop-blur-sm shadow-inner group-hover:border-lz-accent/20 transition-colors">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-3xl font-black text-white tracking-tighter">{formatPrice(currentPrice)}</span>
                  <span className="text-[10px] font-bold text-lz-muted uppercase">/ {currentPrice.duration}D</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="space-y-3 mb-8">
          {data.features.filter(f => f.trim() !== '').map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1 w-4 h-4 rounded-full bg-lz-success/10 flex items-center justify-center flex-shrink-0">
                <FiCheck className="text-lz-success" size={10} />
              </div>
              <span className="text-xs text-gray-300 leading-snug">{feature}</span>
            </div>
          ))}
          {data.features.filter(f => f.trim() !== '').length === 0 && (
            <p className="text-[10px] italic text-lz-muted uppercase tracking-widest text-center">No features added</p>
          )}
        </div>

        <button type="button" className="w-full py-3.5 bg-gradient-to-r from-lz-accent to-cyan-500 hover:from-lz-accent hover:to-cyan-400 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-lz-accent/10 transition-all active:scale-[0.98]">
          Get Featured
        </button>
      </div>

      <div className="mt-8 p-4 bg-lz-accent/5 border border-lz-accent/10 rounded-2xl relative">
        <div className="absolute top-0 right-0 p-2">
            <div className="w-1.5 h-1.5 bg-lz-accent rounded-full animate-pulse" />
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed italic">
          Preview updates in real-time as you modify the form. Appearance may vary slightly based on display settings.
        </p>
      </div>
    </div>
  )
}

export default function AdminPackages() {
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [formData, setFormData] = useState<PackageFormData>({ ...defaultFormData })

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await packagesApi.getAll()
      setPackages(response.data)
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        prices: formData.prices.filter(p => p.label.trim() !== ''),
        maxSlots: formData.maxSlots || undefined,
      }

      if (editingPackage) {
        await packagesApi.update(editingPackage.id, data)
      } else {
        await packagesApi.create(data)
      }
      fetchPackages()
      closeModal()
    } catch (error) {
      console.error('Failed to save package:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this package?')) return
    try {
      await packagesApi.delete(id)
      fetchPackages()
    } catch (error) {
      console.error('Failed to delete package:', error)
    }
  }

  const openModal = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg)
      setFormData({
        name: pkg.name,
        slug: pkg.slug,
        icon: pkg.icon || '',
        size: pkg.size || '',
        description: pkg.description || '',
        subtitle: pkg.subtitle || '',
        features: pkg.features.length > 0 ? [...pkg.features] : [''],
        prices: pkg.prices.length > 0 ? [...pkg.prices] : [{ ...defaultPrice }],
        maxSlots: pkg.maxSlots || null,
        order: pkg.order,
        isActive: pkg.isActive,
      })
    } else {
      setEditingPackage(null)
      setFormData({
        ...defaultFormData,
        features: [''],
        prices: [{ ...defaultPrice }],
        order: packages.length,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPackage(null)
  }

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) })
    }
  }

  const addPrice = () => {
    setFormData({ ...formData, prices: [...formData.prices, { ...defaultPrice }] })
  }

  const updatePrice = (index: number, field: keyof PackagePrice, value: any) => {
    const newPrices = [...formData.prices]
    newPrices[index] = { ...newPrices[index], [field]: value }
    setFormData({ ...formData, prices: newPrices })
  }

  const removePrice = (index: number) => {
    if (formData.prices.length > 1) {
      setFormData({ ...formData, prices: formData.prices.filter((_, i) => i !== index) })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-lz-accent border-t-transparent rounded-full animate-spin shadow-lg shadow-lz-accent/20" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Advertising Packages"
        description="Configure pricing plans and featured advertisement packages"
        action={{
          label: 'Create Package',
          onClick: () => openModal(),
        }}
      />

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-[#0f1117] border rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/40 group relative ${
              pkg.isActive ? 'border-white/5' : 'border-red-500/20 opacity-70'
            }`}
          >
            {/* Glow backing */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-lz-accent/5 blur-2xl rounded-full group-hover:bg-lz-accent/10 transition-colors" />

            <div className="p-7 relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-lz-accent/20 border border-lz-accent/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    {pkg.icon ? (
                      <DynamicIcon name={pkg.icon} size={28} className="text-lz-accent" />
                    ) : (
                      <FiPackage size={28} className="text-lz-muted" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight tracking-tight">{pkg.name}</h3>
                    {pkg.subtitle && (
                      <p className="text-[10px] font-black text-lz-accent uppercase tracking-widest mt-1.5 opacity-80">{pkg.subtitle}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${
                    pkg.isActive
                      ? 'bg-lz-success/10 text-lz-success border-lz-success/20'
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}
                >
                  {pkg.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>

              {/* Stats & Info */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="p-3 bg-lz-dark/40 border border-white/5 rounded-2xl">
                  <p className="text-[10px] font-black text-lz-muted uppercase tracking-widest mb-1 opacity-60">Dimensions</p>
                  <p className="text-sm font-bold text-white tracking-tight">{pkg.size || 'N/A'}</p>
                </div>
                <div className="p-3 bg-lz-dark/40 border border-white/5 rounded-2xl">
                  <p className="text-[10px] font-black text-lz-muted uppercase tracking-widest mb-1 opacity-60">Max Slots</p>
                  <p className="text-sm font-bold text-white tracking-tight">{pkg.maxSlots || 'Unlimited'}</p>
                </div>
              </div>

              {/* Price list snippet */}
              <div className="space-y-3 mb-8 px-1">
                <p className="text-[10px] font-black text-lz-muted uppercase tracking-[0.2em] mb-4 opacity-50">Price Tiers</p>
                {pkg.prices.slice(0, 3).map((price, i) => (
                  <div key={i} className="flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-400">{price.label}</span>
                    <span className="font-bold text-white">{price.price} {price.currency}</span>
                  </div>
                ))}
                {pkg.prices.length > 3 && (
                  <div className="pt-2 text-center">
                    <span className="text-[10px] font-bold text-lz-muted uppercase border border-white/5 px-3 py-1 rounded-full">+{pkg.prices.length - 3} more options</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] text-lz-muted font-black uppercase tracking-[0.2em] opacity-50">Priority</span>
                  <span className="text-lg font-black text-white tracking-tighter">#{pkg.order}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(pkg)}
                    className="p-3 text-lz-muted hover:text-lz-accent hover:bg-lz-accent/10 border border-transparent hover:border-lz-accent/20 rounded-2xl transition-all duration-300"
                    title="Edit Package"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="p-3 text-lz-muted hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-2xl transition-all duration-300"
                    title="Delete Package"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-24 bg-[#0f1117] border border-dashed border-white/5 rounded-[32px] group">
          <div className="w-24 h-24 bg-lz-accent/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
            <FiPackage className="text-lz-accent/30" size={48} />
          </div>
          <p className="text-white font-black text-2xl tracking-tight">No Advertising Packages</p>
          <p className="text-lz-muted text-sm mt-3 px-6 max-w-sm mx-auto font-medium">Create custom pricing plans and highlighted packages to start monetizing your directory.</p>
        </div>
      )}

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingPackage ? 'Edit Advertising Package' : 'Create New Package'}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-8 pb-4">
            {/* Basic Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-lz-accent rounded-full" />
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Core Configuration</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <AdminInput
                  label="Package Name"
                  required
                  placeholder="e.g. VIP Header Banner"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: editingPackage ? formData.slug : generateSlug(e.target.value),
                    })
                  }}
                  help={{ content: 'The primary identifier for this package. This will be visible to advertisers in the pricing table.' }}
                />
                <AdminInput
                  label="URL Slug"
                  required
                  placeholder="vip-header-banner"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  help={{ content: 'The unique URL segment for this package. Keep it lowercase and use hyphens for spaces.' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <AdminInput
                  label="Icon"
                  placeholder="Package"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  help={{ 
                    content: 'Use Feather icon names like Globe, Shield, Lock, Star etc. Browse all icons from the link below.',
                    link: {
                      url: 'https://feathericons.com/',
                      label: 'Browse Icons on Feather Icons'
                    }
                  }}
                />
                <AdminInput
                  label="Banner Resolution"
                  placeholder="e.g. 728 x 90 px"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  help={{ content: 'Specifies the advertising space dimensions. Visible as a badge on the package card.' }}
                />
              </div>

              <AdminInput
                label="Promotional Tagline"
                placeholder="Maximum visibility for your brand"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                help={{ content: 'A short, punchy sentence that highlights the key selling point of this package.' }}
              />

              <AdminTextarea
                label="Detailed Description"
                rows={3}
                placeholder="Explain what is included in this package..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                help={{ content: 'Provide a comprehensive breakdown of the benefits and placement details to potential advertisers.' }}
              />
            </div>

            {/* Pricing & Limits */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-6 bg-lz-accent rounded-full" />
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Inventory & Pricing</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <AdminInput
                  label="Stock Inventory (Slots)"
                  type="number"
                  min="0"
                  placeholder="Infinite"
                  value={formData.maxSlots || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxSlots: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  help={{ content: 'Limit available quantity to create scarcity. Leave empty if you have unlimited advertising space.' }}
                />
                <AdminInput
                  label="List Priority"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: Number(e.target.value) })
                  }
                  help={{ content: 'Controls the display sequence on the pricing page. Lower numbers (e.g., 0, 1) appear first.' }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Duration & Cost Matrix</label>
                  <button
                    type="button"
                    onClick={addPrice}
                    className="p-1.5 bg-lz-accent/10 border border-lz-accent/20 rounded-lg text-[10px] font-black text-lz-accent hover:bg-lz-accent hover:text-white uppercase tracking-wider transition-all"
                  >
                    + Add Pricing Tier
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.prices.map((price, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl grid grid-cols-12 gap-4 items-end group/price relative"
                    >
                      <div className="col-span-3">
                        <AdminInput
                          label="Days"
                          placeholder="30"
                          value={price.duration}
                          onChange={(e) => updatePrice(index, 'duration', e.target.value)}
                        />
                      </div>
                      <div className="col-span-5">
                        <AdminInput
                          label="Admin Label"
                          placeholder="1 Month"
                          value={price.label}
                          onChange={(e) => updatePrice(index, 'label', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <AdminInput
                          label="Price"
                          type="number"
                          value={price.price}
                          onChange={(e) => updatePrice(index, 'price', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center pb-2">
                        <button
                          type="button"
                          onClick={() => removePrice(index)}
                          className="p-2 text-lz-muted hover:text-red-500 transition-colors"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-lz-accent rounded-full" />
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Included Benefits</h4>
                </div>
                <button
                  type="button"
                  onClick={addFeature}
                  className="p-1 link text-[10px] font-black text-lz-accent uppercase tracking-wider"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 group/feat">
                    <div className="w-full relative">
                        <AdminInput
                        className="pr-10"
                        placeholder="Premium placement, bold title, etc."
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        />
                        <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-lz-muted hover:text-red-500 opacity-0 group-hover/feat:opacity-100 transition-all"
                        >
                        <FiTrash2 size={14} />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <AdminCheckbox
                label="Publish this package (Active)"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                help={{ content: 'Inactive packages are hidden from the public site but preserved in the admin panel.' }}
              />
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <AdminButton
                  variant="secondary"
                  className="flex-1 sm:flex-none justify-center px-8"
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  variant="primary"
                  className="flex-1 sm:flex-none justify-center px-8"
                  type="submit"
                >
                  {editingPackage ? 'Push Changes' : 'Launch Package'}
                </AdminButton>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="w-full lg:w-[360px] shrink-0">
            <PackagePreview data={formData} />
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
