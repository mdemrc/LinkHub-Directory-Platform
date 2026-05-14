import { useState, useEffect } from 'react'
import { Announcement, AnnouncementType } from '../types'
import { announcementsApi } from '../lib/api'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminTable, { StatusBadge, ActionButtons } from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminTextarea, AdminCheckbox } from './components/AdminInput'

const defaultFormData = {
  title: '',
  content: '',
  type: 'MODAL' as AnnouncementType,
  showOnPageLoad: true,
  showEveryVisit: false,
  autoClose: false,
  autoCloseDuration: 5000,
  allowManualClose: true,
  backgroundColor: '#1c2333',
  textColor: '#ffffff',
  borderColor: '#30363d',
  startDate: '',
  endDate: '',
  priority: 0,
  isActive: true,
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState(defaultFormData)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementsApi.getAll()
      const data = Array.isArray(response.data) ? response.data : response.data?.value || []
      setAnnouncements(data)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingAnnouncement) {
        await announcementsApi.update(editingAnnouncement.id, formData)
      } else {
        await announcementsApi.create(formData)
      }
      fetchAnnouncements()
      closeModal()
    } catch (error) {
      console.error('Failed to save announcement:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      await announcementsApi.delete(id)
      fetchAnnouncements()
    } catch (error) {
      console.error('Failed to delete announcement:', error)
    }
  }

  const openModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        showOnPageLoad: announcement.showOnPageLoad,
        showEveryVisit: announcement.showEveryVisit ?? false,
        autoClose: announcement.autoClose,
        autoCloseDuration: announcement.autoCloseDuration,
        allowManualClose: announcement.allowManualClose,
        backgroundColor: announcement.backgroundColor || '#1c2333',
        textColor: announcement.textColor || '#ffffff',
        borderColor: announcement.borderColor || '#30363d',
        startDate: '',
        endDate: '',
        priority: announcement.priority,
        isActive: announcement.isActive,
      })
    } else {
      setEditingAnnouncement(null)
      setFormData(defaultFormData)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingAnnouncement(null)
  }

  const typeLabels: Record<AnnouncementType, string> = {
    MODAL: 'Modal Popup',
    BANNER: 'Top Banner',
    TOAST: 'Toast Notification',
  }

  const columns = [
    {
      key: 'priority',
      label: '#',
      width: '50px',
      render: (ann: Announcement) => (
        <span className="text-lz-muted font-mono text-xs">{ann.priority}</span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (ann: Announcement) => (
        <div>
          <p className="font-medium text-white">{ann.title}</p>
          <p className="text-xs text-lz-muted mt-0.5 line-clamp-1">{ann.content}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: '120px',
      render: (ann: Announcement) => (
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap inline-flex items-center justify-center min-w-[100px] ${
          ann.type === 'MODAL' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
          ann.type === 'BANNER' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}>
          {typeLabels[ann.type]}
        </span>
      ),
    },
    {
      key: 'options',
      label: 'Options',
      width: '120px',
      render: (ann: Announcement) => (
        <div className="flex gap-1 flex-wrap">
          {ann.showOnPageLoad && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">Page Load</span>
          )}
          {ann.showEveryVisit && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">Every Visit</span>
          )}
          {ann.autoClose && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400">{ann.autoCloseDuration / 1000}s</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (ann: Announcement) => <StatusBadge active={ann.isActive} />,
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      align: 'right' as const,
      render: (ann: Announcement) => (
        <ActionButtons
          onEdit={() => openModal(ann)}
          onDelete={() => handleDelete(ann.id)}
        />
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Announcements"
        description="Create and manage site-wide announcements, popups, and notifications"
        action={{ label: 'Add Announcement', onClick: () => openModal() }}
      />

      <AdminTable
        columns={columns}
        data={announcements}
        keyField="id"
        emptyMessage="No announcements yet. Create your first announcement to notify users."
      />

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AdminInput
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Announcement title..."
            required
          />

          <AdminTextarea
            label="Content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Announcement message..."
            rows={4}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AdminSelect
              label="Display Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementType })}
              options={[
                { value: 'MODAL', label: 'Modal Popup (center screen)' },
                { value: 'BANNER', label: 'Top Banner (full width)' },
                { value: 'TOAST', label: 'Toast (bottom-right)' },
              ]}
            />
            <AdminInput
              label="Priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              help={{ content: 'Higher priority announcements are shown first.' }}
            />
          </div>

          {/* Behavior */}
          <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Behavior</h4>
            <div className="flex flex-wrap gap-6">
              <AdminCheckbox
                label="Show on Page Load"
                checked={formData.showOnPageLoad}
                onChange={(e) => setFormData({ ...formData, showOnPageLoad: e.target.checked })}
              />
              <AdminCheckbox
                label="Show Every Visit"
                checked={formData.showEveryVisit}
                onChange={(e) => setFormData({ ...formData, showEveryVisit: e.target.checked })}
              />
              <AdminCheckbox
                label="Allow Manual Close"
                checked={formData.allowManualClose}
                onChange={(e) => setFormData({ ...formData, allowManualClose: e.target.checked })}
              />
              <AdminCheckbox
                label="Auto Close"
                checked={formData.autoClose}
                onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
              />
              <AdminCheckbox
                label="Active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            </div>
            {formData.autoClose && (
              <AdminInput
                label="Auto Close Duration (ms)"
                type="number"
                value={formData.autoCloseDuration}
                onChange={(e) => setFormData({ ...formData, autoCloseDuration: parseInt(e.target.value) || 5000 })}
                hint="Time in milliseconds before auto-closing. 5000 = 5 seconds"
              />
            )}
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg border border-white/5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preview</h4>
            <div className="p-4 rounded-lg border border-lz-border/50 bg-lz-dark/50">
              <h5 className="font-bold text-sm text-white">{formData.title || 'Announcement Title'}</h5>
              <p className="text-xs mt-1 text-lz-muted">{formData.content || 'Announcement content will appear here...'}</p>
              <p className="text-[10px] mt-2 text-lz-muted opacity-50">Type: {typeLabels[formData.type]}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              loading={isSaving}
              className="flex-1"
            >
              {editingAnnouncement ? 'Save Changes' : 'Create Announcement'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
