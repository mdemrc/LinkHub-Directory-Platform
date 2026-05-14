import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../lib/api'
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheck,
  FiCalendar,
  FiShield,
} from 'react-icons/fi'
import SEO from '../components/SEO'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    navigate('/login')
    return null
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <SEO
        title="Profile"
        description="Manage your LinkHub account and preferences."
        noindex={true}
      />
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-lz-accent rounded-full flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <p className="text-sm text-lz-muted">{user.email}</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-lz-card border border-lz-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiUser size={20} />
          Account Information
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-lz-darker rounded-lg">
            <div className="flex items-center gap-3">
              <FiUser className="text-lz-muted" size={18} />
              <span className="text-sm text-lz-muted">Username</span>
            </div>
            <span className="text-sm text-white font-medium">{user.username}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-lz-darker rounded-lg">
            <div className="flex items-center gap-3">
              <FiMail className="text-lz-muted" size={18} />
              <span className="text-sm text-lz-muted">Email</span>
            </div>
            <span className="text-sm text-white font-medium">{user.email}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-lz-darker rounded-lg">
            <div className="flex items-center gap-3">
              <FiShield className="text-lz-muted" size={18} />
              <span className="text-sm text-lz-muted">Role</span>
            </div>
            <span className={`px-2 py-1 text-xs rounded font-medium ${
              user.role === 'ADMIN' 
                ? 'bg-red-500/20 text-red-400' 
                : user.role === 'MODERATOR'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-lz-accent/20 text-lz-accent'
            }`}>
              {user.role}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-lz-darker rounded-lg">
            <div className="flex items-center gap-3">
              <FiCalendar className="text-lz-muted" size={18} />
              <span className="text-sm text-lz-muted">Member Since</span>
            </div>
            <span className="text-sm text-white font-medium">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-lz-card border border-lz-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiLock size={20} />
          Change Password
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
            <FiAlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-lz-success/10 border border-lz-success/50 rounded-lg flex items-center gap-3 text-lz-success">
            <FiCheck size={20} />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-lz-muted mb-2">
              Current Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted" size={16} />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lz-muted hover:text-white transition-colors"
              >
                {showPasswords ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-lz-muted mb-2">
              New Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted" size={16} />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-lz-muted mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted" size={16} />
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-lz-darker border border-lz-border rounded-lg text-sm text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-lz-accent hover:bg-lz-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors"
      >
        Log Out
      </button>
    </div>
  )
}
