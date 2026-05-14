import { useState, useEffect } from 'react'
import { messagesApi } from '../lib/api'
import { FiMessageSquare, FiClock, FiTrash2, FiExternalLink, FiLayers, FiLink } from 'react-icons/fi'
import { SiTelegram } from 'react-icons/si'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminTable from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminTextarea, AdminSelect } from './components/AdminInput'

interface ContactMessage {
  id: number
  telegram: string | null
  categoryId: number | null
  linkId: number | null
  message: string
  status: 'PENDING' | 'READ' | 'ARCHIVED'
  adminNote: string | null
  createdAt: string
  category: { id: number; name: string } | null
  link: { id: number; title: string; url: string } | null
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [filterStatus, setFilterStatus] = useState('')

  const [formData, setFormData] = useState({
    status: 'PENDING',
    adminNote: '',
  })

  useEffect(() => {
    fetchMessages()
  }, [filterStatus])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const response = await messagesApi.getAll({ status: filterStatus || undefined })
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMessage) return

    setIsSaving(true)
    try {
      await messagesApi.update(selectedMessage.id, formData)
      fetchMessages()
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to update message:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    try {
      await messagesApi.delete(id)
      fetchMessages()
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const openMessage = (message: ContactMessage) => {
    setSelectedMessage(message)
    setFormData({
      status: message.status,
      adminNote: message.adminNote || '',
    })
    setIsModalOpen(true)
    
    // Mark as READ if it was PENDING
    if (message.status === 'PENDING') {
      messagesApi.update(message.id, { status: 'READ' })
    }
  }

  const columns = [
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (m: ContactMessage) => {
        const colors = {
          PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          READ: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          ARCHIVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        }
        return (
          <span className={`px-2 py-1 text-[10px] font-bold border rounded-full ${colors[m.status]}`}>
            {m.status}
          </span>
        )
      },
    },
    {
      key: 'telegram',
      label: 'Submitter',
      width: '150px',
      render: (m: ContactMessage) => (
        <div className="flex items-center gap-2">
          <SiTelegram className="text-[#0088cc]" size={14} />
          <span className="text-sm text-white font-medium">@{m.telegram || 'Anon'}</span>
        </div>
      ),
    },
    {
      key: 'report',
      label: 'Target',
      render: (m: ContactMessage) => (
        <div className="space-y-1">
          {m.category && (
            <div className="flex items-center gap-1.5 text-xs text-lz-muted">
              <FiLayers size={12} /> {m.category.name}
            </div>
          )}
          {m.link && (
            <div className="flex items-center gap-1.5 text-sm text-gray-300">
              <FiLink size={12} /> {m.link.title}
              <a href={m.link.url} target="_blank" rel="noreferrer" className="text-lz-muted hover:text-lz-accent">
                <FiExternalLink size={12} />
              </a>
            </div>
          )}
          {!m.category && !m.link && <span className="text-xs text-lz-muted italic">General Message</span>}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      width: '120px',
      render: (m: ContactMessage) => (
        <div className="flex items-center gap-1.5 text-xs text-lz-muted">
          <FiClock size={12} />
          {new Date(m.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      align: 'right' as const,
      render: (m: ContactMessage) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openMessage(m)}
            className="p-2 text-lz-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="View Details"
          >
            <FiMessageSquare size={16} />
          </button>
          <button
            onClick={() => handleDelete(m.id)}
            className="p-2 text-lz-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="Delete"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Reports & Messages"
        description="User-submitted scam reports and contact messages."
      />

      <div className="mb-6 flex gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-white/[0.02] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-lz-accent"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="READ">Read</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={messages}
        isLoading={isLoading}
        keyField="id"
      />

      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Message Details"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
              <p className="text-xs text-lz-muted uppercase tracking-wider font-bold mb-1">Telegram</p>
              <p className="text-white font-medium flex items-center gap-2">
                <SiTelegram size={16} className="text-[#0088cc]" />
                @{selectedMessage?.telegram || 'Anonymous'}
              </p>
            </div>
            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
              <p className="text-xs text-lz-muted uppercase tracking-wider font-bold mb-1">Date</p>
              <p className="text-white font-medium">
                {selectedMessage && new Date(selectedMessage.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <p className="text-xs text-lz-muted uppercase tracking-wider font-bold mb-2">Message Content</p>
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {selectedMessage?.message}
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-white/10">
            <AdminSelect
              label="Update Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'READ', label: 'Read' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
            />
            <AdminTextarea
              label="Admin Note (Internal)"
              value={formData.adminNote}
              onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })}
              placeholder="Add your notes here..."
              rows={3}
            />
            <div className="flex gap-3 pt-2">
              <AdminButton type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Close
              </AdminButton>
              <AdminButton type="submit" loading={isSaving} className="flex-1">
                Save Changes
              </AdminButton>
            </div>
          </form>
        </div>
      </AdminModal>
    </div>
  )
}
