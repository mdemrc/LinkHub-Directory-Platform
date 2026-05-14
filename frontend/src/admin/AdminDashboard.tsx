import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { statsApi, submissionsApi } from '../lib/api'
import { LinkSubmission } from '../types'
import {
  FiLink,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiInbox,
  FiTrendingUp,
  FiArrowRight,
  FiClock,
  FiGrid,
  FiFileText,
  FiDollarSign,
  FiShoppingBag,
  FiMessageSquare,
} from 'react-icons/fi'

interface AdminStats {
  totalLinks: number
  onlineLinks: number
  offlineLinks: number
  totalUsers: number
  pendingSubmissions: number
  totalClicks: number
  orders: {
    total: number
    pending: number
    completed: number
  }
  revenue: {
    total: number
    today: number
  }
  ads: {
    total: number
    active: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingSubmissions, setPendingSubmissions] = useState<LinkSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, submissionsRes] = await Promise.all([
          statsApi.getAdmin(),
          submissionsApi.getAll(), // Use getAll with implicitly PENDING or just all
        ])
        setStats(statsRes.data)
        const submissions = Array.isArray(submissionsRes.data) 
          ? submissionsRes.data 
          : (submissionsRes.data.submissions || [])
        setPendingSubmissions(submissions.filter((s: any) => s.status === 'PENDING').slice(0, 5))
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Links',
      value: stats?.totalLinks || 0,
      icon: FiLink,
      gradient: 'from-lz-accent/20 to-cyan-500/10',
      iconColor: 'text-lz-accent',
    },
    {
      label: 'Online Links',
      value: stats?.onlineLinks || 0,
      icon: FiCheckCircle,
      gradient: 'from-emerald-500/20 to-green-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Offline Links',
      value: stats?.offlineLinks || 0,
      icon: FiXCircle,
      gradient: 'from-red-500/20 to-rose-500/10',
      iconColor: 'text-red-400',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      gradient: 'from-purple-500/20 to-violet-500/10',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Pending Submissions',
      value: stats?.pendingSubmissions || 0,
      icon: FiInbox,
      gradient: 'from-amber-500/20 to-yellow-500/10',
      iconColor: 'text-amber-400',
    },
    {
      label: 'New Reports',
      value: (stats as any)?.pendingMessages || 0,
      icon: FiMessageSquare,
      gradient: 'from-blue-500/20 to-indigo-500/10',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Total Clicks',
      value: stats?.totalClicks || 0,
      icon: FiTrendingUp,
      gradient: 'from-blue-500/20 to-sky-500/10',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Total Orders',
      value: stats?.orders?.total || 0,
      icon: FiShoppingBag,
      gradient: 'from-pink-500/20 to-rose-500/10',
      iconColor: 'text-pink-400',
    },
    {
      label: 'Total Revenue',
      value: `$${(stats?.revenue?.total || 0).toFixed(2)}`,
      icon: FiDollarSign,
      gradient: 'from-green-500/20 to-emerald-500/10',
      iconColor: 'text-green-400',
      isText: true,
    },
  ]

  const quickActions = [
    {
      label: 'Manage Links',
      to: '/toptip/links',
      icon: FiLink,
      color: 'text-lz-accent',
    },
    {
      label: 'Categories',
      to: '/toptip/categories',
      icon: FiGrid,
      color: 'text-purple-400',
    },
    {
      label: 'Submissions',
      to: '/toptip/submissions',
      icon: FiInbox,
      color: 'text-amber-400',
    },
    {
      label: 'Users',
      to: '/toptip/users',
      icon: FiUsers,
      color: 'text-blue-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-lz-muted mt-1">Welcome to LinkHub Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border border-white/5 rounded-xl p-5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className={stat.iconColor} size={20} />
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/[0.02] rounded-full" />
            </div>
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Submissions */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-medium text-white flex items-center gap-2.5">
              <FiInbox className="text-amber-400" size={18} />
              Pending Submissions
            </h2>
            <Link
              to="/toptip/submissions"
              className="text-sm text-lz-accent hover:text-lz-accent/80 flex items-center gap-1.5 transition-colors"
            >
              View All <FiArrowRight size={14} />
            </Link>
          </div>

          {pendingSubmissions.length > 0 ? (
            <div className="space-y-2.5">
              {pendingSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{submission.url}</p>
                    <p className="text-xs text-lz-muted flex items-center gap-1.5 mt-1">
                      <FiClock size={11} />
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FiFileText className="mx-auto text-lz-muted/30 mb-3" size={32} />
              <p className="text-lz-muted text-sm">No pending submissions</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
          <h2 className="text-base font-medium text-white mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={index}
                  to={action.to}
                  className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Icon className={action.color} size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
