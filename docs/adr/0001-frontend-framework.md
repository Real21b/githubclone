# ADR-001: Frontend framework olarak Next.js seçilir, Vite kurulumu kaldırılır

- **Durum:** Kabul edildi
- **Tarih:** 2026-08-16
- **Karar verenler:** Proje ekibi
- **İlgili faz:** [Faz 1](../../GELISTIRME-REHBERI.md#faz-1--karar-temizlik-ve-monorepo-temeli), [Faz 6](../../GELISTIRME-REHBERI.md#faz-6--tasarım-sistemi-ve-frontend-temeli)

## Bağlam

`frontend/` paketi aynı `package.json` içinde iki tam framework barındırıyordu:

| | Next.js yolu | Vite yolu |
|---|---|---|
| Giriş noktası | `src/app/layout.tsx` + `src/app/page.tsx` | `src/main.tsx` + `src/App.tsx` |
| Yönlendirme | App Router (dosya tabanlı) | `react-router-dom` (bildirimsel) |
| Yapılandırma | `next.config.js` | `vite.config.ts` |
| Dockerfile | `Dockerfile.nextjs` | `Dockerfile.vite`, `Dockerfile.ultra`, `Dockerfile.optimized` |

Bu bir "çift derleme" avantajı değil, **verilmemiş bir karardı**. Somut maliyetleri:

1. **Vite yolu derlenmiyordu.** `src/App.tsx` on adet var olmayan modül import ediyordu
   (`./pages/Home`, `./pages/Login`, … `./components/Layout/Layout`). `src/pages/` dizini hiç
   oluşturulmamıştı. `npm run build:vite` (`tsc && vite build`) ilk adımda başarısız oluyordu.
2. **İki yönlendirme sistemi** aynı anda bakım gerektiriyordu.
3. **Beş Dockerfile** aynı uygulama için üretiliyordu.
4. `vite.config.ts` içindeki `react({ fastRefresh: true })` seçeneği `@vitejs/plugin-react` v4'te
   kaldırılmıştı — yani Vite yapılandırması zaten güncel değildi.

## Karar

**Next.js 16 (App Router) tek frontend framework'ü olarak benimsenir. Vite kurulumu kaldırılır.**

Kaldırılan dosyalar: `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `index.html`,
`Dockerfile.vite`, `Dockerfile.ultra`, `Dockerfile.optimized`, `src/routes/health.ts`
ve ilgili `package.json` script/bağımlılıkları (`vite`, `@vitejs/plugin-react`,
`vite-plugin-pwa`, `react-router-dom`).

## Gerekçe

- **React Server Components.** Kod tarayıcı bu ürünün en ağır ekranıdır. Sözdizimi vurgulama ve
  büyük dosya render'ının sunucuda yapılabilmesi, istemciye megabaytlarca highlighter göndermemek
  anlamına gelir. Vite'ın saf SPA modeli bunu sunmaz.
- **SEO.** Public repo, profil ve issue sayfaları indekslenebilir olmalıdır. SPA'de bu ek altyapı ister.
- **Streaming SSR.** Dosya ağacı hemen, blob içeriği stream ile gelebilir (Suspense).
- **Tek giriş noktası.** Yönlendirme, veri çekme ve dağıtım için tek model.
- **Kırık olan taraf zaten Vite tarafıydı** — kaldırmak, düzeltmekten hem ucuz hem doğru.

## Sonuçlar

**Olumlu**
- `apps/web` derlenir hale gelir (Faz 1 kabul kriteri).
- Dockerfile sayısı 5 → 1.
- Yönlendirme, veri çekme ve durum yönetimi tek yol üzerinde toplanır.

**Olumsuz / bedel**
- Vite'ın dev sunucusu Turbopack'ten tarihsel olarak daha hızlıydı; Next 16'da Turbopack
  stabil olduğu için bu fark büyük ölçüde kapanmıştır.
- `vite-plugin-pwa` ile gelen PWA desteği kaybolur; gerekirse `next-pwa` veya elle
  service worker ile geri kazanılır (şu an ürün gereksinimi değil).

## Alternatifler

- **Vite'ı tutup Next'i atmak:** Kırık `src/pages/*` ağacının sıfırdan yazılmasını gerektirirdi
  ve RSC/SEO avantajlarından vazgeçmek anlamına gelirdi.
- **İkisini de tutmak:** Mevcut durum. Sürdürülemez olduğu kanıtlanmıştır.
- **TanStack Start:** Olgun bir seçenek, ancak Next 16'nın ekosistem ve dağıtım olgunluğu
  bu proje için daha düşük risklidir.
