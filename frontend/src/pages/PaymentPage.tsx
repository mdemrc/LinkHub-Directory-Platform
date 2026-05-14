import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { adPricingApi } from '../lib/api'
import { 
  FiCopy, 
  FiCheck, 
  FiClock, 
  FiAlertCircle, 
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiAlertTriangle
} from 'react-icons/fi'
import QRCode from 'react-qr-code'
import SEO from '../components/SEO'

// Payment timeout in seconds (1 hour)
const PAYMENT_TIMEOUT_SECONDS = 60 * 60

interface PaymentState {
  order: {
    id: number
    adTitle: string
    adType: string
    duration: string
    price: number
    paymentStatus: string
    payCurrency?: string
    payAmount?: number
    payAddress?: string
    actuallyPaid?: number
    createdAt?: string
  }
  payment: {
    paymentId: string
    address: string
    amount: number
    currency: string
    usdAmount: number
    remainingSeconds?: number
  }
}

const STATUS_CONFIG = {
  PENDING: {
    icon: FiClock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Waiting for payment',
    description: 'Send the exact amount to the address below'
  },
  CONFIRMING: {
    icon: FiRefreshCw,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Confirming',
    description: 'Payment received, waiting for network confirmations'
  },
  COMPLETED: {
    icon: FiCheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Payment completed',
    description: 'Your payment has been confirmed!'
  },
  EXPIRED: {
    icon: FiXCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    label: 'Expired',
    description: 'This payment has expired'
  },
  FAILED: {
    icon: FiAlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Failed',
    description: 'Payment failed. Please contact support.'
  }
}

