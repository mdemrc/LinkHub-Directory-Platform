import { useState, useEffect, useMemo } from 'react'
import { contactApi } from '../lib/api'
import { ContactInfo } from '../types'
import { FiChevronUp, FiChevronDown, FiPhone, FiHeart } from 'react-icons/fi'

import AdminPageHeader from './components/AdminPageHeader'
import AdminModal from './components/AdminModal'
import AdminTable, { ActionButtons } from './components/AdminTable'
import AdminButton from './components/AdminButton'
import { AdminInput, AdminSelect, AdminCheckbox } from './components/AdminInput'
import {
  CONTACT_SELECT_OPTIONS,
  DONATION_SELECT_OPTIONS,
  isQuickContactType,
  isButtonOnlyType,
  getTypeIcon,
  getTypeColor,
} from '../lib/contactDonationTypes'

type Section = 'contact' | 'donation'

export default function AdminContact() {
  const [contacts, setContacts] = useState<ContactInfo[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [section, setSection] = useState<Section>('contact')
  const [isSaving, setIsSaving] = useState(false)
  const [editing, setEditing] = useState<ContactInfo | null>(null)
  const [formData, setFormData] = useState({ type: 'telegram', label: '', value: '', extra: '', order: 0, isActive: true })

  const contactList = useMemo(() => contacts.filter((c) => isQuickContactType(c.type)), [contacts])
  const donationList = useMemo(() => contacts.filter((c) => !isQuickContactType(c.type)), [contacts])

  useEffect(() => { fetchContacts() }, [])

  const fetchContacts = async () => {
    try { setContacts((await contactApi.getAll()).data || []) }
    catch (e) { console.error(e) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const payload = { ...formData, extra: formData.extra || undefined }
      editing ? await contactApi.update(editing.id, payload) : await contactApi.create(payload)
      fetchContacts(); closeModal()
    } catch (err: any) {
      console.error(err)
      alert(err?.response?.data?.error || 'Failed to save')
    } finally { setIsSaving(false) }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return
    try { await contactApi.delete(id); fetchContacts() } catch (e) { console.error(e) }
  }
  const handleToggle = async (c: ContactInfo) => {
    try { await contactApi.update(c.id, { isActive: !c.isActive }); fetchContacts() } catch (e) { console.error(e) }
  }
  const reorder = async (list: ContactInfo[], c: ContactInfo, dir: 'up' | 'down') => {
    const i = list.findIndex((x) => x.id === c.id)
    const j = dir === 'up' ? i - 1 : i + 1
    if (j < 0 || j >= list.length) return
    const o = list[j]
    try { await contactApi.reorder([{ id: c.id, order: o.order }, { id: o.id, order: c.order }]); fetchContacts() }
    catch (e) { console.error(e) }
  }

  const openModal = (sec: Section, c?: ContactInfo) => {
    setSection(sec)
    if (c) {
      setEditing(c)
      setFormData({ type: c.type, label: c.label, value: c.value, extra: c.extra || '', order: c.order, isActive: c.isActive })
    } else {
      setEditing(null)
      const sub = sec === 'contact' ? contactList : donationList
      setFormData({ type: sec === 'contact' ? 'telegram' : 'btc', label: '', value: '', extra: '', order: sub.length, isActive: true })
    }
    setIsModalOpen(true)
  }
  const closeModal = () => { setIsModalOpen(false); setEditing(null) }

  const isBtn = isButtonOnlyType(formData.type)
  const opts = section === 'contact' ? CONTACT_SELECT_OPTIONS : DONATION_SELECT_OPTIONS

  const cols = (list: ContactInfo[]) => [
    { key: 'info', label: 'Details', render: (c: ContactInfo) => {
      const btn = isButtonOnlyType(c.type)
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${getTypeColor(c.type)}20` }}>
            {getTypeIcon(c.type, 16)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">{c.label}</p>
            <p className="max-w-xs truncate text-xs text-lz-muted">
              {btn ? c.value : c.value}
            </p>
            {c.extra && <p className="text-[10px] text-gray-500 truncate">{c.extra}</p>}
          </div>
          {btn && <span className="rounded bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold text-violet-400 border border-violet-500/20">BUTTON</span>}
        </div>
      )
    }},
    { key: 'type', label: 'Type', render: (c: ContactInfo) => (
      <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
        style={{ borderColor: `${getTypeColor(c.type)}30`, background: `${getTypeColor(c.type)}12`, color: getTypeColor(c.type) }}>
        {getTypeIcon(c.type, 12)}
        {c.type.replace(/_/g, ' ').toUpperCase()}
      </span>
    )},
    { key: 'order', label: 'Order', render: (c: ContactInfo) => {
      const idx = list.findIndex((x) => x.id === c.id)
      return (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => reorder(list, c, 'up')} disabled={idx === 0} className="rounded p-1 hover:bg-lz-border disabled:opacity-30 disabled:cursor-not-allowed"><FiChevronUp size={14} /></button>
          <span className="w-6 text-center text-xs text-lz-muted">{c.order}</span>
          <button type="button" onClick={() => reorder(list, c, 'down')} disabled={idx === list.length - 1} className="rounded p-1 hover:bg-lz-border disabled:opacity-30 disabled:cursor-not-allowed"><FiChevronDown size={14} /></button>
        </div>
      )
    }},
    { key: 'status', label: 'Status', render: (c: ContactInfo) => (
      <button type="button" onClick={() => handleToggle(c)}>
        <span className={`cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-medium ${c.isActive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </button>
    )},
    { key: 'actions', label: '', render: (c: ContactInfo) => (
      <ActionButtons onEdit={() => openModal(isQuickContactType(c.type) ? 'contact' : 'donation', c)} onDelete={() => handleDelete(c.id)} />
    )},
  ]

  return (
    <div className="space-y-10">
      <AdminPageHeader title="Contact & Donations" description="Manage quick contact channels and crypto donation addresses." />

      {/* ── Quick Contact ── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10"><FiPhone className="text-cyan-400" size={18} /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Contact</h2>
              <p className="text-xs text-gray-500">Info cards & button links (Telegram, Discord, Twitter, custom links, …)</p>
            </div>
          </div>
          <AdminButton type="button" onClick={() => openModal('contact')}>Add contact</AdminButton>
        </div>
        <AdminTable columns={cols(contactList)} data={contactList} keyField="id" emptyMessage="No contacts. Add Telegram, Discord, email, button links, …" />
      </section>

      {/* ── Donations ── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10"><FiHeart className="text-pink-400" size={18} /></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Donations</h2>
              <p className="text-xs text-gray-500">Crypto addresses for Support Us section.</p>
            </div>
          </div>
          <AdminButton type="button" onClick={() => openModal('donation')}>Add donation address</AdminButton>
        </div>
        <AdminTable columns={cols(donationList)} data={donationList} keyField="id" emptyMessage="No donation addresses." />
      </section>

      {/* ── Modal ── */}
      <AdminModal isOpen={isModalOpen} onClose={closeModal}
        title={editing ? (section === 'contact' ? 'Edit contact' : 'Edit donation') : (section === 'contact' ? 'Add contact' : 'Add donation address')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminSelect label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} options={opts} required />

          {isBtn && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-xs text-violet-300">
                <strong>Button mode</strong> — only a styled button is shown on the public page. <em>Label</em> is the button text, <em>Value</em> is the URL.
              </p>
            </div>
          )}

          <AdminInput label={isBtn ? 'Button text' : 'Label'} value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder={isBtn ? 'e.g., Join our Telegram' : section === 'donation' ? 'e.g., Bitcoin (BTC)' : 'e.g., Support Telegram'}
            required />

          <AdminInput label={isBtn ? 'URL' : 'Value'} value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder={
              isBtn ? 'https://t.me/yourchannel' :
              formData.type === 'telegram' ? '@username' :
              formData.type === 'discord' ? 'discord.gg/invite' :
              formData.type === 'email' ? 'you@example.com' :
              'Wallet / contact address'
            } required />

          <AdminInput label="Extra info" value={formData.extra}
            onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
            placeholder={section === 'donation' ? 'Network note, memo, tag…' : 'Description, fingerprint…'}
            hint="Shown as a small note under the main value" />

          <div className="grid grid-cols-2 gap-4">
            <AdminInput label="Order" type="number" value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
            <div className="flex items-end pb-1">
              <AdminCheckbox label="Active" checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-lz-border pt-4">
            <AdminButton variant="secondary" onClick={closeModal} type="button">Cancel</AdminButton>
            <AdminButton type="submit" loading={isSaving}>{editing ? 'Update' : 'Create'}</AdminButton>
          </div>
        </form>
      </AdminModal>
    </div>
  )
}
