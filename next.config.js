/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Görsel optimizasyon proxy'si kapalı: önceden hostname '**' ile herkes
  // /_next/image üzerinden istediği uzak görseli sunucumuza işletebiliyordu.
  // Yüklenen görseller zaten yükleme anında sharp ile küçültülüyor.
  images: {
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  // Native modülleri webpack bundle'ına ALMA, runtime'da node_modules'dan yükle
  // better-sqlite3 .node binary'si bundle'lanamaz
  experimental: {
    serverComponentsExternalPackages: [
      'better-sqlite3',
      '@prisma/client',
      '@prisma/adapter-better-sqlite3',
      '@prisma/driver-adapter-utils',
      'bcryptjs',
      'jsonwebtoken',
      'nodemailer',
      'geoip-lite',
      'ua-parser-js',
      'sharp',
    ],
    outputFileTracingIncludes: {
      '/': [
        './generated/**/*',
        './node_modules/bcryptjs/**/*',
        './node_modules/jsonwebtoken/**/*',
        './node_modules/nodemailer/**/*',
        './node_modules/geoip-lite/**/*',
        './node_modules/ua-parser-js/**/*',
        './node_modules/qrcode.react/**/*',
        './node_modules/framer-motion/**/*',
        './node_modules/recharts/**/*',
        './node_modules/@dnd-kit/**/*',
        './node_modules/react-icons/**/*',
        './node_modules/@prisma/**/*',
        './node_modules/better-sqlite3/**/*',
      ],
    },
  },
}

module.exports = nextConfig
