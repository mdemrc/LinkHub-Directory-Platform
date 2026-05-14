import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Category } from '../types'
import DynamicIcon from './DynamicIcon'
import {
  FiHome,
  FiPlus,
  FiHeart,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
  FiGlobe,
  FiSettings,
  FiLink,
  FiDollarSign,
  FiRefreshCw,
  FiAlertTriangle,
  FiMail,
  FiHelpCircle,
} from 'react-icons/fi'

interface HeaderProps {
  boards: Category[]
}

export default function Header({ boards }: HeaderProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()
  const { currentLanguage, languages, changeLanguage } = useLanguage()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-lz-darker border-b border-lz-border sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lz-accent rounded flex items-center justify-center shadow-lg shadow-lz-accent/20">
              <FiLink className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              LinkHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-lz-accent text-white' 
                  : 'text-lz-muted hover:text-white hover:bg-lz-card'
              }`}
            >
              <FiHome className="inline-block mr-1.5 -mt-0.5" size={16} />
              {t('nav.home')}
            </Link>

            {/* Dynamic Category Links */}
            {boards.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === `/category/${cat.slug}`
                    ? 'bg-lz-accent text-white'
                    : 'text-lz-muted hover:text-white hover:bg-lz-card'
                }`}
              >
                {cat.icon && <DynamicIcon name={cat.icon} size={16} />}
                {cat.name}
              </Link>
            ))}

            {/* Advertising */}
            <Link
              to="/advertising"
              className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === '/advertising'
                  ? 'bg-lz-accent text-white'
                  : 'text-lz-muted hover:text-white hover:bg-lz-card'
              }`}
            >
              <FiDollarSign size={15} />
              Advertising
            </Link>

            {/* Add Link Button */}
            <Link
              to="/submit"
              className="ml-2 px-3 py-2 bg-lz-success hover:bg-lz-success/80 text-white rounded text-sm font-medium transition-colors"
            >
              <FiPlus className="inline-block mr-1 -mt-0.5" size={16} />
              {t('nav.addLink')}
            </Link>

            {/* Information dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded text-sm font-medium text-lz-muted hover:text-white hover:bg-lz-card transition-colors flex items-center gap-1">
                {t('nav.information')}
                <FiChevronDown size={14} />
              </button>
              <div className="absolute left-0 top-full pt-1 hidden group-hover:block">
                <div className="bg-lz-card border border-lz-border rounded shadow-xl min-w-[180px] py-1">
                  <Link to="/scam" className="flex items-center gap-2.5 px-4 py-2 text-sm text-lz-muted hover:text-white hover:bg-lz-darker">
                    <FiAlertTriangle size={14} className="text-red-400" />
                    {t('page.scam')}
                  </Link>
                  <Link to="/contact" className="flex items-center gap-2.5 px-4 py-2 text-sm text-lz-muted hover:text-white hover:bg-lz-darker">
                    <FiMail size={14} className="text-cyan-400" />
                    {t('page.contact')}
                  </Link>
                  <Link to="/faq" className="flex items-center gap-2.5 px-4 py-2 text-sm text-lz-muted hover:text-white hover:bg-lz-darker">
                    <FiHelpCircle size={14} className="text-amber-400" />
                    {t('page.faq')}
                  </Link>
                  <hr className="border-lz-border my-1" />
                  <Link to="/changelog" className="flex items-center gap-2.5 px-4 py-2 text-sm text-lz-muted hover:text-white hover:bg-lz-darker">
                    <FiRefreshCw size={14} className="text-violet-400" />
                    {t('page.changelog')}
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="p-2 rounded text-lz-muted hover:text-white hover:bg-lz-card transition-colors"
              >
                <FiGlobe size={18} />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-lz-card border border-lz-border rounded shadow-xl min-w-[140px] z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        changeLanguage(lang.code)
                        setIsLangDropdownOpen(false)
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-lz-darker ${
                        currentLanguage === lang.code ? 'text-lz-accent' : 'text-lz-muted hover:text-white'
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons / User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-2 rounded text-lz-muted hover:text-white hover:bg-lz-card transition-colors"
                >
                  <FiUser size={18} />
                  <span className="hidden sm:block text-sm">{user?.username}</span>
                  <FiChevronDown size={14} />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-lz-card border border-lz-border rounded shadow-xl min-w-[160px] z-50">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-lz-muted hover:text-white hover:bg-lz-darker"
                    >
                      <FiUser size={14} />
                      {t('nav.profile')}
                    </Link>
                    <Link
                      to="/favorites"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-lz-muted hover:text-white hover:bg-lz-darker"
                    >
                      <FiHeart size={14} />
                      {t('nav.favorites')}
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/toptip"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-lz-muted hover:text-white hover:bg-lz-darker"
                      >
                        <FiSettings size={14} />
                        Admin
                      </Link>
                    )}
                    <hr className="border-lz-border my-1" />
                    <button
                      onClick={() => {
                        logout()
                        setIsUserDropdownOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-lz-darker"
                    >
                      <FiLogOut size={14} />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              null
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded text-lz-muted hover:text-white hover:bg-lz-card transition-colors"
            >
              {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-lz-border py-4">
            <nav className="flex flex-col gap-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  isActive('/') ? 'bg-lz-accent text-white' : 'text-lz-muted'
                }`}
              >
                <FiHome className="inline-block mr-2" size={16} />
                {t('nav.home')}
              </Link>
              
              {boards.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    location.pathname === `/category/${cat.slug}` ? 'bg-lz-accent text-white' : 'text-lz-muted'
                  }`}
                >
                  {cat.icon && <span className="mr-2">{cat.icon}</span>}
                  {cat.name}
                </Link>
              ))}

              <hr className="border-lz-border my-2" />

              <Link
                to="/advertising"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-lz-muted"
              >
                <FiDollarSign size={15} />
                Advertising
              </Link>
              <Link
                to="/submit"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 px-3 py-2 bg-lz-success text-white rounded text-sm font-medium text-center"
              >
                <FiPlus className="inline-block mr-1" size={16} />
                {t('nav.addLink')}
              </Link>
              <Link
                to="/scam"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-lz-muted"
              >
                <FiAlertTriangle size={14} className="text-red-400" />
                {t('page.scam')}
              </Link>
              <Link
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-lz-muted"
              >
                <FiMail size={14} className="text-cyan-400" />
                {t('page.contact')}
              </Link>
              <Link
                to="/faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-lz-muted"
              >
                <FiHelpCircle size={14} className="text-amber-400" />
                {t('page.faq')}
              </Link>
              <Link
                to="/changelog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-lz-muted"
              >
                <FiRefreshCw size={14} className="text-violet-400" />
                {t('page.changelog')}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
