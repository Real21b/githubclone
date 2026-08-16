// @ts-check
/**
 * Next.js 16 yapılandırması.
 *
 * Faz 1 notları:
 *  - `swcMinify` kaldırıldı (Next 15+ varsayılan; seçenek artık yok sayılıyor).
 *  - `images.domains` kaldırıldı (kullanımdan kalktı) → `remotePatterns`.
 *  - Elle webpack `splitChunks` ayarı kaldırıldı: Turbopack varsayılan bundler
 *    olduğu için webpack yolu artık üretim derlemesinde kullanılmıyor; bu blok
 *    sessizce etkisizdi. Chunk stratejisi Faz 14'te *ölçüme dayalı* ele alınır.
 *  - `env.CUSTOM_KEY` kaldırıldı: hiçbir yerde kullanılmıyordu.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // MUI ve ikon paketleri için ağaç sarsma (tree-shaking) — barrel import maliyetini düşürür
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'githubclone.com' },
      { protocol: 'https', hostname: 'api.githubclone.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Faz 13: CSP nonce tabanlı olarak middleware'de eklenecek.
          // `X-XSS-Protection` bilerek kaldırıldı — modern tarayıcılarda etkisiz
          // ve bazı durumlarda kendisi bir açık yüzeyi (kaldırılması önerilir).
        ],
      },
      {
        source: '/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  async redirects() {
    return [{ source: '/home', destination: '/', permanent: true }];
  },

  /**
   * API proxy'leri — port haritası GELISTIRME-REHBERI.md Faz 1.3 ile hizalandı.
   * Eski değerler (3001/3002/3011) çakışan port düzenine aitti.
   */
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const realtime = process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:4002';

    return [
      { source: '/api/graphql', destination: `${api}/graphql` },
      { source: '/api/auth/:path*', destination: `${api}/auth/:path*` },
      { source: '/api/realtime/:path*', destination: `${realtime}/:path*` },
    ];
  },
};

export default nextConfig;
