import { useState } from 'react'
import { Link } from '../types'
import { linksApi, favoritesApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import {
  FiExternalLink,
  FiHeart,
  FiCopy,
  FiCheck,
  FiTwitter,
  FiShield,
} from 'react-icons/fi'
import { SiDiscord, SiTelegram } from 'react-icons/si'

interface LinkCardProps {
  link: Link
  onFavoriteChange?: (linkId: number, isFavorite: boolean) => void
}

export default function LinkCard({ link, onFavoriteChange }: LinkCardProps) {
  const { isAuthenticated } = useAuth()
  const [copied, setCopied] = useState(false)
  const [isFavorite, setIsFavorite] = useState(link.isFavorite || false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      await linksApi.click(link.id)
    } catch (error) {
      console.error('Failed to track click:', error)
    }
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated || isLoading) return

    setIsLoading(true)
    try {
      if (isFavorite) {
        await favoritesApi.remove(link.id)
        setIsFavorite(false)
      } else {
        await favoritesApi.add(link.id)
        setIsFavorite(true)
      }
      onFavoriteChange?.(link.id, !isFavorite)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    switch (link.status) {
      case 'ONLINE':
        return 'bg-lz-success'
      case 'OFFLINE':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  // Get pinned color - default to gold, custom if set
  const getPinnedColor = () => {
    return link.pinnedColor || '#EAB308' // Default gold (yellow-500)
  }

  const getPinnedStyle = () => {
    const color = getPinnedColor()
    return {
      backgroundColor: `${color}20`, // 20% opacity
      color: color,
      borderColor: `${color}50`,
    }
  }

  const extractCssRules = (css: string): string => {
    let raw = css.trim()
    const blockMatch = raw.match(/^\.[^{]+\{([\s\S]*)\}\s*$/)
    if (blockMatch) raw = blockMatch[1].trim()
    return raw
  }

  const linkClass = `link-card-${link.id}`
  const cssRules = link.customCss ? extractCssRules(link.customCss) : ''

  return (
    <>
      {cssRules && (
        <style dangerouslySetInnerHTML={{ __html: `.${linkClass} { ${cssRules} }` }} />
      )}
      <div className={`bg-lz-card border rounded-lg p-4 hover:border-lz-accent transition-colors ${
        link.isPinned ? 'border-yellow-500/50' : 'border-lz-border'
      } ${cssRules ? linkClass : ''}`} style={link.isPinned && link.pinnedColor ? { borderColor: `${link.pinnedColor}50` } : {}}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header with status and name */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} title={link.status} />
            <h3 className="text-sm font-semibold text-white truncate">
              {link.title}
              {link.isPinned && (
                <span 
                  className="ml-2 px-1.5 py-0.5 text-[10px] rounded border"
                  style={getPinnedStyle()}
                >
                  PINNED
                </span>
              )}
              {link.isScam && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-500 rounded">
                  SCAM
                </span>
              )}
            </h3>
          </div>

          {/* Description */}
          {link.description && (
            <p className="text-xs text-lz-muted mb-2 line-clamp-2">
              {link.description}
            </p>
          )}

          {/* URLs */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-lz-darker text-xs text-lz-text hover:text-white rounded transition-colors"
            >
              <FiExternalLink size={12} />
              Clear
            </a>
            
            {link.mirrorUrl && (
              <a
                href={link.mirrorUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-xs text-purple-400 hover:text-purple-300 rounded transition-colors"
              >
                <FiShield size={12} />
                TOR
              </a>
            )}

            {link.altUrl && (
              <a
                href={link.altUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/20 text-xs text-orange-400 hover:text-orange-300 rounded transition-colors"
              >
                Alt
              </a>
            )}

            {link.backupUrl && (
              <a
                href={link.backupUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-xs text-blue-400 hover:text-blue-300 rounded transition-colors"
              >
                BC
              </a>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {link.telegramUrl && (
              <a
                href={link.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lz-muted hover:text-[#0088cc] transition-colors"
                title="Telegram"
              >
                <SiTelegram size={14} />
              </a>
            )}
            {link.discordUrl && (
              <a
                href={link.discordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lz-muted hover:text-[#5865F2] transition-colors"
                title="Discord"
              >
                <SiDiscord size={14} />
              </a>
            )}
            {link.twitterUrl && (
              <a
                href={link.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lz-muted hover:text-white transition-colors"
                title="Twitter"
              >
                <FiTwitter size={14} />
              </a>
            )}
            {link.hasMirror && (
              <span className="text-[10px] text-purple-400 uppercase px-1.5 py-0.5 bg-purple-500/20 rounded">
                TOR
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => handleCopy(link.url)}
            className="p-2 rounded bg-lz-darker text-lz-muted hover:text-white transition-colors"
            title="Copy URL"
          >
            {copied ? <FiCheck size={14} className="text-lz-success" /> : <FiCopy size={14} />}
          </button>
          
          {isAuthenticated && (
            <button
              onClick={handleFavorite}
              disabled={isLoading}
              className={`p-2 rounded bg-lz-darker transition-colors ${
                isFavorite 
                  ? 'text-red-500 hover:text-red-400' 
                  : 'text-lz-muted hover:text-red-500'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <FiHeart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
