# 🧭 GitHub Clone — Kapsamlı Fullstack Geliştirme Rehberi

> **Sürüm:** 2.0 · **Tarih:** Ağustos 2026 · **Durum:** Aktif master doküman
>
> Bu doküman, projedeki dağınık 25+ rapor dosyasının yerine geçen **tek yetkili geliştirme rehberidir**.
> Mevcut kod tabanının dürüst bir denetimiyle başlar, ardından fazlara bölünmüş,
> her adımı ölçülebilir kabul kriterlerine bağlı bir yol haritası sunar.

---

## 📑 İçindekiler

| Bölüm | Başlık |
|---|---|
| [A](#a-yönetici-özeti) | Yönetici Özeti |
| [B](#b-mevcut-durum-denetimi-kanıta-dayalı) | Mevcut Durum Denetimi (kanıta dayalı) |
| [C](#c-hedef-mimari) | Hedef Mimari |
| [D](#d-teknoloji-seçimleri-ağustos-2026) | Teknoloji Seçimleri (Ağustos 2026) |
| [1](#faz-1--karar-temizlik-ve-monorepo-temeli) | **Faz 1** — Karar, Temizlik ve Monorepo Temeli |
| [2](#faz-2--veri-modeli-ve-veritabanı) | **Faz 2** — Veri Modeli ve Veritabanı |
| [3](#faz-3--kimlik-doğrulama-ve-yetkilendirme) | **Faz 3** — Kimlik Doğrulama ve Yetkilendirme |
| [4](#faz-4--git-motoru-projenin-eksik-kalbi) | **Faz 4** — Git Motoru (projenin eksik kalbi) |
| [5](#faz-5--api-katmanı) | **Faz 5** — API Katmanı |
| [6](#faz-6--tasarım-sistemi-ve-frontend-temeli) | **Faz 6** — Tasarım Sistemi ve Frontend Temeli |
| [7](#faz-7--ürün-akışları-repo-kod-issue-pr-review) | **Faz 7** — Ürün Akışları (Repo, Kod, Issue, PR, Review) |
| [8](#faz-8--gerçek-zamanlı-katman-ve-bildirimler) | **Faz 8** — Gerçek Zamanlı Katman ve Bildirimler |
| [9](#faz-9--arama-ve-keşif) | **Faz 9** — Arama ve Keşif |
| [10](#faz-10--ai-özellikleri) | **Faz 10** — AI Özellikleri |
| [11](#faz-11--test-stratejisi) | **Faz 11** — Test Stratejisi |
| [12](#faz-12--gözlemlenebilirlik) | **Faz 12** — Gözlemlenebilirlik |
| [13](#faz-13--güvenlik-sertleştirme) | **Faz 13** — Güvenlik Sertleştirme |
| [14](#faz-14--performans) | **Faz 14** — Performans |
| [15](#faz-15--dağıtım-ve-operasyon) | **Faz 15** — Dağıtım ve Operasyon |
| [E](#e-ekler) | Ekler: Klasör yapısı, komutlar, DoD, kabul kriterleri |

---

## A. Yönetici Özeti

### Bir cümlede

Proje şu anda **"GitHub Clone" adını taşıyan ama içinde hiç Git olmayan**, iki rakip backend
implementasyonu ve derlenmeyen bir frontend barındıran bir iskelet durumundadır. Bu rehber,
onu çalışan, modern ve tam kapsamlı bir ürüne dönüştürmek için 15 fazlık bir plan sunar.

### En kritik 5 bulgu

| # | Bulgu | Etki |
|---|---|---|
| 1 | **Git fonksiyonalitesi hiç yok.** Ne repo depolama, ne commit, ne branch, ne diff, ne PR, ne issue. | 🔴 Ürünün ana değeri eksik |
| 2 | **Frontend derlenmiyor.** `App.tsx`, var olmayan `./pages/*` ve `./components/Layout/*` dosyalarını import ediyor. | 🔴 `build` anında patlar |
| 3 | **İki rakip backend.** `backend/` (NestJS+TypeORM) ile `services/core-service/` (Express+type-graphql+ham SQL) aynı domain'i (User/Repository/Auth) ayrı ayrı, uyumsuz biçimde uyguluyor. | 🔴 Hangisi doğru belli değil |
| 4 | **Auth sahte.** `services/auth-service` kullanıcıyı veritabanına yazmıyor; yorum satırında `// Create user (in real app, save to database)` yazıyor. JWT secret fallback'i `'fallback-secret'`. | 🔴 Güvenlik + işlevsizlik |
| 5 | **Sıfır test, sahte CI.** Repoda tek bir `.test.ts`/`.spec.ts` yok. CI pipeline'ı sadece `ls -la` çalıştırıp "✅ validated" yazıyor. | 🔴 Hiçbir regresyon yakalanmaz |

### Yaklaşım felsefesi

> **Önce çalışan bir dikey dilim, sonra ölçek.**

Mevcut repo, "ultra-performance", "scaling", "kafka", "12 mikroservis" gibi ölçek problemlerine,
henüz **tek bir kullanıcı akışı bile uçtan uca çalışmadan** yatırım yapmış durumda. Rehberin
Faz 1–7'si bu sırayı tersine çevirir: önce *çalışan ürün*, sonra *ölçeklenen ürün*.

---

## B. Mevcut Durum Denetimi (kanıta dayalı)

Aşağıdaki bulguların tamamı repo üzerinde doğrulanmıştır.

### B.1 Frontend — `frontend/`

**Kanıt:** `frontend/src/App.tsx` şu import'ları yapıyor:

```ts
const Home       = lazy(() => import('./pages/Home'))
const Login      = lazy(() => import('./pages/Login'))
const Register   = lazy(() => import('./pages/Register'))
const Dashboard  = lazy(() => import('./pages/Dashboard'))
const Repository = lazy(() => import('./pages/Repository'))
const Profile    = lazy(() => import('./pages/Profile'))
const Settings   = lazy(() => import('./pages/Settings'))
const NotFound   = lazy(() => import('./pages/NotFound'))
const Layout     = lazy(() => import('./components/Layout/Layout'))
const AuthLayout = lazy(() => import('./components/Layout/AuthLayout'))
```

`frontend/src/pages/` dizini **yok**. `frontend/src/components/` içinde sadece `UnifiedIndex.tsx` var.
→ 10 import'un 10'u da kırık. `npm run build:vite` (`tsc && vite build`) ilk adımda başarısız olur.

**Diğer sorunlar:**

- **Çift framework, tek paket.** Aynı `package.json` içinde hem `next@^14` hem `vite@^5` var;
  `src/app/` (Next App Router: `layout.tsx`, `page.tsx`) ile `src/main.tsx` + `App.tsx`
  (Vite + react-router-dom) yan yana duruyor. İki ayrı yönlendirme sistemi, iki ayrı giriş noktası,
  5 farklı Dockerfile (`Dockerfile`, `.vite`, `.nextjs`, `.optimized`, `.ultra`).
  Bu bir "dual build" avantajı değil, **çözülmemiş bir karar**.
- **Durum yönetiminde 4 kat üst üste binme:** `@apollo/client` + `@tanstack/react-query` + `swr` + `zustand`.
  Üçü aynı işi (sunucu durumu) yapıyor.
- **Eskiyen sürümler:** Next 14 / React 18 / MUI 5 — Ağustos 2026 itibarıyla Next 16 ve React 19 stabil.
- **`vite.config.ts`** içinde `react({ fastRefresh: true })` — bu seçenek `@vitejs/plugin-react` v4'te kaldırıldı.
- **`next.config.js`** içinde `swcMinify: true` — Next 15+ ile birlikte anlamsız (varsayılan).

### B.2 Backend — çift implementasyon

| | `backend/` | `services/core-service/` |
|---|---|---|
| Framework | NestJS 10 | Express + Apollo Server 3 |
| GraphQL | `@nestjs/graphql` (code-first) | `type-graphql` |
| Veri erişimi | TypeORM entity + migration | **Ham SQL string** (`'SELECT * FROM users ORDER BY created_at DESC'`) |
| Entity'ler | `User`, `Repository`, `Health` | `User`, `Repository`, `Health` (aynı domain, ayrı tanım) |

`services/core-service/src/services/UserService.ts` şemayı **hiç oluşturmadan** `users` tablosuna sorgu atıyor.
Tabloları yalnızca `backend/src/migrations/` oluşturuyor — yani core-service, backend'in migration'larına
gizli ve dokümante edilmemiş bir bağımlılık taşıyor. `postgres/` klasöründe yalnızca `postgresql.conf` var,
tek bir `.sql` şema dosyası yok.

**Karar gerekli:** Bu ikisinden biri silinmeli. (Rehber Faz 1'de gerekçeli öneri veriyor.)

### B.3 Mikroservisler — `services/`

13 servis dizini var; olgunluk seviyeleri çok farklı:

| Servis | Dosya sayısı | Gerçek durum |
|---|---|---|
| `core-service` | ~20 | En dolu, ama ham SQL + şemasız |
| `auth-service` | ~10 | **Sahte** — bellekte, DB yok |
| `file-service` | ~10 | İskelet |
| `notification-service`, `sms-service`, `email-service` | ~8 | İskelet + Kafka stub |
| `telegram/whatsapp/wordpress/ai-service` | ~7 | İskelet |
| `realtime-service` | 3 | Neredeyse boş |
| `integration-service` | **1** (`main.ts`) | Boş |

**Ortak eksikler:**
- Hiçbirinde `package-lock.json` yok → build'ler tekrarlanabilir değil (yalnızca `frontend/` lock'a sahip).
- Hiçbirinde test yok.
- `services/shared/` içinde 4 dosya var (`EventBus.ts`, `logger.ts`, `cache-strategy.ts`, `service-discovery.ts`)
  ama paket olarak yayımlanmadığı için servisler bunları **import edemiyor**; her servis kendi `utils/logger.ts`
  kopyasını taşıyor.

**En önemlisi:** 13 servisin hiçbiri Git ile ilgili değil. Bir Git barındırma platformunda
`git-service` (repo depolama, ref yönetimi, pack protokolü, diff) **tamamen yok**.

### B.4 Altyapı ve DevOps

- **14 adet `docker-compose*.yml`.** `yml`, `.development`, `.prod`, `.production`, `.microservices`,
  `.optimized`, `.ultra-optimized`, `.ultra-light`, `.ultra-performance`, `.lightweight`, `.scalable`,
  `.unified`, `.kafka`. Hangisinin doğru olduğu belirsiz; bakım maliyeti 14×.
- **Port çakışması.** `docker-compose.unified.yml` içinde hem `"3001:3001"` hem `"3001:3000"` var —
  host'ta 3001 iki kez bağlanıyor, ikinci konteyner başlamaz. README ayrıca Grafana'yı da 3001'e koyuyor.
- **Sahte CI.** `.github/workflows/ci.yml` `validate` job'ı sadece dizin listeliyor:
  ```yaml
  - name: Validate project structure
    run: |
      ls -la
      echo "✅ Project structure validated"
  ```
  Build yok, test yok, typecheck yok, lint yok.
- **Kök `package.json` yok** — ama README `npm install` ve `npm run dev:vite`'ı kök dizinde çalıştırmayı söylüyor.
  Bu komutlar olduğu gibi çalışmaz.
- **Kök seviyede** `.eslintrc`, `.prettierrc`, `tsconfig.base.json`, `.editorconfig`, `.nvmrc` yok.

### B.5 Dokümantasyon

25 markdown dosyası mevcut ve bunların büyük kısmı **henüz yazılmamış kodun performans raporu**:
`ULTRA-PERFORMANCE-GUIDE.md`, `PERFORMANCE-TEST-REPORT.md`, `FINAL-ARCHITECTURE-VALIDATION.md`,
`MICROSERVICES-INDEX-PERFORMANCE-REPORT.md`… Test edilecek çalışan bir sistem olmadığından
bu raporlardaki sayılar doğrulanamaz. Bu dosyalar Faz 1'de `docs/archive/` altına taşınmalıdır.

### B.6 Denetim özeti tablosu

| Alan | Durum | Öncelik |
|---|---|---|
| Git motoru | ❌ Yok | P0 |
| Frontend build | ❌ Kırık | P0 |
| Auth kalıcılığı | ❌ Sahte | P0 |
| DB şeması (tek kaynak) | ❌ Çakışan iki tanım | P0 |
| Test | ❌ Sıfır | P0 |
| CI | ❌ Sahte | P0 |
| Lockfile / tekrarlanabilir build | ❌ Yok | P1 |
| Monorepo tooling | ❌ Yok | P1 |
| Compose konsolidasyonu | ⚠️ 14 dosya | P1 |
| Gözlemlenebilirlik | ⚠️ Yapılandırma var, sinyal yok | P2 |
| Tasarım sistemi | ⚠️ MUI var, sistem yok | P1 |

---

## C. Hedef Mimari

### C.1 Neden "modüler monolit + kenar servisler"?

Mevcut 12-mikroservis kurgusu, **1 kişilik bir ekip için yanlış maliyet eğrisi** üzerinde.
Mikroservisler ağ sınırları, dağıtık transaction, servis keşfi ve 12× dağıtım yükü getirir —
bunların hepsi henüz *tek kullanıcı akışı çalışmayan* bir üründe saf kayıptır.

**Önerilen hedef:**

```
┌──────────────────────────────────────────────────────────────┐
│  apps/web  — Next.js 16 (App Router, RSC, Server Actions)    │
└───────────────┬──────────────────────────────────────────────┘
                │ tRPC (tip-güvenli) + REST (webhooks, git-http)
┌───────────────▼──────────────────────────────────────────────┐
│  apps/api  — NestJS 11 · Modüler Monolit                     │
│                                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │  auth  │ │  repo  │ │  git   │ │ issue  │ │   pr   │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ search │ │ notify │ │ webhook│ │  org   │               │
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│         Her modül: controller · service · repository         │
│         Modüller arası iletişim: yalnızca public service API  │
└───┬──────────────┬───────────────┬──────────────┬────────────┘
    │              │               │              │
┌───▼────┐   ┌─────▼────┐   ┌──────▼─────┐  ┌────▼──────────┐
│Postgres│   │  Redis   │  │ Object Store│  │  BullMQ       │
│  18    │   │ (cache + │  │  (S3/MinIO: │  │  (worker:     │
│        │   │  pubsub) │  │  LFS, avatar│  │  email, sms,  │
└────────┘   └──────────┘  │  , artifact)│  │  webhook, ai) │
                            └─────────────┘  └───────────────┘
┌──────────────────────────────────────────────────────────────┐
│  Kenar servisler (yalnızca gerçekten ayrılması gerekenler)   │
│  · git-server   — Git HTTP/SSH protokolü, ağır I/O, izole    │
│  · realtime     — WebSocket fan-out, farklı ölçek profili    │
│  · ai-worker    — GPU/uzun süreli iş, farklı ölçek profili   │
└──────────────────────────────────────────────────────────────┘
```

**Kural:** Bir modül ancak şu üç şartın *en az biri* sağlandığında ayrı servise çıkarılır:
1. Ölçek profili farklı (ör. realtime: çok bağlantı/az CPU),
2. Kaynak profili farklı (ör. AI: GPU),
3. Hata izolasyonu kritik (ör. git-server: ağır I/O ana API'yi boğmasın).

`sms`, `email`, `telegram`, `whatsapp`, `wordpress` bu şartların hiçbirini sağlamaz →
bunlar **kuyruk işçisi (worker)** olur, ayrı servis değil.

### C.2 Migrasyon: 13 servis → hedef

| Mevcut | Hedef |
|---|---|
| `core-service` + `backend/` | → `apps/api` (birleşir, NestJS tabanı korunur) |
| `auth-service` | → `apps/api/src/modules/auth` |
| `file-service` | → `apps/api/src/modules/storage` + S3/MinIO |
| `email`, `sms`, `notification` | → `apps/worker` (BullMQ job'ları) |
| `telegram`, `whatsapp`, `wordpress` | → `apps/worker` (integration job'ları) |
| `integration-service` (boş) | → silinir |
| `realtime-service` | → `apps/realtime` (ayrı kalır) |
| `ai-service` | → `apps/ai-worker` (ayrı kalır) |
| — | → **`apps/git-server` (YENİ, P0)** |

---

## D. Teknoloji Seçimleri (Ağustos 2026)

Sürümler Ağustos 2026 itibarıyla doğrulanmıştır. `pnpm` catalog ile tek yerden yönetilir.

### D.1 Çalışma zamanı ve araçlar

| Alan | Seçim | Sürüm | Gerekçe |
|---|---|---|---|
| Runtime | **Node.js** | 24 LTS | Nisan 2028'e kadar destekli. (26 henüz Current; Ekim 2026'da LTS olacak.) |
| Paket yöneticisi | **pnpm** | 10.x | Workspace + catalog; disk verimli, sıkı bağımlılık izolasyonu |
| Monorepo orkestrasyon | **Turborepo** | 2.x | Uzak önbellek, görev grafiği |
| Dil | **TypeScript** | 5.9 | `strict: true`, proje referansları |
| Lint + format | **Biome** | 2.x | ESLint+Prettier yerine tek Rust aracı, ~20× hızlı |
| Git hooks | **lefthook** | 1.x | husky'den hızlı, tek binary |

### D.2 Backend

| Alan | Seçim | Sürüm | Gerekçe |
|---|---|---|---|
| Framework | **NestJS** | 11.2 | SWC varsayılan derleyici (~20× hızlı build), Vitest varsayılan test |
| API sözleşmesi | **tRPC** 11 + REST | — | Web istemcisi için uçtan uca tip güvenliği; REST yalnızca webhook/git-http için |
| ORM | **Drizzle ORM** | 0.4x | SQL'e yakın, tip-güvenli, migration'lar düz SQL — mevcut ham SQL yaklaşımının güvenli hâli |
| DB | **PostgreSQL** | 18 | JSONB, `pg_trgm`, `tsvector` tam metin arama |
| Cache / PubSub | **Redis** | 8 | Oturum, önbellek, realtime fan-out |
| Kuyruk | **BullMQ** | 5.x | Redis tabanlı; Kafka'nın operasyonel yükü bu ölçekte gereksiz |
| Nesne depolama | **MinIO** (dev) / S3 (prod) | — | Git LFS, avatar, CI artifact |
| Git kütüphanesi | **isomorphic-git** + `nodegit`/CLI köprüsü | — | Bkz. Faz 4 |
| Doğrulama | **Zod** | 4.x | Tek şema → tip + runtime doğrulama (`class-validator` yerine) |
| Auth | **Better Auth** | 1.x | OAuth, passkey/WebAuthn, 2FA, oturum yönetimi hazır |

> **Kafka notu:** `docker-compose.kafka.yml` (15 KB) mevcut ölçekte gereksiz karmaşıklık.
> BullMQ ile başlayın; günlük >1M olay veya olay-kaynaklı denetim izi gerektiğinde Kafka'ya geçin.

### D.3 Frontend

| Alan | Seçim | Sürüm | Gerekçe |
|---|---|---|---|
| Framework | **Next.js** | 16.3 | App Router, Cache Components, stabil Turbopack, React Compiler |
| UI kütüphanesi | **React** | 19.2 | Server Components, Actions, `useOptimistic` |
| Stil | **Tailwind CSS** | 4.x | Oxide (Rust) motoru, CSS-first `@theme`, OKLCH renkler |
| Bileşenler | **shadcn/ui** + Radix UI | — | Kopyala-sahiplen; MUI'nun bundle ağırlığı ve tema kilidi yok |
| Sunucu durumu | **TanStack Query** 5 (tRPC üzerinden) | — | Tek sunucu-durumu kütüphanesi (Apollo + SWR + Query üçlüsü kaldırılır) |
| İstemci durumu | **Zustand** 5 | — | Yalnızca gerçek istemci durumu (tema, panel açık/kapalı) |
| Form | **React Hook Form** + Zod resolver | — | Backend ile paylaşılan şema |
| Kod editörü | **CodeMirror 6** | — | Monaco'dan hafif; syntax highlight, diff, blame gutter |
| Animasyon | **Motion** (eski Framer Motion) 12 | — | Sayfa geçişleri, mikro-etkileşimler |
| Grafik | **Recharts** 3 / **visx** | — | Katkı grafiği, insight paneli |
| Tablo | **TanStack Table** 8 | — | Sanallaştırılmış dosya/commit listeleri |
| Test | **Vitest** 3 + Testing Library + **Playwright** | — | Birim + entegrasyon + E2E |

> **MUI → shadcn/ui geçiş gerekçesi:** Mevcut `UnifiedIndex.tsx` tek dosyada 40+ MUI ikonu import ediyor.
> MUI, emotion runtime'ı ve büyük bundle getiriyor; GitHub benzeri yoğun bilgi arayüzlerinde
> Tailwind + Radix daha ince kontrol ve belirgin biçimde küçük bundle sağlıyor.
> Bu bir zevk meselesi değil, **ölçülebilir bir bundle/kontrol kazancı**.

---

# FAZLAR

Her faz: **hedef → adımlar → çıktılar → kabul kriterleri**.
Bir faz, kabul kriterleri karşılanmadan "tamam" sayılmaz.

---

## Faz 1 — Karar, Temizlik ve Monorepo Temeli

**Süre:** 3–5 gün · **Öncelik:** P0 · **Bağımlılık:** yok

### Hedef
Tek bir gerçek kaynağı olan, tekrarlanabilir şekilde derlenen, gerçek CI'ya sahip bir temel.

### 1.1 Kararları ver ve yaz

Şu üç kararı `docs/adr/` altına ADR (Architecture Decision Record) olarak yazın:

- **ADR-001: Frontend framework.** Next.js 16 seçilir; Vite kurulumu kaldırılır.
  *Gerekçe:* RSC ile kod tarayıcı sayfaları sunucuda render edilebilir (büyük dosyalarda kritik),
  SEO (public repo sayfaları), tek yönlendirme sistemi.
- **ADR-002: Backend tabanı.** `backend/` (NestJS) taban alınır; `services/core-service/` mantığı
  buraya taşınır ve dizin silinir. *Gerekçe:* NestJS'in DI, modül sistemi ve test altyapısı;
  ham SQL string'leri Drizzle'a çevrilir.
- **ADR-003: Modüler monolit.** Bölüm C.1'deki servis→modül eşlemesi.

### 1.2 Monorepo iskeletini kur

```bash
# Kökte
pnpm init
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  typescript: 5.9.2
  zod: ^4.0.0
  "@tanstack/react-query": ^5.60.0
  react: ^19.2.0
  react-dom: ^19.2.0
  next: ^16.3.0
```

Hedef dizin yapısı:

```
.
├── apps/
│   ├── web/            # Next.js 16
│   ├── api/            # NestJS 11 (modüler monolit)
│   ├── git-server/     # Git HTTP/SSH  ← YENİ
│   ├── realtime/       # WebSocket
│   ├── worker/         # BullMQ (email, sms, webhook, entegrasyon)
│   └── ai-worker/      # AI işleri
├── packages/
│   ├── db/             # Drizzle şema + migration (TEK GERÇEK KAYNAK)
│   ├── contracts/      # Zod şemaları + tRPC router tipleri
│   ├── ui/             # shadcn/ui bileşenleri + tasarım token'ları
│   ├── config/         # tsconfig, biome, tailwind preset
│   └── observability/  # logger, tracing, metrics (paylaşımlı)
├── docs/
│   ├── adr/
│   └── archive/        # eski 25 rapor buraya
├── infra/
│   ├── docker/
│   └── compose.yml + compose.prod.yml   # 14 → 2
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 1.3 Temizlik

```bash
# Eski raporları arşivle (silme — geçmiş referans olarak kalsın)
mkdir -p docs/archive
git mv ULTRA-PERFORMANCE-GUIDE.md PERFORMANCE-*.md MICROSERVICES-*.md \
       *-REPORT.md *-ANALYSIS*.md docs/archive/

# 14 compose → 2
# infra/compose.yml (dev) + infra/compose.prod.yml
# Diğerleri docs/archive/compose-legacy/ altına
```

**Port haritasını sabitleyin** (mevcut `3001` çakışması giderilir):

| Servis | Port |
|---|---|
| web (Next.js) | 3000 |
| api (NestJS) | 4000 |
| git-server | 4001 |
| realtime | 4002 |
| Postgres | 5432 |
| Redis | 6379 |
| MinIO | 9000 / 9001 |
| Prometheus | 9090 |
| Grafana | **3100** ← 3001'den taşındı |

### 1.4 Ortak yapılandırma

- `.nvmrc` → `24`
- `packages/config/tsconfig.base.json` → `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- `biome.json` → lint + format tek araç
- `lefthook.yml` → pre-commit: `biome check --staged`, pre-push: `turbo typecheck test`
- `.env.example` + **Zod ile başlangıçta ortam doğrulaması**:

```ts
// packages/config/src/env.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),      // fallback YOK — yoksa uygulama açılmaz
  GIT_STORAGE_PATH: z.string().min(1),
});

export const env = schema.parse(process.env);
```

> Bu, mevcut `process.env.JWT_SECRET || 'fallback-secret'` anti-pattern'ini yapısal olarak imkânsız kılar.

### 1.5 Gerçek CI

`.github/workflows/ci.yml` şunları **gerçekten** çalıştırmalı:

```yaml
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile   # lockfile zorunlu
      - run: pnpm biome ci .                  # lint + format
      - run: pnpm turbo typecheck             # tsc --noEmit, tüm paketler
      - run: pnpm turbo build                 # gerçek build
      - run: pnpm turbo test -- --coverage     # gerçek test
      - run: pnpm turbo test:e2e              # Playwright
```

Ek olarak: `dependency-review`, `codeql`, Trivy (mevcut, korunur), ve
**branch protection** — CI yeşil olmadan `main`'e merge yok.

### ✅ Faz 1 Kabul Kriterleri — **TAMAMLANDI**

- [x] `pnpm install && pnpm turbo build` kökte **sıfır hata** ile tamamlanır → `8 successful, 8 total`
- [x] `pnpm turbo typecheck` sıfır hata
- [x] Tüm workspace'lerde `pnpm-lock.yaml` tek ve güncel (eski `frontend/package-lock.json` kaldırıldı)
- [x] `docker compose config` port çakışması olmadan doğrulanır (dev + prod)
- [x] CI, kasten bozulan bir tip hatasında **kırmızı** olur — doğrulandı:
  - tip hatası enjekte edildi → `@app/config#typecheck` FAILED
  - kullanılmayan değişken eklendi → `biome ci` exit=1
  - test beklentisi bozuldu → `1 failed | 12 passed`
  - üçü de geri alındıktan sonra → `8 successful, 8 total`, `biome exit=0`
- [x] 3 ADR yazıldı → [`docs/adr/`](docs/adr/)
- [x] Kök dizinde 2 markdown kaldı (27 rapor `docs/archive/`'e taşındı)
- [x] 14 compose dosyası → 2 (`infra/compose.yml`, `infra/compose.prod.yml`)

### 📋 Faz 1'de bulunan ve düzeltilen gerçek hatalar

Denetimde öngörülmeyen, **yalnızca gerçekten derleyince ortaya çıkan** sorunlar:

| # | Sorun | Nerede | Etki |
|---|---|---|---|
| 1 | `'use client'` direktifi eksik | `AuthContext`, `SocketContext`, `UnifiedIndex`, `theme` | Next tarafı da hiç derlenmemiş |
| 2 | MUI sağlayıcıları Server Component içinde | `app/layout.tsx` | Build hatası |
| 3 | `QueryClientProvider` hiç yok | — | TanStack Query çağrıları runtime'da patlardı |
| 4 | TypeORM `new Index(...)` | 2 migration | `Index` bir **dekoratör**, sınıf değil → migration'lar hiç çalıştırılmamış |
| 5 | `createForeignKey` düz nesne alıyor | `InitialMigration` | Aynı sebep |
| 6 | `@nestjs/config` kullanılıyor, bağımlılık değil | `app.module`, `cache.service` | Derleme hatası |
| 7 | `retryDelayOnFailover` diye bir ioredis seçeneği yok | `cache.service` | Sessizce yok sayılıyordu |
| 8 | **İkinci fallback secret**: `JWT_SECRET \|\| 'your-secret-key'` | `jwt.strategy.ts` | Denetimde kaçırılmıştı |
| 9 | MUI v7 `Grid` API değişikliği (`item` → `size`) | `UnifiedIndex` | 12 kullanım |
| 10 | TanStack Query v4 API'si (`cacheTime`, `getNextPageParam`) | `useOptimizedDataFetching` | Ölü kod, kaldırıldı |
| 11 | `Error` ikonu global `Error` tipini gölgeliyor | `UnifiedIndex` | — |
| 12 | Biome otofix'i NestJS DI'yı bozdu (`import type`) | `apps/api` geneli | Aşağıya bakın |

> **Not — `useImportType` neden `apps/api` için kapalı:** NestJS bağımlılık enjeksiyonu ve
> GraphQL tip kaydı `emitDecoratorMetadata`'ya dayanır. Bir sınıf `import type` ile alınırsa
> dekoratör meta verisi `Object` olarak yayılır; **derleme geçer, uygulama çalışma zamanında
> sessizce bozulur**. `biome.json` içindeki `overrides` bloğu bu yüzden vardır.
> Aynı gerekçeyle `noUnusedFunctionParameters` de kapalıdır: `@Args('id') id: string`
> gibi dekoratörlü parametreler yanlış pozitif üretir.

---

## Faz 2 — Veri Modeli ve Veritabanı

**Süre:** 4–6 gün · **Öncelik:** P0 · **Bağımlılık:** Faz 1

### Hedef
`packages/db` içinde **tek gerçek kaynak** olan, migration'lı, indeksli, seed'li şema.

### 2.1 Çekirdek domain

Mevcut `User` + `Repository` yetersiz. GitHub benzeri bir ürün için minimum:

```
identity          : users, sessions, oauth_accounts, ssh_keys, access_tokens
organization      : organizations, org_members, teams, team_members
repository        : repositories, repo_collaborators, repo_settings, stars, watches, forks
git (metadata)    : refs, commits_cache, branches, tags, releases
issues            : issues, issue_comments, labels, issue_labels, milestones, assignees
pull requests     : pull_requests, pr_reviews, pr_review_comments, pr_commits, merge_status
social            : follows, notifications, activity_feed
content           : gists, wiki_pages, discussions
automation        : webhooks, webhook_deliveries, workflow_runs
audit             : audit_logs
```

### 2.2 Drizzle şema örneği

```ts
// packages/db/src/schema/repository.ts
import { pgTable, uuid, varchar, text, boolean, integer,
         timestamp, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './user';

export const visibilityEnum = pgEnum('visibility', ['public', 'private', 'internal']);

export const repositories = pgTable('repositories', {
  id:            uuid('id').primaryKey().defaultRandom(),
  ownerId:       uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:          varchar('name', { length: 100 }).notNull(),
  description:   text('description'),
  visibility:    visibilityEnum('visibility').notNull().default('public'),
  defaultBranch: varchar('default_branch', { length: 255 }).notNull().default('main'),
  // Sayaçlar: denormalize, trigger ile tutarlı — her istekte COUNT(*) atmamak için
  starsCount:    integer('stars_count').notNull().default(0),
  forksCount:    integer('forks_count').notNull().default(0),
  // Git deposunun diskteki/nesne depodaki yolu
  storagePath:   varchar('storage_path', { length: 500 }).notNull(),
  sizeBytes:     integer('size_bytes').notNull().default(0),
  primaryLanguage: varchar('primary_language', { length: 50 }),
  isArchived:    boolean('is_archived').notNull().default(false),
  pushedAt:      timestamp('pushed_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Bir kullanıcı aynı isimde iki repo açamaz — DB seviyesinde garanti
  uniqueIndex('repo_owner_name_uq').on(t.ownerId, t.name),
  // "Trend repolar" ve profil listeleri için
  index('repo_visibility_stars_idx').on(t.visibility, t.starsCount.desc()),
  index('repo_pushed_at_idx').on(t.pushedAt.desc()),
]);
```

### 2.3 İndeks disiplini

| Sorgu | İndeks |
|---|---|
| Kullanıcının repoları | `(owner_id, pushed_at DESC)` |
| Repo issue listesi (state filtreli) | `(repository_id, state, number DESC)` |
| PR listesi | `(repository_id, state, updated_at DESC)` |
| Bildirim kutusu | `(user_id, read_at NULLS FIRST, created_at DESC)` |
| Kod/repo arama | `GIN (to_tsvector('simple', name \|\| ' ' \|\| description))` |
| Kullanıcı adı arama | `GIN (username gin_trgm_ops)` |

> **Kural:** `EXPLAIN ANALYZE` çıktısında `Seq Scan` gören her sorgu, PR'da gerekçelendirilmeli.

### 2.4 Migration ve seed

```bash
pnpm --filter @app/db drizzle-kit generate   # SQL migration üret
pnpm --filter @app/db migrate                # uygula
pnpm --filter @app/db seed                   # gerçekçi demo veri
```

**Seed gerçekçi olmalı:** 50 kullanıcı, 200 repo, 1000 issue, 300 PR, gerçek commit geçmişi olan
en az 3 repo. Boş bir arayüzde UX kararı verilemez.

### ✅ Faz 2 Kabul Kriterleri

- [ ] `packages/db` tek şema kaynağı; `backend/src/migrations` ve core-service ham SQL'i kaldırıldı
- [ ] `migrate` sıfırdan boş DB'de hatasız çalışır ve **idempotent**'tir
- [ ] Her migration'ın çalışan bir `down`'ı var
- [ ] `seed` sonrası ana sayfa sorguları `EXPLAIN ANALYZE`'da index kullanır
- [ ] Yabancı anahtarların tamamında açık `onDelete` davranışı tanımlı

---

## Faz 3 — Kimlik Doğrulama ve Yetkilendirme

**Süre:** 5–7 gün · **Öncelik:** P0 · **Bağımlılık:** Faz 2

### Hedef
Sahte auth'un yerine, gerçek kalıcılığı olan, modern ve güvenli kimlik katmanı.

### 3.1 Kimlik doğrulama

**Better Auth** üzerine kurulur:

- E-posta + parola (**Argon2id**, bcrypt değil)
- OAuth: GitHub, Google, GitLab
- **Passkey / WebAuthn** (parolasız — 2026 standardı)
- TOTP 2FA + kurtarma kodları
- E-posta doğrulama, parola sıfırlama (tek kullanımlık, süreli token)
- Oturum: httpOnly + Secure + SameSite=Lax çerez, Redis'te saklanan dönebilir (rotating) refresh token

```ts
// apps/api/src/modules/auth/auth.config.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: {
    enabled: true,
    password: { hash: argon2id, verify: argon2Verify },
    requireEmailVerification: true,
  },
  socialProviders: {
    github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET },
  },
  plugins: [passkey(), twoFactor(), organization()],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: { window: 60, max: 10 },   // login denemesi
});
```

### 3.2 Yetkilendirme (kritik ve sık atlanan)

Git barındırma platformunda yetki modeli **repo bazlı ve ince taneli** olmalı:

```ts
// packages/contracts/src/permissions.ts
export const RepoRole = ['read', 'triage', 'write', 'maintain', 'admin'] as const;

export const RepoPermission = {
  'repo:read':      ['read', 'triage', 'write', 'maintain', 'admin'],
  'repo:push':      ['write', 'maintain', 'admin'],
  'issue:write':    ['triage', 'write', 'maintain', 'admin'],
  'pr:merge':       ['maintain', 'admin'],
  'repo:settings':  ['admin'],
  'repo:delete':    ['admin'],
} as const;
```

**Uygulama noktaları — üçü de zorunlu:**

1. **API katmanı:** NestJS guard (`@RequireRepoPermission('pr:merge')`)
2. **Veri katmanı:** her repository sorgusu görünürlük filtresi alır — *private repo asla `SELECT`'e sızmamalı*
3. **Git protokolü:** `git-server`, her fetch/push'ta bağımsız yetki kontrolü yapar
   (istemci HTTP katmanını atlayabilir)

> ⚠️ **En sık yapılan hata:** yetkiyi yalnızca UI'da veya yalnızca API guard'ında kontrol etmek.
> Private repo içeriği `git clone` ile veya iç içe GraphQL alanı üzerinden sızabilir.
> **Testi yazın:** "yetkisiz kullanıcı private repoyu 5 farklı yoldan çekemez."

### 3.3 Access token'lar

Git işlemleri için kişisel erişim token'ları (PAT), kapsam (scope) sınırlı ve süreli:
`repo`, `repo:status`, `read:org`, `write:packages`. Token'lar DB'de **hash'li** saklanır,
oluşturulurken bir kez gösterilir.

### ✅ Faz 3 Kabul Kriterleri

- [ ] Kayıt olan kullanıcı gerçekten `users` tablosuna yazılır (mevcut sahte akış kaldırıldı)
- [ ] `JWT_SECRET` yoksa uygulama **açılmaz** (fallback yok)
- [ ] Parolalar Argon2id ile hash'lenir
- [ ] Passkey ile giriş uçtan uca çalışır
- [ ] Yetki matrisi testi: 5 rol × 6 izin = 30 senaryo, hepsi test kapsamında
- [ ] Private repo sızıntı testi: HTTP API, GraphQL/tRPC, git-http, arama, aktivite akışı — 5'i de kapalı
- [ ] Brute-force koruması: 10 başarısız denemeden sonra rate limit devrede

---

## Faz 4 — Git Motoru (projenin eksik kalbi)

**Süre:** 3–4 hafta · **Öncelik:** P0 · **Bağımlılık:** Faz 2, 3

> Bu faz, projenin **en büyük eksiğini** kapatır. Mevcut repoda Git'e dair tek satır kod yoktur.
> Bu faz olmadan ürün "GitHub Clone" değil, "issue tracker" olur.

### 4.1 Depolama modeli

```
GIT_STORAGE_PATH/
└── {shard}/               # repo id'sinin ilk 2 karakteri — dizin başına dosya sınırını aşmamak için
    └── {repo-id}.git/     # bare repository
        ├── objects/
        ├── refs/
        ├── HEAD
        └── hooks/
            ├── pre-receive     # yetki + branch protection
            ├── update          # force-push, korumalı branch kontrolü
            └── post-receive    # olay yayınla → BullMQ
```

- **Bare repo**, çalışma dizini yok (sunucuda gereksiz).
- Yol veritabanında `repositories.storage_path` olarak tutulur — dizin adı repo *adı* değil *id*'sidir,
  böylece yeniden adlandırma disk işlemi gerektirmez.
- **Git LFS** büyük dosyalar için S3/MinIO'ya yönlendirilir.

### 4.2 Git protokol katmanı — `apps/git-server`

İki taşıma yolu desteklenir:

**HTTP(S) — Smart HTTP:**
```
GET  /:owner/:repo.git/info/refs?service=git-upload-pack     → keşif
POST /:owner/:repo.git/git-upload-pack                        → clone / fetch
POST /:owner/:repo.git/git-receive-pack                       → push
```

Uygulama: `git-http-backend` CGI'ını sarmalayın (yeniden yazmayın — pack protokolü
inceliklidir ve kendi implementasyonunuz sessizce bozulur):

```ts
// apps/git-server/src/http/smart-http.ts
async function handleGitRequest(req, res) {
  const { owner, repo } = parseRepoPath(req.path);
  const service = req.query.service ?? inferFromPath(req.path);

  // 1) Kimlik: Basic auth (PAT) veya oturum çerezi
  const actor = await authenticate(req);

  // 2) Yetki: upload-pack → repo:read, receive-pack → repo:push
  const needed = service === 'git-receive-pack' ? 'repo:push' : 'repo:read';
  await assertPermission(actor, repo, needed);   // ← protokol katmanında BAĞIMSIZ kontrol

  // 3) git-http-backend'e devret, stdio'yu stream'le
  return spawnGitHttpBackend({ repoPath: repo.storagePath, req, res, actor });
}
```

**SSH:** `ssh2` tabanlı sunucu; kullanıcının `ssh_keys` tablosundaki public key'iyle doğrulama,
ardından `git-upload-pack` / `git-receive-pack` çalıştırma. Kısıtlı komut kabuğu — kullanıcı
**yalnızca** bu iki komutu çalıştırabilir.

### 4.3 Okuma API'si — repo tarama

Kod tarayıcı için gereken işlemler (`isomorphic-git` veya `git cat-file` köprüsü ile):

| İşlem | Açıklama | Önbellek |
|---|---|---|
| `listRefs(repo)` | branch + tag listesi | Redis 30 sn |
| `readTree(repo, ref, path)` | dizin içeriği | Redis 5 dk (ref SHA anahtarlı) |
| `readBlob(repo, ref, path)` | dosya içeriği | Redis 1 sa (SHA anahtarlı — **immutable**) |
| `log(repo, ref, path, page)` | commit geçmişi | Redis 5 dk |
| `diff(repo, base, head)` | commit/PR farkı | Redis 1 sa (SHA çiftine göre) |
| `blame(repo, ref, path)` | satır bazlı yazar | Redis 1 sa |
| `mergeBase(repo, a, b)` | PR taban commit'i | Redis 1 sa |

> **Önbellek altın kuralı:** Git nesneleri **içerik-adresli ve değişmezdir**.
> Anahtarı SHA olan her şey sonsuza kadar önbelleklenebilir. Yalnızca *ref → SHA* eşlemesi değişir.
> Bu, Git tabanlı bir üründe en büyük performans kazancıdır ve `AdvancedCacheService` gibi
> genel amaçlı önbellek katmanlarından çok daha etkilidir.

### 4.4 Yazma işlemleri

- **Merge (PR birleştirme):** üç strateji — merge commit, squash, rebase.
  Sunucu tarafında geçici çalışma dizininde yapılır, ardından ref güncellenir (atomik `update-ref`).
- **Web'den düzenleme:** dosya düzenle → yeni blob → yeni tree → yeni commit → ref ilerlet.
- **Branch protection:** `pre-receive` hook'unda — force-push engeli, gerekli review sayısı,
  gerekli status check'ler, imzalı commit zorunluluğu.

### 4.5 Olay yayılımı

`post-receive` hook → BullMQ kuyruğu → tüketiciler:
- Aktivite akışını güncelle
- Webhook'ları tetikle
- Commit mesajlarından issue kapat (`fixes #123`)
- Kod arama indeksini güncelle
- Realtime kanalına yayınla

### 4.6 Sınırlar ve koruma (kötüye kullanım önleme)

| Risk | Önlem |
|---|---|
| Devasa push | `receive.maxInputSize`, repo kota kontrolü |
| Git bomb (iç içe nesne) | `core.bigFileThreshold`, nesne sayısı limiti |
| Path traversal (`../`) | Repo yolu **her zaman** DB'deki id'den türetilir, kullanıcı girdisinden değil |
| Sembolik link kaçışı | `core.symlinks=false` bare repoda |
| Uzun süren işlem | Alt süreçlere timeout + `SIGKILL`; git-server ayrı konteyner (izolasyon) |
| Disk dolması | Repo başına kota, `git gc --aggressive` zamanlanmış iş |

### ✅ Faz 4 Kabul Kriterleri

- [ ] `git clone http://localhost:4001/user/repo.git` **gerçek git istemcisiyle** çalışır
- [ ] `git push` çalışır ve `pre-receive` yetki kontrolü uygular
- [ ] `git clone git@localhost:user/repo.git` (SSH) çalışır
- [ ] Private repoya yetkisiz `clone` **401/404** ile reddedilir
- [ ] 10.000 dosyalı bir repo'nun dizin listesi < 300 ms
- [ ] 5.000 commit'lik geçmiş sayfalanmış olarak < 500 ms
- [ ] Üç merge stratejisi de doğru sonuç üretir (test edilmiş)
- [ ] Force-push korumalı branch'te engellenir
- [ ] Path traversal denemeleri test kapsamında ve engelli

---

## Faz 5 — API Katmanı

**Süre:** 1–2 hafta · **Öncelik:** P0 · **Bağımlılık:** Faz 2, 3

### Hedef
Tip-güvenli, sayfalanmış, sürümlenmiş, hız-sınırlı tek API yüzeyi.

### 5.1 İki yüzey, net sınırlar

| Yüzey | Kullanım | Teknoloji |
|---|---|---|
| **tRPC** | Web istemcisi (`apps/web`) | Uçtan uca tip güvenliği, kod üretimi yok |
| **REST** | Webhook alıcıları, git-http, üçüncü parti | OpenAPI 3.1, sürümlü (`/api/v1`) |

> Mevcut GraphQL kurulumu (Apollo Server 3 — **kullanım ömrü dolmuş**) kaldırılır.
> GraphQL'in ana faydası çoklu istemci tipi ve alan seçimidir; tek bir web istemcisi için
> tRPC daha az yük ve daha iyi tip garantisi verir. Public API gerekirse REST + OpenAPI yeterlidir.

### 5.2 Katman kuralları

```
Controller/Router  → yalnızca HTTP/tRPC ilgisi (girdi doğrulama, yanıt şekli)
Service            → iş mantığı, transaction sınırı
Repository         → veri erişimi (Drizzle), SQL burada kalır
```

**Kural:** Servisler `Request`/`Response` görmez. Repository'ler iş kuralı bilmez.
Bu, mevcut `UserService.findAll(ctx)` gibi *context'i her yere taşıyan* yaklaşımın yerine geçer.

### 5.3 Sayfalama — cursor tabanlı

```ts
// packages/contracts/src/pagination.ts
export const cursorInput = z.object({
  cursor: z.string().nullish(),
  limit:  z.number().min(1).max(100).default(30),
});
```

> Offset sayfalama (`LIMIT 30 OFFSET 9000`) derin sayfalarda çöker ve eşzamanlı eklemede
> kayıt atlar/tekrarlar. Commit ve issue listelerinde **cursor zorunlu**.

### 5.4 Çapraz kesen ilgiler

- **Hız sınırlama:** kimliğe göre (anonim IP: 60/dk, oturum: 900/sa, PAT: 5000/sa),
  Redis sliding window. Yanıt başlıkları: `X-RateLimit-Remaining`, `Retry-After`.
- **Idempotency:** yazma isteklerinde `Idempotency-Key` başlığı (özellikle webhook yeniden denemeleri).
- **Hata formatı:** RFC 9457 Problem Details — `{ type, title, status, detail, instance }`.
- **İstek izleme:** her isteğe `x-request-id`, log ve trace'lere yayılır.
- **N+1 önleme:** DataLoader deseni veya Drizzle `with` ile tek sorguda ilişki çekme.

### ✅ Faz 5 Kabul Kriterleri

- [ ] Web istemcisi API'yi **hiç `any` kullanmadan** çağırır (uçtan uca tip)
- [ ] Tüm liste uçları cursor sayfalamalı
- [ ] OpenAPI dokümanı otomatik üretilir ve CI'da şema uyumu doğrulanır
- [ ] Hız sınırı testi: limit aşımında 429 + `Retry-After`
- [ ] N+1 testi: repo listesi + sahip bilgisi **tek sorguda** (query log ile doğrulanmış)

---

## Faz 6 — Tasarım Sistemi ve Frontend Temeli

**Süre:** 1–2 hafta · **Öncelik:** P0 · **Bağımlılık:** Faz 1

### Hedef
Kırık frontend'i kaldırıp, tutarlı bir tasarım sistemi üzerine yeniden kurmak.

### 6.1 Önce kırığı onar

1. Vite kurulumunu kaldır: `vite.config.ts`, `main.tsx`, `App.tsx`, `Dockerfile.vite`,
   `Dockerfile.ultra`, `Dockerfile.optimized`, `index.html`, ilgili `package.json` script'leri.
2. Çakışan sunucu-durumu kütüphanelerini kaldır: `@apollo/client`, `swr`, `react-router-dom`.
3. MUI'yi kaldır, Tailwind 4 + shadcn/ui kur.
4. `UnifiedIndex.tsx` — bu bir *ürün sayfası değil, bir debug panosu*. `apps/web/src/app/(internal)/status/`
   altına taşınıp ürün ana sayfasından ayrılmalı.

### 6.2 Tasarım token'ları — `packages/ui`

Tailwind 4 CSS-first yapılandırma, OKLCH renk uzayı:

```css
/* packages/ui/src/styles/theme.css */
@import "tailwindcss";

@theme {
  /* Renk — OKLCH: algısal olarak tekdüze, koyu/açık tema geçişi tutarlı */
  --color-canvas:        oklch(100% 0 0);
  --color-canvas-subtle: oklch(98.2% 0.002 265);
  --color-border:        oklch(90.5% 0.005 265);
  --color-fg:            oklch(24%  0.01  265);
  --color-fg-muted:      oklch(52%  0.015 265);
  --color-accent:        oklch(56%  0.17  255);
  --color-success:       oklch(58%  0.14  150);
  --color-danger:        oklch(58%  0.19  25);
  --color-attention:     oklch(70%  0.15  75);

  /* Tipografi — kod yoğun arayüz: dar ve okunaklı */
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;

  /* Aralık — 4px tabanlı ölçek */
  --spacing: 0.25rem;

  /* Yarıçap, gölge, hareket */
  --radius-md: 0.375rem;
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-canvas:        oklch(17%  0.012 265);
    --color-canvas-subtle: oklch(21%  0.014 265);
    --color-border:        oklch(30%  0.015 265);
    --color-fg:            oklch(93%  0.005 265);
    --color-fg-muted:      oklch(68%  0.012 265);
    --color-accent:        oklch(70%  0.15  250);
  }
}
:root[data-theme="dark"] { /* aynı koyu token'lar — açık toggle'ı ezmek için */ }
```

> **Neden OKLCH?** HSL'de `hsl(220 90% 50%)` ile `hsl(60 90% 50%)` aynı "parlaklık" değerine sahip
> görünse de gözle çok farklı algılanır. OKLCH'te aynı `L` gerçekten aynı algısal parlaklıktır —
> bu, erişilebilir kontrast oranlarını sistematik olarak tutturmayı mümkün kılar.

### 6.3 Bileşen katmanları

```
packages/ui/src/
├── primitives/    # Button, Input, Dialog, Popover, Tooltip (Radix + Tailwind)
├── patterns/      # DataTable, EmptyState, FileTree, DiffViewer, CommandPalette
└── layouts/       # AppShell, RepoLayout, SettingsLayout
```

**Zorunlu durumlar** — her veri gösteren bileşen 5 durumu da uygulamalı:

| Durum | Gereklilik |
|---|---|
| Loading | **Skeleton** (spinner değil — layout shift önlenir) |
| Empty | Açıklayıcı metin + birincil eylem |
| Error | Ne olduğu + tekrar dene butonu |
| Partial | Sayfalama / "daha fazla yükle" |
| Success | Asıl içerik |

### 6.4 Erişilebilirlik (baştan, sonradan değil)

- Tüm etkileşimli öğeler klavyeyle erişilebilir, görünür `:focus-visible` halkası
- Radix primitive'leri ARIA'yı doğru yapar — kendi dialog/dropdown'ınızı yazmayın
- Kontrast: normal metin ≥ 4.5:1, büyük metin ≥ 3:1 (token'lar bunu garantiler)
- `prefers-reduced-motion` desteği tüm animasyonlarda
- Canlı bölgeler (`aria-live`) bildirim ve toast'larda
- CI'da `axe-core` ile otomatik denetim

### 6.5 Modern UX kalıpları

| Kalıp | Uygulama |
|---|---|
| **Command palette** (`⌘K`) | Repo, dosya, issue, PR, eylem — tek arama kutusu |
| **Optimistic UI** | Star, watch, label ekleme → `useOptimistic` ile anında geri bildirim |
| **Streaming SSR** | Kod sayfası: dosya ağacı hemen, blob içeriği stream ile (React Suspense) |
| **Klavye kısayolları** | `t` dosya bul, `s` ara, `g d` diff'e git — GitHub kas hafızasıyla uyumlu |
| **Kalıcı görünüm durumu** | Diff modu (split/unified), whitespace gizle, sekme genişliği — URL + localStorage |
| **View Transitions API** | Sayfa geçişleri (Next 16 + React 19 desteği) |
| **Tema** | Açık / koyu / sistem — FOUC olmadan (inline script ile ilk boyama öncesi) |

### ✅ Faz 6 Kabul Kriterleri

- [ ] `pnpm --filter web build` **hatasız** (Faz 1 öncesindeki 10 kırık import giderildi)
- [ ] Tek yönlendirme sistemi (Next App Router), tek Dockerfile
- [ ] Tek sunucu-durumu kütüphanesi (TanStack Query); Apollo + SWR kaldırıldı
- [ ] Storybook'ta tüm primitive'ler, 5 durumun her biri için
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95
- [ ] `axe-core` CI denetimi: 0 kritik ihlal
- [ ] Klavye ile tam gezinme mümkün (fare kullanmadan repo → dosya → PR akışı)

---

## Faz 7 — Ürün Akışları (Repo, Kod, Issue, PR, Review)

**Süre:** 4–6 hafta · **Öncelik:** P0 · **Bağımlılık:** Faz 4, 5, 6

### Hedef
Ürünün asıl değerini üreten dikey dilimler. Her dilim **uçtan uca** tamamlanır — yarım bırakılmaz.

### 7.1 Dilim: Repository yaşam döngüsü

- Oluştur (boş / README ile / şablondan / import ile)
- Ayarlar: görünürlük, varsayılan branch, konu etiketleri, arşivle, aktar, sil
- Fork, star, watch (abonelik seviyeleri: all / participating / ignore)
- Katkıda bulunanlar, insight, katkı grafiği

### 7.2 Dilim: Kod tarayıcı (en kritik ekran)

```
apps/web/src/app/[owner]/[repo]/
├── page.tsx                    # README + dosya ağacı + repo başlığı
├── tree/[ref]/[...path]/       # dizin görünümü
├── blob/[ref]/[...path]/       # dosya görünümü
├── commits/[ref]/              # commit geçmişi
├── commit/[sha]/               # tek commit diff'i
├── compare/[base]...[head]/    # branch karşılaştırma
└── blame/[ref]/[...path]/      # blame görünümü
```

**Kritik UX detayları:**

| Özellik | Not |
|---|---|
| Sanallaştırılmış dosya ağacı | 10.000+ dosyalı repolarda DOM'u öldürmemek için |
| Sözdizimi vurgulama | **Sunucuda** (Shiki) — istemciye 2 MB highlighter göndermeyin |
| Büyük dosya koruması | > 1 MB: "Ham dosyayı görüntüle" — tarayıcıyı kilitlemeyin |
| İkili dosya algılama | Görsel/PDF önizleme; rastgele byte dökümü değil |
| Satır bağlantıları | `#L10-L25` — kalıcı, kopyalanabilir, vurgulu |
| Sembole git | Aynı dosyada tanım/kullanım atlama |
| Dosya bul (`t`) | Bulanık (fuzzy) arama, anında |
| Markdown render | GFM + görev listesi + mermaid + güvenli HTML (sanitize edilmiş) |

### 7.3 Dilim: Issue takibi

Liste (filtre: `is:open label:bug assignee:@me`), detay (yorum, reaksiyon, zaman çizelgesi),
etiket/kilometre taşı/atanan yönetimi, alt görevler, şablonlar, toplu işlem.

### 7.4 Dilim: Pull Request (en karmaşık)

```
PR akışı:
  branch push → PR aç → diff hesapla → review iste
    → satır bazlı yorum → tartışma çözümle → status check'ler
      → merge (merge/squash/rebase) → branch sil → issue kapat
```

**Diff görüntüleyici gereksinimleri:**
- Split ve unified mod (kullanıcı tercihi kalıcı)
- Yalnızca boşluk değişikliklerini gizle
- Genişletilebilir bağlam (±20 satır)
- Satır bazlı yorum + çok satırlı seçim
- Görüntülendi olarak işaretle (viewed) — kalıcı
- Büyük diff'lerde dosya sanallaştırma + "çok büyük, yüklemek için tıkla"
- Yeniden adlandırma ve mod değişikliği algılama
- Görsel diff (yan yana / kaydırıcı / fark)

**Review sistemi:** taslak review (birden çok yorum tek seferde gönderilir),
onay/değişiklik iste/yorum, kod önerisi (suggestion) ve tek tıkla uygula, CODEOWNERS ile
otomatik review ataması.

**Merge güvenliği:** birleştirilebilirlik durumu (arka planda hesaplanır ve önbelleklenir),
çakışma göstergesi, gerekli status check'ler, gerekli onay sayısı, merge kuyruğu.

### 7.5 Dilim: Organizasyon ve takımlar

Org oluştur, üye davet et, takım hiyerarşisi, takım bazlı repo izinleri, denetim kaydı, faturalama iskeleti.

### ✅ Faz 7 Kabul Kriterleri

Her dilim için:
- [ ] Uçtan uca kullanıcı yolculuğu **Playwright E2E** ile kapsanmış
- [ ] Beş arayüz durumu da uygulanmış (loading/empty/error/partial/success)
- [ ] Klavye ile tam kullanılabilir
- [ ] Yetki kontrolü hem UI hem API hem veri katmanında
- [ ] Mobil (375px) düzende kullanılabilir
- [ ] Kod tarayıcı: 10k dosyalı repo'da TTI < 2 sn
- [ ] Diff: 500 dosyalı PR tarayıcıyı kilitlemez

---

## Faz 8 — Gerçek Zamanlı Katman ve Bildirimler

**Süre:** 1–2 hafta · **Öncelik:** P1 · **Bağımlılık:** Faz 5, 7

- **Taşıma:** WebSocket (Socket.IO 4) — `apps/realtime`, Redis adapter ile yatay ölçekli
- **Kanallar:** `repo:{id}`, `pr:{id}`, `user:{id}:notifications`
- **Olaylar:** yeni yorum, review gönderildi, CI durumu değişti, push oldu, mention
- **Bildirim kutusu:** okunmamış rozeti, gruplama, "hepsini okundu işaretle", abonelik yönetimi
- **Teslim kanalları:** in-app, e-posta (digest + anlık), web push, opsiyonel Telegram/Slack
- **Tercihler:** kullanıcı bazlı olay × kanal matrisi + sessiz saatler
- **Dayanıklılık:** WebSocket *en iyi çaba* katmanıdır. **Gerçek kaynak DB'dir** —
  bağlantı koptuğunda istemci yeniden bağlanıp durumu yeniden çeker (yalnızca soket olaylarına güvenmeyin)

> Mevcut `services/notification-service` + `email-service` + `sms-service` üçlüsü burada
> `apps/worker` altında BullMQ job'larına indirgenir. Üç ayrı HTTP servisi, üç ayrı Dockerfile
> ve üç ayrı dağıtım yerine tek worker süreci.

### ✅ Kabul Kriterleri
- [ ] İki tarayıcı sekmesi: birinde yorum → diğerinde < 1 sn içinde görünür
- [ ] Bağlantı kopup döndüğünde durum tutarlı (kaçırılan olay yok)
- [ ] E-posta digest'i zamanlanmış işle gönderilir
- [ ] Bildirim tercihleri gerçekten uygulanır (kapatılan kanal mesaj almaz)

---

## Faz 9 — Arama ve Keşif

**Süre:** 1–2 hafta · **Öncelik:** P1

**Aşamalı yaklaşım — erken Elasticsearch kurmayın:**

| Aşama | Teknoloji | Kapsam |
|---|---|---|
| 1 | PostgreSQL `tsvector` + `pg_trgm` | Repo, kullanıcı, issue, PR başlık/gövde |
| 2 | + Trigram + sıralama sinyalleri | Yazım hatası toleransı, alaka sıralaması |
| 3 | Zoekt / Sourcegraph indeksi | **Kod içi arama** (regex, dile duyarlı) |

**Arama sözdizimi:** `repo:owner/name`, `language:typescript`, `is:open`, `author:@me`,
`created:>2026-01-01`, `path:src/**`.

**Keşif yüzeyleri:** trend repolar, konu (topic) sayfaları, kişiselleştirilmiş öneriler, explore akışı.

### ✅ Kabul Kriterleri
- [ ] 100k repo'da arama < 200 ms (p95)
- [ ] Yazım hatası toleransı çalışır (`typescrpt` → `typescript`)
- [ ] Arama sonuçları **yetki filtreli** (private repo sızmaz — bunu test edin)

---

## Faz 10 — AI Özellikleri

**Süre:** 2–3 hafta · **Öncelik:** P2 · **Bağımlılık:** Faz 7

`apps/ai-worker` — Claude API (`claude-sonnet-5` / `claude-opus-5`) üzerinden:

| Özellik | Değer |
|---|---|
| PR özeti | Diff'ten otomatik açıklama taslağı |
| Kod review asistanı | Hata, güvenlik, stil önerileri (öneri olarak — otomatik uygulanmaz) |
| Issue triyajı | Otomatik etiket + öncelik + benzer issue tespiti |
| Commit mesajı önerisi | Staged diff'ten |
| Kod açıklama | Seçili bloğu "bunu açıkla" |
| Semantik arama | Embedding tabanlı kod arama (pgvector) |
| Release notu | Commit aralığından otomatik CHANGELOG |

**Uygulama kuralları:**
- **Streaming zorunlu** — kullanıcı token token görmeli, 30 sn boş ekran değil
- **Prompt caching** — repo bağlamı sistem prompt'unda önbelleklenir (maliyet ~%90 düşer)
- **Kullanıcı başına kota** ve maliyet takibi
- **AI çıktısı her zaman öneri** — asla otomatik merge/commit değil
- **Gizlilik:** private repo içeriğinin AI'ya gönderilmesi **açık onaya** bağlı (org ayarı)

> Mevcut `services/ai-service` iskeleti bu fazda gerçek implementasyonla değiştirilir.

---

## Faz 11 — Test Stratejisi

**Süre:** sürekli (her fazın parçası) · **Öncelik:** P0

> Şu anda repoda **sıfır test** var. Test, ayrı bir faz değil, her fazın tanımlı bitiş şartıdır.

### Test piramidi

```
       ╱  E2E (Playwright)              %10  — kritik kullanıcı yolculukları
      ╱─────────────────────╲
     ╱  Entegrasyon           ╲          %30  — API + gerçek DB (Testcontainers)
    ╱───────────────────────────╲
   ╱  Birim (Vitest)             ╲       %60  — saf mantık, git işlemleri, yetki
  ╱───────────────────────────────╲
```

### Katman kuralları

| Katman | Araç | Kapsam |
|---|---|---|
| Birim | Vitest 3 | Servis mantığı, permission matrisi, diff parse, cursor kodlama |
| Entegrasyon | Vitest + **Testcontainers** | Gerçek Postgres + Redis; mock DB **yok** |
| Git | Vitest + geçici bare repo | Gerçek `git` binary'siyle clone/push/merge |
| Sözleşme | Zod + OpenAPI diff | İstemci–sunucu şema uyumu |
| Bileşen | Vitest + Testing Library | 5 durum, erişilebilirlik |
| E2E | Playwright | Kayıt→repo oluştur→push→PR aç→review→merge |
| Görsel | Playwright screenshot | Diff görüntüleyici, tema geçişi |
| Yük | k6 (mevcut `k6/` korunur) | Kod tarayıcı, git clone, arama |
| Güvenlik | Semgrep + Trivy + `npm audit` | CI'da bloke edici |

### Kritik test senaryoları (atlanmamalı)

1. **Yetki sızıntısı:** private repo → 5 farklı yoldan erişim denemesi, hepsi reddedilmeli
2. **Git doğruluğu:** push edilen commit, clone edildiğinde **byte-identical**
3. **Merge doğruluğu:** üç strateji, çakışmalı ve çakışmasız senaryolar
4. **Eşzamanlılık:** aynı branch'e iki eşzamanlı push → biri reddedilir, repo bozulmaz
5. **Sınır durumları:** boş repo, tek commit, 100 MB dosya, 10k dosyalı dizin, UTF-8 dosya adı

### Kapsam hedefleri

| Alan | Minimum |
|---|---|
| Git motoru | %90 |
| Auth + yetkilendirme | %90 |
| API servis katmanı | %80 |
| UI bileşenleri | %70 |
| Genel | %75 |

### ✅ Kabul Kriterleri
- [ ] CI'da testler **gerçekten** çalışır ve kırmızı olabilir (kasten bozarak doğrulayın)
- [ ] Kapsam eşiği altına düşen PR bloke edilir
- [ ] E2E ana yolculuk her PR'da çalışır
- [ ] Flaky test toleransı sıfır — kararsız test ya düzeltilir ya silinir

---

## Faz 12 — Gözlemlenebilirlik

**Süre:** 1 hafta · **Öncelik:** P1

Mevcut `monitoring/` klasöründe Prometheus/Grafana yapılandırması var ama **ölçülecek çalışan
bir sistem yok**. Bu faz gerçek sinyalleri bağlar.

### Üç sütun

| Sütun | Araç | Not |
|---|---|---|
| **Log** | Pino → JSON → Loki | Yapılandırılmış; `requestId`, `userId`, `repoId` her satırda |
| **Metrik** | `prom-client` → Prometheus → Grafana | RED (Rate/Error/Duration) + USE |
| **Trace** | OpenTelemetry → Tempo/Jaeger | Web → API → git-server → DB uçtan uca |

### Ölçülecek asıl metrikler (vanity değil)

```
# Altın sinyaller
http_request_duration_seconds{route, method, status}   histogram
git_operation_duration_seconds{op="clone|push|fetch"}  histogram
db_query_duration_seconds{query_name}                  histogram
queue_job_duration_seconds{queue, job}                 histogram
cache_hit_ratio{cache}                                 gauge

# İş metrikleri
repos_created_total, prs_merged_total, active_users
```

### SLO'lar

| Servis | SLO |
|---|---|
| Web sayfa yükleme (p95) | < 1.5 sn |
| API yanıt (p95) | < 300 ms |
| Git clone (10 MB repo, p95) | < 5 sn |
| Kullanılabilirlik | %99.9 |
| Hata bütçesi | Aylık %0.1 |

**Uyarılar SLO ihlaline bağlanır**, CPU %80'e değil. "CPU yüksek" bir semptomdur; "kullanıcılar
hata alıyor" bir olaydır.

### Ek
- **Hata takibi:** Sentry (kaynak haritalarıyla)
- **Sağlık uçları:** `/health/live` (süreç ayakta mı) ve `/health/ready` (bağımlılıklar hazır mı) — **ayrı olmalı**
- **Yapısal panolar:** servis genel bakış, git operasyonları, kuyruk derinliği, DB yavaş sorgular

---

## Faz 13 — Güvenlik Sertleştirme

**Süre:** 1–2 hafta · **Öncelik:** P0 (Faz 3 ile paralel başlar)

### Kontrol listesi

**Kimlik / oturum**
- [ ] Argon2id parola hash'i
- [ ] Dönen (rotating) refresh token + yeniden kullanım tespiti
- [ ] Oturum iptali (tüm cihazlardan çıkış)
- [ ] Passkey/WebAuthn + TOTP 2FA
- [ ] Hassas işlemlerde yeniden kimlik doğrulama (repo silme, ayar değişikliği)

**Girdi / çıktı**
- [ ] Tüm girdiler Zod ile doğrulanır (sınırda, tek noktada)
- [ ] Markdown render'ı sanitize edilir (XSS — `dangerouslySetInnerHTML` yasak)
- [ ] Dosya adı ve yol doğrulama (path traversal)
- [ ] Yüklenen dosyalarda MIME + sihirli byte kontrolü
- [ ] SSRF koruması: webhook URL'leri iç ağa çıkamaz (metadata endpoint'leri dahil)

**Uygulama**
- [ ] CSP (nonce tabanlı), HSTS, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] CSRF token'ı (çerez tabanlı oturumda)
- [ ] Hız sınırlama (kimlik + IP + uç bazlı)
- [ ] Kullanıcı içeriği **ayrı origin'de** sunulur (`raw.domain.com`) — XSS izolasyonu
- [ ] Webhook imzası (HMAC-SHA256) + zaman damgası tekrar saldırısı koruması

**Sırlar**
- [ ] Kod tabanında sır yok (`gitleaks` CI'da bloke edici)
- [ ] **Fallback sır yok** — `env.ts` Zod doğrulaması zorunlu kılar
- [ ] Üretimde sır yöneticisi (Vault / AWS Secrets Manager / Doppler)
- [ ] Token'lar DB'de hash'li

**Altyapı**
- [ ] Konteynerler root olmayan kullanıcıyla çalışır
- [ ] Salt-okunur kök dosya sistemi (mümkün olan yerlerde)
- [ ] Ağ politikaları: DB yalnızca API'den erişilebilir
- [ ] `git-server` izole konteyner (kod yürütme yüzeyi)
- [ ] Bağımlılık taraması (Dependabot + Trivy) CI'da bloke edici

**Uyumluluk**
- [ ] Denetim kaydı (kim, ne, ne zaman, hangi IP)
- [ ] Veri dışa aktarma + hesap silme (KVKK / GDPR)
- [ ] Kişisel veri şifreleme (dinlenmede)

---

## Faz 14 — Performans

**Süre:** 1–2 hafta · **Öncelik:** P1 · **Bağımlılık:** Faz 12 (önce ölç!)

> Mevcut repodaki `ULTRA-PERFORMANCE-GUIDE.md`, `PERFORMANCE-TEST-REPORT.md` gibi dosyalar
> **çalışan kod olmadan** yazılmış performans raporlarıdır. Bu faz, ölçüme dayalı gerçek
> optimizasyonu koyar. **Kural: önce ölç, sonra optimize et.**

### Frontend

| Teknik | Etki |
|---|---|
| RSC ile sunucu render | Kod tarayıcıda istemci JS'i minimumda |
| Route bazlı kod bölme | İlk yükleme bundle'ı küçük |
| Shiki ile **sunucu tarafı** vurgulama | ~2 MB istemci highlighter kaldırılır |
| Sanallaştırma (dosya ağacı, diff, commit listesi) | 10k+ öğede DOM sabit kalır |
| `next/image` + AVIF/WebP | Görsel ağırlığı |
| Font subsetting + `font-display: swap` | CLS = 0 |
| Prefetch (hover/viewport) | Algılanan hız |
| React Compiler | Otomatik memoization |

**Bütçeler (CI'da zorunlu):** İlk JS < 150 KB gzip · LCP < 2.0 sn · CLS < 0.1 · INP < 200 ms

### Backend

| Teknik | Not |
|---|---|
| **Git nesne önbelleği (SHA anahtarlı)** | En büyük kazanç — içerik değişmez, sonsuz TTL |
| Bağlantı havuzu | PgBouncer (transaction modu) |
| Sorgu optimizasyonu | `EXPLAIN ANALYZE` ile doğrulanmış indeksler |
| Denormalize sayaçlar | `stars_count` — `COUNT(*)` yerine |
| Cursor sayfalama | Derin offset'in çöküşünü önler |
| Yanıt sıkıştırma | Brotli |
| CDN | Statik varlıklar + ham dosya içeriği |
| Kuyruk devretme | Ağır iş (indeksleme, webhook) istekten çıkar |

### Sıralama disiplini

1. Faz 12'de ölç → yavaş uçları bul
2. En yavaş **tek** uca odaklan
3. Optimize et → **yeniden ölç**
4. Kazancı belgele
5. Tekrarla

> "Ultra-performance" adında 8 farklı compose dosyası oluşturmak optimizasyon değildir.
> Tek bir p95 metriğini 800 ms'den 200 ms'ye düşürmek optimizasyondur.

---

## Faz 15 — Dağıtım ve Operasyon

**Süre:** 1–2 hafta · **Öncelik:** P1

### Ortamlar

| Ortam | Amaç | Veri |
|---|---|---|
| local | Geliştirme | `infra/compose.yml` + seed |
| preview | PR başına geçici | Anonimleştirilmiş alt küme |
| staging | Üretim aynası | Anonimleştirilmiş kopya |
| production | Canlı | Gerçek |

### Compose konsolidasyonu (14 → 2)

```
infra/
├── compose.yml          # dev: postgres, redis, minio, api, web, git-server, realtime, worker
└── compose.prod.yml     # prod: + nginx, prometheus, grafana, loki; replika ve limitlerle
```

Profil kullanın, dosya çoğaltmayın:
```bash
docker compose --profile monitoring up -d
```

### CD hattı

```
merge → main
  ├─ build (çok aşamalı Docker, katman önbellekli)
  ├─ tara (Trivy, gitleaks)  ── kritik bulgu → dur
  ├─ imzala (cosign) + SBOM
  ├─ staging'e deploy
  ├─ smoke test  ── başarısız → otomatik geri al
  ├─ manuel onay
  └─ production'a deploy (canary %10 → %50 → %100)
```

### Operasyonel gereklilikler

- **Migration'lar geriye uyumlu** — expand/contract deseni (önce genişlet, dağıt, sonra daralt)
- **Sıfır kesintili dağıtım** — rolling update + `/health/ready` gate
- **Yedekleme:** Postgres PITR (günlük tam + WAL), **git deposu yedeği ayrı** (nesne deposu replikasyonu)
- **Geri yükleme tatbikatı** — çeyrekte bir, gerçekten test edilmiş
- **Runbook'lar:** DB failover, git-server disk dolması, kuyruk birikmesi, redis kaybı
- **Özellik bayrakları** — riskli özellikleri dağıtımdan ayır

### ✅ Kabul Kriterleri
- [ ] Sıfırdan tam ortam tek komutla ayağa kalkar
- [ ] Kesintisiz dağıtım kanıtlanmış (dağıtım sırasında k6 ile 0 hata)
- [ ] Geri alma < 5 dakika
- [ ] Yedekten geri yükleme tatbikatı başarılı
- [ ] 14 compose dosyası → 2

---

## E. Ekler

### E.1 Faz özeti ve zaman çizelgesi

| Faz | Konu | Süre | Öncelik |
|---|---|---|---|
| 1 | Temizlik + monorepo | ~~3–5 gün~~ **✅ tamamlandı** | P0 |
| 2 | Veri modeli | 4–6 gün | P0 |
| 3 | Auth + yetkilendirme | 5–7 gün | P0 |
| 4 | **Git motoru** | 3–4 hafta | P0 |
| 5 | API katmanı | 1–2 hafta | P0 |
| 6 | Tasarım sistemi | 1–2 hafta | P0 |
| 7 | Ürün akışları | 4–6 hafta | P0 |
| 8 | Realtime | 1–2 hafta | P1 |
| 9 | Arama | 1–2 hafta | P1 |
| 10 | AI | 2–3 hafta | P2 |
| 11 | Test | sürekli | P0 |
| 12 | Gözlemlenebilirlik | 1 hafta | P1 |
| 13 | Güvenlik | 1–2 hafta | P0 |
| 14 | Performans | 1–2 hafta | P1 |
| 15 | Dağıtım | 1–2 hafta | P1 |

**Toplam MVP (Faz 1–7 + 11 + 13):** ~3–4 ay (1 tam zamanlı geliştirici)

**Paralelleştirme:** Faz 6 (frontend) Faz 4 (git motoru) ile paralel yürütülebilir —
frontend, sözleşme (`packages/contracts`) üzerinden mock veriyle geliştirilir.

### E.2 Faz sıralama mantığı

```
Faz 1 (temel)
   └→ Faz 2 (veri)
        └→ Faz 3 (kimlik) ──┬→ Faz 4 (git)  ──┐
                            └→ Faz 5 (API) ───┼→ Faz 7 (ürün akışları)
        Faz 6 (tasarım) ────────────────────────┘
                                                 └→ 8, 9, 10 (zenginleştirme)
   Faz 11, 12, 13 — her fazın içinde, sonra değil
   Faz 14, 15 — ölçülebilir bir sistem var olduktan sonra
```

### E.3 Günlük komutlar

```bash
# Kurulum
pnpm install
docker compose -f infra/compose.yml up -d
pnpm --filter @app/db migrate && pnpm --filter @app/db seed

# Geliştirme
pnpm dev                      # tüm uygulamalar (turbo)
pnpm --filter web dev         # yalnızca frontend
pnpm --filter api dev         # yalnızca API

# Kalite
pnpm biome check --write .    # lint + format
pnpm turbo typecheck
pnpm turbo test
pnpm turbo test:e2e
pnpm turbo build

# Veritabanı
pnpm --filter @app/db generate    # şemadan migration üret
pnpm --filter @app/db migrate
pnpm --filter @app/db studio      # Drizzle Studio
```

### E.4 "Tamamlandı" tanımı (her PR için)

- [ ] Kabul kriterleri karşılandı
- [ ] Testler yazıldı ve geçiyor (birim + entegrasyon; kullanıcıya değen değişikliklerde E2E)
- [ ] `typecheck` + `biome` temiz
- [ ] Beş arayüz durumu uygulandı (UI değişikliklerinde)
- [ ] Erişilebilirlik kontrolü yapıldı (klavye + `axe`)
- [ ] Yetki kontrolü uygulandı ve test edildi
- [ ] Gözlemlenebilirlik eklendi (log/metrik/trace)
- [ ] Dokümantasyon güncellendi
- [ ] Performans bütçesi aşılmadı
- [ ] Geriye uyumlu migration
- [ ] Güvenlik gözden geçirmesi (girdi doğrulama, yetki, sır sızıntısı)

### E.5 Anti-pattern'ler — bu projede gözlenenler ve kaçınılacaklar

| Anti-pattern | Bu repoda görülen | Doğrusu |
|---|---|---|
| Erken mikroservis | 12 servis, çalışan 0 akış | Modüler monolit → kanıtla → ayır |
| Yapılandırma çoğaltma | 14 compose, 5 Dockerfile | 2 compose + profiller |
| Hayalî dokümantasyon | Kod yokken performans raporları | Ölç, sonra yaz |
| Çift implementasyon | `backend/` vs `core-service/` | Tek gerçek kaynak |
| Karar ertelemesi | Next + Vite yan yana | ADR yaz, birini seç |
| Güvensiz varsayılan | `'fallback-secret'` | Zod ile başlangıçta zorunlu kıl |
| Sahte CI | `ls -la` + "✅" | Gerçekten kırılabilen pipeline |
| Kütüphane biriktirme | Apollo + Query + SWR + Zustand | Her ilgi alanı için tek araç |
| Şemasız SQL | `SELECT * FROM users` (tablo yok) | Migration'lı tek şema |
| Test sonra | 0 test | Test, DoD'nin parçası |

### E.6 İlk hafta — somut başlangıç

| Gün | İş |
|---|---|
| 1 | 3 ADR'yi yaz ve merge et (framework, backend, mimari) |
| 2 | pnpm workspace + Turborepo + Biome + tsconfig temeli |
| 3 | 25 raporu `docs/archive/`'e taşı; 14 compose → 2; port haritasını sabitle |
| 4 | Gerçek CI: install/lint/typecheck/build/test — kasten bozup kırmızı olduğunu doğrula |
| 5 | `packages/db`: Drizzle şema (users, repositories) + ilk migration + seed |

---

## 📎 Kaynaklar

- [Next.js 16](https://nextjs.org/blog/next-16) · [Next.js sürüm takibi](https://endoflife.date/nextjs)
- [NestJS 11 duyurusu](https://trilon.io/blog/announcing-nestjs-11-whats-new) · [nestjs/nest sürümleri](https://github.com/nestjs/nest/releases)
- [Node.js sürüm takvimi](https://nodejs.org/en/about/previous-releases) · [Node.js yeni sürüm politikası](https://nodejs.org/en/blog/announcements/evolving-the-nodejs-release-schedule)
- [Tailwind v4 + shadcn/ui yığını](https://starterpick.com/guides/tailwind-v4-shadcn-ui-saas-stack-2026)

---

*Bu rehber yaşayan bir dokümandır. Her faz tamamlandığında kabul kriterleri işaretlenmeli,
öğrenilenler ilgili bölüme yazılmalıdır.*
