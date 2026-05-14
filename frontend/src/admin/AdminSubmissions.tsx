import { useState, useEffect } from 'react'
import { LinkSubmission, Category } from '../types'
import { submissionsApi, categoriesApi } from '../lib/api'
import { FiCheck, FiX, FiExternalLink, FiClock, FiInbox, FiSend, FiGlobe, FiMail } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminButton from './components/AdminButton'
import { AdminInput } from './components/AdminInput'

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<LinkSubmission[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [approveModal, setApproveModal] = useState<{
    submission: LinkSubmission
    name: string
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subRes, catRes] = await Promise.all([
        submissionsApi.getPending(),
        categoriesApi.getAll(),
      ])
      const subData = subRes.data?.submissions || subRes.data || []
      setSubmissions(Array.isArray(subData) ? subData : [])
      const catData = catRes.data?.categories || catRes.data || []
      setCategories(Array.isArray(catData) ? catData : [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!approveModal) return
    setIsSaving(true)
    try {
      await submissionsApi.approve(approveModal.submission.id, approveModal.name)
      fetchData()
      setApproveModal(null)
    } catch (error) {
      console.error('Failed to approve:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('Rejection reason (optional):')
    try {
      await submissionsApi.reject(id, reason || undefined)
      fetchData()
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  const getCategoryName = (id: number) => {
    return categories.find((c) => c.id === id)?.name || 'Unknown'
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
        title="Submissions"
        description={`${submissions.length} pending submissions`}
      />

      <div className="space-y-3">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Title and URL */}
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  {sub.title && (
                    <span className="font-semibold text-white">{sub.title}</span>
                  )}
                  <a
                    href={sub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lz-accent hover:text-lz-accent/80 flex items-center gap-1.5 text-sm transition-colors"
                  >
                    {sub.url}
                    <FiExternalLink size={14} />
                  </a>
                  <span className="px-2.5 py-1 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                    {getCategoryName(sub.categoryId)}
                  </span>
                </div>

                {/* Description */}
                {sub.description && (
                  <p className="text-sm text-gray-400 mb-3">{sub.description}</p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-lz-muted flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <FiClock size={12} />
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                  {sub.countryCode && (
                    <span className="flex items-center gap-1 text-sky-400">
                      <FiGlobe size={12} />
                      {sub.countryCode}
                    </span>
                  )}
                  {sub.mirrorUrl && (
                    <span className="flex items-center gap-1 text-purple-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      Mirror: {sub.mirrorUrl}
                    </span>
                  )}
                  {sub.altUrl && (
                    <span className="flex items-center gap-1 text-orange-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Alt: {sub.altUrl}
                    </span>
                  )}
                  {sub.contactEmail && (
                    <span className="flex items-center gap-1 text-green-400">
                      <FiMail size={12} />
                      {sub.contactEmail}
                    </span>
                  )}
                  {sub.telegram && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <FiSend size={11} />
                      {sub.telegram}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setApproveModal({
                      submission: sub,
                      name: sub.title || new URL(sub.url).hostname.replace('www.', ''),
                    })
                  }
                  className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  title="Approve"
                >
                  <FiCheck size={18} />
                </button>
                <button
                  onClick={() => handleReject(sub.id)}
                  className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                  title="Reject"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {submissions.length === 0 && (
          <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-xl">
            <FiInbox className="mx-auto text-lz-muted/30 mb-4" size={56} />
            <p className="text-lz-muted">No pending submissions</p>
            <p className="text-sm text-lz-muted/60 mt-1">
              All submissions have been reviewed
            </p>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <AdminModal
        isOpen={!!approveModal}
        onClose={() => setApproveModal(null)}
        title="Approve Submission"
        size="sm"
      >
        <div className="space-y-5">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
            <p className="text-xs text-lz-muted mb-1">URL</p>
            <p className="text-sm text-white truncate">{approveModal?.submission.url}</p>
          </div>

          <AdminInput
            label="Link Name"
            value={approveModal?.name || ''}
            onChange={(e) =>
              approveModal && setApproveModal({ ...approveModal, name: e.target.value })
            }
            placeholder="Enter link name"
            help={{
              content: 'This name will be shown to users. The submitted URL will be saved as the link URL.',
            }}
          />

          <div className="flex gap-3 pt-4 border-t border-lz-border/30">
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => setApproveModal(null)}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton onClick={handleApprove} loading={isSaving} className="flex-1">
              Approve
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
