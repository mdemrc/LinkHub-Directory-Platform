import { useState, useEffect } from 'react'
import { languagesApi } from '../lib/api'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiGlobe,
  FiCheck,
  FiStar,
} from 'react-icons/fi'

// Language interface matching backend schema
interface Language {
  id: number
  code: string
  name: string
  nativeName: string
  flag: string | null
  isDefault: boolean
  isActive: boolean
  order: number
  createdAt?: string
  updatedAt?: string
}

interface LanguageFormData {
  code: string
  name: string
  nativeName: string
  flag: string
  isDefault: boolean
  isActive: boolean
  order: number
}

const defaultFormData: LanguageFormData = {
  code: '',
  name: '',
  nativeName: '',
  flag: '',
  isDefault: false,
  isActive: true,
  order: 0,
}

// Common flag emojis for quick selection
const commonFlags = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'us', flag: '🇺🇸', name: 'English (US)' },
  { code: 'tr', flag: '🇹🇷', name: 'Turkish' },
  { code: 'de', flag: '🇩🇪', name: 'German' },
  { code: 'fr', flag: '🇫🇷', name: 'French' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish' },
  { code: 'it', flag: '🇮🇹', name: 'Italian' },
  { code: 'pt', flag: '🇵🇹', name: 'Portuguese' },
  { code: 'ru', flag: '🇷🇺', name: 'Russian' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese' },
  { code: 'ja', flag: '🇯🇵', name: 'Japanese' },
  { code: 'ko', flag: '🇰🇷', name: 'Korean' },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
  { code: 'nl', flag: '🇳🇱', name: 'Dutch' },
  { code: 'pl', flag: '🇵🇱', name: 'Polish' },
]

export default function AdminLanguages() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null)
  const [formData, setFormData] = useState<LanguageFormData>({ ...defaultFormData })

  useEffect(() => {
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    try {
      const response = await languagesApi.getAll()
      setLanguages(response.data)
    } catch (error) {
      console.error('Failed to fetch languages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        flag: formData.flag || undefined,
      }

      if (editingLanguage) {
        await languagesApi.update(editingLanguage.id, data)
      } else {
        await languagesApi.create(data)
      }
      fetchLanguages()
      closeModal()
    } catch (error) {
      console.error('Failed to save language:', error)
    }
  }

  const handleDelete = async (id: number) => {
    const language = languages.find(l => l.id === id)
    if (language?.isDefault) {
      alert('Cannot delete the default language. Set another language as default first.')
      return
    }
    if (!confirm('Are you sure you want to delete this language?')) return
    try {
      await languagesApi.delete(id)
      fetchLanguages()
    } catch (error) {
      console.error('Failed to delete language:', error)
    }
  }

  const openModal = (language?: Language) => {
    if (language) {
      setEditingLanguage(language)
      setFormData({
        code: language.code,
        name: language.name,
        nativeName: language.nativeName,
        flag: language.flag || '',
        isDefault: language.isDefault,
        isActive: language.isActive,
        order: language.order,
      })
    } else {
      setEditingLanguage(null)
      setFormData({
        ...defaultFormData,
        order: languages.length,
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingLanguage(null)
  }

  const selectFlag = (flag: string) => {
    setFormData({ ...formData, flag })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Languages</h1>
          <p className="text-sm text-lz-muted">Manage site languages and translations</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-lz-accent hover:bg-lz-accent/80 text-white rounded-lg transition-colors"
        >
          <FiPlus size={16} />
          Add Language
        </button>
      </div>

      {/* Table */}
      <div className="bg-lz-card border border-lz-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-lz-darker">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-lz-muted uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lz-muted uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lz-muted uppercase tracking-wider">
                  Native Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lz-muted uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-lz-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-lz-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lz-border">
              {languages.map((language) => (
                <tr key={language.id} className="hover:bg-lz-darker/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{language.flag || '🌐'}</span>
                      <div>
                        <p className="text-white font-medium flex items-center gap-2">
                          {language.name}
                          {language.isDefault && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-lz-accent/20 text-lz-accent rounded">
                              <FiStar size={10} />
                              Default
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm text-lz-muted bg-lz-darker px-2 py-1 rounded">
                      {language.code}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-lz-muted">{language.nativeName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-lz-muted">{language.order}</span>
                  </td>
                  <td className="px-6 py-4">
                    {language.isActive ? (
                      <span className="flex items-center gap-1 text-green-500 text-sm">
                        <FiCheck size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="text-red-500 text-sm">Inactive</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(language)}
                        className="p-2 text-lz-muted hover:text-white rounded transition-colors"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(language.id)}
                        className={`p-2 rounded transition-colors ${
                          language.isDefault
                            ? 'text-lz-border cursor-not-allowed'
                            : 'text-lz-muted hover:text-red-500'
                        }`}
                        disabled={language.isDefault}
                        title={language.isDefault ? 'Cannot delete default language' : ''}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {languages.length === 0 && (
          <div className="text-center py-12">
            <FiGlobe className="mx-auto text-lz-muted mb-4" size={48} />
            <p className="text-lz-muted">No languages yet</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-lz-card border border-lz-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-lz-border">
              <h2 className="text-xl font-bold text-white">
                {editingLanguage ? 'Edit Language' : 'Add New Language'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code & Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lz-muted mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toLowerCase() })
                    }
                    placeholder="en"
                    maxLength={5}
                    className="w-full px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white focus:outline-none focus:border-lz-accent font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lz-muted mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="English"
                    className="w-full px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white focus:outline-none focus:border-lz-accent"
                    required
                  />
                </div>
              </div>

              {/* Native Name */}
              <div>
                <label className="block text-sm font-medium text-lz-muted mb-1">
                  Native Name *
                </label>
                <input
                  type="text"
                  value={formData.nativeName}
                  onChange={(e) =>
                    setFormData({ ...formData, nativeName: e.target.value })
                  }
                  placeholder="English (native name in the language itself)"
                  className="w-full px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white focus:outline-none focus:border-lz-accent"
                  required
                />
              </div>

              {/* Flag */}
              <div>
                <label className="block text-sm font-medium text-lz-muted mb-1">
                  Flag (emoji)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    placeholder="🇬🇧"
                    className="flex-1 px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white focus:outline-none focus:border-lz-accent text-2xl"
                    maxLength={4}
                  />
                  {formData.flag && (
                    <span className="flex items-center justify-center w-12 h-12 bg-lz-darker border border-lz-border rounded-lg text-3xl">
                      {formData.flag}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonFlags.map((f) => (
                    <button
                      key={f.code}
                      type="button"
                      onClick={() => selectFlag(f.flag)}
                      className={`p-2 text-xl rounded-lg transition-colors ${
                        formData.flag === f.flag
                          ? 'bg-lz-accent/20 border border-lz-accent'
                          : 'bg-lz-darker border border-lz-border hover:border-lz-accent'
                      }`}
                      title={f.name}
                    >
                      {f.flag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order */}
              <div>
                <label className="block text-sm font-medium text-lz-muted mb-1">
                  Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-lz-darker border border-lz-border rounded-lg text-white focus:outline-none focus:border-lz-accent"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-white">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-white">Set as Default</span>
                </label>
              </div>

              {formData.isDefault && (
                <p className="text-xs text-yellow-500">
                  Setting this as default will unset any existing default language.
                </p>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-lz-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-lz-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-lz-accent hover:bg-lz-accent/80 text-white rounded-lg transition-colors"
                >
                  {editingLanguage ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
