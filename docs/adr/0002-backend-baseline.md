# ADR-002: Backend tabanı NestJS olur, `core-service` buraya birleştirilir

- **Durum:** Kabul edildi
- **Tarih:** 2026-08-16
- **İlgili faz:** [Faz 1](../../GELISTIRME-REHBERI.md#faz-1--karar-temizlik-ve-monorepo-temeli), [Faz 2](../../GELISTIRME-REHBERI.md#faz-2--veri-modeli-ve-veritabanı), [Faz 5](../../GELISTIRME-REHBERI.md#faz-5--api-katmanı)

## Bağlam

Aynı iş alanı (User, Repository, Auth, Health) **iki ayrı ve uyumsuz** implementasyona sahipti:

| | `backend/` | `services/core-service/` |
|---|---|---|
| Framework | NestJS 10 | Express + Apollo Server 3 |
| GraphQL | `@nestjs/graphql` (code-first) | `type-graphql` |
| Veri erişimi | TypeORM entity + migration | Ham SQL string |
| Bağımlılık enjeksiyonu | Var (Nest DI) | Yok (elle `new`) |
| Entity | `User`, `Repository`, `Health` | `User`, `Repository`, `Health` (ayrı tanım) |

Kritik sorun: `core-service`, `users` tablosuna
`SELECT * FROM users ORDER BY created_at DESC` gibi sorgular atıyor ama **hiçbir şema
oluşturmuyordu**. Tabloları yalnızca `backend/src/migrations/` yaratıyordu. Yani `core-service`,
`backend`'in migration'larına dokümante edilmemiş ve gizli bir bağımlılık taşıyordu — ikisi ayrı
dağıtıldığında sessizce çalışmaz hale gelirdi.

Ek olarak `postgres/` klasöründe tek bir `.sql` dosyası yoktu.

## Karar

**`backend/` (NestJS) taban alınır ve `apps/api` olarak yeniden konumlandırılır.
`services/core-service/` içindeki iş mantığı buraya modül olarak taşınır, ardından dizin silinir.**

Ayrıca:
- Veri erişimi **Drizzle ORM**'e taşınır (Faz 2), şema `packages/db` içinde **tek gerçek kaynak** olur.
- API yüzeyi GraphQL'den **tRPC + REST**'e taşınır (Faz 5, bkz. ADR-003 bağlamı).

## Gerekçe

NestJS tabanının seçilme nedenleri:

- **Modül sistemi ve DI.** Modüler monolit hedefi (ADR-003) doğrudan Nest'in modül modeliyle eşleşir.
  `core-service`'te bağımlılıklar elle örneklendiği için test edilmesi zordu.
- **Test altyapısı.** `@nestjs/testing` ile modül izolasyonu hazır gelir. NestJS 11'de Vitest
  varsayılan test koşucusudur ve SWC ile derleme ~20× hızlanmıştır.
- **Zaten migration'lara sahipti.** Şemayı gerçekten oluşturan taraf `backend/` idi.
- **Apollo Server 3 kullanım ömrünü doldurmuştur.** `core-service`'in GraphQL katmanı zaten
  desteklenmeyen bir sürüme bağlıydı.

Ham SQL'in Drizzle'a taşınma nedeni: `core-service`'in SQL'e yakın yaklaşımı doğruydu (TypeORM'un
sorgu üretimi büyük şemalarda öngörülemez olabiliyor), ancak string SQL tip güvenliği ve migration
disiplini sunmuyordu. Drizzle her ikisini de verir.

## Sonuçlar

**Olumlu**
- Tek gerçek kaynak; "hangi backend doğru?" sorusu ortadan kalkar.
- Şema/kod ayrışması giderilir.
- Test edilebilirlik artar.

**Olumsuz / bedel**
- `core-service` içindeki `AdvancedCacheService`, `OptimizedDatabaseService`, `ClusterService`,
  `PerformanceMonitor` sınıflarının taşınması veya elenmesi gerekir. Bunların çoğu ölçülmemiş
  optimizasyondur; Faz 14'te **ölçüme dayalı** olarak yeniden değerlendirilir.
- GraphQL şemasına bağlı istemci kodu (`frontend/src/graphql/queries.ts`, Apollo) yeniden yazılır.

## Geçiş planı

| Aşama | Faz |
|---|---|
| `backend/` → `apps/api` taşınır, workspace'e bağlanır | 1 |
| `packages/db` (Drizzle) tek şema kaynağı olur | 2 |
| `auth-service` mantığı `apps/api/src/modules/auth` olur | 3 |
| `core-service` resolver/service'leri modüllere taşınır, dizin silinir | 5 |
| GraphQL → tRPC + REST geçişi tamamlanır | 5 |
