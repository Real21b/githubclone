# ADR-003: 12 mikroservis yerine modüler monolit + gerekçelendirilmiş kenar servisler

- **Durum:** Kabul edildi
- **Tarih:** 2026-08-16
- **İlgili faz:** [Faz 1](../../GELISTIRME-REHBERI.md#faz-1--karar-temizlik-ve-monorepo-temeli), [Bölüm C](../../GELISTIRME-REHBERI.md#c-hedef-mimari)

## Bağlam

`services/` altında 13 dizin vardı. Olgunluk seviyeleri çok farklıydı:

| Servis | Gerçek durum |
|---|---|
| `core-service` | En dolu; ham SQL, şemasız |
| `auth-service` | Kullanıcıyı DB'ye yazmıyor — bellekte sahte |
| `file-service`, `email`, `sms`, `notification` | İskelet |
| `telegram`, `whatsapp`, `wordpress`, `ai-service` | İskelet |
| `realtime-service` | 3 dosya |
| `integration-service` | **1 dosya** (`main.ts`) |

Ortak sorunlar:

- Hiçbirinde `package-lock.json` yoktu → build'ler tekrarlanabilir değildi.
- Hiçbirinde test yoktu.
- `services/shared/` içindeki 4 dosya paket olarak yayımlanmadığı için **hiçbir servis onları
  import edemiyordu**; her servis kendi `utils/logger.ts` kopyasını taşıyordu.
- 13 servisin hiçbiri Git ile ilgili değildi. Bir Git barındırma platformunda `git-server`
  tamamen yoktu.

Mikroservisler ağ sınırı, dağıtık transaction, servis keşfi ve 13× dağıtım/gözlemlenebilirlik
yükü getirir. Bu maliyetler, **henüz tek bir kullanıcı akışı uçtan uca çalışmayan** bir üründe
karşılığı olmayan bir yatırımdır.

## Karar

**Varsayılan mimari modüler monolittir (`apps/api`). Bir yetenek ancak aşağıdaki üç ölçütten
en az birini karşıladığında ayrı servise çıkarılır:**

1. **Ölçek profili farklı** — ör. realtime: çok bağlantı, az CPU
2. **Kaynak profili farklı** — ör. AI: GPU / uzun süreli iş
3. **Hata izolasyonu kritik** — ör. git-server: ağır disk I/O ana API'yi boğmamalı

### Servis → hedef eşlemesi

| Mevcut | Hedef | Ölçüt |
|---|---|---|
| `core-service` + `backend/` | `apps/api` | — (birleşir) |
| `auth-service` | `apps/api/src/modules/auth` | — |
| `file-service` | `apps/api/src/modules/storage` + S3/MinIO | — |
| `email`, `sms`, `notification` | `apps/worker` (BullMQ job) | — |
| `telegram`, `whatsapp`, `wordpress` | `apps/worker` (entegrasyon job) | — |
| `integration-service` | **silinir** (boş) | — |
| `realtime-service` | `apps/realtime` | ① ölçek profili |
| `ai-service` | `apps/ai-worker` | ② kaynak profili |
| **— (yok)** | **`apps/git-server`** ← YENİ | ③ hata izolasyonu |

`sms`, `email`, `telegram`, `whatsapp`, `wordpress` üç ölçütün **hiçbirini** karşılamaz:
hepsi kısa, dışa çağrı yapan, kuyruklanabilir işlerdir. Bunlar ayrı HTTP servisi değil,
**kuyruk işçisi** olur.

## Gerekçe

- **Modüller arası çağrı, ağ çağrısından ucuz ve güvenilirdir.** Monolit içinde bir modül
  sınırını geçmek bir fonksiyon çağrısıdır; mikroservislerde bu bir HTTP isteği, bir timeout
  politikası, bir retry ve bir devre kesicidir.
- **Transaction sınırı korunur.** "Repo oluştur + varsayılan branch yaz + aktivite kaydı ekle"
  tek DB transaction'ında atomiktir. Üç servise bölündüğünde saga deseni gerekir.
- **Modül sınırları korunur.** Modüler monolit "spagetti monolit" demek değildir: modüller
  yalnızca birbirinin **public service API'si** üzerinden konuşur, repository katmanına
  çapraz erişim yasaktır. Sınır gerçekten gerektiğinde ayırma maliyeti düşük kalır.
- **Kafka yerine BullMQ.** `docker-compose.kafka.yml` (15 KB) bu ölçekte operasyonel yüktür.
  BullMQ (Redis tabanlı) aynı işi yapar. Günlük >1M olay veya olay-kaynaklı denetim izi
  gerektiğinde Kafka yeniden değerlendirilir.

## Sonuçlar

**Olumlu**
- Dağıtılacak birim sayısı 13 → 5 (`api`, `web`, `git-server`, `realtime`, `worker`/`ai-worker`).
- Yerel geliştirme tek komutla ayağa kalkar.
- Transaction ve tip güvenliği modül sınırlarında korunur.

**Olumsuz / bedel**
- `apps/api` tek hata alanıdır; bir modüldeki bellek sızıntısı tümünü etkiler.
  Karşı önlem: git-server ve realtime zaten izole; Faz 12'de modül bazlı metrikler.
- Ekip büyüdüğünde modüller ayrı ekiplere verilirse ayırma ihtiyacı doğabilir.
  Modül sınırları bu ayrımı ucuz tutmak için baştan uygulanır.

## Bu kararı yeniden değerlendirme tetikleyicileri

Aşağıdakilerden biri gerçekleştiğinde bu ADR yeniden açılır:

- `apps/api` dağıtımı 10 dakikayı aşarsa
- İki bağımsız ekip aynı modülde düzenli olarak çakışırsa
- Tek bir modül toplam CPU/bellek kullanımının %50'sini aşarsa
- Bir modülün ölçek ihtiyacı diğerlerinden 10× ayrışırsa
