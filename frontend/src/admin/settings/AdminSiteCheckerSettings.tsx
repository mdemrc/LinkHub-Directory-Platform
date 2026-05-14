import { useState, useEffect } from 'react'
import { FiRefreshCw, FiPlay, FiClock, FiZap, FiCheck, FiX } from 'react-icons/fi'
import api from '../../lib/api'

interface SiteCheckerStatus {
  interval: number
  timeout: number
  lastCheck: string | null
  stats: {
    online: number
    offline: number
    unknown: number
  }
}

export default function AdminSiteCheckerSettings() {
  const [status, setStatus] = useState<SiteCheckerStatus | null>(null)
  const [interval, setInterval] = useState(30)
  const [timeout, setTimeout] = useState(10000)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/settings/site-checker/status')
      setStatus(res.data)
      setInterval(res.data.interval)
      setTimeout(res.data.timeout)
    } catch (error) {
      console.error('Failed to fetch site checker status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      await api.post('/settings/site-checker/settings', { interval, timeout })
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      fetchStatus()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunCheck = async () => {
    setIsRunning(true)
    setMessage(null)
    try {
      await api.post('/settings/site-checker/run')
      setMessage({ type: 'success', text: 'Site check started! This may take a few minutes.' })
      // Refresh status after a delay
      window.setTimeout(() => {
        fetchStatus()
      }, 5000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to start site check' })
    } finally {
      setIsRunning(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Site Checker Settings</h1>
        <button
          onClick={handleRunCheck}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-lz-accent text-white rounded hover:bg-lz-accent/80 disabled:opacity-50"
        >
          {isRunning ? (
            <FiRefreshCw className="animate-spin" size={16} />
          ) : (
            <FiPlay size={16} />
          )}
          Run Check Now
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <FiCheck size={18} /> : <FiX size={18} />}
          {message.text}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-lz-text-muted mb-2">
            <FiCheck size={16} className="text-green-500" />
            <span className="text-sm">Online</span>
          </div>
          <div className="text-2xl font-bold text-green-500">
            {status?.stats.online || 0}
          </div>
        </div>
        
        <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-lz-text-muted mb-2">
            <FiX size={16} className="text-red-500" />
            <span className="text-sm">Offline</span>
          </div>
          <div className="text-2xl font-bold text-red-500">
            {status?.stats.offline || 0}
          </div>
        </div>
        
        <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-lz-text-muted mb-2">
            <FiClock size={16} className="text-yellow-500" />
            <span className="text-sm">Unknown</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">
            {status?.stats.unknown || 0}
          </div>
        </div>
        
        <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-lz-text-muted mb-2">
            <FiRefreshCw size={16} />
            <span className="text-sm">Last Check</span>
          </div>
          <div className="text-sm font-medium text-white">
            {formatDate(status?.lastCheck || null)}
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-lz-bg-light border border-lz-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Check Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-lz-text-muted mb-2">
              <FiClock className="inline mr-2" />
              Check Interval (minutes)
            </label>
            <input
              type="number"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 30)}
              min={1}
              max={1440}
              className="w-full max-w-xs px-3 py-2 bg-lz-bg border border-lz-border rounded text-white focus:outline-none focus:border-lz-accent"
            />
            <p className="text-xs text-lz-text-muted mt-1">
              How often to check all sites (1-1440 minutes, default: 30)
            </p>
          </div>

          <div>
            <label className="block text-sm text-lz-text-muted mb-2">
              <FiZap className="inline mr-2" />
              Timeout (milliseconds)
            </label>
            <input
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value) || 10000)}
              min={1000}
              max={60000}
              step={1000}
              className="w-full max-w-xs px-3 py-2 bg-lz-bg border border-lz-border rounded text-white focus:outline-none focus:border-lz-accent"
            />
            <p className="text-xs text-lz-text-muted mt-1">
              Maximum time to wait for each site response (1000-60000 ms, default: 10000)
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-lz-accent text-white rounded hover:bg-lz-accent/80 disabled:opacity-50"
          >
            {isSaving ? (
              <FiRefreshCw className="animate-spin" size={16} />
            ) : (
              <FiCheck size={16} />
            )}
            Save Settings
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-lz-bg-light border border-lz-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">How it works</h3>
        <ul className="text-xs text-lz-text-muted space-y-1">
          <li>• The site checker runs automatically at the configured interval</li>
          <li>• Each site is checked using HTTP HEAD/GET requests</li>
          <li>• Sites returning HTTP 2xx-3xx are marked as <span className="text-green-500">ONLINE</span></li>
          <li>• Sites that timeout or return errors are marked as <span className="text-red-500">OFFLINE</span></li>
          <li>• Sites that haven't been checked yet are marked as <span className="text-yellow-500">UNKNOWN</span></li>
          <li>• You can manually trigger a check anytime using the "Run Check Now" button</li>
        </ul>
      </div>
    </div>
  )
}
