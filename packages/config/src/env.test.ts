import { describe, expect, it } from 'vitest';
import { assertProductionSafety, loadEnv } from './env.js';

/** Doğrulamayı geçen minimum geçerli ortam. */
const gecerli = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/githubclone',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a'.repeat(32),
  REFRESH_SECRET: 'b'.repeat(32),
  SESSION_SECRET: 'c'.repeat(32),
  GIT_STORAGE_PATH: '/var/lib/githubclone/repos',
} satisfies NodeJS.ProcessEnv;

describe('loadEnv', () => {
  it('geçerli ortamı kabul eder ve varsayılanları uygular', () => {
    const env = loadEnv(gecerli);

    expect(env.NODE_ENV).toBe('development');
    expect(env.API_PORT).toBe(4000);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000']);
  });

  it('port değerlerini string ortamdan sayıya çevirir', () => {
    const env = loadEnv({ ...gecerli, API_PORT: '8080' });
    expect(env.API_PORT).toBe(8080);
  });

  it('CORS_ORIGINS listesini ayrıştırır ve boşlukları temizler', () => {
    const env = loadEnv({
      ...gecerli,
      CORS_ORIGINS: 'https://a.com, https://b.com ,',
    });
    expect(env.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com']);
  });

  // --- Asıl mesele: sırlar ---------------------------------------------------

  it('JWT_SECRET eksikse fırlatır (fallback yok)', () => {
    const { JWT_SECRET: _, ...eksik } = gecerli;
    expect(() => loadEnv(eksik)).toThrow(/JWT_SECRET/);
  });

  it('kısa sırrı reddeder', () => {
    expect(() => loadEnv({ ...gecerli, JWT_SECRET: 'kisa' })).toThrow(/en az 32 karakter/);
  });

  it("eski kod tabanındaki 'fallback-secret' değerini reddeder", () => {
    expect(() => loadEnv({ ...gecerli, JWT_SECRET: `fallback-secret${'x'.repeat(32)}` })).toThrow(
      /yer tutucu/,
    );
  });

  it('tüm hataları tek seferde raporlar', () => {
    let mesaj = '';
    try {
      loadEnv({ GIT_STORAGE_PATH: '/tmp/repos' });
    } catch (e) {
      mesaj = (e as Error).message;
    }

    // Eksik olan her değişken tek çıktıda görünmeli
    for (const anahtar of ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'REFRESH_SECRET']) {
      expect(mesaj).toContain(anahtar);
    }
  });

  it('geçersiz DATABASE_URL protokolünü reddeder', () => {
    expect(() => loadEnv({ ...gecerli, DATABASE_URL: 'mysql://localhost:3306/db' })).toThrow();
  });
});

describe('assertProductionSafety', () => {
  const uretim = { ...gecerli, NODE_ENV: 'production' } satisfies NodeJS.ProcessEnv;

  it('geliştirme ortamında hiçbir kısıt uygulamaz', () => {
    expect(() => assertProductionSafety(loadEnv(gecerli))).not.toThrow();
  });

  it('üretimde HTTPS olmayan PUBLIC_APP_URL değerini reddeder', () => {
    const env = loadEnv({
      ...uretim,
      PUBLIC_APP_URL: 'http://ornek.com',
      CORS_ORIGINS: 'https://ornek.com',
    });
    expect(() => assertProductionSafety(env)).toThrow(/HTTPS/);
  });

  it('üretimde localhost CORS kaynağını reddeder', () => {
    const env = loadEnv({ ...uretim, PUBLIC_APP_URL: 'https://ornek.com' });
    expect(() => assertProductionSafety(env)).toThrow(/localhost/);
  });

  it('aynı değere sahip sırları reddeder', () => {
    const ayni = 'z'.repeat(32);
    const env = loadEnv({
      ...uretim,
      PUBLIC_APP_URL: 'https://ornek.com',
      CORS_ORIGINS: 'https://ornek.com',
      JWT_SECRET: ayni,
      REFRESH_SECRET: ayni,
      SESSION_SECRET: ayni,
    });
    expect(() => assertProductionSafety(env)).toThrow(/farklı olmalı/);
  });

  it('kurallara uyan üretim ortamını kabul eder', () => {
    const env = loadEnv({
      ...uretim,
      PUBLIC_APP_URL: 'https://ornek.com',
      CORS_ORIGINS: 'https://ornek.com,https://www.ornek.com',
    });
    expect(() => assertProductionSafety(env)).not.toThrow();
  });
});
