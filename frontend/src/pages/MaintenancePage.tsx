import { FiTool } from 'react-icons/fi'
import { useSettings } from '../contexts/SettingsContext'

export default function MaintenancePage() {
  const { settings } = useSettings()

  return (
    <div className="min-h-screen bg-gradient-to-b from-lz-bg to-lz-darker flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-lz-accent/20 flex items-center justify-center">
            <FiTool className="w-12 h-12 text-lz-accent animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-lz-muted text-lg mb-8">
          {settings.site_name || 'Our site'} is currently undergoing scheduled maintenance. 
          We'll be back shortly with improvements!
        </p>

        {/* Status Card */}
        <div className="bg-lz-card border border-lz-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-yellow-500 font-medium">Maintenance in Progress</span>
          </div>
          <p className="text-lz-muted text-sm">
            Our team is working hard to improve your experience. 
            Please check back in a few moments.
          </p>
        </div>

        {/* Contact Info */}
        {(settings.discord_url || settings.telegram_url || settings.contact_email) && (
          <div className="text-sm text-lz-muted">
            <p className="mb-2">Questions? Contact us:</p>
            <div className="flex items-center justify-center gap-4">
              {settings.discord_url && (
                <a 
                  href={String(settings.discord_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lz-accent hover:underline"
                >
                  Discord
                </a>
              )}
              {settings.telegram_url && (
                <a 
                  href={String(settings.telegram_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lz-accent hover:underline"
                >
                  Telegram
                </a>
              )}
              {settings.contact_email && (
                <a 
                  href={`mailto:${settings.contact_email}`}
                  className="text-lz-accent hover:underline"
                >
                  Email
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
