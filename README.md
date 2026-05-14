# LinkHub — Moderated Link Directory Platform

A moderated link directory and advertising SaaS built as a TypeScript Express API + React (Vite) frontend, with cryptocurrency-based premium-listing payments via NowPayments (sandbox-configurable), category/country filtering, multi-language UI, and a full admin panel.

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io)
[![React](https://img.shields.io/badge/React-18-149eca?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

> ⓘ **Notice.** Any references to "mirror" URLs in the schema and forms refer to standard secondary HTTP(S) mirrors of a primary site (for example a documentation mirror or a CDN-backed alternative). The platform does not target or host content that is hidden from the public web.
>
> ⓘ **Bildirim.** Şemada ve formlarda görünen "mirror" URL alanları, bir birincil sitenin standart ikinci HTTP(S) aynalarını (ör. bir belgeleme aynası veya CDN destekli alternatif) ifade eder. Platform, açık webden gizlenmiş içeriği hedeflemez veya barındırmaz.

---

## English

### ◆ Overview

LinkHub is a directory product: visitors browse a curated, moderated catalog of links grouped by category and country; submitters propose new entries and pay for premium placement; an admin team approves submissions, manages categories, monitors site health, and runs a scam-report workflow. The system is designed to deploy as a SaaS — it ships a settings table, a paid-tier model, an analytics module, and a notification layer.

### ⚡ Capability Map

| Capability | Description |
|---|---|
| ▣ Public catalog | Category and country browsing, search, pagination |
| ▣ Submission flow | Submit a link with primary URL, optional mirror URL, description, category, country |
| ▣ Payment | NowPayments integration (sandbox-configurable) for premium / featured slots |
| ▣ Moderation | Admin reviews each submission; site checker probes URLs periodically |
| ▣ Reporting | Public scam-report endpoint with an admin queue |
| ▣ Notifications | Telegram bot integration for new submissions and admin alerts |
| ▣ Localisation | `react-i18next` UI with multiple language packs |
| ▣ Analytics | Click counters, country statistics, dashboard widgets |

### ▣ Tech Stack

| Tier | Technology |
|---|---|
| Backend | Node.js 20, Express 5, TypeScript, Prisma 6, MySQL, JWT, bcryptjs, helmet, express-rate-limit, node-cron |
| Payments | NowPayments REST API (configurable sandbox / production keys) |
| Notifications | Telegram Bot API |
| Frontend | React 18, Vite 6, TypeScript, Tailwind CSS, react-i18next, react-router |
| Tooling | yarn / npm workspaces, ESLint, Prettier |

### ▦ Architecture

```
┌──────────────────────┐         ┌──────────────────────┐
│   React (Vite) SPA   │  REST   │  Express 5 API       │
│  i18n, admin panel   │ ──────▶ │  JWT, helmet, cron   │
└──────────────────────┘         └──────────┬───────────┘
                                            │
                       ┌────────────────────┼─────────────────────┐
                       ▼                    ▼                     ▼
                ┌────────────┐      ┌──────────────┐      ┌─────────────┐
                │   MySQL    │      │  NowPayments │      │  Telegram   │
                │  (Prisma)  │      │  (sandbox)   │      │  Bot API    │
                └────────────┘      └──────────────┘      └─────────────┘
```

### ▢ Project Layout

```
backend/
  src/
    routes/          REST API routes (auth, links, categories, payments, admin)
    services/        siteChecker, telegramNotify, payments
    middleware/      auth, rate limiting, validation
    prisma/          schema.prisma + migrations
frontend/
  src/
    pages/           Public pages (Home, Category, Country, Submit, Detail)
    admin/           Admin panel (Links, Users, Categories, Scam reports, Settings, ...)
    components/      Cards, lists, layouts, modals
    i18n/            Language packs
    data/            Country / category seed data
```

### ▶ Getting Started

```bash
# Backend
cd backend
npm install
cp .env.example .env       # DATABASE_URL, JWT_SECRET, NOWPAYMENTS_*, TELEGRAM_*
npx prisma db push
npx prisma db seed
npm run dev                # http://localhost:4000

# Frontend
cd ../frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:4000
npm run dev                # http://localhost:5173
```

### ⚙ Environment Variables

| Key | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string for Prisma |
| `JWT_SECRET` | Secret used to sign admin sessions |
| `ADMIN_DEFAULT_PASSWORD` | Initial admin password applied during seed |
| `NOWPAYMENTS_API_KEY` / `NOWPAYMENTS_SANDBOX` | Payment provider credentials |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Notification target |

---

## Türkçe

### ◆ Genel Bakış

LinkHub bir dizin ürünüdür: ziyaretçiler kategoriye ve ülkeye göre gruplanmış, moderasyondan geçmiş bir link kataloğunda gezinir; gönderenler yeni kayıtlar önerir ve öne çıkma için ödeme yapar; bir yönetici ekibi gönderileri onaylar, kategorileri yönetir, site sağlığını izler ve dolandırıcılık bildirim akışını işletir. Sistem; ayarlar tablosu, ücretli kademe modeli, analitik modülü ve bildirim katmanıyla bir SaaS olarak konuşlandırılabilecek şekilde tasarlanmıştır.

### ⚡ Yetenek Haritası

| Yetenek | Açıklama |
|---|---|
| ▣ Genel katalog | Kategori ve ülke bazlı gezinme, arama, sayfalama |
| ▣ Gönderim akışı | Birincil URL, isteğe bağlı mirror URL, açıklama, kategori, ülke ile link gönderme |
| ▣ Ödeme | Premium/öne çıkarılmış slotlar için NowPayments entegrasyonu (sandbox uyumlu) |
| ▣ Moderasyon | Yönetici her gönderiyi inceler; site checker URL'leri periyodik olarak yoklar |
| ▣ Raporlama | Yönetici kuyruğu ile genel dolandırıcılık raporu uç noktası |
| ▣ Bildirimler | Yeni gönderi ve yönetici uyarıları için Telegram bot entegrasyonu |
| ▣ Yerelleştirme | `react-i18next` ile çok dilli arayüz |
| ▣ Analitik | Tıklama sayaçları, ülke istatistikleri, dashboard widget'ları |

### ▶ Kurulum

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev                # http://localhost:4000

# Frontend
cd ../frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:5173
```

---

## License

Released for educational and portfolio review purposes only.
