import { useState, useEffect } from 'react'
import { telegramApi } from '../lib/api'
import { FiSettings, FiCheck, FiX, FiRefreshCw, FiMessageCircle, FiInfo, FiZap, FiBell, FiFileText } from 'react-icons/fi'
import AdminPageHeader from './components/AdminPageHeader'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminCheckbox, AdminTextarea } from './components/AdminInput'

interface TelegramSettings {
  id: number
  botToken: string
  chatId: string
  enabled: boolean
  notifyPayments: boolean
  notifyOrders: boolean
  notifyLinks: boolean
  paymentReceivedTemplate: string
  paymentConfirmedTemplate: string
  newOrderTemplate: string
  newLinkTemplate: string
  hasBotToken: boolean
  hasChatId: boolean
}

export default function AdminTelegram() {
  const [settings, setSettings] = useState<TelegramSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testingType, setTestingType] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'connection' | 'notifications' | 'templates'>('connection')

  const [form, setForm] = useState({
    botToken: '',
    chatId: '',
    enabled: false,
    notifyPayments: true,
    notifyOrders: true,
    notifyLinks: true,
    paymentReceivedTemplate: '',
    paymentConfirmedTemplate: '',
    newOrderTemplate: '',
    newLinkTemplate: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await telegramApi.getSettings()
      setSettings(res.data)
      setForm({
        botToken: res.data.botToken || '',
        chatId: res.data.chatId || '',
        enabled: res.data.enabled,
        notifyPayments: res.data.notifyPayments,
        notifyOrders: res.data.notifyOrders,
        notifyLinks: res.data.notifyLinks,
        paymentReceivedTemplate: res.data.paymentReceivedTemplate,
        paymentConfirmedTemplate: res.data.paymentConfirmedTemplate,
        newOrderTemplate: res.data.newOrderTemplate,
        newLinkTemplate: res.data.newLinkTemplate
      })
    } catch (error) {
      console.error('Failed to fetch telegram settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await telegramApi.updateSettings(form)
      setSettings(res.data)
      setTestResult({ success: true, message: 'Settings saved successfully!' })
      setTimeout(() => setTestResult(null), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setTestResult({ success: false, message: 'Failed to save settings' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestingType('connection')
    setTestResult(null)
    try {
      const res = await telegramApi.test()
      if (res.data.success) {
        setTestResult({ 
          success: true, 
          message: `✅ Connected to @${res.data.botName} → ${res.data.chatTitle}` 
        })
      } else {
        setTestResult({ success: false, message: res.data.error || 'Test failed' })
      }
    } catch (error: any) {
      setTestResult({ 
        success: false, 
        message: error.response?.data?.error || 'Connection test failed' 
      })
    } finally {
      setIsTesting(false)
      setTestingType(null)
    }
  }

  const handleTestNotification = async (type: 'link' | 'order' | 'payment_received' | 'payment_confirmed') => {
    setTestingType(type)
    setTestResult(null)
    try {
      const res = await telegramApi.testNotification(type)
      if (res.data.success) {
        setTestResult({ success: true, message: `✅ Test ${type.replace('_', ' ')} notification sent!` })
      } else {
        setTestResult({ success: false, message: res.data.error || 'Failed to send test' })
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.response?.data?.error || 'Failed to send test notification' })
    } finally {
      setTestingType(null)
    }
  }

  const tabs = [
    { id: 'connection', label: 'Connection', icon: <FiSettings /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'templates', label: 'Message Templates', icon: <FiFileText /> },
  ]

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
        title="Telegram Notifications"
        description="Configure Telegram bot for instant notifications"
      />

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
          settings?.enabled && settings?.hasBotToken && settings?.hasChatId
            ? 'bg-green-500/20 border-green-500/30 text-green-400'
            : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
        }`}>
          {settings?.enabled && settings?.hasBotToken && settings?.hasChatId ? (
            <>
              <FiCheck className="w-4 h-4" />
              <span>Telegram notifications active</span>
            </>
          ) : (
            <>
              <FiX className="w-4 h-4" />
              <span>Not configured</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-lz-border pb-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-lz-card border-b-2 border-accent text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-500/20 border-green-500/30 text-green-400'
            : 'bg-red-500/20 border-red-500/30 text-red-400'
        }`}>
          {testResult.message}
        </div>
      )}

      {/* Connection Tab */}
      {activeTab === 'connection' && (
        <div className="bg-lz-card border border-lz-border rounded-lg p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <FiInfo className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-2">How to set up:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@BotFather</a> on Telegram</li>
                <li>Copy the bot token and paste it below</li>
                <li>Add the bot to your group/channel as admin</li>
                <li>Get the Chat ID (forward a message from the group to <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@userinfobot</a>)</li>
              </ol>
            </div>
          </div>

          <AdminInput
            label="Bot Token"
            type="password"
            value={form.botToken}
            onChange={(e) => setForm({ ...form, botToken: e.target.value })}
            placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            hint={settings?.hasBotToken ? '✓ Token is configured' : 'Get this from @BotFather'}
          />

          <AdminInput
            label="Chat ID"
            value={form.chatId}
            onChange={(e) => setForm({ ...form, chatId: e.target.value })}
            placeholder="-1001234567890"
            hint="Group/Channel ID (starts with - for groups)"
          />

          <AdminCheckbox
            label="Enable Telegram Notifications"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <AdminButton
              onClick={handleTest}
              loading={isTesting}
              variant="secondary"
              icon={<FiZap />}
              className="w-full sm:w-auto"
            >
              Test Connection
            </AdminButton>
            <AdminButton
              onClick={handleSave}
              loading={isSaving}
              icon={<FiCheck />}
              className="w-full sm:w-auto"
            >
              Save Settings
            </AdminButton>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-lz-card border border-lz-border rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-white">Notification Types</h3>
          <p className="text-sm text-gray-400">Choose which events trigger Telegram notifications</p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-lz-carder rounded-lg border border-lz-border gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FiMessageCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Payment Notifications</div>
                  <div className="text-sm text-gray-400">Get notified when payments are received or confirmed</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTestNotification('payment_received')}
                  disabled={testingType === 'payment_received'}
                  className="text-xs px-3 py-1.5 rounded border border-lz-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  {testingType === 'payment_received' ? 'Sending...' : 'Test Received'}
                </button>
                <button
                  onClick={() => handleTestNotification('payment_confirmed')}
                  disabled={testingType === 'payment_confirmed'}
                  className="text-xs px-3 py-1.5 rounded border border-lz-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  {testingType === 'payment_confirmed' ? 'Sending...' : 'Test Confirmed'}
                </button>
                <AdminCheckbox
                  label=""
                  checked={form.notifyPayments}
                  onChange={(e) => setForm({ ...form, notifyPayments: e.target.checked })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-lz-carder rounded-lg border border-lz-border gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FiMessageCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white">New Order Notifications</div>
                  <div className="text-sm text-gray-400">Get notified when new ad orders are placed</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTestNotification('order')}
                  disabled={testingType === 'order'}
                  className="text-xs px-3 py-1.5 rounded border border-lz-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  {testingType === 'order' ? 'Sending...' : 'Test'}
                </button>
                <AdminCheckbox
                  label=""
                  checked={form.notifyOrders}
                  onChange={(e) => setForm({ ...form, notifyOrders: e.target.checked })}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-lz-carder rounded-lg border border-lz-border gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FiMessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Link Submission Notifications</div>
                  <div className="text-sm text-gray-400">Get notified when users submit new links</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTestNotification('link')}
                  disabled={testingType === 'link'}
                  className="text-xs px-3 py-1.5 rounded border border-lz-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                >
                  {testingType === 'link' ? 'Sending...' : 'Test'}
                </button>
                <AdminCheckbox
                  label=""
                  checked={form.notifyLinks}
                  onChange={(e) => setForm({ ...form, notifyLinks: e.target.checked })}
                />
              </div>
            </div>
          </div>

          <AdminButton
            onClick={handleSave}
            loading={isSaving}
            icon={<FiCheck />}
          >
            Save Settings
          </AdminButton>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="bg-lz-card border border-lz-border rounded-lg p-6 space-y-6">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <FiInfo className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-gray-300">
              <p className="font-medium text-white mb-2">Available placeholders:</p>
              <code className="text-accent">{'{orderId}'}</code>, 
              <code className="text-accent ml-2">{'{amount}'}</code>, 
              <code className="text-accent ml-2">{'{currency}'}</code>, 
              <code className="text-accent ml-2">{'{status}'}</code>, 
              <code className="text-accent ml-2">{'{title}'}</code>, 
              <code className="text-accent ml-2">{'{type}'}</code>, 
              <code className="text-accent ml-2">{'{duration}'}</code>, 
              <code className="text-accent ml-2">{'{price}'}</code>, 
              <code className="text-accent ml-2">{'{contact}'}</code>, 
              <code className="text-accent ml-2">{'{url}'}</code>
              <p className="mt-2">Use <code className="text-accent">*text*</code> for bold, <code className="text-accent">_text_</code> for italic (Markdown)</p>
            </div>
          </div>

          <AdminTextarea
            label="Payment Received Template"
            value={form.paymentReceivedTemplate}
            onChange={(e) => setForm({ ...form, paymentReceivedTemplate: e.target.value })}
            rows={4}
            hint="Sent when a payment is detected (confirming)"
          />

          <AdminTextarea
            label="Payment Confirmed Template"
            value={form.paymentConfirmedTemplate}
            onChange={(e) => setForm({ ...form, paymentConfirmedTemplate: e.target.value })}
            rows={4}
            hint="Sent when payment is fully confirmed"
          />

          <AdminTextarea
            label="New Order Template"
            value={form.newOrderTemplate}
            onChange={(e) => setForm({ ...form, newOrderTemplate: e.target.value })}
            rows={4}
            hint="Sent when a new ad order is placed"
          />

          <AdminTextarea
            label="New Link Submission Template"
            value={form.newLinkTemplate}
            onChange={(e) => setForm({ ...form, newLinkTemplate: e.target.value })}
            rows={4}
            hint="Sent when a user submits a new link"
          />

          <AdminButton
            onClick={handleSave}
            loading={isSaving}
            icon={<FiCheck />}
          >
            Save Templates
          </AdminButton>
        </div>
      )}
    </div>
  )
}