export default function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialState = location.state as PaymentState | null

  const [paymentStatus, setPaymentStatus] = useState(initialState?.order?.paymentStatus || 'PENDING')
  const [actuallyPaid, setActuallyPaid] = useState(initialState?.order?.actuallyPaid || 0)
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    // Calculate initial remaining time based on order creation time
    if (initialState?.order?.createdAt) {
      const created = new Date(initialState.order.createdAt).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - created) / 1000)
      return Math.max(0, PAYMENT_TIMEOUT_SECONDS - elapsed)
    }
    return initialState?.payment?.remainingSeconds || PAYMENT_TIMEOUT_SECONDS
  })

  const payment = initialState?.payment
  const order = initialState?.order

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (remainingSeconds <= 60) return 'text-red-400' // Last minute
    if (remainingSeconds <= 300) return 'text-yellow-400' // Last 5 minutes
    return 'text-lz-accent'
  }

  // Countdown timer effect
  useEffect(() => {
    if (paymentStatus !== 'PENDING') return
    if (remainingSeconds <= 0) {
      setPaymentStatus('EXPIRED')
      return
    }

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setPaymentStatus('EXPIRED')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [paymentStatus, remainingSeconds])

  // Check payment status periodically
  const checkStatus = useCallback(async () => {
    if (!order?.id) return
    
    try {
      setIsRefreshing(true)
      const res = await adPricingApi.getPaymentStatus(order.id)
      setPaymentStatus(res.data.paymentStatus)
      setActuallyPaid(res.data.actuallyPaid || 0)
    } catch (error) {
      console.error('Failed to check payment status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [order?.id])

  useEffect(() => {
    if (!initialState) {
      navigate('/advertising')
      return
    }

    // Poll for status updates every 30 seconds for pending/confirming payments
    if (paymentStatus === 'PENDING' || paymentStatus === 'CONFIRMING') {
      const interval = setInterval(checkStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [initialState, navigate, paymentStatus, checkStatus])

  const copyToClipboard = async (text: string, type: 'address' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!initialState || !payment || !order) {
    return null
  }

  const statusConfig = STATUS_CONFIG[paymentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
  const StatusIcon = statusConfig.icon

  return (
    <div className="py-6 sm:py-8 px-4 max-w-lg mx-auto">
      <SEO title="Payment" noindex={true} />
      {/* Back Button */}
      <button
        onClick={() => navigate('/advertising')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors text-sm"
      >
        <FiArrowLeft />
        Back to advertising
      </button>

      {/* Payment Status Card */}
      <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-xl p-4 sm:p-6 mb-4 sm:mb-6`}>
        <div className="flex items-start sm:items-center gap-3 mb-3">
          <StatusIcon className={`${statusConfig.color} ${paymentStatus === 'CONFIRMING' ? 'animate-spin' : ''} flex-shrink-0`} size={24} />
          <div className="flex-1">
            <h2 className={`text-base sm:text-lg font-semibold ${statusConfig.color}`}>{statusConfig.label}</h2>
            <p className="text-xs sm:text-sm text-gray-400">{statusConfig.description}</p>
          </div>
        </div>
        
        {/* Countdown Timer - only for PENDING status */}
        {paymentStatus === 'PENDING' && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiClock className={getTimerColor()} size={18} />
                <span className="text-sm text-gray-400">Time remaining:</span>
              </div>
              <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
                {formatTime(remainingSeconds)}
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  remainingSeconds <= 60 ? 'bg-red-500' : 
                  remainingSeconds <= 300 ? 'bg-yellow-500' : 'bg-lz-accent'
                }`}
                style={{ width: `${(remainingSeconds / PAYMENT_TIMEOUT_SECONDS) * 100}%` }}
              />
            </div>
            {/* Warning when time is low */}
            {remainingSeconds <= 300 && remainingSeconds > 0 && (
              <div className="mt-3 flex items-center gap-2 text-yellow-400">
                <FiAlertTriangle size={14} />
                <span className="text-xs">
                  {remainingSeconds <= 60 
                    ? 'Payment will expire in less than 1 minute!' 
                    : 'Payment will expire soon!'}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Progress indicator for confirming */}
        {paymentStatus === 'CONFIRMING' && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Amount received:</span>
              <span className="text-white font-medium">
                {actuallyPaid} {payment.currency}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Details - only show if not completed/failed */}
      {(paymentStatus === 'PENDING' || paymentStatus === 'CONFIRMING') && (
        <>
          {/* QR Code */}
          <div className="bg-lz-card border border-lz-border rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg">
                <QRCode 
                  value={payment.address} 
                  size={160}
                  level="H"
                  className="w-40 h-40 sm:w-[180px] sm:h-[180px]"
                />
              </div>
            </div>
            
            {/* Amount */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Send exactly:</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-lz-darker rounded-lg px-3 sm:px-4 py-3 font-mono text-base sm:text-lg text-white overflow-x-auto">
                  {payment.amount} {payment.currency}
                </div>
                <button
                  onClick={() => copyToClipboard(payment.amount.toString(), 'amount')}
                  className="p-3 bg-lz-darker hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied === 'amount' ? <FiCheck className="text-green-400" /> : <FiCopy />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ≈ ${payment.usdAmount.toFixed(2)} USD
              </p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">To this address:</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-lz-darker rounded-lg px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm text-white break-all">
                  {payment.address}
                </div>
                <button
                  onClick={() => copyToClipboard(payment.address, 'address')}
                  className="p-3 bg-lz-darker hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied === 'address' ? <FiCheck className="text-green-400" /> : <FiCopy />}
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-lz-card border border-lz-border rounded-xl p-4 mb-4 sm:mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="text-white">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ad Type:</span>
                <span className="text-white">{order.adType === 'BANNER' ? 'Banner' : 'Text'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{order.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Title:</span>
                <span className="text-white truncate ml-2 max-w-[150px]">{order.adTitle}</span>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={checkStatus}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-lz-border rounded-lg text-gray-300 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
            {isRefreshing ? 'Checking...' : 'Check Payment Status'}
          </button>


          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-yellow-400">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-400/80">
                  <li>Send exactly the amount shown above</li>
                  <li>Payment must be sent in a single transaction</li>
                  <li>You have 1 hour to complete this payment</li>
                  <li>This page will update automatically once payment is detected</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success State */}
      {paymentStatus === 'COMPLETED' && (
        <div className="bg-lz-card border border-lz-border rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="text-green-400" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Thank you!</h3>
          <p className="text-gray-400 mb-6">
            Your payment has been confirmed. Your ad will be reviewed and activated within 3 hours.
          </p>
          <div className="bg-lz-darker rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Order ID:</span>
              <span className="text-white">#{order.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount Paid:</span>
              <span className="text-green-400 font-medium">
                {actuallyPaid || payment.amount} {payment.currency}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-lz-accent text-white font-semibold rounded-lg hover:bg-lz-accent/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Failed/Expired State */}
      {(paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') && (
        <div className="bg-lz-card border border-lz-border rounded-xl p-6 text-center">
          <div className={`w-16 h-16 ${statusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={statusConfig.color} size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {paymentStatus === 'EXPIRED' ? 'Payment Expired' : 'Payment Failed'}
          </h3>
          <p className="text-gray-400 mb-6">
            {paymentStatus === 'EXPIRED' 
              ? 'This payment has expired. Please create a new order.'
              : 'Something went wrong with your payment. Please contact support.'}
          </p>
          <button
            onClick={() => navigate('/advertising')}
            className="w-full px-6 py-3 bg-lz-accent text-white font-semibold rounded-lg hover:bg-lz-accent/90 transition-colors"
          >
            Create New Order
          </button>
        </div>
      )}

      {/* ── Have a Question? ── */}
      <div className="mt-6 flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lz-accent/10 border border-lz-accent/15 flex items-center justify-center flex-shrink-0">
            <FiAlertCircle size={14} className="text-lz-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Have a question?</p>
            <p className="text-[10px] text-gray-500">We're here to help with your payment.</p>
          </div>
        </div>
        <Link
          to="/contact"
          className="flex items-center gap-1.5 px-4 py-2 bg-lz-accent/10 hover:bg-lz-accent/15 border border-lz-accent/20 text-lz-accent text-xs font-bold rounded-lg transition-all whitespace-nowrap"
        >
          Contact Us
        </Link>
      </div>
    </div>
  )
}
