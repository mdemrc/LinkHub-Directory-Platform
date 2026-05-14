import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/BoardPage'
import MaintenancePage from './pages/MaintenancePage'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'

const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const SubmitLinkPage = lazy(() => import('./pages/SubmitLinkPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const AdOrderPage = lazy(() => import('./pages/AdOrderPage'))
const LivePreviewPage = lazy(() => import('./pages/LivePreviewPage'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const AdvertisingPage = lazy(() => import('./pages/AdvertisingPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const ScamPage = lazy(() => import('./pages/ScamPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PageView = lazy(() => import('./pages/PageView'))
const TermsPage = lazy(() =>
  import('./pages/LegalPage').then((m) => ({ default: m.TermsPage }))
)
const PrivacyPage = lazy(() =>
  import('./pages/LegalPage').then((m) => ({ default: m.PrivacyPage }))
)
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'))

// Admin imports (lazy loaded)
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AdminCategories = lazy(() => import('./admin/AdminCategories'))
const AdminCategoryOrder = lazy(() => import('./admin/AdminCategoryOrder'))
const AdminLinks = lazy(() => import('./admin/AdminLinks'))
const AdminAds = lazy(() => import('./admin/AdminAds'))
const AdminAdOrder = lazy(() => import('./admin/AdminAdOrder'))
const AdminAdPricing = lazy(() => import('./admin/AdminAdPricing'))
const AdminChangelog = lazy(() => import('./admin/AdminChangelog'))
const AdminSubmissions = lazy(() => import('./admin/AdminSubmissions'))
const AdminUsers = lazy(() => import('./admin/AdminUsers'))
const AdminMessages = lazy(() => import('./admin/AdminMessages'))
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminFaq = lazy(() => import('./admin/AdminFaq'))
const AdminSiteCheckerSettings = lazy(() => import('./admin/settings/AdminSiteCheckerSettings'))
const AdminOrders = lazy(() => import('./admin/AdminOrders'))
const AdminLinkOrder = lazy(() => import('./admin/AdminLinkOrder'))
const AdminPayments = lazy(() => import('./admin/AdminPayments'))
const AdminTelegram = lazy(() => import('./admin/AdminTelegram'))
const AdminAnnouncements = lazy(() => import('./admin/AdminAnnouncements'))
const AdminContact = lazy(() => import('./admin/AdminContact'))
const AdminLegal = lazy(() => import('./admin/AdminLegal'))
const AdminScam = lazy(() => import('./admin/AdminScam'))

// Component that handles maintenance mode check
function AppRoutes() {
  const { settings, isLoading } = useSettings()
  const location = useLocation()

  // Show loading while settings are being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-lz-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Allow admin routes even in maintenance mode
  const isAdminRoute = location.pathname.startsWith('/toptip')

  // Show maintenance page for non-admin routes when maintenance mode is enabled
  if (settings.maintenance_mode && !isAdminRoute) {
    return <MaintenancePage />
  }

  const fallback = (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-lz-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <Suspense fallback={fallback}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="submit" element={<SubmitLinkPage />} />
          <Route path="advertising" element={<PricingPage />} />
          <Route path="advertising/order" element={<AdOrderPage />} />
          <Route path="advertising/preview" element={<LivePreviewPage />} />
          <Route path="advertise" element={<AdvertisingPage />} />
          <Route path="changelog" element={<ChangelogPage />} />
          <Route path="scam" element={<ScamPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="page/:slug" element={<PageView />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment" element={<PaymentPage />} />
          <Route path="payment/success" element={<PaymentSuccessPage />} />
          <Route path="payment/cancel" element={<PaymentCancelPage />} />
        </Route>

        {/* Admin login */}
        <Route path="/toptip/login" element={<AdminLoginPage />} />

        {/* Admin routes */}
        <Route path="/toptip" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/order" element={<AdminCategoryOrder />} />
          <Route path="links" element={<AdminLinks />} />
          <Route path="links/order" element={<AdminLinkOrder />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="ads/order" element={<AdminAdOrder />} />
          <Route path="ads/pricing" element={<AdminAdPricing />} />
          <Route path="changelog" element={<AdminChangelog />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="settings/site-checker" element={<AdminSiteCheckerSettings />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="faq" element={<AdminFaq />} />
          <Route path="contact" element={<AdminContact />} />
          <Route path="legal" element={<AdminLegal />} />
          <Route path="scam" element={<AdminScam />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="telegram" element={<AdminTelegram />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  )
}

export default App
