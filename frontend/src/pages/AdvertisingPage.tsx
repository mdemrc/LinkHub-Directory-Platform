import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdPricing, AdSettings } from '../types'
import { adPricingApi } from '../lib/api'
import { FiChevronDown } from 'react-icons/fi'
import SEO from '../components/SEO'

type Duration = 'WEEK' | 'MONTH' | '2_MONTHS' | '3_MONTHS' | '6_MONTHS' | 'YEAR'

const DURATION_LABELS: Record<Duration, string> = {
  WEEK: '1 Week',
  MONTH: '1 Month',
  '2_MONTHS': '2 Months',
  '3_MONTHS': '3 Months',
  '6_MONTHS': '6 Months',
  YEAR: '1 Year',
}

const DURATION_DAYS: Record<Duration, number> = {
  WEEK: 7,
  MONTH: 30,
  '2_MONTHS': 60,
  '3_MONTHS': 90,
  '6_MONTHS': 180,
  YEAR: 365,
}

export default function PricingPage() {
  const navigate = useNavigate()
  const [pricing, setPricing] = useState<AdPricing[]>([])
  const [settings, setSettings] = useState<AdSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [selectedType, setSelectedType] = useState<'BANNER' | 'TEXT'>('BANNER')
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedDuration, setSelectedDuration] = useState<Duration | ''>('')
  const [adTitle, setAdTitle] = useState('')
  const [adLink, setAdLink] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('')

  // Available positions for selected type
  const positionsForType = pricing.filter(p => p.type === selectedType)
  const uniquePositions = [...new Set(positionsForType.map(p => p.position || ''))]
  const sizesForPosition = positionsForType.filter(p => (p.position || '') === selectedPosition)
  const selectedSlot = sizesForPosition.find(p => ((p as any).bannerSize || '') === selectedSize) || (sizesForPosition.length === 1 ? sizesForPosition[0] : null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pricingRes, settingsRes] = await Promise.all([
          adPricingApi.getAll(),
          adPricingApi.getSettings()
        ])
        setPricing(pricingRes.data)
        setSettings(settingsRes.data)
        
        // Set default payment method
        if (settingsRes.data?.paymentMethods?.length > 0) {
          setSelectedPayment(settingsRes.data.paymentMethods[0])
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get price for selected type and duration
  const getPrice = (item: AdPricing, duration: Duration): number => {
    switch (duration) {
      case 'WEEK': return item.priceWeek
      case 'MONTH': return item.priceMonth
      case '2_MONTHS': return item.price2Months
      case '3_MONTHS': return item.price3Months
      case '6_MONTHS': return item.price6Months
      case 'YEAR': return item.priceYear
      default: return 0
    }
  }

  // Get selected slot price
  const getSelectedPrice = (): number => {
    if (!selectedDuration || !selectedSlot) return 0
    return getPrice(selectedSlot, selectedDuration)
  }

  // Calculate savings compared to monthly
  const getSavings = (price: number, duration: Duration): number => {
    if (duration === 'WEEK' || duration === 'MONTH' || !selectedSlot) return 0
    const monthlyPrice = selectedSlot.priceMonth
    const months = DURATION_DAYS[duration] / 30
    const expectedPrice = monthlyPrice * months
    return Math.round(expectedPrice - price)
  }

  // Build period options for dropdown
  const getPeriodOptions = () => {
    if (!selectedSlot) return []
    
    const options: { value: Duration; label: string; price: number; savings: number }[] = []
    const durations: Duration[] = ['WEEK', 'MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', 'YEAR']
    
    durations.forEach(dur => {
      const price = getPrice(selectedSlot, dur)
      if (price > 0) {
        options.push({
          value: dur,
          label: DURATION_LABELS[dur],
          price,
          savings: getSavings(price, dur)
        })
      }
    })
    
    return options
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPosition && uniquePositions.length > 0) {
      alert('Please select an ad position')
      return
    }
    if (selectedType === 'BANNER' && sizesForPosition.length > 1 && !selectedSize) {
      alert('Please select a banner size')
      return
    }
    if (!selectedDuration || !adTitle || !adLink || !contactInfo || !selectedPayment) {
      alert('Please fill all required fields')
      return
    }

    const price = getSelectedPrice()
    
    navigate('/advertise/order', {
      state: {
        adType: selectedType,
        adPosition: selectedSlot?.position || undefined,
        bannerSize: (selectedSlot as any)?.bannerSize || undefined,
        adTitle,
        adLink,
        duration: selectedDuration,
        price,
        contactInfo,
        paymentMethod: selectedPayment,
      }
    })
  }

  // Separate pricing
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
    <div className="py-6 sm:py-8 px-4 max-w-5xl mx-auto">
      <SEO
        title="Advertise"
        description="Promote your website on LinkHub. Multiple ad formats and positions available."
        keywords="advertise, promotion, banner ads, sponsored"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Advertise', url: '/advertise' }
        ]}
      />
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {settings?.pageTitle || 'Do you want to place an advertising banner on this site?'}
        </h1>
        {settings?.pageSubtitle && (
          <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
            {settings.pageSubtitle}
          </p>
        )}
        {settings?.bannerSize && (
          <p className="text-xs sm:text-sm text-gray-500 mt-3">
            {settings.bannerSize} - Ad is in a {settings.bannerPosition}
          </p>
        )}
      </div>

      {/* Pricing Table */}
      <div className="mb-8 sm:mb-10">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Time period price</h2>
        
        {/* Desktop Table */}
        <div className="hidden md:block bg-lz-card border border-lz-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-lz-darker border-b border-lz-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Ad type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Week (test)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Month</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">2 months</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">3 months</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">6 months</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">1 Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lz-border">
                {bannerPricing.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-lz-card' : 'bg-lz-darker/50'}>
                    <td className="px-4 py-3 font-semibold text-white">
                      Banner
                      {item.position && <span className="block text-xs text-lz-accent mt-0.5">{item.position.replace(/_/g, ' ')}</span>}
                      {(item as any).bannerSize && <span className="block text-[10px] text-gray-500 mt-0.5">Size: {(item as any).bannerSize.toUpperCase()}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">${item.priceWeek.toFixed(2)}</td>
                    <td className="px-4 py-3 text-lz-accent font-medium">${item.priceMonth.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.price2Months.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.price3Months.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.price6Months.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.priceYear.toFixed(2)}</td>
                  </tr>
                ))}
                {textPricing.map((item, idx) => (
                  <tr key={item.id} className={(bannerPricing.length + idx) % 2 === 0 ? 'bg-lz-card' : 'bg-lz-darker/50'}>
                    <td className="px-4 py-3 font-semibold text-white">
                      Text
                      {item.position && <span className="block text-xs text-lz-accent mt-0.5">{item.position.replace(/_/g, ' ')}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">${item.priceWeek.toFixed(2)}</td>
                    <td className="px-4 py-3 text-lz-accent font-medium">${item.priceMonth.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.price2Months.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.price3Months.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.price6Months.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-300">${item.priceYear.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {bannerPricing.map((item) => (
            <div key={item.id} className="bg-lz-card border border-lz-border rounded-xl p-4">
              <div className="font-semibold text-white mb-3">Banner Ad</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
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
          {textPricing.map((item) => (
            <div key={item.id} className="bg-lz-card border border-lz-border rounded-xl p-4">
              <div className="font-semibold text-white mb-3">Text Ad</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
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
      </div>

      {/* How to Order */}
      {settings?.howToOrderSteps && settings.howToOrderSteps.length > 0 && (
        <div className="mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">How to order an Ad</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm sm:text-base">
            {settings.howToOrderSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Order Form */}
      <div className="bg-lz-card border border-lz-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-6">Start your advertise</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ad Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ad Type</label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as 'BANNER' | 'TEXT')
                  setSelectedPosition('')
                  setSelectedSize('')
                  setSelectedDuration('')
                }}
                className="w-full px-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-lz-accent"
              >
                <option value="BANNER">Banner</option>
                <option value="TEXT">Text</option>
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Position */}
          {uniquePositions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Ad Position</label>
              <div className="relative">
                <select
                  value={selectedPosition}
                  onChange={(e) => {
                    setSelectedPosition(e.target.value)
                    setSelectedSize('')
                    setSelectedDuration('')
                  }}
                  className="w-full px-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-lz-accent"
                >
                  <option value="">Select position</option>
                  {uniquePositions.map((pos) => (
                    <option key={pos} value={pos}>
                      {(pos || 'Default').replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Banner Size */}
          {selectedType === 'BANNER' && selectedPosition && sizesForPosition.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Banner Size</label>
              <div className="flex flex-wrap gap-2">
                {sizesForPosition.map((slot) => {
                  const size = (slot as any).bannerSize || ''
                  const sizeLabels: Record<string, string> = { xs: 'XS (468×60)', sm: 'Small (440×111)', cc: 'CC (920×111)' }
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => { setSelectedSize(size); setSelectedDuration('') }}
                      className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg border text-center transition-colors ${
                        selectedSize === size
                          ? 'bg-lz-accent/20 border-lz-accent/50 text-lz-accent'
                          : 'bg-lz-darker border-lz-border text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {sizeLabels[size] || size || 'Default'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select advert period</label>
            <div className="relative">
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value as Duration)}
                className="w-full px-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-lz-accent"
              >
                <option value="">Select advert period</option>
                {getPeriodOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ${opt.price.toFixed(2)}
                    {opt.savings > 0 ? ` -> save $${opt.savings}` : opt.value === 'WEEK' ? ' -> Test period' : ''}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Ad Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ad title</label>
            <input
              type="text"
              value={adTitle}
              onChange={(e) => setAdTitle(e.target.value)}
              placeholder="Your advert title"
              className="w-full px-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lz-accent"
              required
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Link to your source</label>
            <input
              type="url"
              value={adLink}
              onChange={(e) => setAdLink(e.target.value)}
              placeholder="Place your link here"
              className="w-full px-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lz-accent"
              required
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your email, jabber, tox, TG:</label>
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Your contact"
              className="w-full px-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lz-accent"
              required
            />
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment type</label>
            <div className="relative">
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="w-full px-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-lz-accent"
              >
                {settings?.paymentMethods?.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Selected Price Display */}
          {selectedDuration && (
            <div className="p-4 bg-lz-accent/10 border border-lz-accent/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total Price:</span>
                <span className="text-2xl font-bold text-lz-accent">
                  ${getSelectedPrice().toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {selectedType === 'BANNER' ? 'Banner Ad' : 'Text Ad'}
                {selectedSlot?.position && ` · ${selectedSlot.position.replace(/_/g, ' ')}`}
                {' · '}{DURATION_LABELS[selectedDuration]}
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={!selectedDuration || !selectedSlot}
              className="flex-1 px-6 py-3 bg-lz-accent text-white font-medium rounded-lg hover:bg-lz-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType('BANNER')
                setSelectedPosition('')
                setSelectedSize('')
                setSelectedDuration('')
                setAdTitle('')
                setAdLink('')
                setContactInfo('')
              }}
              className="px-6 py-3 bg-white/5 text-gray-300 font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
