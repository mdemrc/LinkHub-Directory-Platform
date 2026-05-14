import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiLock, FiUser, FiAlertCircle, FiLink } from 'react-icons/fi'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/toptip')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-lz-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-lz-accent rounded-lg mb-4 shadow-lg shadow-lz-accent/20">
            <FiLink size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-lz-muted mt-2">Sign in to access admin panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-lz-card border border-lz-border rounded-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <FiAlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-lz-muted mb-2">
              Username or Email
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted" size={18} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-lz-muted mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-lz-darker border border-lz-border rounded-lg text-white placeholder-lz-muted focus:outline-none focus:border-lz-accent"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-lz-accent hover:bg-lz-accent/80 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        <p className="text-center text-lz-muted text-sm mt-4">
          <a href="/" className="text-lz-accent hover:underline">
            ← Back to site
          </a>
        </p>
      </div>
    </div>
  )
}
