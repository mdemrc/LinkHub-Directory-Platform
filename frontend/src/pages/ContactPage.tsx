import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiMail, FiSend, FiAlertCircle, FiCheck, FiCopy, FiLayers, FiLink, FiHeart, FiExternalLink } from 'react-icons/fi'
import { SiTelegram } from 'react-icons/si'
import { contactApi, categoriesApi, linksApi, messagesApi } from '../lib/api'
import { ContactInfo, Category, Link } from '../types'
import SEO from '../components/SEO'
import CaptchaWidget from '../components/CaptchaWidget'
import {
  isQuickContactType,
  isButtonOnlyType,
  getTypeIcon,
  getTypeColor,
} from '../lib/contactDonationTypes'

function getContactHref(contact: ContactInfo): string | null {
  const v = contact.value.trim()
  switch (contact.type) {
    case 'telegram': return `https://t.me/${v.replace(/^@/, '')}`
    case 'discord': return v.startsWith('http') ? v : `https://discord.gg/${v}`
    case 'email': return v.startsWith('mailto:') ? v : `mailto:${v}`
    case 'xmpp': return `xmpp:${v}`
    default:
      if (v.startsWith('http') || v.startsWith('mailto:') || v.startsWith('xmpp:')) return v
      return null
  }
}

export default function ContactPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContacts, setIsLoadingContacts] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [contacts, setContacts] = useState<ContactInfo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const [formData, setFormData] = useState({ telegram: '', categoryId: 'general', linkId: '', message: '' })

  useEffect(() => {
    ;(async () => {
      try {
        const [cRes, catRes] = await Promise.all([contactApi.getActive(), categoriesApi.getAll()])
        setContacts(cRes.data || [])
        setCategories(catRes.data || [])
      } catch (e) { console.error(e) }
      finally { setIsLoadingContacts(false) }
    })()
  }, [])

  useEffect(() => {
    if (!formData.categoryId || formData.categoryId === 'general') { setLinks([]); return }
    ;(async () => {
      setIsLoadingLinks(true)
      try {
        const res = await linksApi.getAll({ categoryId: Number(formData.categoryId) })
        setLinks(Array.isArray(res.data) ? res.data : (res.data.links || []))
      } catch (e) { console.error(e) }
      finally { setIsLoadingLinks(false) }
    })()
  }, [formData.categoryId])

  const quickContacts = contacts.filter((c) => isQuickContactType(c.type))
  const infoContacts = quickContacts.filter((c) => !isButtonOnlyType(c.type))
  const buttonContacts = quickContacts.filter((c) => isButtonOnlyType(c.type))
  const cryptoAddresses = contacts.filter((c) => !isQuickContactType(c.type))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((p) => ({
      ...p,
      [name]: value,
      ...(name === 'categoryId' ? { linkId: '' } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!formData.message) { setError('Please provide a message.'); return }
    setIsLoading(true)
    try {
      const catId = formData.categoryId && formData.categoryId !== 'general' ? +formData.categoryId : undefined
      await messagesApi.create({ telegram: formData.telegram, categoryId: catId, linkId: formData.linkId ? +formData.linkId : undefined, message: formData.message, captchaToken: captchaToken || undefined })
      setSuccess(true); setFormData({ telegram: '', categoryId: 'general', linkId: '', message: '' })
    } catch (err: any) { setError(err.response?.data?.error || 'Something went wrong.') }
    finally { setIsLoading(false) }
  }

  const copy = async (text: string, id: number) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }
    catch {}
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-10 sm:py-16 px-4 sm:px-0">
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5"><FiCheck className="text-emerald-400" size={30} /></div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Message Sent!</h1>
          <p className="text-sm text-gray-400 mb-6">Thank you for contacting us. We'll get back to you as soon as possible.</p>
          <button onClick={() => setSuccess(false)} className="px-6 py-2.5 bg-lz-accent hover:bg-lz-accent/80 text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-lz-accent/25">Send Another Message</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-0">
      <SEO title="Contact" description="Get in touch with LinkHub." keywords="contact, support" breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Contact', url: '/contact' }]} />

      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t('page.contact')}</h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
          Have questions, feedback, or want to advertise? Get in touch with us through any of the channels below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {/* ── Form ── */}
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-lz-accent/10 rounded-xl flex items-center justify-center"><FiMail className="text-lz-accent" size={18} /></div>
            <div><h2 className="text-base sm:text-lg font-bold text-white">Send a Message</h2><p className="text-xs text-gray-500">Report a link or ask a question</p></div>
          </div>
          {error && <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400"><FiAlertCircle size={18} /><span className="text-sm">{error}</span></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-2"><FiLayers size={13} /> Category</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-4 py-2.5 bg-[#0d1117] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/25 transition-all">
                <option value="general">Send a Message</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {formData.categoryId && formData.categoryId !== 'general' && (
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-2"><FiLink size={13} /> Reported Link</label>
                <select name="linkId" value={formData.linkId} onChange={handleChange} disabled={isLoadingLinks} className="w-full px-4 py-2.5 bg-[#0d1117] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{isLoadingLinks ? 'Loading…' : 'Select a link (optional)'}</option>
                  {links.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-2"><SiTelegram size={13} className="text-[#0088cc]" /> Telegram Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input type="text" name="telegram" value={formData.telegram} onChange={handleChange} className="w-full pl-8 pr-4 py-2.5 bg-[#0d1117] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/25 transition-all" placeholder="YourTelegram (Optional)" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Message <span className="text-red-400">*</span></label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows={5} required className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/25 transition-all resize-none"
                placeholder={formData.categoryId === 'general' || !formData.categoryId ? 'Write your message here…' : 'Explain why you are reporting this link…'} />
            </div>
            <CaptchaWidget onVerify={setCaptchaToken} />
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-gradient-to-r from-lz-accent to-cyan-500 hover:from-lz-accent/90 hover:to-cyan-500/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-md shadow-lz-accent/20">
              {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</> : <><FiSend size={16} /> Send Message</>}
            </button>
          </form>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Quick Contact — info cards */}
          <div className="bg-[#161b22] border border-white/10 rounded-2xl p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center"><FiSend className="text-cyan-400" size={18} /></div>
              <div><h2 className="text-base sm:text-lg font-bold text-white">Quick Contact</h2><p className="text-xs text-gray-500">Reach us directly</p></div>
            </div>

            {isLoadingContacts ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : infoContacts.length > 0 || buttonContacts.length > 0 ? (
              <div className="space-y-3">
                {/* Info cards */}
                {infoContacts.map((c) => {
                  const href = getContactHref(c)
                  const color = getTypeColor(c.type)
                  return (
                    <div key={c.id} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-white/[0.06] transition-all hover:border-white/15"
                      style={{ background: `linear-gradient(135deg, ${color}18 0%, transparent 70%)` }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                        {getTypeIcon(c.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-white font-medium">{c.label}</h3>
                        <p className="text-xs text-gray-400 truncate">{c.value}</p>
                        {c.extra && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{c.extra}</p>}
                      </div>
                      {href && (
                        <a href={href} target={c.type !== 'email' ? '_blank' : undefined} rel={c.type !== 'email' ? 'noopener noreferrer' : undefined}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                          <FiExternalLink size={12} />{c.type === 'email' ? 'Email' : 'Open'}
                        </a>
                      )}
                    </div>
                  )
                })}

                {/* Button-only links */}
                {buttonContacts.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {buttonContacts.map((c) => {
                      const color = getTypeColor(c.type)
                      return (
                        <a key={c.id} href={c.value} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white border transition-all hover:scale-[1.02] hover:shadow-lg"
                          style={{ borderColor: `${color}40`, background: `${color}15`, boxShadow: `0 0 20px ${color}10` }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = `${color}30` }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = `${color}15` }}>
                          {getTypeIcon(c.type, 16)}
                          {c.label}
                          <FiExternalLink size={12} className="opacity-50" />
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-2"><FiMail className="text-gray-600" size={18} /></div>
                <p className="text-sm text-gray-500">No contact information available.</p>
              </div>
            )}
          </div>

          {/* ── Donations ── */}
          <div className="bg-[#161b22] border border-white/10 rounded-2xl p-5 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center"><FiHeart className="text-pink-400" size={18} /></div>
              <div><h2 className="text-base sm:text-lg font-bold text-white">Support Us</h2><p className="text-xs text-gray-500">Help keep LinkHub running</p></div>
            </div>
            <p className="text-xs text-gray-400 mb-4">LinkHub is a free service. If you find it useful, consider donating to help keep it running.</p>

            {isLoadingContacts ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : cryptoAddresses.length > 0 ? (
              <div className="space-y-2">
                {cryptoAddresses.map((c) => {
                  const color = getTypeColor(c.type)
                  const copied = copiedId === c.id
                  return (
                    <button key={c.id} type="button" onClick={() => copy(c.value, c.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all group cursor-pointer hover:scale-[1.01]"
                      style={{ borderColor: copied ? '#34d399' : `${color}25`, background: copied ? 'rgba(52,211,153,0.08)' : `${color}08` }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                        {getTypeIcon(c.type, 18)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{c.label}</p>
                          {c.extra && <p className="text-[9px] text-gray-500 truncate">— {c.extra}</p>}
                        </div>
                        <code className="text-[11px] text-gray-400 break-all leading-relaxed block">{c.value}</code>
                      </div>
                      <div className="flex-shrink-0 p-2 rounded-lg transition-all sm:opacity-0 sm:group-hover:opacity-100"
                        style={{ color: copied ? '#34d399' : undefined }}>
                        {copied ? <FiCheck size={15} /> : <FiCopy size={15} className="text-gray-500" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-2"><FiHeart className="text-gray-600" size={18} /></div>
                <p className="text-sm text-gray-500">No donation addresses available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
