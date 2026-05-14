import { useState } from 'react'

interface FlagIconProps {
  code: string
  size?: number
  className?: string
  useCssVar?: boolean // When true, uses --flag-size CSS variable instead of size prop
}

/**
 * Converts a 2-letter country code into its emoji flag.
 * Each letter is mapped to a Regional Indicator Symbol.
 * e.g. "US" → 🇺🇸, "TR" → 🇹🇷
 */
function toEmojiFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join('')
}

/**
 * Renders a country flag using flagcdn.com SVG with emoji fallback.
 * Supports ISO 3166-1 alpha-2 codes (US, TR, DE, etc.)
 * and a special "GLOBAL" code which shows a globe emoji.
 */
export default function FlagIcon({ code, size = 20, className = '', useCssVar }: FlagIconProps) {
  const [imgError, setImgError] = useState(false)

  if (!code) return null

  const upperCode = code.toUpperCase()

  // When useCssVar is true, use CSS variable for sizing
  const effectiveSize = size

  // Special case for GLOBAL
  if (upperCode === 'GLOBAL') {
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
        style={useCssVar
          ? { width: 'var(--flag-size, 14px)', height: 'calc(var(--flag-size, 14px) * 0.75)', fontSize: 'calc(var(--flag-size, 14px) * 0.75)' }
          : { width: effectiveSize, height: effectiveSize * 0.75, fontSize: effectiveSize * 0.75 }}
        role="img"
        aria-label="Global"
      >
        🌐
      </span>
    )
  }

  // If CDN image failed, show emoji flag
  if (imgError) {
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
        style={useCssVar
          ? { width: 'var(--flag-size, 14px)', height: 'calc(var(--flag-size, 14px) * 0.75)', fontSize: 'calc(var(--flag-size, 14px) * 0.7)' }
          : { width: effectiveSize, height: effectiveSize * 0.75, fontSize: effectiveSize * 0.7 }}
        role="img"
        aria-label={`${upperCode} flag`}
      >
        {toEmojiFlag(upperCode)}
      </span>
    )
  }

  const lowerCode = code.toLowerCase()

  return (
    <img
      src={`https://flagcdn.com/${lowerCode}.svg`}
      alt={`${upperCode} flag`}
      className={`inline-block object-cover rounded-sm flex-shrink-0 ${className}`}
      loading="lazy"
      onError={() => setImgError(true)}
      {...(useCssVar
        ? { style: { width: 'var(--flag-size, 14px)', height: 'calc(var(--flag-size, 14px) * 0.75)' } }
        : { width: effectiveSize, height: Math.round(effectiveSize * 0.75) }
      )}
    />
  )
}
