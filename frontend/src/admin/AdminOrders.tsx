import { useState, useEffect } from 'react'
import { 
  FiShoppingBag, 
  FiCheck, 
  FiX, 
  FiRefreshCw,
  FiExternalLink,
  FiDollarSign,
  FiClock,
  FiMail,
  FiPackage,
  FiImage,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle
} from 'react-icons/fi'
import api from '../lib/api'
import AdminPageHeader from './components/AdminPageHeader'
import AdminButton from './components/AdminButton'
import AdminModal from './components/AdminModal'

interface Payment {
  id: number
  nowpaymentId: string | null
  invoiceUrl: string | null
  payAddress: string | null
  payCurrency: string | null
  payAmount: number | null
  actuallyPaid: number | null
  priceAmount: number
  priceCurrency: string
  status: string
  paidAt: string | null
  createdAt: string
}

interface AdOrder {
  id: number
  _source?: string
  orderNumber: string
  customerEmail: string
  customerName: string | null
  packageId: number
  packageName: string
  duration: string
  durationLabel: string
  priceAmount: number
  priceCurrency: string
  adType: 'BANNER' | 'TEXT' | 'HTML'
  adTitle: string | null
  adUrl: string | null
  adImageUrl: string | null
  adDescription: string | null
  status: string
  createdAdId: number | null
  adminNotes: string | null
  customerNotes: string | null
  payment: Payment | null
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_PAYMENT: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending Payment' },
  PAYMENT_RECEIVED: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Payment Received' },
  APPROVED: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Approved' },
  REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
  EXPIRED: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Expired' },
  REFUNDED: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Refunded' }
}

