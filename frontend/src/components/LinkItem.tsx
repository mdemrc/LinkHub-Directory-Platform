import { useState } from 'react'
import { Link as LinkType } from '../types'
import FlagIcon from './FlagIcon'
import { FiShield } from 'react-icons/fi'

interface LinkItemProps {
  link: LinkType
  hideFlag?: boolean
}

export default function LinkItem({ link, hideFlag }: LinkItemProps) {
  const [torCopied, setTorCopied] = useState(false)

  // Determine the primary URL to open (public only)
  const primaryUrl = link.url || ''

  const handleClick = () => {
    // If public URL exists, open it
    if (primaryUrl) {
      window.open(primaryUrl, '_blank', 'noopener,noreferrer')
      return
    }
    // If only Mirror URL, copy it to clipboard
    if (link.mirrorUrl) {
      copyTorUrl()
    }
  }

  const copyTorUrl = () => {
    if (!link.mirrorUrl) return
    navigator.clipboard.writeText(link.mirrorUrl).then(() => {
      setTorCopied(true)
      setTimeout(() => setTorCopied(false), 2000)
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = link.mirrorUrl!
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setTorCopied(true)
      setTimeout(() => setTorCopied(false), 2000)
    })
  }

  const handleTorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyTorUrl()
  }

  // Status color
  const getStatusColor = () => {
    if (link.isScam) return 'bg-red-500'
    switch (link.status) {
      case 'ONLINE':
        return 'bg-green-500'
      case 'OFFLINE':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  // Text color based on status
  const getTextColor = () => {
    if (link.isPinned && link.textColor) return '' // handled via inline style
    if (link.isPinned) return 'text-lz-highlight hover:text-red-400'
    if (link.isScam) return 'text-red-500 line-through'
    switch (link.status) {
      case 'ONLINE':
        return 'text-lz-link hover:text-lz-link-hover'
      case 'OFFLINE':
        return 'text-white/25 hover:text-white/40'
      default:
        return 'text-lz-link hover:text-lz-link-hover'
    }
  }

  const parseCss = (css: string): React.CSSProperties => {
    const style: Record<string, string> = {}
    css.split(';').forEach(rule => {
      const [prop, val] = rule.split(':').map(s => s.trim())
      if (prop && val) {
        const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        style[camel] = val
      }
    })
    return style
  }

  const inlineTextStyle: React.CSSProperties = {
    ...(link.isPinned && link.textColor ? { color: link.textColor } : {}),
    ...(link.isPinned && link.customCss ? parseCss(link.customCss) : {}),
  }

  return (
    <div
      className="flex items-center gap-1.5 py-1 cursor-pointer group border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] -mx-1 px-1 rounded-sm transition-colors"
      onClick={handleClick}
    >
      {/* Premium Star */}
      {link.isPinned && (
        <span
          className="flex-shrink-0 leading-none"
          style={{
            color: link.pinnedColor || '#EAB308',
            fontSize: 'var(--pinned-badge-size, 14px)',
          }}
        >★</span>
      )}

      {/* Status Dot (hidden for pinned links) */}
      {!link.isPinned && (
        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} flex-shrink-0`} />
      )}

      {/* Country Flag */}
      {!hideFlag && link.countryCode && link.countryCode !== 'GLOBAL' && (
        <FlagIcon code={link.countryCode} useCssVar />
      )}

      {/* Link Name */}
      <span
        className={`text-xs font-semibold ${getTextColor()} transition-colors truncate`}
        style={inlineTextStyle}
      >
        {link.title}
      </span>

      {/* Scam Badge */}
      {link.isScam && (
        <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded uppercase leading-none flex-shrink-0">
          Scam
        </span>
      )}

      {/* Mirror link button - copy to clipboard when both URLs exist */}
      {link.mirrorUrl && link.url && (
        <button
          onClick={handleTorClick}
          className={`flex items-center gap-0.5 text-[10px] ${torCopied ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20'} border px-1 py-0.5 rounded transition-colors flex-shrink-0`}
          title={`Copy Mirror: ${link.mirrorUrl}`}
        >
          <FiShield size={9} />
          {torCopied ? 'Copied!' : 'Mirror'}
        </button>
      )}

      {/* Mirror-only indicator - copy on click since the mirror URL may not open in a regular browser */}
      {link.mirrorUrl && !link.url && (
        <button
          onClick={handleTorClick}
          className={`flex items-center gap-0.5 text-[10px] ${torCopied ? 'text-green-400' : 'text-purple-400 hover:text-purple-300'} flex-shrink-0`}
          title={`Copy Mirror: ${link.mirrorUrl}`}
        >
          <FiShield size={9} />
          {torCopied ? 'Copied!' : '[Mirror]'}
        </button>
      )}
    </div>
  )
}
