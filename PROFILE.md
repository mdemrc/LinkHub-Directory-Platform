# LinkHub — Project Description

## English

LinkHub is a moderated link-directory and advertising SaaS built as a TypeScript Express API paired with a React (Vite) frontend. Visitors browse a curated catalog of links grouped by category and country; submitters propose new entries through a structured form and can optionally pay for premium placement through NowPayments (sandbox-configurable); an admin team approves submissions, manages categories and settings, monitors site health through an automated URL checker, and runs a scam-report workflow.

Technically the platform stitches together the pieces a real SaaS needs: a Prisma-on-MySQL data layer, JWT-protected admin endpoints with bcrypt-hashed credentials, helmet and express-rate-limit on the edge, periodic site-health checks via node-cron, Telegram bot notifications for new submissions and moderator alerts, and an analytics layer that tracks clicks and country distributions. The frontend ships a multi-language UI through react-i18next, a router-driven public catalog, and a full admin panel that mirrors the backend's capabilities.

The project was an exercise in shipping the unglamorous parts of a directory product — billing edge cases, moderation queues, abuse reporting, site-health probing, multi-language copy, and a settings table that lets non-developers reconfigure the platform — rather than just the happy path. Mirror-URL fields in the schema refer to standard secondary HTTP(S) mirrors of a primary site; the platform does not target or host content that is hidden from the public web.

## Türkçe

LinkHub; TypeScript Express API ile React (Vite) bir önyüzü birleştiren, moderasyonlu bir link dizini ve reklam SaaS'ıdır. Ziyaretçiler kategoriye ve ülkeye göre gruplanmış, kürelenmiş bir link kataloğunda gezinir; gönderenler yapılandırılmış bir form üzerinden yeni kayıtlar önerir ve dilerlerse NowPayments üzerinden (sandbox uyumlu) öne çıkarma için ödeme yapar; bir yönetici ekibi gönderileri onaylar, kategorileri ve ayarları yönetir, otomatik bir URL kontrolcüsüyle site sağlığını izler ve dolandırıcılık bildirimi iş akışını işletir.

Teknik açıdan platform, gerçek bir SaaS'ın ihtiyaç duyduğu parçaları bir araya getirir: MySQL üzerine Prisma veri katmanı, bcrypt ile hashlenmiş kimlik bilgileriyle JWT korumalı yönetici uçları, edge'de helmet ve express-rate-limit, node-cron üzerinden düzenli site sağlık kontrolleri, yeni gönderi ve moderatör uyarıları için Telegram bot bildirimleri ve tıklama ile ülke dağılımlarını izleyen bir analitik katmanı. Önyüz; react-i18next ile çok dilli bir arayüz, router tabanlı genel katalog ve arka uçun yeteneklerini yansıtan eksiksiz bir yönetici paneli sunar.

Proje; bir dizin ürününün gösterişsiz parçalarını — faturalama uç durumları, moderasyon kuyrukları, kötüye kullanım bildirimi, site sağlık yoklaması, çok dilli metin ve geliştirici olmayan bir kişinin platformu yeniden yapılandırmasına olanak tanıyan bir ayarlar tablosu — yalnızca mutlu yol yerine tam olarak sevkiyat etme alıştırmasıydı. Şemadaki mirror URL alanları, birincil bir sitenin standart ikinci HTTP(S) aynalarını ifade eder; platform, açık webden gizlenmiş içeriği hedeflemez veya barındırmaz.
