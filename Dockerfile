# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Native modüller için build bağımlılıkları (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++ vips-dev

# Package dosyalarını kopyala (lock dosyası: her build'de aynı sürümler kurulsun)
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Bağımlılıkları yükle
RUN npm ci --legacy-peer-deps

# Kaynak kodları kopyala
COPY . .

# Prisma Client oluştur + template database (Prisma 7: --skip-generate yok)
ENV DATABASE_URL="file:/app/prisma/dev.db"
RUN npx prisma generate && \
    npx prisma db push && \
    cp /app/prisma/dev.db /app/template.db && \
    rm /app/prisma/dev.db

# Next.js standalone build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# dumb-init: signal handling için
RUN apk add --no-cache dumb-init vips

# Next.js standalone dosyalarını kopyala
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma generated client
COPY --from=builder /app/generated ./generated

# Template database (ilk kurulumda kopyalanacak)
COPY --from=builder /app/template.db ./template.db

# Runtime bağımlılıkları (standalone build için)
# @prisma klasörü adapter-better-sqlite3 ve driver-adapter-utils içeriyor
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# better-sqlite3 native binary - ARM64 için builder'da derlendi
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
# sharp - goruntu optimizasyonu için
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/jsonwebtoken ./node_modules/jsonwebtoken
COPY --from=builder /app/node_modules/nodemailer ./node_modules/nodemailer
COPY --from=builder /app/node_modules/geoip-lite ./node_modules/geoip-lite
COPY --from=builder /app/node_modules/ua-parser-js ./node_modules/ua-parser-js
COPY --from=builder /app/node_modules/qrcode.react ./node_modules/qrcode.react
COPY --from=builder /app/node_modules/framer-motion ./node_modules/framer-motion
COPY --from=builder /app/node_modules/recharts ./node_modules/recharts
COPY --from=builder /app/node_modules/@dnd-kit ./node_modules/@dnd-kit
COPY --from=builder /app/node_modules/react-icons ./node_modules/react-icons

# Entrypoint script (database başlatma + migration + server)
COPY docker-entrypoint.sh ./docker-entrypoint.sh
COPY db-migrate.js ./db-migrate.js
RUN chmod +x ./docker-entrypoint.sh

# Dizinleri oluştur
RUN mkdir -p /app/prisma /app/public/uploads

EXPOSE 3000

# dumb-init ile signal handling
ENTRYPOINT ["dumb-init", "--"]

# Entrypoint: database kopyala (yoksa) ve server başlat
CMD ["/app/docker-entrypoint.sh"]
