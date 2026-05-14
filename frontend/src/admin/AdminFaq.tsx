import { useState, useEffect } from 'react'
import { faqApi } from '../lib/api'
import { FiHelpCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { FaqItem } from '../types'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminTable, { ActionButtons } from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminTextarea, AdminCheckbox } from './components/AdminInput'

// Predefined FAQ categories
const FAQ_CATEGORIES = [
  { value: '', label: 'No Category' },
  { value: 'General', label: 'General' },
  { value: 'Advertising', label: 'Advertising' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Submissions', label: 'Link Submissions' },
  { value: 'Support', label: 'Support & Contact' },
]

export default function AdminFaq() {
  const [faqs, setFaqs] = useState<FaqItem[]>([])  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    order: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      const response = await faqApi.getAll()
      setFaqs(response.data || [])
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (editingFaq) {
        await faqApi.update(editingFaq.id, formData)
      } else {
        await faqApi.create(formData)
      }
      fetchFaqs()
      closeModal()
    } catch (error) {
      console.error('Failed to save FAQ:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ item?')) return
    try {
      await faqApi.delete(id)
      fetchFaqs()
    } catch (error) {
      console.error('Failed to delete FAQ:', error)
    }
  }

  const handleToggleActive = async (faq: FaqItem) => {
    try {
      await faqApi.update(faq.id, { isActive: !faq.isActive })
      fetchFaqs()
    } catch (error) {
      console.error('Failed to toggle FAQ status:', error)
    }
  }

  const handleMoveUp = async (faq: FaqItem, index: number) => {
    if (index === 0) return
    const prevFaq = faqs[index - 1]
    try {
      await faqApi.reorder([
        { id: faq.id, order: prevFaq.order },
        { id: prevFaq.id, order: faq.order }
      ])
      fetchFaqs()
    } catch (error) {
      console.error('Failed to reorder FAQs:', error)
    }
  }

  const handleMoveDown = async (faq: FaqItem, index: number) => {
    if (index === faqs.length - 1) return
    const nextFaq = faqs[index + 1]
    try {
      await faqApi.reorder([
        { id: faq.id, order: nextFaq.order },
        { id: nextFaq.id, order: faq.order }
      ])
      fetchFaqs()
    } catch (error) {
      console.error('Failed to reorder FAQs:', error)
    }
  }

  const openModal = (faq?: FaqItem) => {
    if (faq) {
      setEditingFaq(faq)
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || '',
        order: faq.order,
        isActive: faq.isActive,
      })
    } else {
      setEditingFaq(null)
      setFormData({
        question: '',
        answer: '',
        category: '',
        order: faqs.length,
        isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFaq(null)
  }

  const CategoryBadge = ({ category }: { category: string | undefined }) => {
    if (!category) return <span className="text-lz-muted text-xs">—</span>
    
    const colors: Record<string, string> = {
      General: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      Advertising: 'bg-green-500/10 text-green-400 border-green-500/20',
      Technical: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      Submissions: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      Support: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    }
    return (
      <span
        className={`px-2.5 py-1 text-[10px] font-medium border rounded-full ${
          colors[category] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}
      >
        {category}
      </span>
    )
  }

  const columns = [
    {
      key: 'question',
      label: 'Question',
      render: (faq: FaqItem) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-lz-accent/10 rounded-lg flex items-center justify-center">
            <FiHelpCircle className="text-lz-accent" size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <button 
              onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              className="font-medium text-white text-left hover:text-lz-accent transition-colors flex items-center gap-2"
            >
              <span className="truncate max-w-xs">{faq.question}</span>
              {expandedId === faq.id ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>
            {expandedId === faq.id && (
              <div className="mt-2 p-3 bg-lz-darker rounded-lg text-xs text-lz-muted whitespace-pre-wrap">
                {faq.answer}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (faq: FaqItem) => <CategoryBadge category={faq.category} />,
    },
    {
      key: 'order',
      label: 'Order',
      render: (faq: FaqItem) => {
        const index = faqs.findIndex(f => f.id === faq.id)
        return (
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handleMoveUp(faq, index)}
              disabled={index === 0}
              className="p-1 hover:bg-lz-border rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiChevronUp size={14} />
            </button>
            <span className="text-xs text-lz-muted w-6 text-center">{faq.order}</span>
            <button 
              onClick={() => handleMoveDown(faq, index)}
              disabled={index === faqs.length - 1}
              className="p-1 hover:bg-lz-border rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FiChevronDown size={14} />
            </button>
          </div>
        )
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (faq: FaqItem) => (
        <button onClick={() => handleToggleActive(faq)}>
          <span
            className={`px-2.5 py-1 text-[10px] font-medium border rounded-full cursor-pointer ${
              faq.isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            {faq.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (faq: FaqItem) => (
        <ActionButtons
          onEdit={() => openModal(faq)}
          onDelete={() => handleDelete(faq.id)}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQ Management"
        description={`Manage frequently asked questions (${faqs.length} total)`}
        action={{ label: 'Add FAQ', onClick: () => openModal() }}
      />

      <AdminTable
        columns={columns}
        data={faqs}
        keyField="id"
        emptyMessage="No FAQs found"
      />

      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminInput
            label="Question"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="e.g., How do I submit a link?"
            required
          />

          <AdminTextarea
            label="Answer"
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Detailed answer to the question... (Markdown supported)"
            rows={6}
            required
          />

          <AdminSelect
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={FAQ_CATEGORIES}
          />

          <AdminInput
            label="Order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
          />

          <AdminCheckbox
            label="Active"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-lz-border">
            <AdminButton variant="secondary" onClick={closeModal} type="button">
              Cancel
            </AdminButton>
            <AdminButton type="submit" loading={isSaving}>
              {editingFaq ? 'Update FAQ' : 'Create FAQ'}
            </AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
