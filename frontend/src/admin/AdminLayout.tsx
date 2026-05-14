import { useEffect, useState, useCallback } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { statsApi } from '../lib/api'
import {
  FiHome,
  FiFolder,
  FiLink,
  FiImage,
  FiFileText,
  FiInbox,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiArrowLeft,
  FiActivity,
  FiList,
  FiHelpCircle,
  FiMessageSquare,
  FiShoppingBag,
  FiDollarSign,
  FiCreditCard,
  FiSend,
  FiMenu,
  FiX,
  FiBell,
  FiPhone,
  FiShield,
  FiAlertTriangle,
} from 'react-icons/fi'

const menuGroups = [
  {
    title: 'Overview',
    items: [
      { path: '/toptip', label: 'Dashboard', icon: FiHome },
    ],
  },
  {
    title: 'Content',
    items: [
      { path: '/toptip/categories', label: 'Categories', icon: FiFolder, countKey: 'categories' },
      { path: '/toptip/categories/order', label: 'Category Order', icon: FiList },
      { path: '/toptip/links', label: 'Links', icon: FiLink, countKey: 'links' },
      { path: '/toptip/links/order', label: 'Link Order', icon: FiList },
      { path: '/toptip/announcements', label: 'Announcements', icon: FiBell, countKey: 'announcements' },
      { path: '/toptip/faq', label: 'FAQ', icon: FiHelpCircle, countKey: 'faq' },
      { path: '/toptip/contact', label: 'Contact & Donations', icon: FiPhone },
      { path: '/toptip/legal', label: 'Legal (Terms & Privacy)', icon: FiShield },
      { path: '/toptip/scam', label: 'Scam Database', icon: FiAlertTriangle },
    ],
  },
  {
    title: 'Monetization',
    items: [
      { path: '/toptip/ads', label: 'Advertisements', icon: FiImage, countKey: 'ads' },
      { path: '/toptip/ads/order', label: 'Ad Order', icon: FiList, countKey: 'adOrders' },
      { path: '/toptip/ads/pricing', label: 'Ad Pricing', icon: FiDollarSign, countKey: 'adPricing' },
      { path: '/toptip/orders', label: 'Orders', icon: FiShoppingBag, countKey: 'orders' },
      { path: '/toptip/payments', label: 'Payments', icon: FiCreditCard, countKey: 'payments' },
    ],
  },
  {
    title: 'Management',
    items: [
      { path: '/toptip/submissions', label: 'Submissions', icon: FiInbox, countKey: 'submissions', highlight: true },
      { path: '/toptip/messages', label: 'Reports & Messages', icon: FiMessageSquare, countKey: 'messages', highlight: true },
      { path: '/toptip/users', label: 'Users', icon: FiUsers, countKey: 'users' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/toptip/changelog', label: 'Changelog', icon: FiFileText },
      { path: '/toptip/telegram', label: 'Telegram', icon: FiSend },
      { path: '/toptip/settings', label: 'Settings', icon: FiSettings },
      { path: '/toptip/settings/site-checker', label: 'Site Checker', icon: FiActivity },
    ],
  },
] as const

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCounts, setSidebarCounts] = useState<Record<string, number>>({})

  const fetchSidebarCounts = useCallback(async () => {
    try {
      const res = await statsApi.getAdminSidebar()
      setSidebarCounts(res.data)
    } catch {
      // Silently fail
    }
  }, [])

  // Fetch sidebar counts on mount and when route changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchSidebarCounts()
    }
  }, [isAuthenticated, user, location.pathname, fetchSidebarCounts])

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      navigate('/toptip/login')
    }
  }, [isAuthenticated, isLoading, user, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lz-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#161921] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link to="/toptip" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-lz-accent to-cyan-400 rounded-lg flex items-center justify-center">
            <FiLink size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-white">LinkHub</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 lg:self-start inset-y-0 left-0 z-50
        w-64 lg:h-screen bg-[#161921] border-r border-white/5 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:transform-none lg:shrink-0
      `}>
        {/* Logo - Desktop only */}
        <div className="hidden lg:block px-5 py-6 border-b border-white/5">
          <Link to="/toptip" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-lz-accent to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-lz-accent/20">
              <FiLink size={20} className="text-white" />
            </div>
            <div>
              <span className="text-base font-semibold text-white block">LinkHub</span>
              <span className="text-[10px] text-lz-muted uppercase tracking-wider">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Mobile: Add padding for fixed header */}
        <div className="lg:hidden h-14" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <h3 className="px-3 mb-2 text-[10px] font-semibold text-lz-muted/60 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  const countKey = 'countKey' in item ? item.countKey as string : undefined
                  const count = countKey ? sidebarCounts[countKey] : undefined
                  const isHighlight = 'highlight' in item && item.highlight && count && count > 0
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-lz-accent/10 text-lz-accent'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-lz-accent' : ''} />
                      <span className="font-medium">{item.label}</span>
                      {count !== undefined && count > 0 && (
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                          isHighlight
                            ? 'bg-red-500/20 text-red-400'
                            : isActive
                              ? 'bg-lz-accent/20 text-lz-accent'
                              : 'bg-white/5 text-lz-muted'
                        }`}>
                          {count}
                        </span>
                      )}
                      {isActive && !count && (
                        <div className="ml-auto w-1.5 h-1.5 bg-lz-accent rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-lz-accent to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
              <p className="text-xs text-lz-accent">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white rounded-lg transition-all duration-200"
            >
              <FiArrowLeft size={14} />
              <span className="hidden sm:inline">Site</span>
            </Link>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 rounded-lg transition-all duration-200"
            >
              <FiLogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-[#0f1117] min-h-screen min-w-0">
        {/* Add padding for mobile header */}
        <div className="lg:hidden h-14" />
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
