import { useState, useEffect } from 'react'
import { changelogApi } from '../lib/api'
import { FiTag, FiClock, FiCheck, FiAlertCircle, FiPlus, FiX, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect } from './components/AdminInput'

type ChangelogStatus = 'PLANNED' | 'COMMITTED' | 'PUBLISHED'

interface Changelog {
  id: number
  version: string
  title: string
  changes: string[]
  status: ChangelogStatus
  publishedAt: string | null
  createdAt?: string
  updatedAt?: string
}

interface ChangelogFormData {
  version: string
  title: string
  changes: string[]
  status: ChangelogStatus
}

const defaultFormData: ChangelogFormData = {
  version: '',
  title: '',
  changes: [''],
  status: 'PLANNED',
}

const statusConfig: Record<ChangelogStatus, { label: string; bgColor: string; textColor: string; borderColor: string; icon: typeof FiClock }> = {
  PLANNED: { label: 'Planned', bgColor: 'bg-amber-500/10', textColor: 'text-amber-400', borderColor: 'border-amber-500/20', icon: FiClock },
  COMMITTED: { label: 'Committed', bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/20', icon: FiAlertCircle },
  PUBLISHED: { label: 'Published', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/20', icon: FiCheck },
}

export default function AdminChangelog() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingChangelog, setEditingChangelog] = useState<Changelog | null>(null)
  const [formData, setFormData] = useState<ChangelogFormData>({ ...defaultFormData })

  useEffect(() => {
    fetchChangelogs()
  }, [])

  const fetchChangelogs = async () => {
    try {
      const response = await changelogApi.getAll()
      setChangelogs(response.data)
    } catch (error) {
      console.error('Failed to fetch changelogs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const data = {
        ...formData,
        changes: formData.changes.filter((c) => c.trim() !== ''),
      }

      if (editingChangelog) {
        await changelogApi.update(editingChangelog.id, data)
      } else {
        await changelogApi.create(data)
      }
      fetchChangelogs()
      closeModal()
    } catch (error) {
      console.error('Failed to save changelog:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this changelog entry?')) return
    try {
      await changelogApi.delete(id)
      fetchChangelogs()
    } catch (error) {
      console.error('Failed to delete changelog:', error)
    }
  }

  const openModal = (changelog?: Changelog) => {
    if (changelog) {
      setEditingChangelog(changelog)
      setFormData({
        version: changelog.version,
        title: changelog.title,
        changes: changelog.changes.length > 0 ? [...changelog.changes] : [''],
        status: changelog.status,
      })
    } else {
      setEditingChangelog(null)
      setFormData({
        ...defaultFormData,
        changes: [''],
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingChangelog(null)
  }

  const addChange = () => {
    setFormData({ ...formData, changes: [...formData.changes, ''] })
  }

  const updateChange = (index: number, value: string) => {
    const newChanges = [...formData.changes]
    newChanges[index] = value
    setFormData({ ...formData, changes: newChanges })
  }

  const removeChange = (index: number) => {
    if (formData.changes.length > 1) {
      setFormData({ ...formData, changes: formData.changes.filter((_, i) => i !== index) })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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
        title="Changelog"
        description="Manage version history and updates"
        action={{ label: 'Add Entry', onClick: () => openModal() }}
      />

      {/* List */}
      <div className="space-y-4">
        {changelogs.map((changelog) => {
          const status = statusConfig[changelog.status]
          const StatusIcon = status.icon

          return (
            <div
              key={changelog.id}
              className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-lz-dark/50 rounded-lg border border-white/5">
                      <FiTag size={13} className="text-lz-accent" />
                      <span className="text-white font-mono font-bold text-sm">
                        v{changelog.version}
                      </span>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-full border ${status.bgColor} ${status.textColor} ${status.borderColor}`}
                    >
                      <StatusIcon size={11} />
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(changelog)}
                      className="p-2 text-lz-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <FiEdit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(changelog.id)}
                      className="p-2 text-lz-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-medium text-white mb-3">{changelog.title}</h3>

                {/* Changes */}
                <ul className="space-y-1.5 mb-4">
                  {changelog.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className="text-lz-accent mt-1.5">•</span>
                      {change}
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/5 text-xs text-lz-muted">
                  <span className="flex items-center gap-1.5">
                    <FiClock size={12} />
                    Published: {formatDate(changelog.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {changelogs.length === 0 && (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl">
          <FiFileText className="mx-auto text-lz-muted/30 mb-4" size={56} />
          <p className="text-lz-muted">No changelog entries yet</p>
          <p className="text-sm text-lz-muted/60 mt-1">Create your first version entry</p>
        </div>
      )}

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingChangelog ? 'Edit Changelog' : 'Create Changelog'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <AdminInput
              label="Version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g. 1.0.0"
              required
              help={{
                content: 'Semantic versioning: MAJOR.MINOR.PATCH (e.g., 1.2.3). Major = breaking changes, Minor = new features, Patch = bug fixes.',
                link: { url: 'https://semver.org/', label: 'Learn about SemVer' },
              }}
            />
            <AdminSelect
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ChangelogStatus })}
              options={[
                { value: 'PLANNED', label: '🟡 Planned' },
                { value: 'COMMITTED', label: '🔵 Committed' },
                { value: 'PUBLISHED', label: '🟢 Published' },
              ]}
              help={{
                content: 'Planned: Future version. Committed: In progress. Published: Released to users.',
              }}
            />
          </div>

          <AdminInput
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Major Update"
            required
            help={{
              content: 'Brief headline for this release. Make it descriptive but concise.',
            }}
          />

          {/* Changes List */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Changes</label>
            <div className="space-y-2">
              {formData.changes.map((change, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={change}
                    onChange={(e) => updateChange(index, e.target.value)}
                    placeholder="Enter change..."
                    className="flex-1 px-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white placeholder-lz-muted text-sm focus:outline-none focus:border-lz-accent/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeChange(index)}
                    className="p-2.5 text-lz-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addChange}
              className="mt-3 flex items-center gap-1.5 text-sm text-lz-accent hover:text-lz-accent/80 transition-colors"
            >
              <FiPlus size={14} />
              Add Change
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSaving} className="flex-1">
              {editingChangelog ? 'Save Changes' : 'Create Entry'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
