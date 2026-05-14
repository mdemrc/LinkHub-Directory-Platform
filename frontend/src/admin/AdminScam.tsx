import { useState, useEffect } from 'react'
import { scamApi } from '../lib/api'
import { FiExternalLink, FiShield, FiSearch, FiCheckCircle } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminTable, { ActionButtons } from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminTextarea, AdminCheckbox } from './components/AdminInput'

interface ScamReport {
  id: number
  siteName: string
  siteUrl: string | null
  category: string
  reason: string | null
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminScam() {
  const [scamReports, setScamReports] = useState<ScamReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingScam, setEditingScam] = useState<ScamReport | null>(null)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    siteName: '',
    siteUrl: '',
    category: 'Forumlar',
    reason: '',
    isVerified: false,
  })

  useEffect(() => {
    fetchScamReports()
  }, [])

  const fetchScamReports = async () => {
    setIsLoading(true)
    try {
      const response = await scamApi.getAll()
      setScamReports(response.data.scams || [])
    } catch (error) {
      console.error('Failed to fetch scam reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.siteName || !formData.category) return

    setIsSaving(true)
    try {
      if (editingScam) {
        await scamApi.update(editingScam.id, formData)
      } else {
        await scamApi.create(formData)
      }
      fetchScamReports()
      closeModal()
    } catch (error) {
      console.error('Failed to save scam report:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scam report? This action cannot be undone.')) return
    try {
      await scamApi.delete(id)
      fetchScamReports()
    } catch (error) {
      console.error('Failed to delete scam report:', error)
    }
  }

  const openModal = (scam?: ScamReport) => {
    if (scam) {
      setEditingScam(scam)
      setFormData({
        siteName: scam.siteName,
        siteUrl: scam.siteUrl || '',
        category: scam.category,
        reason: scam.reason || '',
        isVerified: scam.isVerified,
      })
    } else {
      setEditingScam(null)
      setFormData({
        siteName: '',
        siteUrl: '',
        category: 'Forumlar',
        reason: '',
        isVerified: false,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingScam(null)
  }

  const filteredData = scamReports.filter(item => 
    item.siteName.toLowerCase().includes(search.toLowerCase()) ||
    (item.siteUrl?.toLowerCase().includes(search.toLowerCase()) || false)
  )

  const columns = [
    {
      key: 'siteName',
      label: 'Site / Brand',
      render: (scam: ScamReport) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiShield className="text-red-500" size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white truncate">{scam.siteName}</span>
              {scam.isVerified && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded uppercase">
                  <FiCheckCircle size={10} /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-lz-muted truncate max-w-[200px]">{scam.siteUrl || 'No URL'}</span>
              {scam.siteUrl && (
                <a
                  href={scam.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lz-muted hover:text-red-400 transition-colors"
                >
                  <FiExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      width: '140px',
      render: (scam: ScamReport) => (
        <span className="px-2.5 py-1 text-[10px] font-bold bg-lz-bg border border-lz-border text-lz-muted rounded-full uppercase tracking-wider">
          {scam.category}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason / Description',
      render: (scam: ScamReport) => (
        <span className="text-sm text-gray-400 line-clamp-2 max-w-[300px]">
          {scam.reason || '—'}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Reported Date',
      width: '150px',
      render: (scam: ScamReport) => (
        <span className="text-xs text-lz-muted font-medium">
          {new Date(scam.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      align: 'right' as const,
      render: (scam: ScamReport) => (
        <ActionButtons onEdit={() => openModal(scam)} onDelete={() => handleDelete(scam.id)} />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Scam Database"
        description={`Manage ${scamReports.length} reported fraudulent entries`}
        action={{ label: 'Add Scam Site', onClick: () => openModal() }}
      />

      {/* Filters */}
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lz-muted" size={18} />
          <input
            type="text"
            placeholder="Search by name or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-lz-dark/50 border border-lz-border/50 rounded-lg text-white placeholder-lz-muted text-sm focus:outline-none focus:border-red-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-lz-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Verified Scams: {scamReports.filter(r => r.isVerified).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Pending: {scamReports.filter(r => !r.isVerified).length}</span>
          </div>
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredData}
        keyField="id"
        isLoading={isLoading}
        emptyMessage={search ? "No matches found for your search." : "Your scam database is empty."}
      />

      {/* Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingScam ? 'Edit Scam Entry' : 'New Scam Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AdminInput
              label="Site / Label Name"
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              placeholder="e.g. ScammerMarket"
              required
              help={{ content: 'The public name of the site being reported.' }}
            />

            <AdminSelect
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'Forumlar', label: 'Forums' },
                { value: 'Mağazalar', label: 'Markets / Shops' },
                { value: 'Cüzdanlar', label: 'Wallets' },
                { value: 'Exchangeler', label: 'Exchanges' },
                { value: 'Diğer', label: 'Others' },
              ]}
              help={{ content: 'Helps group the scam reports for users.' }}
            />
          </div>

          <AdminInput
            label="Site URL / Mirror"
            type="text"
            value={formData.siteUrl}
            onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
            placeholder="https://scamsite.net"
            help={{ content: 'The domain or specific address linked to the scam.' }}
          />

          <AdminTextarea
            label="Scam Reason / Detailed Report"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Briefly describe the scam behavior (e.g., 'Exit scam after 2 months', 'Phishing for login keys')..."
            rows={4}
            help={{ content: 'Try to be concise but informative. This will be shown to users.' }}
          />

          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <AdminCheckbox
              label="Verified Scam"
              checked={formData.isVerified}
              onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
              help={{ content: 'Verified entries get a special checkmark badge and are considered high-confidence reports.' }}
            />
          </div>

          <div className="flex gap-3 pt-6 border-t border-lz-border/30">
            <AdminButton type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSaving} className="flex-1">
              {editingScam ? 'Update Entry' : 'Create Entry'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
