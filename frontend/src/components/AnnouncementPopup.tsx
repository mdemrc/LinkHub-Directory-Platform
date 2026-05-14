import { useState, useEffect, useCallback } from 'react'
import { FiX, FiBell } from 'react-icons/fi'
import { Announcement } from '../types'
import { announcementsApi } from '../lib/api'

const DISMISSED_KEY = 'lz_dismissed_announcements'

function getDismissed(): Record<number, string> {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}')
  } catch {
    return {}
  }
}

function setDismissed(dismissed: Record<number, string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed))
}

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await announcementsApi.getActive()
      const data = Array.isArray(res.data) ? res.data : res.data?.value || []
      const dismissed = getDismissed()

      // Filter: only show on page load + not dismissed (or if updated since last dismissal)
      const pageLoadAnnouncements = data
        .filter((a: Announcement) => {
          if (!a.showOnPageLoad) return false
          // showEveryVisit: always show, regardless of localStorage
          if (a.showEveryVisit) return true
          const dismissedAt = dismissed[a.id]
          if (!dismissedAt) return true
          // If the announcement was updated AFTER it was dismissed, show it again
          return new Date(a.updatedAt) > new Date(dismissedAt)
        })
        .sort((a: Announcement, b: Announcement) => b.priority - a.priority)

      if (pageLoadAnnouncements.length > 0) {
        setAnnouncements(pageLoadAnnouncements)
        setIsVisible(true)
      }
    } catch (error) {
      // Announcements are optional
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const currentAnnouncement = announcements[currentIndex]

  const handleDismiss = useCallback(() => {
    if (!currentAnnouncement) return

    // Only track dismissal for announcements that don't repeat every visit
    if (!currentAnnouncement.showEveryVisit) {
      const dismissed = getDismissed()
      dismissed[currentAnnouncement.id] = currentAnnouncement.updatedAt
      setDismissed(dismissed)
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setIsVisible(false)
    }
  }, [currentAnnouncement, currentIndex, announcements.length])

  // Auto-close timer
  useEffect(() => {
    if (!currentAnnouncement?.autoClose || !isVisible) return

    const duration = currentAnnouncement.autoCloseDuration || 5000
    const timer = setTimeout(handleDismiss, duration)
    return () => clearTimeout(timer)
  }, [currentAnnouncement, isVisible, handleDismiss])

  if (!isVisible || !currentAnnouncement) return null

  // Render based on type
  if (currentAnnouncement.type === 'TOAST') {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] max-w-sm animate-slide-up">
        <div
          className="rounded-xl border shadow-2xl p-4 bg-lz-bg-light/95 backdrop-blur-md border-white/10"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-lz-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiBell size={20} className="text-lz-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white">{currentAnnouncement.title}</h4>
              <p className="text-xs mt-1 text-lz-muted line-clamp-3 whitespace-pre-wrap">{currentAnnouncement.content}</p>
            </div>
            {currentAnnouncement.allowManualClose && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors text-lz-muted hover:text-white"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          {announcements.length > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-lz-muted opacity-50">
                {currentIndex + 1} / {announcements.length}
              </span>
              <button onClick={handleDismiss} className="text-[10px] text-lz-accent font-bold uppercase tracking-wider">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentAnnouncement.type === 'BANNER') {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down shadow-lg border-b border-white/10"
      >
        <div className="bg-lz-accent text-white py-2 px-4">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="bg-white/20 p-1 rounded">
                <FiBell size={14} />
              </div>
              <p className="text-sm font-bold truncate">{currentAnnouncement.title}</p>
              <div className="w-px h-3 bg-white/30 hidden sm:block" />
              <p className="text-xs opacity-90 truncate hidden sm:block">{currentAnnouncement.content}</p>
            </div>
            <div className="flex items-center gap-3">
              {announcements.length > 1 && (
                <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded">
                  {currentIndex + 1}/{announcements.length}
                </span>
              )}
              {currentAnnouncement.allowManualClose && (
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default: MODAL
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-lz-bg/80 backdrop-blur-sm animate-fade-in"
        onClick={currentAnnouncement.allowManualClose ? handleDismiss : undefined}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-lz-bg-light border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lz-accent/20 rounded-xl flex items-center justify-center">
              <FiBell size={20} className="text-lz-accent" />
            </div>
            <h3 className="font-bold text-lg text-white">{currentAnnouncement.title}</h3>
          </div>
          {currentAnnouncement.allowManualClose && (
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl hover:bg-white/5 text-lz-muted hover:text-white transition-all"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm leading-relaxed text-lz-muted whitespace-pre-wrap">
            {currentAnnouncement.content}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between">
          <div>
            {announcements.length > 1 && (
              <span className="text-[10px] font-bold text-lz-muted opacity-40 uppercase tracking-widest">
                Announcement {currentIndex + 1} of {announcements.length}
              </span>
            )}
          </div>
          {currentAnnouncement.allowManualClose && (
            <button
              onClick={handleDismiss}
              className="px-6 py-2.5 bg-lz-accent hover:bg-lz-accent/80 rounded-xl text-xs font-bold text-lz-bg uppercase tracking-wider transition-all shadow-lg shadow-lz-accent/20"
            >
              Understand
            </button>
          )}
        </div>

        {/* Auto-close progress bar */}
        {currentAnnouncement.autoClose && (
          <div className="h-0.5 bg-white/10">
            <div
              className="h-full bg-lz-accent transition-all ease-linear"
              style={{
                animation: `shrink ${currentAnnouncement.autoCloseDuration || 5000}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
      `}</style>
    </div>
  )
}
