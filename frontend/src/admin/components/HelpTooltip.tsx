import { useState, useRef } from 'react'
import { FiHelpCircle, FiExternalLink } from 'react-icons/fi'

interface HelpTooltipProps {
  content: string
  link?: {
    url: string
    label: string
  }
}

export default function HelpTooltip({ content, link }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(true)
  }

  const hideTooltip = () => {
    // Small delay before hiding to allow mouse to move to tooltip
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 150)
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={() => setIsVisible(!isVisible)}
        className="p-0.5 text-lz-muted hover:text-lz-accent transition-colors"
      >
        <FiHelpCircle size={14} />
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div 
          className="absolute left-6 top-0 z-50 w-64 animate-in fade-in duration-150"
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {/* Invisible bridge to connect button and tooltip */}
          <div className="absolute -left-2 top-0 w-3 h-full" />
          <div className="bg-[#1a1d24] border border-white/10 rounded-lg shadow-xl p-3">
            <p className="text-xs text-gray-300 leading-relaxed">{content}</p>
            {link && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-lz-accent hover:text-lz-accent/80 transition-colors"
              >
                <FiExternalLink size={11} />
                {link.label}
              </a>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute left-0 top-2 -translate-x-1 w-2 h-2 bg-[#1a1d24] border-l border-b border-white/10 rotate-45" />
        </div>
      )}
    </div>
  )
}
