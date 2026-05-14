import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FiCheck, FiLoader, FiMail, FiClock, FiHome } from 'react-icons/fi'
import api from '../lib/api'
import SEO from '../components/SEO'

interface OrderInfo {
  orderNumber: string
  status: string
  packageName: string
  durationLabel: string
  priceAmount: number
  priceCurrency: string
  payment: {
    status: string
    invoiceUrl: string | null
  } | null
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderParam = searchParams.get('order')
  
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [, setError] = useState<string | null>(null)

  useEffect(() => {
    const orderNumber = orderParam || sessionStorage.getItem('orderNumber')
    
    if (orderNumber) {
      fetchOrderStatus(orderNumber)
      // Clear session storage
      sessionStorage.removeItem('orderNumber')
    } else {
      setIsLoading(false)
    }
  }, [orderParam])

  const fetchOrderStatus = async (orderNumber: string) => {
    try {
      const res = await api.get(`/payments/order/${orderNumber}`)
      setOrderInfo(res.data)
    } catch (error) {
      console.error('Failed to fetch order:', error)
      setError('Order not found')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <FiLoader className="w-8 h-8 text-lz-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <SEO title="Payment Successful" noindex={true} />
      <div className="bg-lz-bg-light border border-lz-border rounded-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <FiCheck className="text-green-400" size={40} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Thank You for Your Order!
        </h1>
        
        <p className="text-lz-text-muted mb-8">
          Your payment has been received and is being processed.
        </p>

        {orderInfo && (
          <div className="bg-lz-dark rounded-lg p-6 mb-8 text-left space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lz-text-muted">Order Number</span>
              <span className="text-white font-mono">{orderInfo.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lz-text-muted">Package</span>
              <span className="text-white">{orderInfo.packageName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lz-text-muted">Duration</span>
              <span className="text-white">{orderInfo.durationLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lz-text-muted">Amount</span>
              <span className="text-lz-accent font-bold">
                €{Number(orderInfo.priceAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lz-text-muted">Status</span>
              <span className={`px-2 py-1 rounded text-sm ${
                orderInfo.status === 'APPROVED' 
                  ? 'bg-green-500/20 text-green-400'
                  : orderInfo.status === 'PAYMENT_RECEIVED'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {orderInfo.status === 'PAYMENT_RECEIVED' 
                  ? 'Awaiting Review'
                  : orderInfo.status === 'APPROVED'
                  ? 'Approved'
                  : 'Processing'
                }
              </span>
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-lz-dark/50 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-white mb-4">What happens next?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-lz-accent/20 flex items-center justify-center flex-shrink-0">
                <FiMail className="text-lz-accent" size={16} />
              </div>
              <div>
                <div className="text-white font-medium">Email Confirmation</div>
                <div className="text-sm text-lz-text-muted">
                  You'll receive an email confirmation with your order details.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-lz-accent/20 flex items-center justify-center flex-shrink-0">
                <FiClock className="text-lz-accent" size={16} />
              </div>
              <div>
                <div className="text-white font-medium">Review Process</div>
                <div className="text-sm text-lz-text-muted">
                  Our team will review and activate your ad within 24 hours.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <FiCheck className="text-green-400" size={16} />
              </div>
              <div>
                <div className="text-white font-medium">Ad Goes Live</div>
                <div className="text-sm text-lz-text-muted">
                  Once approved, your ad will be visible on the site immediately.
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-lz-accent text-white rounded-lg hover:bg-lz-accent/80 transition-colors"
        >
          <FiHome size={18} />
          Return to Home
        </Link>
      </div>
    </div>
  )
}
