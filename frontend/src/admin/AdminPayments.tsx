import { useState, useEffect } from 'react'
import { adPricingApi } from '../lib/api'
import { FiCheck, FiClock, FiX, FiRefreshCw, FiExternalLink, FiMail } from 'react-icons/fi'
import AdminPageHeader from './components/AdminPageHeader'

interface AdOrder {
  id: number
  adType: string
  adTitle: string
  adLink: string
  adBannerUrl?: string
  duration: string
  price: number
  contactInfo: string
  paymentMethod: string
  nowpaymentId?: string
  payAddress?: string
  payCurrency?: string
  payAmount?: number
  actuallyPaid?: number
  paymentStatus: string
  status: string
  adminNotes?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  EXPIRED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const orderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  ACTIVE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  EXPIRED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const statusIcons: Record<string, JSX.Element> = {
  PENDING: <FiClock className="w-4 h-4" />,
  CONFIRMING: <FiRefreshCw className="w-4 h-4 animate-spin" />,
  COMPLETED: <FiCheck className="w-4 h-4" />,
  EXPIRED: <FiX className="w-4 h-4" />,
  FAILED: <FiX className="w-4 h-4" />,
}

export default function AdminPayments() {
  const [orders, setOrders] = useState<AdOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<AdOrder | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await adPricingApi.getOrders()
      setOrders(res.data || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshOrders = async () => {
    setIsRefreshing(true)
    await fetchOrders()
    setIsRefreshing(false)
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'paid') return order.paymentStatus === 'COMPLETED'
    if (filter === 'pending') return order.paymentStatus === 'PENDING'
    if (filter === 'confirming') return order.paymentStatus === 'CONFIRMING'
    if (filter === 'expired') return order.paymentStatus === 'EXPIRED'
    return true
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.paymentStatus === 'PENDING').length,
    confirming: orders.filter(o => o.paymentStatus === 'CONFIRMING').length,
    completed: orders.filter(o => o.paymentStatus === 'COMPLETED').length,
    expired: orders.filter(o => o.paymentStatus === 'EXPIRED').length,
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'COMPLETED')
      .reduce((sum, o) => sum + o.price, 0),
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payments"
        description="Monitor all ad order payments"
      >
        <button
          onClick={refreshOrders}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-lz-card border border-lz-border rounded-lg hover:bg-lz-darker transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
      </AdminPageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-lz-card border border-lz-border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-400">Total Orders</div>
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-lz-card border border-lz-border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-yellow-400">Pending</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-lz-card border border-lz-border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-blue-400">Confirming</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-400">{stats.confirming}</div>
        </div>
        <div className="bg-lz-card border border-lz-border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-green-400">Completed</div>
          <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.completed}</div>
        </div>
        <div className="bg-lz-card border border-lz-border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-400">Expired</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-400">{stats.expired}</div>
        </div>
        <div className="bg-lz-card border border-lz-border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-green-400">Revenue</div>
          <div className="text-xl sm:text-2xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'confirming', label: 'Confirming' },
          { value: 'paid', label: 'Paid' },
          { value: 'expired', label: 'Expired' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg transition-colors ${
              filter === f.value
                ? 'bg-accent text-white'
                : 'bg-lz-card border border-lz-border text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mobile Cards / Desktop Table */}
      <div className="lg:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-lz-card border border-lz-border rounded-lg p-8 text-center text-gray-400">
            No orders found
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-lz-card border border-lz-border rounded-lg p-4 cursor-pointer hover:bg-lz-carder transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-white font-medium">{order.adTitle}</div>
                  <div className="text-xs text-gray-400">#{order.id} • {order.adType} • {order.duration}</div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.paymentStatus] || 'bg-gray-500/20 text-gray-400'}`}>
                  {statusIcons[order.paymentStatus]}
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-white">${order.price.toFixed(2)}</div>
                <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-lz-card border border-lz-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-lz-carder border-b border-lz-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">ID</th>
                <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Order</th>
                <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Contact</th>
                <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Payment</th>
                <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-sm text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="border-b border-lz-border hover:bg-lz-carder cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-mono">#{order.id}</td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{order.adTitle}</div>
                      <div className="text-sm text-gray-400">{order.adType} • {order.duration}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <FiMail className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{order.contactInfo}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">${order.price.toFixed(2)}</div>
                      {order.payCurrency && (
                        <div className="text-sm text-gray-400 uppercase">{order.payCurrency}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.paymentStatus] || 'bg-gray-500/20 text-gray-400'}`}>
                        {statusIcons[order.paymentStatus]}
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${orderStatusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-lz-card border border-lz-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-lz-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Order #{selectedOrder.id}</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Order Details */}
              <div className="bg-lz-darker rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-gray-500">Type</div>
                    <div className="text-sm text-white font-medium">{selectedOrder.adType}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Duration</div>
                    <div className="text-sm text-white font-medium">{selectedOrder.duration.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Title</div>
                    <div className="text-sm text-white font-medium">{selectedOrder.adTitle}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Link</div>
                    <a href={selectedOrder.adLink} target="_blank" rel="noopener noreferrer" className="text-sm text-lz-accent hover:underline flex items-center gap-1 truncate">
                      {selectedOrder.adLink.length > 25 ? selectedOrder.adLink.substring(0, 25) + '...' : selectedOrder.adLink}
                      <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>
                {selectedOrder.adBannerUrl && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-[11px] text-gray-500 mb-1.5">Banner Preview</div>
                    <img src={selectedOrder.adBannerUrl} alt="Banner" className="h-12 rounded border border-lz-border object-contain" />
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div className="bg-lz-darker rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-white">${selectedOrder.price.toFixed(2)}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[selectedOrder.paymentStatus] || statusColors.PENDING}`}>
                    {statusIcons[selectedOrder.paymentStatus]}
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                {(selectedOrder.payCurrency || selectedOrder.actuallyPaid) && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                    {selectedOrder.payCurrency && (
                      <>
                        <div>
                          <div className="text-[11px] text-gray-500">Currency</div>
                          <div className="text-sm text-white uppercase">{selectedOrder.payCurrency}</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-gray-500">Pay Amount</div>
                          <div className="text-sm text-white">{selectedOrder.payAmount}</div>
                        </div>
                      </>
                    )}
                    {selectedOrder.actuallyPaid !== undefined && selectedOrder.actuallyPaid > 0 && (
                      <div>
                        <div className="text-[11px] text-gray-500">Actually Paid</div>
                        <div className="text-sm text-green-400 font-medium">{selectedOrder.actuallyPaid}</div>
                      </div>
                    )}
                  </div>
                )}
                {selectedOrder.payAddress && (
                  <div className="pt-3 mt-3 border-t border-white/5">
                    <div className="text-[11px] text-gray-500">Pay Address</div>
                    <div className="text-xs text-white font-mono break-all mt-0.5 bg-black/20 rounded px-2 py-1.5">{selectedOrder.payAddress}</div>
                  </div>
                )}
                {selectedOrder.nowpaymentId && (
                  <div className="pt-3 mt-3 border-t border-white/5">
                    <div className="text-[11px] text-gray-500">NowPayments ID</div>
                    <div className="text-xs text-white font-mono mt-0.5">{selectedOrder.nowpaymentId}</div>
                  </div>
                )}
              </div>

              {/* Contact & Dates */}
              <div className="bg-lz-darker rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-gray-500">Contact</div>
                    <div className="text-sm text-white flex items-center gap-1.5 mt-0.5">
                      <FiMail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      {selectedOrder.contactInfo}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Status</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border mt-0.5 ${orderStatusColors[selectedOrder.status] || orderStatusColors.PENDING}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Created</div>
                    <div className="text-sm text-white mt-0.5">{formatDate(selectedOrder.createdAt)}</div>
                  </div>
                  {selectedOrder.paidAt && (
                    <div>
                      <div className="text-[11px] text-gray-500">Paid</div>
                      <div className="text-sm text-green-400 mt-0.5">{formatDate(selectedOrder.paidAt)}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-lz-border">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-lz-border rounded-lg text-sm text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
