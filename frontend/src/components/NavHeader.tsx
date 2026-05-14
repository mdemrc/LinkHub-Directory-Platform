import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Category } from '../types'
import DynamicIcon from './DynamicIcon'
import {
  FiHome,
  FiPlus,
  FiMenu,
  FiX,
  FiChevronDown,
  FiGlobe,
  FiSearch,
  FiAlertTriangle,
  FiMail,
  FiHelpCircle,
  FiRefreshCw,
  FiInfo,
  FiZap,
  FiEye,
  FiDollarSign,
} from 'react-icons/fi'

interface NavHeaderProps {
  categories: Category[]
}

export default function NavHeader({ categories }: NavHeaderProps) {
  const location = useLocation()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const isActive = (path: string) => location.pathname === path

  // Categories from /navigation endpoint are already filtered by showInNav on the server
  const navCategories = categories

  return (
    <header className="bg-lz-header border-b border-lz-border">
      <div className="flex items-center h-12 md:h-10 px-2 xl:pr-48">
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 px-3 h-full lg:w-52 flex-shrink-0 border-r border-lz-border hover:bg-lz-bg/50 transition-all duration-300"
        >
          <div className="relative w-7 h-7 flex-shrink-0">
            <div className="absolute inset-0 bg-lz-accent/20 rounded-lg blur-sm group-hover:bg-lz-accent/30 transition-all duration-300" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#00d4ff] to-[#0088cc] rounded-lg flex items-center justify-center shadow-lg shadow-lz-accent/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 drop-shadow-sm">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
          </div>
          <div className="hidden sm:flex items-baseline gap-0">
            <span className="text-base font-extrabold text-white tracking-tight">LINK</span>
            <span className="text-base font-extrabold text-lz-accent tracking-tight">ZONE</span>
          </div>
        </Link>

        {/* Home */}
        <Link
          to="/"
          className={`flex items-center gap-1 px-3 h-full text-xs font-medium transition-colors border-r border-lz-border ${
            isActive('/') 
              ? 'bg-lz-accent text-white' 
              : 'text-lz-text-muted hover:text-white hover:bg-lz-bg'
          }`}
        >
          <FiHome size={14} />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:contents" aria-label="Main navigation">
          {/* Category Tabs - with subcategory dropdowns */}
          {navCategories.map((cat) => {
            const regularChildren = cat.children?.filter((child) => !child.countryCode) || []
            const hasDropdownChildren = regularChildren.length > 0
            const isChildActive = cat.children?.some(
              (child) => location.pathname === `/category/${child.slug}`
            )

            if (hasDropdownChildren) {
              return (
                <div
                  key={cat.id}
                  className="relative h-full"
                  onMouseEnter={() => setOpenDropdown(`cat-${cat.id}`)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    to={`/category/${cat.slug}`}
                    className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-colors border-r border-lz-border whitespace-nowrap ${
                      location.pathname === `/category/${cat.slug}` || isChildActive
                        ? 'bg-lz-accent text-white'
                        : 'text-lz-text-muted hover:text-white hover:bg-lz-bg'
                    }`}
                  >
                    {cat.icon && <DynamicIcon name={cat.icon} size={14} />}
                    <span>{cat.name}</span>
                    <FiChevronDown size={10} className="ml-0.5 opacity-60" />
                  </Link>
                  {openDropdown === `cat-${cat.id}` && (
                    <div className="absolute left-0 top-full bg-[#161b22] border border-lz-border rounded shadow-xl min-w-[160px] z-50 py-1">
                      {regularChildren.map((child) => (
                        <Link
                          key={child.id}
                          to={`/category/${child.slug}`}
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs ${
                            location.pathname === `/category/${child.slug}`
                              ? 'text-lz-accent bg-lz-accent/10'
                              : 'text-gray-200 hover:text-white hover:bg-[#2a303c]'
                          }`}
                        >
                          {child.icon && <DynamicIcon name={child.icon} size={12} />}
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-colors border-r border-lz-border whitespace-nowrap ${
                  location.pathname === `/category/${cat.slug}` || isChildActive
                    ? 'bg-lz-accent text-white'
                    : 'text-lz-text-muted hover:text-white hover:bg-lz-bg'
                }`}
              >
                {cat.icon && <DynamicIcon name={cat.icon} size={14} />}
                <span>{cat.name}</span>
              </Link>
            )
          })}

        </nav>

        {/* Spacer pushes utility items to the right */}
        <div className="hidden md:block flex-1" />

        {/* Right-side utility nav */}
        <nav className="hidden md:flex items-center h-full border-l border-lz-border/60 ml-0" aria-label="Utility navigation">
          {/* Subtle separator dot */}

          {/* Advertising Dropdown */}
          <div
            className="relative h-full"
            onMouseEnter={() => setOpenDropdown('ads')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              className={`flex items-center gap-1.5 px-3.5 h-full text-xs font-medium transition-all whitespace-nowrap ${
                location.pathname.startsWith('/advertising')
                  ? 'bg-lz-accent/10 text-lz-accent border-b-2 border-lz-accent'
                  : openDropdown === 'ads' ? 'text-amber-300 bg-white/[0.03]' : 'text-gray-400 hover:text-amber-300 hover:bg-white/[0.03]'
              }`}
            >
              <FiZap size={13} />
              <span>Advertising</span>
              <FiChevronDown size={10} className="ml-0.5 opacity-50" />
            </button>
            {openDropdown === 'ads' && (
              <div className="absolute left-0 top-full bg-[#161b22] border border-lz-border rounded-lg shadow-2xl min-w-[220px] z-50 py-1.5">
                <Link to="/advertising" className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <FiDollarSign size={13} className="text-amber-400" />
                  <div>
                    <div className="font-medium">Advertising Plans</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">View all ad packages & order</div>
                  </div>
                </Link>
                <hr className="border-lz-border/30 my-1.5 mx-2" />
                <Link to="/advertising/preview" className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors group">
                  <FiEye size={13} className="text-lz-accent" />
                  <div>
                    <div className="font-medium flex items-center gap-1.5">
                      Live Preview
                      <span className="text-[8px] font-bold px-1.5 py-[1px] bg-lz-accent/15 text-lz-accent rounded-full uppercase tracking-wider">New</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">See how your ad will look on the site</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Add Link */}
          <Link
            to="/submit"
            className={`flex items-center gap-1.5 px-3.5 h-full text-xs font-medium transition-all whitespace-nowrap ${
              location.pathname === '/submit'
                ? 'bg-lz-accent/10 text-lz-accent border-b-2 border-lz-accent'
                : 'text-gray-400 hover:text-emerald-300 hover:bg-white/[0.03]'
            }`}
          >
            <FiPlus size={13} />
            <span className="hidden lg:inline">Add Link</span>
          </Link>

          {/* Information Dropdown */}
          <div 
            className="relative h-full"
            onMouseEnter={() => setOpenDropdown('info')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button 
              className={`flex items-center gap-1.5 px-3.5 h-full text-xs font-medium transition-all ${
                openDropdown === 'info' ? 'text-white bg-white/[0.05]' : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <FiInfo size={13} />
              <span>Information</span>
              <FiChevronDown size={10} className="ml-0.5 opacity-50" />
            </button>
            {openDropdown === 'info' && (
              <div className="absolute right-0 top-full bg-[#161b22] border border-lz-border rounded-lg shadow-2xl min-w-[180px] z-50 py-1.5">
                <Link to="/scam" className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <FiAlertTriangle size={13} className="text-red-400" />
                  Scam/Fake
                </Link>
                <Link to="/contact" className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <FiMail size={13} className="text-cyan-400" />
                  Contact
                </Link>
                <Link to="/faq" className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <FiHelpCircle size={13} className="text-amber-400" />
                  FAQ
                </Link>
                <hr className="border-lz-border/30 my-1.5 mx-2" />
                <Link to="/changelog" className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <FiRefreshCw size={13} className="text-violet-400" />
                  Changelog
                </Link>
              </div>
            )}
          </div>

          {/* Language */}
          <button className="flex items-center gap-1 px-3 h-full text-xs font-medium text-gray-500 hover:text-white hover:bg-white/[0.03] transition-all border-l border-lz-border/40">
            <FiGlobe size={14} />
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-3 text-lz-text-muted hover:text-white"
        >
          {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-lz-bg border-t border-lz-border">
          {/* Search */}
          <div className="p-3 border-b border-lz-border">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 pr-10 bg-lz-header border border-lz-border rounded-lg text-sm text-white placeholder-lz-text-muted focus:outline-none focus:border-lz-accent"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-lz-accent">
                <FiSearch size={16} />
              </button>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="p-2 space-y-1">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
            >
              <FiHome size={16} />
              Home
            </Link>
            
            {/* Categories Section */}
            <div className="py-2">
              <p className="px-4 text-xs uppercase text-lz-text-muted tracking-wider mb-2">Categories</p>
              {navCategories.map((cat) => {
                const mobileChildren = cat.children?.filter((child) => !child.countryCode) || []
                return (
                  <div key={cat.id}>
                    <Link
                      to={`/category/${cat.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
                    >
                      {cat.icon && <DynamicIcon name={cat.icon} size={16} />}
                      {cat.name}
                    </Link>
                    {mobileChildren.length > 0 && (
                      <div className="ml-6 border-l border-lz-border pl-2">
                        {mobileChildren.map((child) => (
                          <Link
                            key={child.id}
                            to={`/category/${child.slug}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
                          >
                            {child.icon && <DynamicIcon name={child.icon} size={14} />}
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-lz-border my-2" />

            {/* Quick Links */}
            <Link 
              to="/advertising" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
            >
              <FiZap size={16} className="text-amber-400" />
              Advertising
            </Link>
            <Link 
              to="/advertising/preview" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 ml-4 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
            >
              <FiEye size={16} className="text-lz-accent" />
              Live Preview
              <span className="text-[9px] font-bold px-1.5 py-[1px] bg-lz-accent/15 text-lz-accent rounded-full uppercase">New</span>
            </Link>
            <Link 
              to="/submit" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-lz-accent hover:bg-lz-header rounded-lg"
            >
              <FiPlus size={16} />
              Add Link
            </Link>
            <Link 
              to="/scam" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
            >
              <FiAlertTriangle size={16} className="text-red-400" />
              Scam/Fake
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
            >
              <FiMail size={16} className="text-cyan-400" />
              Contact
            </Link>
            <Link 
              to="/faq" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
            >
              <FiHelpCircle size={16} className="text-amber-400" />
              FAQ
            </Link>
            <Link 
              to="/changelog" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-lz-text-muted hover:text-white rounded-lg hover:bg-lz-header"
            >
              <FiRefreshCw size={16} className="text-violet-400" />
              Changelog
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
