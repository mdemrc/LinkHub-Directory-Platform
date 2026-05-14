import { useState, useEffect } from 'react'
import { AdPricing, AdSettings } from '../types'
import { adPricingApi } from '../lib/api'
import { FiTrash2, FiEdit2, FiDollarSign, FiSettings, FiSave, FiCreditCard, FiCheck, FiX, FiZap, FiRefreshCw, FiShoppingBag, FiPlay, FiExternalLink, FiClock, FiMail, FiImage, FiMonitor, FiEye, FiStar } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminCheckbox, AdminTextarea } from './components/AdminInput'
import IconPicker from './components/IconPicker'
import DynamicIcon from '../components/DynamicIcon'

interface CryptoInfo {
  code: string
  name: string
  icon: string
}

interface FullSettings extends AdSettings {
  hasApiKey?: boolean
  hasIpnSecret?: boolean
}

export default function AdminAdPricing() {
  const [pricing, setPricing] = useState<AdPricing[]>([])
  const [fullSettings, setFullSettings] = useState<FullSettings | null>(null)
  const [allCryptos, setAllCryptos] = useState<CryptoInfo[]>([])
  const [minAmounts, setMinAmounts] = useState<Record<string, number>>({})
  const [isLoadingMinAmounts, setIsLoadingMinAmounts] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [editingPricing, setEditingPricing] = useState<AdPricing | null>(null)
  const [activeTab, setActiveTab] = useState<'pricing' | 'settings' | 'payments' | 'orders'>('pricing')

  // Orders state
  const [orders, setOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [orderFilter, setOrderFilter] = useState('')
  const [isActivating, setIsActivating] = useState<number | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  const [pricingForm, setPricingForm] = useState({
    type: 'BANNER' as string,
    position: '' as string,
    bannerSize: '' as string,
    displayName: '' as string,
    description: '' as string,
    previewLabel: '' as string,
    features: '' as string,
    priceWeek: 0,
    priceMonth: 0,
    price2Months: 0,
    price3Months: 0,
    price6Months: 0,
    priceYear: 0,
    isActive: true,
    badgeType: '' as string,
    badgeText: '' as string,
    badgeIcon: '' as string,
    badgeColor: '#10b981' as string,
    glowEnabled: false,
    glowColor: '#ff6b00' as string,
  })

  const [settingsForm, setSettingsForm] = useState({
    pageTitle: 'Advertising',
    pageSubtitle: '',
    maxBannerSlots: 6,
    maxTextSlots: 5,
    bannerSize: '468x64',
    bannerPosition: 'Header',
    howToOrderSteps: '',
    paymentMethods: 'BTC,ETH,LTC,USDT',
    autoPlaceEnabled: true,
    specialAdLink: '/contact',
    pinnedBadgeSize: 14,
    flagSize: 14,
  })

  const [nowpaymentsForm, setNowpaymentsForm] = useState({
    apiKey: '',
    ipnSecret: '',
    enabled: false,
    enabledCryptos: {} as Record<string, boolean>
  })
  const [minAmountsLastChecked, setMinAmountsLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch min amounts when payments tab is active and API is configured
  useEffect(() => {
    if (activeTab === 'payments' && fullSettings?.hasApiKey) {
      fetchMinAmounts()
    }
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab, fullSettings?.hasApiKey, orderFilter])

  const fetchMinAmounts = async () => {
    setIsLoadingMinAmounts(true)
    try {
      const res = await adPricingApi.getCryptoMinAmounts()
      setMinAmounts(res.data.minAmounts || {})
      setMinAmountsLastChecked(new Date())
    } catch (error) {
      console.error('Failed to fetch min amounts:', error)
    } finally {
      setIsLoadingMinAmounts(false)
    }
  }

  const fetchOrders = async () => {
    setIsLoadingOrders(true)
    try {
      const res = await adPricingApi.getOrders(orderFilter || undefined)
      setOrders(res.data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleActivateOrder = async (orderId: number) => {
    if (!confirm('Activate this order and create the ad?')) return
    setIsActivating(orderId)
    try {
      await adPricingApi.activateOrder(orderId)
      fetchOrders()
    } catch (error: any) {
      console.error('Failed to activate order:', error)
      alert(error.response?.data?.error || 'Failed to activate order')
    } finally {
      setIsActivating(null)
    }
  }

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Delete this order?')) return
    try {
      await adPricingApi.deleteOrder(orderId)
      fetchOrders()
    } catch (error) {
      console.error('Failed to delete order:', error)
    }
  }

  const fetchData = async () => {
    try {
      const [pricingRes, settingsRes, cryptosRes] = await Promise.all([
        adPricingApi.getAllAdmin(),
        adPricingApi.getSettingsFull(),
        adPricingApi.getCryptos()
      ])
      setPricing(pricingRes.data)
      setFullSettings(settingsRes.data)
      
      if (cryptosRes.data.allCryptos) {
        setAllCryptos(cryptosRes.data.allCryptos)
      }
      
      if (settingsRes.data) {
        setSettingsForm({
          pageTitle: settingsRes.data.pageTitle || 'Advertising',
          pageSubtitle: settingsRes.data.pageSubtitle || '',
          maxBannerSlots: settingsRes.data.maxBannerSlots || 6,
          maxTextSlots: settingsRes.data.maxTextSlots || 5,
          bannerSize: settingsRes.data.bannerSize || '468x64',
          bannerPosition: settingsRes.data.bannerPosition || 'Header',
          howToOrderSteps: (settingsRes.data.howToOrderSteps || []).join('\n'),
          paymentMethods: (settingsRes.data.paymentMethods || []).join(','),
          autoPlaceEnabled: settingsRes.data.autoPlaceEnabled ?? true,
          specialAdLink: settingsRes.data.specialAdLink || '/contact',
          pinnedBadgeSize: settingsRes.data.pinnedBadgeSize || 14,
          flagSize: settingsRes.data.flagSize || 14,
        })
        
        setNowpaymentsForm({
          apiKey: settingsRes.data.nowpaymentsApiKey || '',
          ipnSecret: settingsRes.data.nowpaymentsIpnSecret || '',
          enabled: settingsRes.data.nowpaymentsEnabled || false,
          enabledCryptos: (settingsRes.data.enabledCryptos as Record<string, boolean>) || {}
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const payload = {
        ...pricingForm,
        displayName: pricingForm.displayName || null,
        description: pricingForm.description || null,
        previewLabel: pricingForm.previewLabel || null,
        features: pricingForm.features.trim()
          ? pricingForm.features.split('\n').map(s => s.trim()).filter(Boolean)
          : null,
        badgeType: pricingForm.badgeType || null,
        badgeText: pricingForm.badgeText || null,
        badgeIcon: pricingForm.badgeIcon || null,
        badgeColor: pricingForm.badgeType ? (pricingForm.badgeColor || null) : null,
        glowColor: pricingForm.glowEnabled ? (pricingForm.glowColor || null) : null,
      }
      if (editingPricing) {
        await adPricingApi.update(editingPricing.id, payload)
      } else {
        await adPricingApi.create(payload)
      }
      fetchData()
      closePricingModal()
    } catch (error: any) {
      console.error('Failed to save pricing:', error)
      alert(error?.response?.data?.error || error?.message || 'Failed to save pricing')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await adPricingApi.updateSettings({
        ...settingsForm,
        howToOrderSteps: settingsForm.howToOrderSteps.split('\n').filter(s => s.trim()),
        paymentMethods: settingsForm.paymentMethods.split(',').map(s => s.trim()).filter(Boolean),
        specialAdLink: settingsForm.specialAdLink || '/contact',
        pinnedBadgeSize: settingsForm.pinnedBadgeSize || 14,
        flagSize: settingsForm.flagSize || 14,
      })
      fetchData()
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNowpaymentsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTestResult(null)
    try {
      await adPricingApi.updateNowpaymentsSettings({
        apiKey: nowpaymentsForm.apiKey,
        ipnSecret: nowpaymentsForm.ipnSecret,
        enabled: nowpaymentsForm.enabled,
        enabledCryptos: nowpaymentsForm.enabledCryptos
      })
      fetchData()
      setTestResult({ success: true, message: 'Settings saved successfully!' })
    } catch (error: any) {
      console.error('Failed to save NowPayments settings:', error)
      setTestResult({ success: false, message: error.response?.data?.error || 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await adPricingApi.testNowpayments()
      setTestResult({ 
        success: true, 
        message: `Connection successful! BTC min: ${res.data.testResult?.btcMinAmount || 'N/A'}`
      })
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.response?.data?.message || 'Connection failed'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const toggleCrypto = (code: string) => {
    setNowpaymentsForm(prev => ({
      ...prev,
      enabledCryptos: {
        ...prev.enabledCryptos,
        [code]: !prev.enabledCryptos[code]
      }
    }))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing slot?')) return
    try {
      await adPricingApi.delete(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete pricing:', error)
    }
  }

  const openPricingModal = (item?: AdPricing) => {
    if (item) {
      setEditingPricing(item)
      setPricingForm({
        type: item.type,
        position: item.position || '',
        bannerSize: (item as any).bannerSize || '',
        displayName: item.displayName || '',
        description: item.description || '',
        previewLabel: item.previewLabel || '',
        features: Array.isArray(item.features) ? item.features.join('\n') : '',
        priceWeek: item.priceWeek,
        priceMonth: item.priceMonth,
        price2Months: item.price2Months,
        price3Months: item.price3Months,
        price6Months: item.price6Months,
        priceYear: item.priceYear,
        isActive: item.isActive,
        badgeType: item.badgeType || '',
        badgeText: item.badgeText || '',
        badgeIcon: item.badgeIcon || '',
        badgeColor: item.badgeColor || '#10b981',
        glowEnabled: item.glowEnabled || false,
        glowColor: item.glowColor || '#ff6b00',
      })
    } else {
      setEditingPricing(null)
      setPricingForm({
        type: 'BANNER',
        position: 'HEADER_TOP',
        bannerSize: '',
        displayName: '',
        description: '',
        previewLabel: '',
        features: '',
        priceWeek: 300,
        priceMonth: 1000,
        price2Months: 1700,
        price3Months: 2500,
        price6Months: 5000,
        priceYear: 9000,
        isActive: true,
        badgeType: '',
        badgeText: '',
        badgeIcon: '',
        badgeColor: '#10b981',
        glowEnabled: false,
        glowColor: '#ff6b00',
      })
    }
    setIsPricingModalOpen(true)
  }

  const closePricingModal = () => {
    setIsPricingModalOpen(false)
    setEditingPricing(null)
  }

  // Separate Banner and Text pricing
  const bannerPricing = pricing.filter(p => p.type === 'BANNER')
  const textPricing = pricing.filter(p => p.type === 'TEXT')

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
        title="Ad Pricing"
        description="Manage advertising prices and settings"
        action={{ label: 'Add Pricing Slot', onClick: () => openPricingModal() }}
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'bg-lz-accent text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <FiDollarSign size={16} />
          Pricing Table
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-lz-accent text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <FiSettings size={16} />
          Page Settings
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'payments'
              ? 'bg-lz-accent text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <FiCreditCard size={16} />
          Crypto Payments
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-lz-accent text-white'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <FiShoppingBag size={16} />
          Purchased Ads
          {orders.filter(o => o.paymentStatus === 'COMPLETED' && !o.createdAdId).length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {orders.filter(o => o.paymentStatus === 'COMPLETED' && !o.createdAdId).length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'pricing' && (
        <>
          {/* Desktop Pricing Table */}
          <div className="hidden lg:block bg-lz-card border border-lz-border rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-lz-border">
              <h3 className="text-lg font-semibold text-white">Time Period Price</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-lz-darker text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Ad Type</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Week</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Month</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">2 Months</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">3 Months</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">6 Months</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">1 Year</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border">
                  {bannerPricing.map((item) => (
                    <tr key={item.id} className={`hover:bg-white/[0.02] ${!item.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{item.displayName || 'Banner'}</span>
                          {item.badgeType && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full text-white"
                              style={{ backgroundColor: item.badgeColor || (item.badgeType === 'popular' ? '#10b981' : item.badgeType === 'premium' ? '#ff6b00' : '#6366f1') }}
                            >
                              {item.badgeIcon && <DynamicIcon name={item.badgeIcon} size={9} className="text-white" />}
                              {item.badgeText || item.badgeType}
                            </span>
                          )}
                        </div>
                        {item.description ? (
                          <span className="block text-xs text-lz-accent mt-0.5">{item.description}</span>
                        ) : (
                          <>
                            {item.position && (
                              <span className="block text-xs text-lz-accent mt-0.5">{item.position.replace(/_/g, ' ')}</span>
                            )}
                            {(item as any).bannerSize && (
                              <span className="block text-[10px] text-gray-500 mt-0.5">Size: {(item as any).bannerSize.toUpperCase()}</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">${item.priceWeek.toFixed(2)}</td>
                      <td className="px-4 py-3 text-lz-accent font-medium">${item.priceMonth.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.price2Months.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.price3Months.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.price6Months.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.priceYear.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPricingModal(item)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {textPricing.map((item) => (
                    <tr key={item.id} className={`hover:bg-white/[0.02] ${!item.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{item.displayName || 'Text'}</span>
                          {item.badgeType && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full text-white"
                              style={{ backgroundColor: item.badgeColor || (item.badgeType === 'popular' ? '#10b981' : item.badgeType === 'premium' ? '#ff6b00' : '#6366f1') }}
                            >
                              {item.badgeIcon && <DynamicIcon name={item.badgeIcon} size={9} className="text-white" />}
                              {item.badgeText || item.badgeType}
                            </span>
                          )}
                        </div>
                        {item.description ? (
                          <span className="block text-xs text-lz-accent mt-0.5">{item.description}</span>
                        ) : (
                          item.position && (
                            <span className="block text-xs text-lz-accent mt-0.5">{item.position.replace(/_/g, ' ')}</span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">${item.priceWeek.toFixed(2)}</td>
                      <td className="px-4 py-3 text-lz-accent font-medium">${item.priceMonth.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.price2Months.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.price3Months.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.price6Months.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-300">${item.priceYear.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openPricingModal(item)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Pricing Cards */}
          <div className="lg:hidden space-y-4 mb-6">
            <div className="bg-lz-card border border-lz-border rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Time Period Price</h3>
            </div>
            {[...bannerPricing, ...textPricing].map((item) => (
              <div 
                key={item.id} 
                className={`bg-lz-card border border-lz-border rounded-xl p-4 ${!item.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{item.type === 'BANNER' ? 'Banner' : 'Text'}</span>
                      {item.badgeType && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full text-white"
                          style={{ backgroundColor: item.badgeColor || (item.badgeType === 'popular' ? '#10b981' : item.badgeType === 'premium' ? '#ff6b00' : '#6366f1') }}
                        >
                          {item.badgeIcon && <DynamicIcon name={item.badgeIcon} size={9} className="text-white" />}
                          {item.badgeText || item.badgeType}
                        </span>
                      )}
                    </div>
                    {item.position && (
                      <span className="block text-xs text-lz-accent mt-0.5">{item.position.replace(/_/g, ' ')}</span>
                    )}
                    {(item as any).bannerSize && (
                      <span className="block text-[10px] text-gray-500 mt-0.5">Size: {(item as any).bannerSize.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPricingModal(item)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-2 bg-lz-darker rounded">
                    <span className="text-gray-500">Week</span>
                    <span className="text-gray-300">${item.priceWeek.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-lz-accent/10 rounded">
                    <span className="text-gray-400">Month</span>
                    <span className="text-lz-accent font-medium">${item.priceMonth.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-lz-darker rounded">
                    <span className="text-gray-500">2 Months</span>
                    <span className="text-gray-300">${item.price2Months.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-lz-darker rounded">
                    <span className="text-gray-500">3 Months</span>
                    <span className="text-gray-300">${item.price3Months.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-lz-darker rounded">
                    <span className="text-gray-500">6 Months</span>
                    <span className="text-gray-300">${item.price6Months.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-lz-darker rounded">
                    <span className="text-gray-500">1 Year</span>
                    <span className="text-gray-300">${item.priceYear.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <div className="bg-lz-card border border-lz-border rounded-xl p-6">
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AdminInput
                label="Page Title"
                value={settingsForm.pageTitle}
                onChange={(e) => setSettingsForm({ ...settingsForm, pageTitle: e.target.value })}
                placeholder="Advertising"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AdminInput
                  label="Banner Size"
                  value={settingsForm.bannerSize}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bannerSize: e.target.value })}
                  placeholder="468x64"
                />
                <AdminInput
                  label="Banner Position"
                  value={settingsForm.bannerPosition}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bannerPosition: e.target.value })}
                  placeholder="Header"
                />
              </div>
            </div>

            <AdminTextarea
              label="Page Subtitle"
              value={settingsForm.pageSubtitle}
              onChange={(e) => setSettingsForm({ ...settingsForm, pageSubtitle: e.target.value })}
              placeholder="Daily real and stable attendance of the resource is ≈ 4,420 people..."
              rows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AdminInput
                label="Max Banner Slots"
                type="number"
                value={settingsForm.maxBannerSlots}
                onChange={(e) => setSettingsForm({ ...settingsForm, maxBannerSlots: parseInt(e.target.value) || 0 })}
              />
              <AdminInput
                label="Max Text Slots"
                type="number"
                value={settingsForm.maxTextSlots}
                onChange={(e) => setSettingsForm({ ...settingsForm, maxTextSlots: parseInt(e.target.value) || 0 })}
              />
            </div>

            <AdminTextarea
              label="How to Order Steps (one per line)"
              value={settingsForm.howToOrderSteps}
              onChange={(e) => setSettingsForm({ ...settingsForm, howToOrderSteps: e.target.value })}
              placeholder="Select Ad type&#10;Select period of advert&#10;Enter your Ad text and link..."
              rows={6}
            />

            <AdminInput
              label="Payment Methods (comma separated)"
              value={settingsForm.paymentMethods}
              onChange={(e) => setSettingsForm({ ...settingsForm, paymentMethods: e.target.value })}
              placeholder="BTC,ETH,LTC,USDT"
              help={{ content: 'Supported: BTC, ETH, LTC, USDT, XMR, DOGE, etc.' }}
            />

            <AdminInput
              label="Special Ad Contact Link"
              value={settingsForm.specialAdLink}
              onChange={(e) => setSettingsForm({ ...settingsForm, specialAdLink: e.target.value })}
              placeholder="/contact or https://t.me/yourbot"
              help={{ content: 'The URL the "Contact Us" button links to on the Special Advertising card.' }}
            />

            <AdminInput
              label="Pinned Badge Size (px)"
              type="number"
              value={settingsForm.pinnedBadgeSize}
              onChange={(e) => setSettingsForm({ ...settingsForm, pinnedBadgeSize: parseInt(e.target.value) || 14 })}
              placeholder="14"
              help={{ content: 'Size of the ★ star badge for pinned links in pixels. Default: 14px.' }}
            />

            <AdminInput
              label="Flag Size (px)"
              type="number"
              value={settingsForm.flagSize}
              onChange={(e) => setSettingsForm({ ...settingsForm, flagSize: parseInt(e.target.value) || 14 })}
              placeholder="14"
              help={{ content: 'Size of country flag icons next to links in pixels. Default: 14px.' }}
            />

            {/* Auto-Place Toggle */}
            <div className="bg-lz-darker border border-lz-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Ad Placement Mode</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {settingsForm.autoPlaceEnabled
                      ? 'Automatic: Ads are placed automatically when payment is confirmed.'
                      : 'Manual: Admin must manually activate ads after payment is confirmed.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, autoPlaceEnabled: !settingsForm.autoPlaceEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settingsForm.autoPlaceEnabled ? 'bg-lz-accent' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settingsForm.autoPlaceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  settingsForm.autoPlaceEnabled
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {settingsForm.autoPlaceEnabled ? 'Automatic' : 'Manual'}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <AdminButton type="submit" loading={isSaving}>
                <FiSave size={16} className="mr-2" />
                Save Settings
              </AdminButton>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* API Configuration */}
          <div className="bg-lz-card border border-lz-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">NowPayments Configuration</h3>
                <p className="text-sm text-gray-400 mt-1">Configure your NowPayments API integration</p>
              </div>
              <div className="flex items-center gap-3">
                {fullSettings?.hasApiKey && (
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    <FiCheck size={12} /> API Key Set
                  </span>
                )}
                {!fullSettings?.hasApiKey && (
                  <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                    <FiX size={12} /> API Key Missing
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleNowpaymentsSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AdminInput
                  label="API Key"
                  type="password"
                  value={nowpaymentsForm.apiKey}
                  onChange={(e) => setNowpaymentsForm({ ...nowpaymentsForm, apiKey: e.target.value })}
                  placeholder={fullSettings?.hasApiKey ? '••••••••' : 'Enter API key'}
                  help={{ content: 'Get your API key from NowPayments dashboard' }}
                />
                <AdminInput
                  label="IPN Secret (Optional)"
                  type="password"
                  value={nowpaymentsForm.ipnSecret}
                  onChange={(e) => setNowpaymentsForm({ ...nowpaymentsForm, ipnSecret: e.target.value })}
                  placeholder={fullSettings?.hasIpnSecret ? '••••••••' : 'Enter IPN secret'}
                  help={{ content: 'For webhook signature verification' }}
                />
              </div>

              <div className="flex items-center gap-6">
                <AdminCheckbox
                  label="Enable Crypto Payments"
                  checked={nowpaymentsForm.enabled}
                  onChange={(e) => setNowpaymentsForm({ ...nowpaymentsForm, enabled: e.target.checked })}
                />
                
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !fullSettings?.hasApiKey}
                  className="flex items-center gap-2 text-sm text-lz-accent hover:text-lz-accent/80 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <FiZap size={14} className={isTesting ? 'animate-pulse' : ''} />
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  testResult.success 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {testResult.message}
                </div>
              )}

              <div className="flex justify-end">
                <AdminButton type="submit" loading={isSaving}>
                  <FiSave size={16} className="mr-2" />
                  Save API Settings
                </AdminButton>
              </div>
            </form>
          </div>

          {/* Crypto Selection */}
          <div className="bg-lz-card border border-lz-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Enabled Cryptocurrencies</h3>
                <p className="text-sm text-gray-400 mt-1">Select which cryptocurrencies customers can use for payment</p>
              </div>
              <button
                onClick={fetchMinAmounts}
                disabled={isLoadingMinAmounts || !fullSettings?.hasApiKey}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-lz-border rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={isLoadingMinAmounts ? 'animate-spin' : ''} size={14} />
                Refresh Min Amounts
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {allCryptos.map((crypto) => {
                const minAmount = minAmounts[crypto.code]
                const roundedMin = minAmount ? Math.ceil(minAmount) : null
                return (
                  <button
                    key={crypto.code}
                    type="button"
                    onClick={() => toggleCrypto(crypto.code)}
                    className={`flex flex-col p-3 rounded-lg border transition-all ${
                      nowpaymentsForm.enabledCryptos[crypto.code]
                        ? 'bg-lz-accent/10 border-lz-accent text-white'
                        : 'bg-white/5 border-lz-border text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <img 
                        src={crypto.icon} 
                        alt={crypto.name} 
                        className="w-6 h-6"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://nowpayments.io/images/coins/${crypto.code}.svg`
                        }}
                      />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{crypto.code.toUpperCase()}</div>
                        <div className="text-xs text-gray-500 truncate">{crypto.name}</div>
                      </div>
                      {nowpaymentsForm.enabledCryptos[crypto.code] && (
                        <FiCheck size={16} className="text-lz-accent flex-shrink-0" />
                      )}
                    </div>
                    {/* Minimum amount display */}
                    <div className="mt-2 pt-2 border-t border-white/10 w-full text-left">
                      {isLoadingMinAmounts ? (
                        <span className="text-xs text-gray-500">Loading...</span>
                      ) : roundedMin ? (
                        <span className="text-xs text-yellow-400">Min: ${roundedMin}</span>
                      ) : (
                        <span className="text-xs text-gray-500">Min: -</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {allCryptos.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No cryptocurrencies available.</p>
                <p className="text-sm mt-1">Make sure the API is configured correctly.</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-lz-border flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {Object.values(nowpaymentsForm.enabledCryptos).filter(Boolean).length} of {allCryptos.length} currencies enabled
              </span>
              <AdminButton onClick={handleNowpaymentsSubmit} loading={isSaving}>
                <FiSave size={16} className="mr-2" />
                Save Changes
              </AdminButton>
            </div>
          </div>

          {/* Live Minimum Amounts Checker */}
          <div className="bg-lz-card border border-lz-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Live Minimum Amounts</h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Real-time minimum USD amounts required by NowPayments for each cryptocurrency.
                  {minAmountsLastChecked && (
                    <span className="text-gray-500 ml-1.5">
                      Last checked: {minAmountsLastChecked.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={fetchMinAmounts}
                disabled={isLoadingMinAmounts || !fullSettings?.hasApiKey}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-lz-border rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={isLoadingMinAmounts ? 'animate-spin' : ''} size={14} />
                {isLoadingMinAmounts ? 'Checking...' : 'Check Now'}
              </button>
            </div>

            {!fullSettings?.hasApiKey ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                Configure an API key first to check live minimum amounts.
              </div>
            ) : isLoadingMinAmounts ? (
              <div className="flex items-center justify-center py-8 gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Fetching live data from NowPayments...</span>
              </div>
            ) : Object.keys(minAmounts).length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                Click "Check Now" to fetch live minimum amounts.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-lz-border text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left py-2 px-3 font-medium">Cryptocurrency</th>
                      <th className="text-right py-2 px-3 font-medium">Min Amount (USD)</th>
                      <th className="text-right py-2 px-3 font-medium">+ 5% Buffer</th>
                      <th className="text-center py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lz-border/50">
                    {allCryptos.map((crypto) => {
                      const rawMin = minAmounts[crypto.code]
                      const minWithBuffer = rawMin ? rawMin * 1.05 : null
                      const isEnabled = nowpaymentsForm.enabledCryptos[crypto.code]
                      const lowestPrice = pricing.length > 0 ? Math.min(...pricing.map(p => p.priceWeek || p.priceMonth || 999)) : null

                      let statusColor = 'text-gray-500'
                      let statusLabel = '—'
                      let statusBg = ''
                      if (rawMin !== undefined) {
                        if (!isEnabled) {
                          statusColor = 'text-gray-500'
                          statusLabel = 'Disabled'
                        } else if (lowestPrice && lowestPrice >= (minWithBuffer || 0)) {
                          statusColor = 'text-green-400'
                          statusLabel = 'OK'
                          statusBg = 'bg-green-500/10'
                        } else if (lowestPrice) {
                          statusColor = 'text-red-400'
                          statusLabel = 'Too Low'
                          statusBg = 'bg-red-500/10'
                        }
                      }

                      return (
                        <tr key={crypto.code} className={`${!isEnabled ? 'opacity-40' : ''} hover:bg-white/[0.02] transition-colors`}>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={crypto.icon}
                                alt={crypto.name}
                                className="w-5 h-5"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://nowpayments.io/images/coins/${crypto.code}.svg` }}
                              />
                              <div>
                                <div className="font-medium text-white">{crypto.code.toUpperCase()}</div>
                                <div className="text-xs text-gray-500">{crypto.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {rawMin !== undefined
                              ? <span className="text-white font-mono">${rawMin.toFixed(2)}</span>
                              : <span className="text-gray-600">—</span>
                            }
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {minWithBuffer !== null
                              ? <span className="text-yellow-400 font-mono">${minWithBuffer.toFixed(2)}</span>
                              : <span className="text-gray-600">—</span>
                            }
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {pricing.length > 0 && (
                  <p className="text-xs text-gray-500 mt-3 px-1">
                    "OK" means your lowest weekly price (${Math.min(...pricing.map(p => p.priceWeek || p.priceMonth || 999)).toFixed(2)}) covers the minimum + 5% buffer.
                    "Too Low" means a customer may get a rejection when trying to pay with this coin.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-3">
            <select
              value={orderFilter}
              onChange={(e) => { setOrderFilter(e.target.value); }}
              className="bg-lz-darker border border-lz-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-lz-accent"
            >
              <option value="">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-lz-border rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
            >
              <FiRefreshCw size={14} className={isLoadingOrders ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Orders table */}
          <div className="bg-lz-card border border-lz-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-lz-darker text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Ad Info</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Duration</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Price</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Payment</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lz-border">
                  {isLoadingOrders ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="w-6 h-6 border-2 border-lz-accent border-t-transparent rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <td className="px-4 py-3 text-gray-400 text-sm">#{order.id}</td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium text-sm">{order.adTitle}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.adType === 'BANNER' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {order.adType}
                          </span>
                          {order.adPosition && (
                            <span className="text-lz-accent">{order.adPosition.replace(/_/g, ' ')}</span>
                          )}
                        </div>
                        <a href={order.adLink} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-lz-accent flex items-center gap-1 mt-0.5">
                          <FiExternalLink size={10} />
                          {order.adLink.length > 40 ? order.adLink.substring(0, 40) + '...' : order.adLink}
                        </a>
                        {order.adBannerUrl && (
                          <img src={order.adBannerUrl} alt="Banner" className="mt-1 h-8 rounded border border-lz-border" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{order.duration.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-lz-accent font-medium text-sm">${order.price?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.paymentStatus === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          order.paymentStatus === 'CONFIRMING' ? 'bg-blue-500/20 text-blue-400' :
                          order.paymentStatus === 'FAILED' || order.paymentStatus === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        {order.payCurrency && (
                          <span className="block text-[10px] text-gray-500 mt-0.5">
                            {order.payCurrency} • {order.contactInfo}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                          order.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {order.status}
                        </span>
                        {order.createdAdId && (
                          <span className="block text-[10px] text-lz-accent mt-0.5">
                            Ad #{order.createdAdId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {!order.createdAdId && (order.paymentStatus === 'COMPLETED' || order.status === 'APPROVED') && (
                            <button
                              onClick={() => handleActivateOrder(order.id)}
                              disabled={isActivating === order.id}
                              className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                              title="Activate - Create Ad"
                            >
                              {isActivating === order.id ? (
                                <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiPlay size={12} />
                              )}
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete order"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <AdminModal
        isOpen={isPricingModalOpen}
        onClose={closePricingModal}
        title={editingPricing ? 'Edit Pricing Slot' : 'Add Pricing Slot'}
      >
        <form onSubmit={handlePricingSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminSelect
              label="Ad Type"
              value={pricingForm.type}
              onChange={(e) => setPricingForm({ ...pricingForm, type: e.target.value })}
              options={[
                { value: 'BANNER', label: 'Banner' },
                { value: 'TEXT', label: 'Text' },
              ]}
            />
            <AdminSelect
              label="Position"
              value={pricingForm.position}
              onChange={(e) => setPricingForm({ ...pricingForm, position: e.target.value })}
              options={[
                { value: '', label: 'No specific position' },
                { value: 'HEADER_TOP', label: 'Banner Big (Header Top)' },
                { value: 'HEADER_BOTTOM', label: 'Banner Medium (Header Bottom)' },
                { value: 'SIDEBAR_LEFT', label: 'Left Side (Sidebar Left)' },
                { value: 'SIDEBAR_RIGHT', label: 'Right Side (Sidebar Right)' },
                { value: 'CONTENT_TOP', label: 'Ad-Text Top (Content Top)' },
                { value: 'CONTENT_INLINE', label: 'Banner Small (Content Inline)' },
                { value: 'FOOTER', label: 'Footer' },
              ]}
            />
          </div>

          {/* Live Site Preview */}
          <div className="p-4 bg-[#090b10] rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <FiMonitor size={12} className="text-lz-accent/60" />
              <span className="text-xs text-lz-muted uppercase tracking-wider font-medium">Ad Placement Preview</span>
            </div>
            <div className="space-y-1">
              {/* Banner Big */}
              <PreviewZone pos="HEADER_TOP" label="Banner Big (Full Width)" currentPos={pricingForm.position} onSelect={(p) => setPricingForm({ ...pricingForm, position: p })} />
              {/* Nav mock */}
              <div className="px-2 py-1 flex items-center gap-1.5 border-y border-white/5 bg-[#0c0e15] rounded">
                <span className="text-lz-accent text-[8px] font-bold">🔗 LinkHub</span>
                <span className="text-[7px] text-white/20">Home</span>
                <span className="text-[7px] text-white/20">Forums</span>
                <span className="text-[7px] text-white/20">Shop</span>
              </div>
              {/* Text Ad Top */}
              <PreviewZone pos="CONTENT_TOP" label="Text Ad Top" currentPos={pricingForm.position} onSelect={(p) => setPricingForm({ ...pricingForm, position: p })} />
              {/* Banner Medium */}
              <PreviewZone pos="HEADER_BOTTOM" label="Banner Medium" currentPos={pricingForm.position} onSelect={(p) => setPricingForm({ ...pricingForm, position: p })} />
              {/* Left | Content + Banner Small | Right */}
              <div className="flex gap-1">
                <div className="w-14 flex-shrink-0">
                  <PreviewZone pos="SIDEBAR_LEFT" label="Left" currentPos={pricingForm.position} onSelect={(p) => setPricingForm({ ...pricingForm, position: p })} className="h-full" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="border border-dashed border-white/5 rounded p-1.5 text-center">
                    <span className="text-[7px] text-white/10">Page Content</span>
                  </div>
                  <PreviewZone pos="CONTENT_INLINE" label="Banner Small" currentPos={pricingForm.position} onSelect={(p) => setPricingForm({ ...pricingForm, position: p })} />
                </div>
                <div className="w-16 flex-shrink-0">
                  <PreviewZone pos="SIDEBAR_RIGHT" label="Right" currentPos={pricingForm.position} onSelect={(p) => setPricingForm({ ...pricingForm, position: p })} className="h-full" />
                </div>
              </div>
              {/* Footer */}
              <PreviewZone pos="FOOTER" label="Footer" currentPos={pricingForm.position} onSelect={(p) => setPricingForm({ ...pricingForm, position: p })} />
            </div>
            {pricingForm.position && (
              <p className="text-[10px] text-lz-accent mt-2 text-center">Click any zone to change position</p>
            )}
            {!pricingForm.position && (
              <p className="text-[10px] text-gray-500 mt-2 text-center">Click a zone to assign a position</p>
            )}
          </div>

          {/* Banner Size Selection */}
          {pricingForm.type === 'BANNER' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Banner Size</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '', label: 'Any', desc: 'No specific size' },
                  { value: 'xs', label: 'XS', desc: '468×60' },
                  { value: 'sm', label: 'Small', desc: '440×111' },
                  { value: 'cc', label: 'CC', desc: '920×111' },
                ].map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setPricingForm({ ...pricingForm, bannerSize: size.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-center transition-colors ${
                      pricingForm.bannerSize === size.value
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
          )}

          <div className="p-4 bg-lz-darker rounded-lg border border-lz-border space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Card Display</h4>
            <AdminInput
              label="Display Name"
              value={pricingForm.displayName}
              onChange={(e) => setPricingForm({ ...pricingForm, displayName: e.target.value })}
              placeholder="e.g. Small Banner, Promoted Text"
              help={{ content: 'Custom card title shown on the pricing page.' }}
            />
            <AdminInput
              label="Description"
              value={pricingForm.description}
              onChange={(e) => setPricingForm({ ...pricingForm, description: e.target.value })}
              placeholder="e.g. Size: 468×60 · Advertise in the header"
              help={{ content: 'Short description shown below the card title.' }}
            />
            <AdminInput
              label="Preview Label"
              value={pricingForm.previewLabel}
              onChange={(e) => setPricingForm({ ...pricingForm, previewLabel: e.target.value })}
              placeholder="e.g. Side Text, Header Banner"
              help={{ content: 'Custom label shown in the live site preview when users hover this card on the pricing page.' }}
            />
            <AdminTextarea
              label="Features (one per line)"
              value={pricingForm.features}
              onChange={(e) => setPricingForm({ ...pricingForm, features: e.target.value })}
              placeholder={"Visible on all pages\nPremium header placement\nHighlighted in sites area\nCustom text"}
              rows={4}
              help={{ content: 'Each line becomes a feature bullet on the pricing card.' }}
            />
          </div>

          {/* Badge & Glow Settings */}
          <div className="p-4 bg-lz-darker rounded-lg border border-lz-border space-y-4">
            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <FiStar size={14} />
              Badge & Glow
            </h4>
            <AdminSelect
              label="Badge Type"
              value={pricingForm.badgeType}
              onChange={(e) => setPricingForm({ ...pricingForm, badgeType: e.target.value })}
              options={[
                { value: '', label: 'None' },
                { value: 'popular', label: 'Popular' },
                { value: 'premium', label: 'Premium' },
                { value: 'custom', label: 'Custom' },
              ]}
              help={{ content: 'Choose a badge style for this card on the pricing page.' }}
            />
            {pricingForm.badgeType && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AdminInput
                    label="Badge Text"
                    value={pricingForm.badgeText}
                    onChange={(e) => setPricingForm({ ...pricingForm, badgeText: e.target.value })}
                    placeholder={pricingForm.badgeType === 'popular' ? 'Popular' : pricingForm.badgeType === 'premium' ? 'Premium' : 'Best Value'}
                    help={{ content: 'Custom text shown on the badge. Leave empty for default.' }}
                  />
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">Badge Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={pricingForm.badgeColor}
                          onChange={(e) => setPricingForm({ ...pricingForm, badgeColor: e.target.value })}
                          className="w-10 h-[38px] rounded-lg border border-lz-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={pricingForm.badgeColor}
                          onChange={(e) => setPricingForm({ ...pricingForm, badgeColor: e.target.value })}
                          className="flex-1 px-3 py-2 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-sm text-white"
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <IconPicker
                  value={pricingForm.badgeIcon}
                  onChange={(icon) => setPricingForm({ ...pricingForm, badgeIcon: icon })}
                  label="Badge Icon (optional)"
                />
              </div>
            )}
            <div className="space-y-3">
              <AdminCheckbox
                label="Enable Glow Effect"
                checked={pricingForm.glowEnabled}
                onChange={(e) => setPricingForm({ ...pricingForm, glowEnabled: e.target.checked })}
              />
              {pricingForm.glowEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-300">Glow Color</label>
                  <input
                    type="color"
                    value={pricingForm.glowColor}
                    onChange={(e) => setPricingForm({ ...pricingForm, glowColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-lz-border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={pricingForm.glowColor}
                    onChange={(e) => setPricingForm({ ...pricingForm, glowColor: e.target.value })}
                    className="flex-1 px-3 py-2 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-sm text-white"
                    placeholder="#ff6b00"
                  />
                </div>
              )}
            </div>
            {/* Live preview of badge */}
            {pricingForm.badgeType && (
              <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/5">
                <span className="text-[10px] text-gray-500 block mb-2">Preview:</span>
                <div className="flex justify-center">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-full"
                    style={{
                      background: pricingForm.badgeColor || 'rgba(100,100,255,0.8)',
                      boxShadow: pricingForm.glowEnabled ? `0 2px 12px ${pricingForm.glowColor}80` : undefined,
                    }}
                  >
                    {pricingForm.badgeIcon && <DynamicIcon name={pricingForm.badgeIcon} size={11} className="text-white" />}
                    {' '}{pricingForm.badgeText || (pricingForm.badgeType === 'popular' ? 'Popular' : pricingForm.badgeType === 'premium' ? 'Premium' : 'Custom')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-lz-darker rounded-lg border border-lz-border space-y-4">
            <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <FiDollarSign size={14} />
              Prices (USD)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AdminInput
                label="Week"
                type="number"
                value={pricingForm.priceWeek}
                onChange={(e) => setPricingForm({ ...pricingForm, priceWeek: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
              <AdminInput
                label="1 Month"
                type="number"
                value={pricingForm.priceMonth}
                onChange={(e) => setPricingForm({ ...pricingForm, priceMonth: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
              <AdminInput
                label="2 Months"
                type="number"
                value={pricingForm.price2Months}
                onChange={(e) => setPricingForm({ ...pricingForm, price2Months: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
              <AdminInput
                label="3 Months"
                type="number"
                value={pricingForm.price3Months}
                onChange={(e) => setPricingForm({ ...pricingForm, price3Months: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
              <AdminInput
                label="6 Months"
                type="number"
                value={pricingForm.price6Months}
                onChange={(e) => setPricingForm({ ...pricingForm, price6Months: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
              <AdminInput
                label="1 Year"
                type="number"
                value={pricingForm.priceYear}
                onChange={(e) => setPricingForm({ ...pricingForm, priceYear: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
            </div>
          </div>

          <AdminCheckbox
            label="Active"
            checked={pricingForm.isActive}
            onChange={(e) => setPricingForm({ ...pricingForm, isActive: e.target.checked })}
          />

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={closePricingModal}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSaving} className="flex-1">
              {editingPricing ? 'Save Changes' : 'Create Slot'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* Order Detail Modal */}
      <AdminModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id ?? ''} — Details`}
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status Row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                selectedOrder.paymentStatus === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                selectedOrder.paymentStatus === 'CONFIRMING' ? 'bg-blue-500/20 text-blue-400' :
                selectedOrder.paymentStatus === 'FAILED' || selectedOrder.paymentStatus === 'EXPIRED' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                Payment: {selectedOrder.paymentStatus}
              </span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                selectedOrder.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                selectedOrder.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                selectedOrder.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                Status: {selectedOrder.status}
              </span>
              {selectedOrder.createdAdId && (
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-lz-accent/20 text-lz-accent">
                  Ad #{selectedOrder.createdAdId}
                </span>
              )}
            </div>

            {/* Ad Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiShoppingBag size={14} /> Ad Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem label="Title" value={selectedOrder.adTitle} />
                <DetailItem label="Type" value={
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedOrder.adType === 'BANNER' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>{selectedOrder.adType}</span>
                } />
                <DetailItem label="Position" value={selectedOrder.adPosition?.replace(/_/g, ' ') || '—'} />
                <DetailItem label="Duration" value={selectedOrder.duration?.replace(/_/g, ' ')} />
                {selectedOrder.bannerSize && (
                  <DetailItem label="Banner Size" value={selectedOrder.bannerSize} />
                )}
                <DetailItem label="Link" value={
                  <a href={selectedOrder.adLink} target="_blank" rel="noopener noreferrer" className="text-lz-accent hover:underline flex items-center gap-1 break-all">
                    <FiExternalLink size={12} className="shrink-0" />
                    {selectedOrder.adLink}
                  </a>
                } />
              </div>
              {selectedOrder.adBannerUrl && (
                <div className="mt-3">
                  <span className="text-xs text-gray-500 block mb-1.5 flex items-center gap-1"><FiImage size={12} /> Banner Preview</span>
                  <a href={selectedOrder.adBannerUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selectedOrder.adBannerUrl}
                      alt="Banner"
                      className="max-h-32 rounded-lg border border-lz-border object-contain"
                    />
                  </a>
                  <a href={selectedOrder.adBannerUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-500 hover:text-lz-accent break-all mt-1 block">
                    {selectedOrder.adBannerUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Contact & Payment */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiMail size={14} /> Contact & Payment
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem label="Contact Info" value={selectedOrder.contactInfo || '—'} />
                <DetailItem label="Payment Method" value={selectedOrder.paymentMethod || '—'} />
                <DetailItem label="Price" value={`$${selectedOrder.price?.toFixed(2)}`} highlight />
                {selectedOrder.payCurrency && (
                  <DetailItem label="Crypto Currency" value={selectedOrder.payCurrency.toUpperCase()} />
                )}
                {selectedOrder.payAmount != null && (
                  <DetailItem label="Pay Amount" value={`${selectedOrder.payAmount} ${selectedOrder.payCurrency?.toUpperCase() || ''}`} />
                )}
                {selectedOrder.actuallyPaid != null && (
                  <DetailItem label="Actually Paid" value={`${selectedOrder.actuallyPaid} ${selectedOrder.payCurrency?.toUpperCase() || ''}`} />
                )}
                {selectedOrder.payAddress && (
                  <DetailItem label="Pay Address" value={
                    <span className="font-mono text-xs break-all">{selectedOrder.payAddress}</span>
                  } />
                )}
                {selectedOrder.nowpaymentId && (
                  <DetailItem label="NowPayments ID" value={selectedOrder.nowpaymentId} />
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FiClock size={14} /> Timestamps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem label="Created" value={new Date(selectedOrder.createdAt).toLocaleString()} />
                <DetailItem label="Updated" value={new Date(selectedOrder.updatedAt).toLocaleString()} />
                {selectedOrder.paidAt && (
                  <DetailItem label="Paid At" value={new Date(selectedOrder.paidAt).toLocaleString()} />
                )}
                {selectedOrder.expiresAt && (
                  <DetailItem label="Expires At" value={new Date(selectedOrder.expiresAt).toLocaleString()} />
                )}
              </div>
            </div>

            {/* Admin Notes */}
            {selectedOrder.adminNotes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin Notes</h3>
                <p className="text-gray-300 text-sm bg-white/5 rounded-lg p-3 border border-lz-border/30">
                  {selectedOrder.adminNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  )
}

function DetailItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="bg-white/[0.03] rounded-lg px-3 py-2 border border-lz-border/20">
      <span className="text-[11px] text-gray-500 uppercase tracking-wider block mb-0.5">{label}</span>
      <span className={`text-sm ${highlight ? 'text-lz-accent font-semibold' : 'text-gray-200'}`}>{value}</span>
    </div>
  )
}

function PreviewZone({ pos, label, currentPos, onSelect, className = '' }: {
  pos: string; label: string; currentPos: string; onSelect: (pos: string) => void; className?: string
}) {
  const active = currentPos === pos
  return (
    <button
      type="button"
      onClick={() => onSelect(active ? '' : pos)}
      className={`w-full relative transition-all duration-300 cursor-pointer ${className} ${
        active ? 'ring-2 ring-lz-accent shadow-[0_0_16px_rgba(0,200,255,0.25)] scale-[1.01] z-10' : 'opacity-50 hover:opacity-80'
      }`}
    >
      <div className={`transition-all duration-300 ${
        active ? 'bg-lz-accent/10 border-lz-accent/40' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
      } border border-dashed rounded px-2 py-1.5 text-center`}>
        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${
          active ? 'text-lz-accent' : 'text-white/20'
        }`}>{label}</span>
        {active && (
          <div className="mt-0.5">
            <span className="inline-flex items-center gap-1 text-[8px] font-bold text-lz-accent bg-lz-accent/20 px-1.5 py-0.5 rounded-full animate-pulse">
              <FiEye size={7} /> YOUR AD HERE
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