const paymentStatusColors: Record<string, { bg: string; text: string }> = {
  WAITING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  CONFIRMING: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  CONFIRMED: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  SENDING: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  PARTIALLY_PAID: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  FINISHED: { bg: 'bg-green-500/20', text: 'text-green-400' },
  FAILED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  REFUNDED: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  EXPIRED: { bg: 'bg-gray-500/20', text: 'text-gray-400' }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdOrder[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<AdOrder | null>(null)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Approve modal state
  const [approvePosition, setApprovePosition] = useState('HEADER_TOP')
  const [approveNotes, setApproveNotes] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  
  // Reject modal state
  const [rejectReason, setRejectReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const res = await api.get(`/payments/admin/orders${params}`)
      setOrders(res.data.orders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/payments/admin/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleApprove = async () => {
    if (!selectedOrder) return
    
    setIsApproving(true)
    setMessage(null)
    try {
      await api.post(`/payments/admin/orders/${selectedOrder.id}/approve`, {
        adData: { position: approvePosition },
        adminNotes: approveNotes,
        source: selectedOrder._source
      })
      setMessage({ type: 'success', text: `Order ${selectedOrder.orderNumber} approved successfully!` })
      setShowApproveModal(false)
      setSelectedOrder(null)
      setApprovePosition('HEADER_TOP')
      setApproveNotes('')
      fetchOrders()
      fetchStats()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to approve order' })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedOrder) return
    
    setIsRejecting(true)
    setMessage(null)
    try {
      await api.post(`/payments/admin/orders/${selectedOrder.id}/reject`, {
        reason: rejectReason,
        source: selectedOrder._source
      })
      setMessage({ type: 'success', text: `Order ${selectedOrder.orderNumber} rejected.` })
      setShowRejectModal(false)
      setSelectedOrder(null)
      setRejectReason('')
      fetchOrders()
      fetchStats()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to reject order' })
    } finally {
      setIsRejecting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' }
    return `${symbols[currency] || currency} ${Number(amount).toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FiRefreshCw className="w-6 h-6 text-lz-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Ad Orders"
        description="Manage advertising orders and payments"
      />

      {message && (
        <div className={`p-4 rounded flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <FiCheck size={18} /> : <FiX size={18} />}
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-lz-text-muted mb-2">
              <FiShoppingBag size={16} />
              <span className="text-sm">Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
          </div>
          
          <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-lz-text-muted mb-2">
              <FiClock size={16} className="text-yellow-500" />
              <span className="text-sm">Pending</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingOrders}</div>
          </div>
          
          <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-lz-text-muted mb-2">
              <FiCheck size={16} className="text-green-500" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.completedOrders}</div>
          </div>
          
          <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
            <div className="flex items-center gap-2 text-lz-text-muted mb-2">
              <FiDollarSign size={16} className="text-emerald-500" />
              <span className="text-sm">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              €{Number(stats.totalRevenue).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-lz-bg-light border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent"
        >
          <option value="">All Orders</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PAYMENT_RECEIVED">Payment Received</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
        </select>
        
        <button
          onClick={() => { fetchOrders(); fetchStats() }}
          className="flex items-center gap-2 px-4 py-2 bg-lz-bg-light border border-lz-border text-white rounded hover:border-lz-accent"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-lz-bg-light border border-lz-border rounded-lg p-8 text-center">
            <FiShoppingBag size={48} className="mx-auto text-lz-text-muted mb-4" />
            <p className="text-lz-text-muted">No orders found</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = statusColors[order.status] || statusColors.PENDING_PAYMENT
            const isExpanded = expandedOrder === order.id
            
            return (
              <div
                key={order.id}
                className="bg-lz-bg-light border border-lz-border rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-lz-dark flex items-center justify-center">
                      <FiPackage className="text-lz-accent" size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{order.orderNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-sm text-lz-text-muted">
                        {order.packageName} • {order.durationLabel}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium text-white">
                        {formatPrice(order.priceAmount, order.priceCurrency)}
                      </div>
                      <div className="text-xs text-lz-text-muted">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-lz-border p-4 space-y-4">
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
                          <FiMail size={14} />
                          Customer
                        </h4>
                        <div className="bg-lz-dark rounded p-3">
                          <div className="text-white">{order.customerEmail}</div>
                          {order.customerName && (
                            <div className="text-sm text-lz-text-muted">{order.customerName}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Ad Details */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
                          <FiImage size={14} />
                          Ad Details
                        </h4>
                        <div className="bg-lz-dark rounded p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-lz-text-muted">Type:</span>
                            <span className="text-white">{order.adType}</span>
                          </div>
                          {order.adTitle && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-lz-text-muted">Title:</span>
                              <span className="text-white">{order.adTitle}</span>
                            </div>
                          )}
                          {order.adUrl && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-lz-text-muted">URL:</span>
                              <a
                                href={order.adUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lz-accent hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {order.adUrl.slice(0, 40)}...
                                <FiExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Info */}
                    {order.payment && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-lz-text-muted flex items-center gap-2">
                          <FiDollarSign size={14} />
                          Payment Details
                        </h4>
                        <div className="bg-lz-dark rounded p-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-lz-text-muted">Status</div>
                            <div className={`text-sm ${paymentStatusColors[order.payment.status]?.text || 'text-white'}`}>
                              {order.payment.status}
                            </div>
                          </div>
                          {order.payment.payCurrency && (
                            <div>
                              <div className="text-xs text-lz-text-muted">Currency</div>
                              <div className="text-white text-sm">{order.payment.payCurrency.toUpperCase()}</div>
                            </div>
                          )}
                          {order.payment.payAmount && (
                            <div>
                              <div className="text-xs text-lz-text-muted">Amount</div>
                              <div className="text-white text-sm">{Number(order.payment.payAmount).toFixed(8)}</div>
                            </div>
                          )}
                          {order.payment.invoiceUrl && (
                            <div>
                              <div className="text-xs text-lz-text-muted">Invoice</div>
                              <a
                                href={order.payment.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lz-accent hover:underline text-sm flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View
                                <FiExternalLink size={10} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {(order.customerNotes || order.adminNotes) && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-lz-text-muted">Notes</h4>
                        <div className="bg-lz-dark rounded p-3 space-y-2">
                          {order.customerNotes && (
                            <div>
                              <div className="text-xs text-lz-text-muted">Customer:</div>
                              <div className="text-white text-sm">{order.customerNotes}</div>
                            </div>
                          )}
                          {order.adminNotes && (
                            <div>
                              <div className="text-xs text-lz-text-muted">Admin:</div>
                              <div className="text-white text-sm">{order.adminNotes}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {order.status === 'PAYMENT_RECEIVED' && (
                      <div className="flex items-center gap-3 pt-4 border-t border-lz-border">
                        <AdminButton
                          variant="primary"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowApproveModal(true)
                          }}
                        >
                          <FiCheck size={16} />
                          Approve & Create Ad
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowRejectModal(true)
                          }}
                        >
                          <FiX size={16} />
                          Reject
                        </AdminButton>
                      </div>
                    )}

                    {order.createdAdId && (
                      <div className="flex items-center gap-2 text-green-400 bg-green-500/10 rounded px-3 py-2">
                        <FiCheck size={16} />
                        <span>Ad created (ID: {order.createdAdId})</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Approve Modal */}
      <AdminModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false)
          setSelectedOrder(null)
        }}
        title="Approve Order"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-lz-dark rounded p-4">
            <div className="text-sm text-lz-text-muted mb-1">Order</div>
            <div className="text-white font-medium">{selectedOrder?.orderNumber}</div>
            <div className="text-sm text-lz-text-muted mt-2">
              {selectedOrder?.packageName} • {selectedOrder?.durationLabel}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-lz-text-muted">Ad Position</label>
            <select
              value={approvePosition}
              onChange={(e) => setApprovePosition(e.target.value)}
              className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent"
            >
              <option value="HEADER_TOP">Header Top (Banner Area)</option>
              <option value="HEADER_BOTTOM">Header Bottom</option>
              <option value="SIDEBAR_LEFT">Left Sidebar</option>
              <option value="SIDEBAR_RIGHT">Right Sidebar</option>
              <option value="CONTENT_TOP">Content Top (Text Ads)</option>
              <option value="FOOTER">Footer</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-lz-text-muted">Admin Notes (Optional)</label>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="Internal notes about this order..."
              rows={3}
              className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <AdminButton
              variant="ghost"
              onClick={() => {
                setShowApproveModal(false)
                setSelectedOrder(null)
              }}
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? (
                <FiRefreshCw className="animate-spin" size={16} />
              ) : (
                <FiCheck size={16} />
              )}
              Approve & Create Ad
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      {/* Reject Modal */}
      <AdminModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setSelectedOrder(null)
        }}
        title="Reject Order"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4 flex items-start gap-3">
            <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <div className="text-red-400 font-medium">Warning</div>
              <div className="text-sm text-lz-text-muted">
                This will reject the order. The customer may need to be contacted for a refund.
              </div>
            </div>
          </div>

          <div className="bg-lz-dark rounded p-4">
            <div className="text-sm text-lz-text-muted mb-1">Order</div>
            <div className="text-white font-medium">{selectedOrder?.orderNumber}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-lz-text-muted">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejecting this order..."
              rows={3}
              className="w-full bg-lz-dark border border-lz-border rounded px-4 py-2 text-white focus:outline-none focus:border-lz-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <AdminButton
              variant="ghost"
              onClick={() => {
                setShowRejectModal(false)
                setSelectedOrder(null)
              }}
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <FiRefreshCw className="animate-spin" size={16} />
              ) : (
                <FiX size={16} />
              )}
              Reject Order
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
