import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  FiPackage, 
  FiClock, 
  FiDollarSign, 
  FiUser, 
  FiMail,
  FiLink,
  FiImage,
  FiFileText,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi'
import api from '../lib/api'
import { Package, PackagePrice } from '../types'
import DynamicIcon from '../components/DynamicIcon'
import SEO from '../components/SEO'

type CheckoutStep = 'details' | 'review' | 'payment'

interface FormData {
  customerEmail: string
  customerName: string
  adType: 'BANNER' | 'TEXT'
  adTitle: string
  adUrl: string
  adImageUrl: string
  adDescription: string
  customerNotes: string
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const packageSlug = searchParams.get('package')
  const durationParam = searchParams.get('duration')
  
  const [pkg, setPkg] = useState<Package | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<string>(durationParam || '')
  const [step, setStep] = useState<CheckoutStep>('details')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    customerEmail: '',
    customerName: '',
    adType: 'BANNER',
    adTitle: '',
    adUrl: '',
    adImageUrl: '',
    adDescription: '',
    customerNotes: ''
  })

  useEffect(() => {
    if (!packageSlug) {
      navigate('/advertising')
      return
    }
    fetchPackage()
  }, [packageSlug])

  const fetchPackage = async () => {
    try {
      const res = await api.get(`/packages/${packageSlug}`)
      setPkg(res.data)
      
      // Set default duration if not provided
      const prices = res.data.prices as PackagePrice[]
      if (!selectedDuration && prices.length > 0) {
        setSelectedDuration(prices[0].duration)
      }
    } catch (error) {
      console.error('Failed to fetch package:', error)
      setError('Package not found')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPrice = pkg?.prices?.find((p: PackagePrice) => p.duration === selectedDuration)
  
  const calculateFinalPrice = () => {
    if (!selectedPrice) return 0
    const discount = selectedPrice.discount || 0
    return selectedPrice.price * (1 - discount / 100)
  }

  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const validateStep = (currentStep: CheckoutStep): boolean => {
    if (currentStep === 'details') {
      if (!formData.customerEmail) {
        setError('Email is required')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
        setError('Please enter a valid email address')
        return false
      }
      if (!formData.adUrl) {
        setError('Ad URL is required')
        return false
      }
    }
    setError(null)
    return true
  }

  const handleNext = () => {
    if (!validateStep(step)) return
    
    if (step === 'details') setStep('review')
    else if (step === 'review') setStep('payment')
  }

  const handleBack = () => {
    if (step === 'review') setStep('details')
    else if (step === 'payment') setStep('review')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const res = await api.post('/payments/create', {
        packageId: pkg?.id,
        duration: selectedDuration,
        customerEmail: formData.customerEmail,
        customerName: formData.customerName,
        adType: formData.adType,
        adTitle: formData.adTitle,
        adUrl: formData.adUrl,
        adImageUrl: formData.adImageUrl,
        adDescription: formData.adDescription,
        customerNotes: formData.customerNotes,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      })

      if (res.data.invoiceUrl) {
        // Store order number in session for success page
        sessionStorage.setItem('orderNumber', res.data.orderNumber)
        // Redirect to NowPayments
        window.location.href = res.data.invoiceUrl
      } else {
        setError('Failed to create payment. Please try again.')
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setError(error.response?.data?.error || 'Failed to create payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-lz-accent animate-spin" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Package Not Found</h2>
          <button
            onClick={() => navigate('/advertising')}
            className="text-lz-accent hover:underline"
          >
            Go to Pricing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <SEO title="Checkout" noindex={true} />
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {['details', 'review', 'payment'].map((s, i) => {
          const isActive = step === s
          const isPast = (step === 'review' && s === 'details') || 
                         (step === 'payment' && (s === 'details' || s === 'review'))
          
          return (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isActive ? 'bg-lz-accent text-white' :
                isPast ? 'bg-green-500 text-white' :
                'bg-lz-bg-light text-lz-text-muted'
              }`}>
                {isPast ? <FiCheck size={16} /> : i + 1}
              </div>
              <span className={`ml-2 text-sm ${isActive ? 'text-white' : 'text-lz-text-muted'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && <div className="w-12 h-px bg-lz-border mx-4" />}
            </div>
          )
        })}
      </div>

      {/* Package Summary (always visible) */}
      <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-lz-accent/20 flex items-center justify-center">
            {pkg.icon ? (
              <DynamicIcon name={pkg.icon} className="text-lz-accent" size={24} />
            ) : (
              <FiPackage className="text-lz-accent" size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">{pkg.name}</h3>
            <p className="text-sm text-lz-text-muted">{pkg.subtitle || pkg.size}</p>
          </div>
          <div className="text-right">
            {selectedPrice && (
              <>
                <div className="text-lg font-bold text-white">
                  €{calculateFinalPrice().toFixed(2)}
                </div>
                <div className="text-sm text-lz-text-muted">{selectedPrice.label}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <FiAlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Step Content */}
      {step === 'details' && (
        <div className="bg-lz-bg-light border border-lz-border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <FiUser className="text-lz-accent" />
            Your Details & Ad Information
          </h2>

          {/* Duration Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
              <FiClock size={14} />
              Duration
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(pkg.prices as PackagePrice[]).map((price) => {
                const finalPrice = price.discount 
                  ? price.price * (1 - price.discount / 100) 
                  : price.price
                
                return (
                  <button
                    key={price.duration}
                    onClick={() => setSelectedDuration(price.duration)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedDuration === price.duration
                        ? 'border-lz-accent bg-lz-accent/10'
                        : 'border-lz-border hover:border-lz-accent/50'
                    }`}
                  >
                    <div className="font-medium text-white">{price.label}</div>
                    <div className="text-sm text-lz-accent">€{finalPrice.toFixed(2)}</div>
                    {(price.discount ?? 0) > 0 && (
                      <div className="text-xs text-green-400">-{price.discount}%</div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
                <FiMail size={14} />
                Email *
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => updateFormData('customerEmail', e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
                <FiUser size={14} />
                Name (Optional)
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => updateFormData('customerName', e.target.value)}
                placeholder="Your name"
                className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent"
              />
            </div>
          </div>

          {/* Ad Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-lz-text-muted">Ad Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => updateFormData('adType', 'BANNER')}
                className={`flex-1 p-4 rounded-lg border flex items-center gap-3 ${
                  formData.adType === 'BANNER'
                    ? 'border-lz-accent bg-lz-accent/10'
                    : 'border-lz-border hover:border-lz-accent/50'
                }`}
              >
                <FiImage size={20} className={formData.adType === 'BANNER' ? 'text-lz-accent' : 'text-lz-text-muted'} />
                <div className="text-left">
                  <div className="font-medium text-white">Banner Ad</div>
                  <div className="text-xs text-lz-text-muted">Image-based advertisement</div>
                </div>
              </button>
              <button
                onClick={() => updateFormData('adType', 'TEXT')}
                className={`flex-1 p-4 rounded-lg border flex items-center gap-3 ${
                  formData.adType === 'TEXT'
                    ? 'border-lz-accent bg-lz-accent/10'
                    : 'border-lz-border hover:border-lz-accent/50'
                }`}
              >
                <FiFileText size={20} className={formData.adType === 'TEXT' ? 'text-lz-accent' : 'text-lz-text-muted'} />
                <div className="text-left">
                  <div className="font-medium text-white">Text Ad</div>
                  <div className="text-xs text-lz-text-muted">Text-based advertisement</div>
                </div>
              </button>
            </div>
          </div>

          {/* Ad Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
                <FiLink size={14} />
                Ad URL *
              </label>
              <input
                type="url"
                value={formData.adUrl}
                onChange={(e) => updateFormData('adUrl', e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent"
              />
            </div>

            {formData.adType === 'BANNER' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
                  <FiImage size={14} />
                  Banner Image URL
                </label>
                <input
                  type="url"
                  value={formData.adImageUrl}
                  onChange={(e) => updateFormData('adImageUrl', e.target.value)}
                  placeholder="https://yoursite.com/banner.png"
                  className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent"
                />
                <p className="text-xs text-lz-text-muted">
                  Recommended size: {pkg.size || '920x120'} pixels
                </p>
              </div>
            )}

            {formData.adType === 'TEXT' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-lz-text-muted">Ad Title</label>
                <input
                  type="text"
                  value={formData.adTitle}
                  onChange={(e) => updateFormData('adTitle', e.target.value)}
                  placeholder="Your ad headline"
                  className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-lz-text-muted">Description / Notes</label>
              <textarea
                value={formData.customerNotes}
                onChange={(e) => updateFormData('customerNotes', e.target.value)}
                placeholder="Any special requests or notes..."
                rows={3}
                className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="bg-lz-bg-light border border-lz-border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold text-white">Review Your Order</h2>

          <div className="space-y-4">
            {/* Order Details */}
            <div className="bg-lz-dark rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-lz-text-muted">Package</span>
                <span className="text-white">{pkg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lz-text-muted">Duration</span>
                <span className="text-white">{selectedPrice?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lz-text-muted">Ad Type</span>
                <span className="text-white">{formData.adType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lz-text-muted">Email</span>
                <span className="text-white">{formData.customerEmail}</span>
              </div>
              {formData.adUrl && (
                <div className="flex justify-between">
                  <span className="text-lz-text-muted">URL</span>
                  <span className="text-lz-accent">{formData.adUrl}</span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-lz-dark rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-lz-text-muted">Subtotal</span>
                <span className="text-white">€{selectedPrice?.price.toFixed(2)}</span>
              </div>
              {(selectedPrice?.discount ?? 0) > 0 && selectedPrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Discount ({selectedPrice.discount}%)</span>
                  <span className="text-green-400">
                    -€{((selectedPrice.price * (selectedPrice.discount ?? 0)) / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t border-lz-border pt-3 flex justify-between">
                <span className="font-medium text-white">Total</span>
                <span className="text-xl font-bold text-lz-accent">
                  €{calculateFinalPrice().toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FiDollarSign className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-300">
                You will be redirected to NowPayments to complete your payment with cryptocurrency.
                After payment, your order will be reviewed and activated by our team.
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="bg-lz-bg-light border border-lz-border rounded-lg p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-lz-accent/20 flex items-center justify-center mx-auto">
            <FiDollarSign className="text-lz-accent" size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-white">Ready to Pay</h2>
          <p className="text-lz-text-muted max-w-md mx-auto">
            Click the button below to proceed to secure cryptocurrency payment.
            You'll be able to pay with BTC, ETH, XMR, USDT and many more.
          </p>

          <div className="bg-lz-dark rounded-lg p-4 inline-block">
            <div className="text-sm text-lz-text-muted mb-1">Amount to pay</div>
            <div className="text-3xl font-bold text-white">
              €{calculateFinalPrice().toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={step === 'details' ? () => navigate('/advertising') : handleBack}
          className="flex items-center gap-2 px-4 py-2 text-lz-text-muted hover:text-white transition-colors"
        >
          <FiArrowLeft size={18} />
          {step === 'details' ? 'Back to Pricing' : 'Back'}
        </button>

        {step !== 'payment' ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-lz-accent text-white rounded hover:bg-lz-accent/80 transition-colors"
          >
            Continue
            <FiArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-lz-accent text-white rounded-lg hover:bg-lz-accent/80 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                <FiDollarSign size={18} />
                Pay Now
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
