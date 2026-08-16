/**
 * Ortam değişkeni doğrulaması.
 *
 * Bu modülün tek amacı, uygulamanın **yanlış yapılandırmayla açılmasını engellemektir**.
 *
 * Eski kod tabanında şu desen vardı:
 *
 *     this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
 *
 * Bu desen sessizce üretime sızabilen bir güvenlik açığıdır: `JWT_SECRET`
 * tanımsızsa uygulama açılır, çalışır ve herkesin bildiği bir sırla token imzalar.
 *
 * Buradaki şema bunu yapısal olarak imkânsız kılar — eksik veya zayıf bir sır
 * varsa `loadEnv()` fırlatır ve süreç başlamaz.
 */

import { z } from 'zod';

/** En az 32 karakter: 256-bit entropiye karşılık gelen makul alt sınır. */
const secret = (name: string) =>
  z
    .string({ error: `${name} tanımlı değil` })
    .min(32, `${name} en az 32 karakter olmalı (varsayılan/fallback değer kullanmayın)`)
    .refine((v) => !/^(fallback|change ?me|secret|test|default)/i.test(v), {
      message: `${name} yer tutucu bir değer içeriyor — gerçek bir sır üretin`,
    });

const port = z.coerce.number().int().min(1).max(65_535);

export const envSchema = z.object({
  /* --- Çalışma zamanı --- */
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /* --- Servis portları (bkz. GELISTIRME-REHBERI.md Faz 1.3 port haritası) --- */
  WEB_PORT: port.default(3000),
  API_PORT: port.default(4000),
  GIT_SERVER_PORT: port.default(4001),
  REALTIME_PORT: port.default(4002),

  /* --- Veri katmanı --- */
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  REDIS_URL: z.url({ protocol: /^rediss?$/ }),

  /* --- Sırlar: fallback YOK --- */
  JWT_SECRET: secret('JWT_SECRET'),
  REFRESH_SECRET: secret('REFRESH_SECRET'),
  SESSION_SECRET: secret('SESSION_SECRET'),

  /* --- Git deposu --- */
  GIT_STORAGE_PATH: z.string().min(1, 'GIT_STORAGE_PATH tanımlı olmalı'),

  /* --- Nesne depolama (S3 uyumlu) --- */
  S3_ENDPOINT: z.url().optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),

  /* --- Genel --- */
  PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Ortamı doğrular ve tipli nesneyi döndürür.
 *
 * Başarısız olursa **tüm** hataları tek seferde, okunabilir biçimde raporlar —
 * her seferinde bir eksik değişken keşfetmek yerine.
 *
 * @throws {Error} doğrulama başarısız olursa
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const detay = result.error.issues
      .map((i) => `  • ${i.path.join('.') || '(kök)'}: ${i.message}`)
      .join('\n');

    throw new Error(
      `Ortam yapılandırması geçersiz — uygulama başlatılmadı.\n\n${detay}\n\n` +
        'Örnek değerler için depo kökündeki .env.example dosyasına bakın.',
    );
  }

  return result.data;
}

/**
 * Üretimde ek kısıtlar. `loadEnv` sonrası çağrılır.
 * Geliştirmede kabul edilebilir olan bazı şeyler üretimde kabul edilemez.
 */
export function assertProductionSafety(env: Env): void {
  if (env.NODE_ENV !== 'production') return;

  const sorunlar: string[] = [];

  if (env.PUBLIC_APP_URL.startsWith('http://')) {
    sorunlar.push('PUBLIC_APP_URL üretimde HTTPS olmalı');
  }
  if (env.CORS_ORIGINS.some((o) => o.includes('localhost'))) {
    sorunlar.push('CORS_ORIGINS üretimde localhost içeremez');
  }
  if (new Set([env.JWT_SECRET, env.REFRESH_SECRET, env.SESSION_SECRET]).size < 3) {
    sorunlar.push('JWT_SECRET, REFRESH_SECRET ve SESSION_SECRET birbirinden farklı olmalı');
  }

  if (sorunlar.length > 0) {
    throw new Error(
      `Üretim ortamı güvenlik kontrolü başarısız:\n${sorunlar.map((s) => `  • ${s}`).join('\n')}`,
    );
  }
}
