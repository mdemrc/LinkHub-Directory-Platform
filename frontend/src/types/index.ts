  // User types
  export interface User {
    id: number
    username: string
    email: string
    role: 'USER' | 'MODERATOR' | 'ADMIN'
    createdAt: string
    updatedAt: string
  }

  export interface AuthResponse {
    message: string
    token: string
    user: User
  }

  // Category types (top-level navigation tabs)
  export interface Category {
    id: number
    name: string
    slug: string
    icon?: string
    description?: string
    countryCode?: string | null
    parentId?: number | null
    parent?: Category
    children?: Category[]
    displayMode?: 'SUBCATEGORY' | 'COUNTRY'
    order: number
    isActive: boolean
    showInNav: boolean
    links?: Link[]
    createdAt: string
    updatedAt: string
    _count?: { links: number }
  }

  // Link types
  export type LinkStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN'

  export interface Link {
    id: number
    title: string
    url: string
    mirrorUrl?: string
    altUrl?: string
    backupUrl?: string
    description?: string
    twitterUrl?: string
    facebookUrl?: string
    telegramUrl?: string
    discordUrl?: string
    status: LinkStatus
    lastChecked?: string
    responseTime?: number
    isPinned: boolean
    pinnedColor?: string
    textColor?: string
    customCss?: string
    isScam: boolean
    hasMirror: boolean
    isHighlighted: boolean
    highlightColor?: string
    badges?: any
    clickCount: number
    order: number
    isActive: boolean
    isPermanentOnline: boolean
    countryCode?: string
    countryName?: string
    categoryId: number
    category?: Category
    createdAt: string
    updatedAt: string
    isFavorite?: boolean
  }

  // Ad types
  export type AdType = 'BANNER' | 'TEXT' | 'HTML'
  export type AdPosition = 'HEADER_TOP' | 'HEADER_BOTTOM' | 'SIDEBAR_LEFT' | 'SIDEBAR_RIGHT' | 'CONTENT_TOP' | 'CONTENT_INLINE' | 'FOOTER'

  export interface Ad {
    id: number
    name: string
    imageUrl?: string
    linkUrl?: string
    htmlContent?: string
    textContent?: string
    textTitle?: string
    textIcon?: string
    customCss?: string
    fontSize?: string
    fontWeight?: string
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    bannerSize?: string
    width?: number
    height?: number
    type: AdType
    position: AdPosition
    viewCount: number
    clickCount: number
    order: number
    startDate?: string
    endDate?: string
    durationType?: string
    isPurchased?: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

  // Package types
  export interface PackagePrice {
    duration: string
    label: string
    price: number
    currency: string
    discount?: number
  }

  export interface Package {
    id: number
    name: string
    slug: string
    icon?: string
    size?: string
    description?: string
    subtitle?: string
    features: string[]
    prices: PackagePrice[]
    maxSlots?: number
    order: number
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

  // Ad Pricing types (New System)
  export interface AdPricing {
    id: number
    type: AdType
    position?: string
    bannerSize?: string
    displayName?: string
    description?: string
    previewLabel?: string
    features?: string[]
    priceWeek: number
    priceMonth: number
    price2Months: number
    price3Months: number
    price6Months: number
    priceYear: number
    isActive: boolean
    order: number
    badgeType?: string
    badgeText?: string
    badgeIcon?: string
    badgeColor?: string
    glowEnabled?: boolean
    glowColor?: string
    createdAt: string
    updatedAt: string
  }

  export interface AdSettings {
    id: number
    pageTitle: string
    pageSubtitle?: string
    maxBannerSlots: number
    maxTextSlots: number
    bannerSize: string
    bannerPosition: string
    howToOrderSteps: string[]
    paymentMethods: string[]
    autoPlaceEnabled: boolean
    specialAdLink?: string
    pinnedBadgeSize?: number
    flagSize?: number
    createdAt: string
    updatedAt: string
  }

  export interface AdOrderRequest {
    id: number
    adType: AdType
    adTitle: string
    adLink: string
    adBannerUrl?: string
    bannerSize?: string
    duration: string
    price: number
    contactInfo: string
    paymentMethod: string
    paymentId?: string
    paymentStatus: string
    status: string
    adminNotes?: string
    createdAt: string
    updatedAt: string
    expiresAt?: string
  }

  // Changelog types
  export type ChangelogStatus = 'PLANNED' | 'COMMITTED' | 'PUBLISHED'

  export interface Changelog {
    id: number
    version: string
    title: string
    changes: string[]
    status: ChangelogStatus
    publishedAt?: string
    createdAt: string
    updatedAt: string
  }

  // Scam types
  export interface ScamReport {
    id: number
    siteName: string
    siteUrl?: string
    category: string
    reason?: string
    isVerified: boolean
    createdAt: string
    updatedAt: string
  }

  // Page types
  export type PageType = 'CONTENT' | 'LINK' | 'FORM'
  export type MenuLocation = 'HEADER' | 'FOOTER' | 'SIDEBAR' | null

  export interface Page {
    id: number
    title: string
    slug: string
    content: string
    menuLocation?: MenuLocation
    menuLabel?: string
    pageType: PageType
    order: number
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

  // Favorite types
  export interface Favorite {
    id: number
    userId: number
    linkId: number
    link?: Link
    createdAt: string
  }

  // Submission types
  export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

  export interface LinkSubmission {
    id: number
    title?: string
    url: string
    mirrorUrl?: string
    altUrl?: string
    backupUrl?: string
    description?: string
    categoryId: number
    category?: Category
    countryCode?: string
    language?: string
    contactEmail?: string
    telegram?: string
    twitter?: string
    discord?: string
    status: SubmissionStatus
    rejectionReason?: string
    submittedByIp?: string
    userId?: number
    user?: User
    createdAt: string
    updatedAt: string
  }

  // Language types
  export interface Language {
    id: number
    code: string
    name: string
    nativeName: string
    flag?: string
    isDefault: boolean
    isActive: boolean
    order: number
    createdAt: string
    updatedAt: string
  }

  export interface Translation {
    id: number
    languageId: number
    key: string
    value: string
  }

  // Settings types
  export interface Setting {
    id: number
    key: string
    value: string
    createdAt: string
    updatedAt: string
  }

  // Stats types
  export interface StatsOverview {
    totalLinks: number
    onlineLinks: number
    offlineLinks: number
    totalCategories: number
    totalUsers: number
    pendingSubmissions: number
    totalClicks: number
  }

  export interface StatsDaily {
    id: number
    date: string
    visits: number
    uniqueVisitors: number
    linkClicks: number
    adClicks: number
    newUsers: number
    newSubmissions: number
  }

  // Contact info
  export interface ContactInfo {
    id: number
    type: string      // "xmpp", "email", "telegram", "crypto"
    label: string     // "XMPP / Jabber", "Email"
    value: string     // "LinkBaseORG@jabb3r.org"
    extra?: string    // OTR fingerprint, etc.
    order: number
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

  // FAQ types
  export interface FaqItem {
    id: number
    question: string
    answer: string
    category?: string   // "General", "Advertising", "Technical"
    order: number
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

  export interface FaqCategory {
    name: string
    count: number
  }

  // API Response types
  export interface ApiResponse<T> {
    data: T
    message?: string
  }

  export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // Payment types
  export type OrderStatus = 'PENDING_PAYMENT' | 'PAYMENT_RECEIVED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REFUNDED'
  export type PaymentStatus = 'WAITING' | 'CONFIRMING' | 'CONFIRMED' | 'SENDING' | 'PARTIALLY_PAID' | 'FINISHED' | 'FAILED' | 'REFUNDED' | 'EXPIRED'

  export interface Payment {
    id: number
    nowpaymentId?: string
    invoiceUrl?: string
    payAddress?: string
    payCurrency?: string
    payAmount?: number
    actuallyPaid?: number
    priceAmount: number
    priceCurrency: string
    status: PaymentStatus
    paidAt?: string
    createdAt: string
    updatedAt: string
  }

  export interface AdOrder {
    id: number
    orderNumber: string
    customerEmail: string
    customerName?: string
    packageId: number
    packageName: string
    duration: string
    durationLabel: string
    priceAmount: number
    priceCurrency: string
    adType: AdType
    adTitle?: string
    adUrl?: string
    adImageUrl?: string
    adDescription?: string
    status: OrderStatus
    createdAdId?: number
    adminNotes?: string
    customerNotes?: string
    payment?: Payment
    createdAt: string
    updatedAt: string
  }

  export interface PaymentSettings {
    nowpaymentsEnabled: boolean
    minAmount: number
    maxAmount: number
    currency: string
  }

  // Announcement types
  export type AnnouncementType = 'MODAL' | 'BANNER' | 'TOAST'

  export interface Announcement {
    id: number
    title: string
    content: string
    type: AnnouncementType
    showOnPageLoad: boolean
    showEveryVisit: boolean
    autoClose: boolean
    autoCloseDuration: number
    allowManualClose: boolean
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    startDate?: string
    endDate?: string
    priority: number
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

