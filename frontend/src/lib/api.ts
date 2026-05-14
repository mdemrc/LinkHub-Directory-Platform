import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:58741/api')

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if we're on an admin page
      // Don't redirect during login attempt
      const isLoginAttempt = error.config?.url?.includes('/auth/login')
      const isAdminPage = window.location.pathname.startsWith('/toptip')
      
      if (!isLoginAttempt && isAdminPage) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/toptip/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  getProfile: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  // Admin user management
  getAllUsers: () => api.get('/auth/users'),
  createUser: (data: { username: string; email: string; password: string; role?: string; isActive?: boolean }) =>
    api.post('/auth/users', data),
  updateUser: (id: number, data: Partial<{ username: string; email: string; password?: string; role?: string; isActive?: boolean }>) =>
    api.patch(`/auth/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/auth/users/${id}`),
}

// Categories API
export const categoriesApi = {
  getAll: (includeInactive?: boolean) => api.get('/categories', { params: includeInactive ? { includeInactive: 'true' } : {} }),
  getNavigation: () => api.get('/categories/navigation'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
  getById: (id: number) => api.get(`/categories/id/${id}`),
  create: (data: { name: string; slug: string; icon?: string; description?: string; order?: number; showInNav?: boolean; isActive?: boolean; parentId?: number | null; displayMode?: string; countryCode?: string | null }) =>
    api.post('/categories', data),
  update: (id: number, data: Partial<{ name: string; slug?: string; icon?: string; description?: string; order?: number; showInNav?: boolean; isActive?: boolean; parentId?: number | null; displayMode?: string; countryCode?: string | null }>) =>
    api.patch(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
  reorder: (orders: { id: number; order: number }[]) => api.post('/categories/reorder', { orders }),
}

// Links API
export const linksApi = {
  getAll: (params?: { categoryId?: number; categorySlug?: string; countryCode?: string; search?: string }) =>
    api.get('/links', { params }),
  getById: (id: number) => api.get(`/links/${id}`),
  getByCategory: (categorySlug: string) =>
    api.get(`/links/by-category/${categorySlug}`),
  getByParent: (categorySlug: string) =>
    api.get(`/links/by-parent/${categorySlug}`),
  create: (data: {
    name: string
    url: string
    categoryId: number
    mirrorUrl?: string
    altUrl?: string
    backupUrl?: string
    description?: string
    language?: string
    telegram?: string
    twitter?: string
    discord?: string
    order?: number
    isPremium?: boolean
    isActive?: boolean
  }) => api.post('/links', data),
  update: (id: number, data: Partial<{
    name: string
    url: string
    mirrorUrl?: string
    altUrl?: string
    backupUrl?: string
    description?: string
    language?: string
    telegram?: string
    twitter?: string
    discord?: string
    status?: string
    order?: number
    isPremium?: boolean
    isActive?: boolean
  }>) => api.patch(`/links/${id}`, data),
  delete: (id: number) => api.delete(`/links/${id}`),
  click: (id: number) => api.post(`/links/${id}/click`),
  reorder: (orders: { id: number; order: number }[]) => api.post('/links/reorder', { orders }),
  checkStatus: (url: string) => api.post('/links/check-status', { url }),
}

// Ads API
export const adsApi = {
  getAll: () => api.get('/ads/all'),
  getActive: () => api.get('/ads'),
  getByPosition: (position: string, trackView: boolean = false) => 
    api.get('/ads', { params: { position, trackView: trackView ? 'true' : undefined } }),
  create: (data: Record<string, any>) => api.post('/ads', data),
  update: (id: number, data: Record<string, any>) => api.patch(`/ads/${id}`, data),
  delete: (id: number) => api.delete(`/ads/${id}`),
  click: (id: number) => api.post(`/ads/${id}/click`),
  reorder: (adId: number, direction: 'up' | 'down') => api.post('/ads/reorder', { adId, direction }),
}

// Packages API
export const packagesApi = {
  getAll: () => api.get('/packages/all'),
  getActive: () => api.get('/packages'),
  getBySlug: (slug: string) => api.get(`/packages/${slug}`),
  create: (data: {
    name: string
    slug: string
    icon?: string
    size?: string
    description?: string
    subtitle?: string
    features: any
    prices: any
    maxSlots?: number
    order?: number
    isActive?: boolean
  }) => api.post('/packages', data),
  update: (id: number, data: Partial<{
    name?: string
    slug?: string
    icon?: string
    size?: string
    description?: string
    subtitle?: string
    features?: any
    prices?: any
    maxSlots?: number
    order?: number
    isActive?: boolean
  }>) => api.patch(`/packages/${id}`, data),
  delete: (id: number) => api.delete(`/packages/${id}`),
}

// Ad Pricing API (New System)
export const adPricingApi = {
  // Pricing table
  getAll: () => api.get('/ad-pricing'),
  getAllAdmin: () => api.get('/ad-pricing/all'),
  create: (data: {
    type: string
    position?: string
    priceWeek?: number
    priceMonth?: number
    price2Months?: number
    price3Months?: number
    price6Months?: number
    priceYear?: number
    isActive?: boolean
  }) => api.post('/ad-pricing', data),
  update: (id: number, data: Partial<{
    type?: string
    position?: string
    priceWeek?: number
    priceMonth?: number
    price2Months?: number
    price3Months?: number
    price6Months?: number
    priceYear?: number
    isActive?: boolean
  }>) => api.patch(`/ad-pricing/${id}`, data),
  delete: (id: number) => api.delete(`/ad-pricing/${id}`),
  
  // Settings
  getSettings: () => api.get('/ad-pricing/settings'),
  getSettingsFull: () => api.get('/ad-pricing/settings/full'),
  updateSettings: (data: Partial<{
    pageTitle?: string
    pageSubtitle?: string
    maxBannerSlots?: number
    maxTextSlots?: number
    bannerSize?: string
    bannerPosition?: string
    howToOrderSteps?: string[]
    paymentMethods?: string[]
    autoPlaceEnabled?: boolean
    specialAdLink?: string
    pinnedBadgeSize?: number
    flagSize?: number
  }>) => api.patch('/ad-pricing/settings', data),
  
  // NowPayments settings
  updateNowpaymentsSettings: (data: {
    apiKey?: string
    ipnSecret?: string
    enabled?: boolean
    enabledCryptos?: Record<string, boolean>
  }) => api.patch('/ad-pricing/settings/nowpayments', data),
  testNowpayments: () => api.post('/ad-pricing/settings/nowpayments/test'),
  
  // Crypto currencies
  getCryptos: () => api.get('/ad-pricing/cryptos'),
  getCryptoMinAmounts: () => api.get('/ad-pricing/cryptos/min-amounts'),
  
  // Orders
  getOrders: (status?: string) => api.get('/ad-pricing/orders', { params: { status } }),
  createOrder: (data: {
    adType: string
    adPosition?: string
    adTitle: string
    adLink: string
    adBannerUrl?: string
    duration: string
    price: number
    contactInfo: string
    paymentMethod: string
  }) => api.post('/ad-pricing/orders', data),
  updateOrder: (id: number, data: Partial<{
    status?: string
    paymentStatus?: string
    paymentId?: string
    adminNotes?: string
    expiresAt?: string
  }>) => api.patch(`/ad-pricing/orders/${id}`, data),
  deleteOrder: (id: number) => api.delete(`/ad-pricing/orders/${id}`),
  activateOrder: (id: number) => api.post(`/ad-pricing/orders/${id}/activate`),

  // Payment
  createPayment: (orderId: number, currency: string) => 
    api.post(`/ad-pricing/orders/${orderId}/pay`, { currency }),
  getPaymentStatus: (orderId: number) => 
    api.get(`/ad-pricing/orders/${orderId}/status`),
}

// Changelog API
export const changelogApi = {
  getAll: () => api.get('/changelog'),
  getPublished: () => api.get('/changelog?status=PUBLISHED'),
  getLatest: () => api.get('/changelog/latest'),
  getById: (id: number) => api.get(`/changelog/${id}`),
  create: (data: {
    version: string
    title: string
    changes: string[]
    status?: 'PLANNED' | 'COMMITTED' | 'PUBLISHED'
  }) => api.post('/changelog', data),
  update: (id: number, data: Partial<{
    version?: string
    title?: string
    changes?: string[]
    status?: 'PLANNED' | 'COMMITTED' | 'PUBLISHED'
  }>) => api.patch(`/changelog/${id}`, data),
  delete: (id: number) => api.delete(`/changelog/${id}`),
}

// Scam API
export const scamApi = {
  getAll: () => api.get('/scam'),
  getByCategory: (category: string) => api.get(`/scam?category=${category}`),
  getCategories: () => api.get('/scam/categories'),
  create: (data: {
    siteName: string
    siteUrl?: string
    category: string
    reason?: string
    isVerified?: boolean
  }) => api.post('/scam', data),
  update: (id: number, data: Partial<{
    siteName?: string
    siteUrl?: string
    category?: string
    reason?: string
    isVerified?: boolean
  }>) => api.patch(`/scam/${id}`, data),
  delete: (id: number) => api.delete(`/scam/${id}`),
}

// Favorites API
export const favoritesApi = {
  getAll: () => api.get('/favorites'),
  add: (linkId: number) => api.post(`/favorites/${linkId}`),
  remove: (linkId: number) => api.delete(`/favorites/${linkId}`),
  check: (linkId: number) => api.get(`/favorites/check/${linkId}`),
}

// Submissions API
export const submissionsApi = {
  getAll: () => api.get('/submissions'),
  getPending: () => api.get('/submissions', { params: { status: 'PENDING' } }),
  create: (data: {
    title: string
    url: string
    mirrorUrl?: string
    altUrl?: string
    description?: string
    categoryId: number
    countryCode?: string
    contactEmail?: string
    captchaToken?: string
  }) => api.post('/submissions', data),
  approve: (id: number, name: string) => api.post(`/submissions/${id}/approve`, { name }),
  reject: (id: number, reason?: string) => api.post(`/submissions/${id}/reject`, { reason }),
}

// Languages API
export const languagesApi = {
  getAll: () => api.get('/languages'),
  getActive: () => api.get('/languages', { params: { activeOnly: 'true' } }),
  getTranslations: (code: string) => api.get(`/languages/${code}/translations`),
  create: (data: { code: string; name: string; nativeName: string; flag?: string; isDefault?: boolean; order?: number }) =>
    api.post('/languages', data),
  update: (id: number, data: Partial<{ name?: string; nativeName?: string; flag?: string; isDefault?: boolean; isActive?: boolean; order?: number }>) =>
    api.patch(`/languages/${id}`, data),
  delete: (id: number) => api.delete(`/languages/${id}`),
  setTranslation: (languageCode: string, key: string, value: string, category?: string) =>
    api.post('/languages/translations', { languageCode, key, value, category }),
}

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getPublic: () => api.get('/settings/public'),
  get: (key: string) => api.get(`/settings/${key}`),
  set: (key: string, value: string) => api.post('/settings', { key, value }),
  setBulk: (settings: { key: string; value: string }[]) => api.post('/settings/bulk', { settings }),
}

// Stats API
export const statsApi = {
  getOverview: () => api.get('/stats'),
  getSidebar: () => api.get('/stats/sidebar'),
  getDaily: (days?: number) => api.get('/stats/history', { params: { days } }),
  getAdmin: () => api.get('/stats/admin'),
  getAdminSidebar: () => api.get('/stats/admin-sidebar'),
}

// Pages API
export const pagesApi = {
  getAll: () => api.get('/pages/all'),
  getNavigation: () => api.get('/pages/navigation'),
  getBySlug: (slug: string) => api.get(`/pages/${slug}`),
  create: (data: {
    title: string
    slug: string
    content: string
    menuLocation?: string
    menuLabel?: string
    pageType?: string
    order?: number
    isActive?: boolean
  }) => api.post('/pages', data),
  update: (id: number, data: Partial<{
    title?: string
    slug?: string
    content?: string
    menuLocation?: string
    menuLabel?: string
    pageType?: string
    order?: number
    isActive?: boolean
  }>) => api.patch(`/pages/${id}`, data),
  delete: (id: number) => api.delete(`/pages/${id}`),
}

// FAQ API
export const faqApi = {
  getAll: () => api.get('/faq'),
  getActive: () => api.get('/faq', { params: { activeOnly: 'true' } }),
  getCategories: () => api.get('/faq/categories'),
  getById: (id: number) => api.get(`/faq/${id}`),
  create: (data: {
    question: string
    answer: string
    category?: string
    order?: number
    isActive?: boolean
  }) => api.post('/faq', data),
  update: (id: number, data: Partial<{
    question?: string
    answer?: string
    category?: string
    order?: number
    isActive?: boolean
  }>) => api.patch(`/faq/${id}`, data),
  reorder: (items: { id: number; order: number }[]) => api.post('/faq/reorder', { items }),
  delete: (id: number) => api.delete(`/faq/${id}`),
}

// Contact Info API
export const contactApi = {
  getAll: () => api.get('/contact'),
  getActive: () => api.get('/contact', { params: { activeOnly: 'true' } }),
  getByType: (type: string) => api.get(`/contact/type/${type}`),
  getById: (id: number) => api.get(`/contact/${id}`),
  create: (data: {
    type: string
    label: string
    value: string
    extra?: string
    order?: number
    isActive?: boolean
  }) => api.post('/contact', data),
  update: (id: number, data: Partial<{
    type?: string
    label?: string
    value?: string
    extra?: string
    order?: number
    isActive?: boolean
  }>) => api.patch(`/contact/${id}`, data),
  reorder: (items: { id: number; order: number }[]) => api.post('/contact/reorder', { items }),
  delete: (id: number) => api.delete(`/contact/${id}`),
}

// Telegram API
export const telegramApi = {
  getSettings: () => api.get('/telegram/settings'),
  updateSettings: (data: {
    botToken?: string
    chatId?: string
    enabled?: boolean
    notifyPayments?: boolean
    notifyOrders?: boolean
    notifyLinks?: boolean
    paymentReceivedTemplate?: string
    paymentConfirmedTemplate?: string
    newOrderTemplate?: string
    newLinkTemplate?: string
  }) => api.patch('/telegram/settings', data),
  test: () => api.post('/telegram/test'),
  send: (message: string) => api.post('/telegram/send', { message }),
  testNotification: (type: 'link' | 'order' | 'payment_received' | 'payment_confirmed') =>
    api.post('/telegram/test-notification', { type }),
}

// Announcements API
export const announcementsApi = {
  getActive: () => api.get('/announcements'),
  getAll: () => api.get('/announcements/all'),
  create: (data: any) => api.post('/announcements', data),
  update: (id: number, data: any) => api.patch(`/announcements/${id}`, data),
  delete: (id: number) => api.delete(`/announcements/${id}`),
}

// Messages API (Scam Reports / Contact)
export const messagesApi = {
  getAll: (params?: { status?: string; limit?: number; offset?: number }) => api.get('/messages', { params }),
  create: (data: { telegram?: string; categoryId?: number; linkId?: number; message: string; captchaToken?: string }) => api.post('/messages', data),
  update: (id: number, data: { status?: string; adminNote?: string }) => api.patch(`/messages/${id}`, data),
  delete: (id: number) => api.delete(`/messages/${id}`),
}
