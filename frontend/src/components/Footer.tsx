import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiGlobe, FiMail, FiLink, FiHeadphones } from 'react-icons/fi'
import { SiTelegram, SiDiscord, SiGithub, SiReddit, SiSignal } from 'react-icons/si'
import { useSettings, SocialLink } from '../contexts/SettingsContext'

const socialColors: Record<string, string> = {
  telegram: '#2AABEE',
  telegram_group: '#2AABEE',
  telegram_channel: '#2AABEE',
  signal: '#3A76F0',
  discord: '#5865F2',
  live_support: '#D4A030',
}

const socialIconMap: Record<string, React.ReactNode> = {
  telegram: <SiTelegram size={18} />,
  telegram_group: <SiTelegram size={18} />,
  telegram_channel: <SiTelegram size={18} />,
  signal: <SiSignal size={18} />,
  live_support: <FiHeadphones size={18} />,
  discord: <SiDiscord size={18} />,
  twitter: <span className="font-bold text-base">𝕏</span>,
  github: <SiGithub size={18} />,
  reddit: <SiReddit size={18} />,
  email: <FiMail size={18} />,
  website: <FiGlobe size={18} />,
}

function getSocialHref(link: SocialLink): string {
  if (link.type === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`
  }
  return link.url
}

export default function Footer() {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const currentYear = new Date().getFullYear()
  const socialLinks = settings.social_links || []

  return (
    <footer className="bg-lz-darker border-t border-lz-border mt-8">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-lz-accent rounded flex items-center justify-center shadow-lg shadow-lz-accent/20">
                <FiLink className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">LinkHub</span>
            </div>
            <p className="text-sm text-lz-muted">
              The easiest way to find quality websites, useful tools, forums, and online stores in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-lz-muted hover:text-white transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-lz-muted hover:text-white transition-colors">
                  {t('nav.addLink')}
                </Link>
              </li>
              <li>
                <Link to="/advertising" className="text-lz-muted hover:text-white transition-colors">
                  Advertising
                </Link>
              </li>
              <li>
                <Link to="/changelog" className="text-lz-muted hover:text-white transition-colors">
                  {t('page.changelog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Information</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/scam" className="text-lz-muted hover:text-white transition-colors">
                  {t('page.scam')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-lz-muted hover:text-white transition-colors">
                  {t('page.contact')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-lz-muted hover:text-white transition-colors">
                  {t('page.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          {socialLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Connect</h4>
              <div className="flex items-center gap-3 flex-wrap">
                {socialLinks.map((link, index) => {
                  const brandColor = socialColors[link.type]
                  return (
                    <a
                      key={index}
                      href={getSocialHref(link)}
                      title={link.label || link.type}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                        brandColor ? 'text-white' : 'text-lz-muted bg-lz-card hover:text-white hover:bg-lz-accent'
                      }`}
                      style={brandColor ? { backgroundColor: brandColor } : undefined}
                      {...(link.type !== 'email' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {socialIconMap[link.type] || <FiGlobe size={18} />}
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-lz-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-lz-muted">
            © {currentYear} LinkHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-lz-muted">
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
